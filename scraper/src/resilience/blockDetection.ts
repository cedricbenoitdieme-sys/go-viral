import type { Response } from "playwright";

const BLOCK_STATUS_CODES = new Set([403, 429]);

// Known phrases pages show instead of real content when a bot check fires.
// Kept short and specific to avoid false positives on unrelated text.
const BLOCK_MARKERS = [
  "sign in to confirm you're not a bot",
  "unusual traffic from your computer network",
  "please verify you are a human",
  "verify you are human",
  "/sorry/index",
];

export function isBlockedResponse(response: Response | null): boolean {
  if (!response) return false;
  return BLOCK_STATUS_CODES.has(response.status());
}

export async function isBlockedPage(page: { content: () => Promise<string> }): Promise<boolean> {
  const html = await page.content().catch(() => "");
  const lower = html.toLowerCase();
  return BLOCK_MARKERS.some((marker) => lower.includes(marker));
}
