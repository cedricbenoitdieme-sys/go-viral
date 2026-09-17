import type { Browser, BrowserContext, Page } from "playwright";
import { supabase } from "./supabase.js";
import { searchShortsIds, scrapeVideoMetadata, scrapeComments } from "./youtube.js";
import { PLATFORM_CONFIG } from "./resilience/config.js";
import { RateLimiter, jitterDelay } from "./resilience/rateLimiter.js";
import { CircuitBreaker } from "./resilience/circuitBreaker.js";
import { withRetry, PlatformBlockedError } from "./resilience/retry.js";
import { logEvent, RunStats } from "./resilience/logger.js";
import { launchBrowser, newStealthContext } from "./resilience/browser.js";
import { loadProxyPoolFromEnv } from "./resilience/proxyPool.js";
import { qualifyVideo } from "./resilience/qualification.js";

const PLATFORM = "youtube_shorts" as const;
const config = PLATFORM_CONFIG[PLATFORM];

const MAX_SHORT_DURATION_SECONDS = 60;
const RESULTS_PER_KEYWORD = 25;
const COMMENTS_PER_VIDEO = 20;

const SEARCH_KEYWORDS = [
  "saas tips",
  "saas marketing",
  "startup tool",
  "growth hacking",
  "indie hacker",
  "no code saas",
  "build in public",
  "saas founder",
];

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

  // Resilience layer wrapped around the existing scraping functions: rate
  // limit + jitter before every action, retry with backoff on transient
  // errors, pause (not retry) on a detected block, and trip the circuit
  // breaker after too many consecutive failures. Nothing in youtube.ts's
  // extraction logic changes — this only guards how/when it gets called.
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

        // A block is exactly when rotating (if we can) earns its keep most.
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

  const videoIdSet = new Set<string>();
  for (const keyword of SEARCH_KEYWORDS) {
    if (breaker.isOpen()) break;
    const ids = await guarded(`search:${keyword}`, (p) => searchShortsIds(p, keyword, RESULTS_PER_KEYWORD));
    for (const id of ids ?? []) videoIdSet.add(id);
  }
  console.log(`Found ${videoIdSet.size} candidate Shorts across ${SEARCH_KEYWORDS.length} keywords.`);

  const candidateIds = [...videoIdSet].slice(0, config.maxVideosPerRun);
  if (candidateIds.length < videoIdSet.size) {
    await logEvent(
      PLATFORM,
      "info",
      `Capping this run to ${candidateIds.length}/${videoIdSet.size} candidates (maxVideosPerRun=${config.maxVideosPerRun})`,
    );
  }

  const candidateUrls = candidateIds.map((id) => `https://www.youtube.com/shorts/${id}`);
  const { data: existingRows } = await supabase.from("viral_videos").select("video_url").in("video_url", candidateUrls);
  const existingUrls = new Set((existingRows ?? []).map((r) => r.video_url));

  let upsertedCount = 0;
  let commentsInserted = 0;

  for (const videoId of candidateIds) {
    if (breaker.isOpen()) break;

    const meta = await guarded(`metadata:${videoId}`, (p) => scrapeVideoMetadata(p, videoId));
    if (!meta) continue;
    if (meta.lengthSeconds > MAX_SHORT_DURATION_SECONDS) continue; // not actually a Short, unrelated to qualification

    const videoUrl = `https://www.youtube.com/shorts/${videoId}`;
    const qualification = qualifyVideo({
      viewsCount: meta.viewCount,
      likesCount: meta.likesCount,
      commentsCount: null, // not tracked for YouTube — only the comment sample is, separately
      text: [meta.title, meta.description].filter(Boolean).join(" "),
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
          comments_count: null,
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
      comments_count: null,
      saves_count: null,
      published_at: meta.publishedAt,
      is_qualified: qualification.isQualified,
      engagement_suspect: qualification.engagementSuspect,
      saas_relevance_score: qualification.saasRelevanceScore,
    };

    // Upsert immediately, one video at a time, rather than batching results
    // in memory — a crash mid-run then loses at most the video in flight,
    // not everything scraped so far.
    const { data: upserted, error } = await supabase
      .from("viral_videos")
      .upsert(row, { onConflict: "video_url" })
      .select("id, video_url")
      .single();

    if (error) {
      await logEvent(PLATFORM, "error", `Upsert failed for ${videoUrl}: ${error.message}`);
      continue;
    }
    upsertedCount += 1;

    if (existingUrls.has(videoUrl)) continue; // already had this one from a prior run — comments already sampled

    const comments = await guarded(`comments:${videoId}`, (p) => scrapeComments(p, videoId, COMMENTS_PER_VIDEO));
    if (!comments || comments.length === 0) continue;

    const { error: commentsError } = await supabase
      .from("viral_video_comments")
      .insert(comments.map((c) => ({ video_id: upserted.id, comment_text: c.text, author: c.author })));

    if (commentsError) {
      await logEvent(PLATFORM, "error", `Insert comments failed for ${videoUrl}: ${commentsError.message}`);
      continue;
    }
    commentsInserted += comments.length;
  }

  await logEvent(
    PLATFORM,
    "summary",
    `Upserted ${upsertedCount} videos, inserted ${commentsInserted} comments. ${stats.summary()}`,
  );
  await browser.close();
}

main().catch(async (err) => {
  console.error(err);
  await logEvent(PLATFORM, "error", `Run crashed: ${errorMessage(err)}`);
  process.exitCode = 1;
});
