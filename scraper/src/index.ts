import { chromium } from "playwright";
import { supabase } from "./supabase.js";
import { searchShortsIds, scrapeVideoMetadata, scrapeComments } from "./youtube.js";

const MIN_VIEWS = 100_000;
const MAX_SHORT_DURATION_SECONDS = 60;
const RESULTS_PER_KEYWORD = 25;
const COMMENTS_PER_VIDEO = 20;
const NAV_DELAY_MS = 1_500; // stay polite with youtube.com, avoid tripping rate limits

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

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const browser = await chromium.launch();
  const context = await browser.newContext({ userAgent: USER_AGENT });
  const page = await context.newPage();

  const videoIdSet = new Set<string>();
  for (const keyword of SEARCH_KEYWORDS) {
    try {
      const ids = await searchShortsIds(page, keyword, RESULTS_PER_KEYWORD);
      for (const id of ids) videoIdSet.add(id);
    } catch (err) {
      console.error(`search failed for "${keyword}":`, err);
    }
    await sleep(NAV_DELAY_MS);
  }
  console.log(`Found ${videoIdSet.size} candidate Shorts across ${SEARCH_KEYWORDS.length} keywords.`);

  const qualifying = [];
  for (const videoId of videoIdSet) {
    try {
      const meta = await scrapeVideoMetadata(page, videoId);
      if (meta && meta.viewCount >= MIN_VIEWS && meta.lengthSeconds <= MAX_SHORT_DURATION_SECONDS) {
        qualifying.push(meta);
      }
    } catch (err) {
      console.error(`metadata scrape failed for ${videoId}:`, err);
    }
    await sleep(NAV_DELAY_MS);
  }
  console.log(`${qualifying.length} qualify with >=${MIN_VIEWS} views and <=${MAX_SHORT_DURATION_SECONDS}s duration.`);

  if (qualifying.length === 0) {
    await browser.close();
    return;
  }

  const candidateUrls = qualifying.map((v) => `https://www.youtube.com/shorts/${v.videoId}`);
  const { data: existingRows } = await supabase.from("viral_videos").select("video_url").in("video_url", candidateUrls);
  const existingUrls = new Set((existingRows ?? []).map((r) => r.video_url));

  const rows = qualifying.map((video) => ({
    platform: "youtube_shorts",
    video_url: `https://www.youtube.com/shorts/${video.videoId}`,
    account_name: video.channelName,
    account_handle: video.channelHandle,
    views_count: video.viewCount,
    likes_count: video.likesCount,
    comments_count: null,
    saves_count: null,
    published_at: video.publishedAt,
  }));

  const { data: upserted, error } = await supabase
    .from("viral_videos")
    .upsert(rows, { onConflict: "video_url" })
    .select("id, video_url");

  if (error) {
    console.error("Upsert into viral_videos failed:", error);
    await browser.close();
    process.exitCode = 1;
    return;
  }
  console.log(`Upserted ${upserted?.length ?? 0} videos.`);

  // Only pull comments for videos we hadn't already collected, to avoid
  // re-inserting duplicate comment samples on every scheduled run.
  const newlyInserted = (upserted ?? []).filter((v) => !existingUrls.has(v.video_url));
  let commentsInserted = 0;

  for (const video of newlyInserted) {
    const videoId = video.video_url.split("/shorts/")[1];
    try {
      const comments = await scrapeComments(page, videoId, COMMENTS_PER_VIDEO);
      if (comments.length > 0) {
        const { error: commentsError } = await supabase
          .from("viral_video_comments")
          .insert(comments.map((c) => ({ video_id: video.id, comment_text: c.text, author: c.author })));
        if (commentsError) {
          console.error(`Insert comments failed for ${video.video_url}:`, commentsError);
        } else {
          commentsInserted += comments.length;
        }
      }
    } catch (err) {
      console.error(`comment scrape failed for ${video.video_url}:`, err);
    }
    await sleep(NAV_DELAY_MS);
  }
  console.log(`Inserted ${commentsInserted} sampled comments.`);

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
