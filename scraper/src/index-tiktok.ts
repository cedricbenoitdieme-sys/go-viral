import type { Browser, BrowserContext, Page } from "playwright";
import { supabase } from "./supabase.js";
import { scrapeProfileVideoIds, scrapeVideoMetadata } from "./tiktok.js";
import { TIKTOK_SEED_HANDLES } from "./tiktokSeedAccounts.js";
import { PLATFORM_CONFIG } from "./resilience/config.js";
import { RateLimiter, jitterDelay } from "./resilience/rateLimiter.js";
import { CircuitBreaker } from "./resilience/circuitBreaker.js";
import { withRetry, PlatformBlockedError } from "./resilience/retry.js";
import { logEvent, RunStats } from "./resilience/logger.js";
import { launchBrowser, newStealthContext } from "./resilience/browser.js";
import { loadProxyPoolFromEnv } from "./resilience/proxyPool.js";
import { qualifyVideo } from "./resilience/qualification.js";

const PLATFORM = "tiktok" as const;
const config = PLATFORM_CONFIG[PLATFORM];

const VIDEOS_PER_ACCOUNT = 20;

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

async function main() {
  await logEvent(PLATFORM, "info", "Run started");

  const rateLimiter = new RateLimiter(config.maxRequestsPerHour);
  const breaker = new CircuitBreaker(config.circuitBreakerThreshold);
  const stats = new RunStats();
  const proxyPool = loadProxyPoolFromEnv();

  const browser: Browser = await launchBrowser();
  let context: BrowserContext = await newStealthContext(browser, proxyPool.current());
  let page: Page = await context.newPage();

  // Same resilience wrapper as the YouTube collector (rate limit + jitter,
  // retry with backoff, pause-not-retry on a detected block, circuit
  // breaker) — see index.ts for the fuller comment on why each piece exists.
  async function guarded<T>(label: string, fn: (page: Page) => Promise<T>): Promise<T | null> {
    if (breaker.isOpen()) return null;

    await rateLimiter.waitForSlot();
    await jitterDelay(config.minDelayMs, config.maxDelayMs);
    proxyPool.noteRequest();

    try {
      const result = await withRetry(() => fn(page), {
        retryDelaysMs: config.retryDelaysMs,
        onAttemptFailed: (err, attempt) => {
          void logEvent(PLATFORM, "error", `${label} attempt ${attempt + 1} failed: ${errorMessage(err)}`);
        },
      });
      stats.recordSuccess();
      breaker.recordSuccess();
      return result;
    } catch (err) {
      if (err instanceof PlatformBlockedError) {
        stats.recordBlocked();
        breaker.pauseFor(config.blockCooldownMs);
        await logEvent(
          PLATFORM,
          "blocked",
          `${label}: ${errorMessage(err)} — pausing ${PLATFORM} for ${Math.round(config.blockCooldownMs / 60_000)}min`,
        );

        if (proxyPool.enabled) {
          proxyPool.rotate();
          await context.close();
          context = await newStealthContext(browser, proxyPool.current());
          page = await context.newPage();
        }
        return null;
      }

      stats.recordFailure();
      const tripped = breaker.recordFailure();
      await logEvent(PLATFORM, "error", `${label} failed after retries: ${errorMessage(err)}`);
      if (tripped) {
        await logEvent(
          PLATFORM,
          "circuit_open",
          `${config.circuitBreakerThreshold} consecutive failures — disabling ${PLATFORM} for the rest of this run`,
        );
      }
      return null;
    }
  }

  // Discovery: seed accounts, not keyword search (TikTok blocks /search and
  // /tag/* unauthenticated — see tiktok.ts). videoId -> owning handle, since
  // the video URL and metadata fetch both need the handle.
  const candidates = new Map<string, string>();
  for (const handle of TIKTOK_SEED_HANDLES) {
    if (breaker.isOpen()) break;
    const ids = await guarded(`profile:${handle}`, (p) => scrapeProfileVideoIds(p, handle, VIDEOS_PER_ACCOUNT));
    for (const id of ids ?? []) candidates.set(id, handle);
  }
  console.log(`Found ${candidates.size} candidate videos across ${TIKTOK_SEED_HANDLES.length} accounts.`);

  const candidateEntries = [...candidates.entries()].slice(0, config.maxVideosPerRun);
  if (candidateEntries.length < candidates.size) {
    await logEvent(
      PLATFORM,
      "info",
      `Capping this run to ${candidateEntries.length}/${candidates.size} candidates (maxVideosPerRun=${config.maxVideosPerRun})`,
    );
  }

  let upsertedCount = 0;

  for (const [videoId, handle] of candidateEntries) {
    if (breaker.isOpen()) break;

    const meta = await guarded(`metadata:${videoId}`, (p) => scrapeVideoMetadata(p, handle, videoId));
    if (!meta) continue;

    const videoUrl = `https://www.tiktok.com/@${handle}/video/${videoId}`;
    const qualification = qualifyVideo({
      viewsCount: meta.viewCount,
      likesCount: meta.likesCount,
      commentsCount: meta.commentsCount,
      text: meta.description ?? "",
    });

    if (!qualification.passesHardGate) {
      const { error: rejectError } = await supabase.from("rejected_videos").upsert(
        {
          platform: PLATFORM,
          video_url: videoUrl,
          account_name: meta.channelName,
          account_handle: meta.channelHandle,
          views_count: meta.viewCount,
          likes_count: meta.likesCount,
          comments_count: meta.commentsCount,
          rejection_reason: qualification.rejectionReason,
        },
        { onConflict: "video_url" },
      );
      if (rejectError) {
        await logEvent(PLATFORM, "error", `Rejected-video upsert failed for ${videoUrl}: ${rejectError.message}`);
      }
      continue;
    }

    const row = {
      platform: PLATFORM,
      video_url: videoUrl,
      account_name: meta.channelName,
      account_handle: meta.channelHandle,
      views_count: meta.viewCount,
      likes_count: meta.likesCount,
      comments_count: meta.commentsCount,
      saves_count: meta.savesCount,
      published_at: meta.publishedAt,
      is_qualified: qualification.isQualified,
      engagement_suspect: qualification.engagementSuspect,
      saas_relevance_score: qualification.saasRelevanceScore,
    };

    // Immediate per-video upsert — a crash mid-run loses at most the video
    // in flight, not everything scraped so far this run.
    const { error } = await supabase.from("viral_videos").upsert(row, { onConflict: "video_url" });

    if (error) {
      await logEvent(PLATFORM, "error", `Upsert failed for ${videoUrl}: ${error.message}`);
      continue;
    }
    upsertedCount += 1;

    // No comment scraping for TikTok: unauthenticated video pages don't
    // expose the comment API or panel at all (verified live). comments_count
    // above is still the real aggregate from TikTok's own stats.
  }

  await logEvent(PLATFORM, "summary", `Upserted ${upsertedCount} videos. ${stats.summary()}`);
  await browser.close();
}

main().catch(async (err) => {
  console.error(err);
  await logEvent(PLATFORM, "error", `Run crashed: ${errorMessage(err)}`);
  process.exitCode = 1;
});
