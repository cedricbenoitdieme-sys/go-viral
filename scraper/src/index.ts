import type { Browser, BrowserContext, Page } from "playwright";
import { supabase } from "./supabase.js";
import {
  searchShortsIds,
  scrapeVideoMetadata,
  scrapeComments,
  SEARCH_FILTER_SHORTS,
  SEARCH_FILTER_SHORTS_NEWEST_THIS_YEAR,
} from "./youtube.js";
import { PLATFORM_CONFIG } from "./resilience/config.js";
import { RateLimiter, jitterDelay } from "./resilience/rateLimiter.js";
import { CircuitBreaker } from "./resilience/circuitBreaker.js";
import { withRetry, PlatformBlockedError } from "./resilience/retry.js";
import { logEvent, RunStats } from "./resilience/logger.js";
import { launchBrowser, newStealthContext } from "./resilience/browser.js";
import { loadProxyPoolFromEnv } from "./resilience/proxyPool.js";
import { qualifyVideo, type Category } from "./resilience/qualification.js";

const PLATFORM = "youtube_shorts" as const;
const config = PLATFORM_CONFIG[PLATFORM];

const RESULTS_PER_KEYWORD = 25;
const COMMENTS_PER_VIDEO = 20;

// Two collection goals, US market (English queries; region pinned in youtube.ts):
//  - saas_marketing: viral (100k views / 10k likes) videos promoting a SaaS/tool.
//    Genuine Shorts only (<= 60s).
//  - ai_dev_tips: 2026 tips/warnings for developing with AI (incl. what breaks
//    security), 50k views / 1k likes minimum; searched newest-first. Up to the
//    4-minute ceiling of YouTube's "short" duration filter, since advice rarely
//    fits 60s.
interface SearchPlan {
  category: Category;
  filter: string;
  maxDurationSeconds: number;
  keywords: string[];
}

const SEARCH_PLANS: SearchPlan[] = [
  {
    category: "saas_marketing",
    filter: SEARCH_FILTER_SHORTS,
    maxDurationSeconds: 60,
    keywords: [
      "saas marketing",
      "saas founder",
      "i built a saas",
      "micro saas",
      "saas launch",
      "startup tool",
      "indie hacker",
      "no code saas",
      "ai saas tool",
      "build in public",
    ],
  },
  {
    category: "ai_dev_tips",
    filter: SEARCH_FILTER_SHORTS_NEWEST_THIS_YEAR,
    maxDurationSeconds: 240,
    keywords: [
      "vibe coding tips",
      "vibe coding mistakes",
      "vibe coding security",
      "cursor ai tips",
      "claude code tips",
      "ai coding mistakes to avoid",
      "ai generated code security",
      "ai coding best practices",
      "api key leak ai coding",
      "github copilot tips",
      "prompt engineering for developers",
      "ai coding agent tips",
    ],
  },
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

  // videoId -> the plan that first surfaced it. A video only gets one category
  // (one row per video_url); plans are ordered so the stricter/rarer
  // saas_marketing category claims a video before ai_dev_tips can.
  const candidates = new Map<string, SearchPlan>();
  for (const plan of SEARCH_PLANS) {
    let found = 0;
    for (const keyword of plan.keywords) {
      if (breaker.isOpen()) break;
      const ids = await guarded(`search[${plan.category}]:${keyword}`, (p) =>
        searchShortsIds(p, keyword, RESULTS_PER_KEYWORD, plan.filter),
      );
      for (const id of ids ?? []) {
        if (!candidates.has(id)) {
          candidates.set(id, plan);
          found += 1;
        }
      }
    }
    console.log(`[${plan.category}] ${found} new candidates from ${plan.keywords.length} keywords.`);
  }

  // Cap per category so a big saas_marketing haul can't crowd out ai_dev_tips.
  const perCategory = new Map<Category, number>();
  const candidateEntries = [...candidates.entries()].filter(([, plan]) => {
    const used = perCategory.get(plan.category) ?? 0;
    if (used >= config.maxVideosPerRun) return false;
    perCategory.set(plan.category, used + 1);
    return true;
  });
  if (candidateEntries.length < candidates.size) {
    await logEvent(
      PLATFORM,
      "info",
      `Capping to ${candidateEntries.length}/${candidates.size} candidates (maxVideosPerRun=${config.maxVideosPerRun} per category)`,
    );
  }

  const candidateUrls = candidateEntries.map(([id]) => `https://www.youtube.com/shorts/${id}`);
  // Chunked: hundreds of URLs in one `in (...)` filter would blow past URL length limits.
  const existingUrls = new Set<string>();
  for (let i = 0; i < candidateUrls.length; i += 100) {
    const { data: existingRows } = await supabase
      .from("viral_videos")
      .select("video_url")
      .in("video_url", candidateUrls.slice(i, i + 100));
    for (const r of existingRows ?? []) existingUrls.add(r.video_url);
  }

  let upsertedCount = 0;
  let qualifiedCount = 0;
  let commentsInserted = 0;

  for (const [videoId, plan] of candidateEntries) {
    if (breaker.isOpen()) break;

    const meta = await guarded(`metadata:${videoId}`, (p) => scrapeVideoMetadata(p, videoId));
    if (!meta) continue;
    if (meta.lengthSeconds > plan.maxDurationSeconds) continue; // too long for this category, unrelated to qualification

    const videoUrl = `https://www.youtube.com/shorts/${videoId}`;
    const qualification = qualifyVideo({
      category: plan.category,
      publishedAt: meta.publishedAt,
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
          category: plan.category,
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
      category: plan.category,
      is_qualified: qualification.isQualified,
      engagement_suspect: qualification.engagementSuspect,
      saas_relevance_score: qualification.saasRelevanceScore,
      ai_dev_relevance_score: qualification.aiDevRelevanceScore,
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
    if (qualification.isQualified) qualifiedCount += 1;

    // Comment sampling is the slowest step (scroll + lazy-load per video), so
    // only spend it on videos that will actually surface in the dashboard.
    if (!qualification.isQualified) continue;
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
    `Upserted ${upsertedCount} videos (${qualifiedCount} qualified), inserted ${commentsInserted} comments. ${stats.summary()}`,
  );
  await browser.close();
}

main().catch(async (err) => {
  console.error(err);
  await logEvent(PLATFORM, "error", `Run crashed: ${errorMessage(err)}`);
  process.exitCode = 1;
});
