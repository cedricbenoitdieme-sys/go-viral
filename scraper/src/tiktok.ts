import type { Page } from "playwright";
import { isBlockedPage, isBlockedResponse } from "./resilience/blockDetection.js";
import { PlatformBlockedError } from "./resilience/retry.js";

export interface ScrapedTiktokVideo {
  videoId: string;
  channelName: string | null;
  channelHandle: string | null;
  viewCount: number;
  likesCount: number | null;
  commentsCount: number | null;
  savesCount: number | null;
  publishedAt: string | null;
  lengthSeconds: number;
}

// TikTok's /search and /tag/<hashtag> pages hard-block unauthenticated
// (and headless-with-stealth) requests — verified live, not assumed. Profile
// pages (@handle) and individual video pages work fine unauthenticated and
// carry exact stats, so discovery here is seed-list-of-accounts based rather
// than keyword search like the YouTube collector.
export async function scrapeProfileVideoIds(page: Page, handle: string, limit: number): Promise<string[]> {
  const response = await page.goto(`https://www.tiktok.com/@${handle}`, { waitUntil: "load", timeout: 30_000 });
  if (isBlockedResponse(response) || (await isBlockedPage(page))) {
    throw new PlatformBlockedError(`Blocked while listing videos for @${handle}`);
  }

  const hrefs = await page.evaluate(() =>
    Array.from(document.querySelectorAll('a[href*="/video/"]')).map((a) => a.getAttribute("href") ?? ""),
  );
  const ids = hrefs.map((href) => href.match(/\/video\/(\d+)/)?.[1]).filter((id): id is string => Boolean(id));
  return [...new Set(ids)].slice(0, limit);
}

// Unauthenticated video pages don't expose the comment API or a comments
// panel at all (verified live — no XHR fires, no comment DOM nodes render).
// commentsCount below is still the real aggregate from TikTok's own stats,
// just not the individual comment text/authors viral_video_comments wants.
export async function scrapeVideoMetadata(page: Page, handle: string, videoId: string): Promise<ScrapedTiktokVideo | null> {
  const response = await page.goto(`https://www.tiktok.com/@${handle}/video/${videoId}`, {
    waitUntil: "load",
    timeout: 30_000,
  });
  if (isBlockedResponse(response) || (await isBlockedPage(page))) {
    throw new PlatformBlockedError(`Blocked while scraping metadata for ${videoId}`);
  }

  const item = await page.evaluate(() => {
    const el = document.getElementById("__UNIVERSAL_DATA_FOR_REHYDRATION__");
    if (!el || !el.textContent) return null;
    try {
      const json = JSON.parse(el.textContent);
      return json?.__DEFAULT_SCOPE__?.["webapp.video-detail"]?.itemInfo?.itemStruct ?? null;
    } catch {
      return null;
    }
  });

  if (!item) return null;

  const createTimeSeconds = Number(item.createTime ?? 0);

  return {
    videoId,
    channelName: item.author?.nickname ?? null,
    channelHandle: item.author?.uniqueId ? `@${item.author.uniqueId}` : null,
    viewCount: Number(item.stats?.playCount ?? 0),
    likesCount: item.stats?.diggCount != null ? Number(item.stats.diggCount) : null,
    commentsCount: item.stats?.commentCount != null ? Number(item.stats.commentCount) : null,
    savesCount: item.stats?.collectCount != null ? Number(item.stats.collectCount) : null,
    publishedAt: createTimeSeconds > 0 ? new Date(createTimeSeconds * 1000).toISOString() : null,
    lengthSeconds: Number(item.video?.duration ?? Infinity),
  };
}
