import type { Page } from "playwright";
import { isBlockedPage, isBlockedResponse } from "./resilience/blockDetection.js";
import { PlatformBlockedError } from "./resilience/retry.js";

export interface ScrapedVideo {
  videoId: string;
  channelName: string | null;
  channelHandle: string | null;
  channelId: string | null;
  viewCount: number;
  likesCount: number | null;
  publishedAt: string | null;
  lengthSeconds: number;
  title: string | null;
  description: string | null;
}

export interface ScrapedComment {
  text: string;
  author: string | null;
}

// YouTube ships no public list-of-IDs endpoint here; we walk the raw
// ytInitialData blob the results page embeds and collect every "videoId"
// key at any depth. That's more resilient to YouTube reshuffling its
// renderer wrapper types than pinning to one exact JSON path.
function collectVideoIds(node: unknown, out: Set<string>): void {
  if (!node || typeof node !== "object") return;
  if (Array.isArray(node)) {
    for (const item of node) collectVideoIds(item, out);
    return;
  }
  for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
    if (key === "videoId" && typeof value === "string") {
      out.add(value);
    } else {
      collectVideoIds(value, out);
    }
  }
}

// YouTube's `sp` search-filter param is a base64 protobuf. Both values below
// include "Duration: Short (< 4 minutes)"; the second additionally sorts by
// upload date and restricts to uploads from the current year.
export const SEARCH_FILTER_SHORTS = "EgIYAQ%3D%3D";
export const SEARCH_FILTER_SHORTS_NEWEST_THIS_YEAR = "CAISBggFEAEYAQ%3D%3D";

export async function searchShortsIds(
  page: Page,
  keyword: string,
  limit: number,
  filter: string = SEARCH_FILTER_SHORTS,
): Promise<string[]> {
  // hl=en&gl=US pins results to the US market regardless of where the scraper runs.
  const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(keyword)}&sp=${filter}&hl=en&gl=US`;
  const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30_000 });
  if (isBlockedResponse(response) || (await isBlockedPage(page))) {
    throw new PlatformBlockedError(`Blocked while searching "${keyword}"`);
  }

  const data = await page.evaluate(() => (window as unknown as { ytInitialData?: unknown }).ytInitialData);
  if (!data) return [];

  const ids = new Set<string>();
  collectVideoIds(data, ids);
  return [...ids].slice(0, limit);
}

// The /shorts/<id> player is a newer "reel" UI whose embedded JSON doesn't
// carry view/like counts. The classic /watch?v=<id> page still does, in
// microformat.playerMicroformatRenderer, exact (not abbreviated) and
// including the channel's @handle via ownerProfileUrl — so we scrape that
// URL for every Short instead.
export async function scrapeVideoMetadata(page: Page, videoId: string): Promise<ScrapedVideo | null> {
  const response = await page.goto(`https://www.youtube.com/watch?v=${videoId}`, {
    waitUntil: "domcontentloaded",
    timeout: 30_000,
  });
  if (isBlockedResponse(response) || (await isBlockedPage(page))) {
    throw new PlatformBlockedError(`Blocked while scraping metadata for ${videoId}`);
  }

  const data = await page.evaluate(() => {
    const pr = (window as unknown as { ytInitialPlayerResponse?: any }).ytInitialPlayerResponse;
    return pr?.microformat?.playerMicroformatRenderer ?? null;
  });

  if (!data) return null;

  const handleMatch = typeof data.ownerProfileUrl === "string" ? data.ownerProfileUrl.match(/@[\w.-]+/) : null;

  return {
    videoId,
    channelName: data.ownerChannelName ?? null,
    channelHandle: handleMatch ? handleMatch[0] : null,
    channelId: data.externalChannelId ?? null,
    viewCount: Number(data.viewCount ?? 0),
    likesCount: data.likeCount != null ? Number(data.likeCount) : null,
    publishedAt: data.publishDate ?? null,
    lengthSeconds: Number(data.lengthSeconds ?? Infinity),
    title: data.title?.simpleText ?? null,
    description: data.description?.simpleText ?? null,
  };
}

async function triggerLazyLoad(page: Page, steps: number): Promise<void> {
  for (let i = 0; i < steps; i++) {
    await page.mouse.wheel(0, 1_200);
    await page.waitForTimeout(800);
  }
}

export async function scrapeComments(page: Page, videoId: string, limit: number): Promise<ScrapedComment[]> {
  const response = await page.goto(`https://www.youtube.com/watch?v=${videoId}`, {
    waitUntil: "load",
    timeout: 30_000,
  });
  if (isBlockedResponse(response) || (await isBlockedPage(page))) {
    throw new PlatformBlockedError(`Blocked while scraping comments for ${videoId}`);
  }
  await page.waitForTimeout(1_500);

  // The comments section is a hidden, not-yet-upgraded custom element until
  // it scrolls into view, so we simulate real scrolling to trigger it.
  await triggerLazyLoad(page, 6);

  try {
    await page.waitForSelector("#content-text", { timeout: 10_000, state: "attached" });
  } catch {
    // Comments disabled, none posted yet, or the section never hydrated.
    return [];
  }

  const comments = await page.evaluate((max: number) => {
    const nodes = Array.from(document.querySelectorAll("#content-text")).slice(0, max);
    return nodes.map((node) => {
      const commentRoot = node.closest("ytd-comment-renderer, ytd-comment-view-model");
      const authorNode = commentRoot?.querySelector("#author-text");
      return {
        text: (node.textContent ?? "").trim(),
        author: authorNode?.textContent?.trim() ?? null,
      };
    });
  }, limit);

  return comments.filter((c) => c.text.length > 0);
}
