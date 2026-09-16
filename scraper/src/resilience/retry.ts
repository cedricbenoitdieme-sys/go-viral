import { sleep } from "./rateLimiter.js";

/** Thrown when a response looks like a block (captcha, 429, 403) rather than a
 * transient failure — callers should NOT retry immediately on this, they
 * should pause the platform instead. See detectBlock() in blockDetection.ts. */
export class PlatformBlockedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PlatformBlockedError";
  }
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: { retryDelaysMs: number[]; onAttemptFailed?: (err: unknown, attempt: number) => void },
): Promise<T> {
  const { retryDelaysMs, onAttemptFailed } = options;
  let lastError: unknown;

  for (let attempt = 0; attempt <= retryDelaysMs.length; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      onAttemptFailed?.(err, attempt);

      // Blocks get escalated to the caller immediately — no point burning
      // through the backoff schedule against a captcha wall.
      if (err instanceof PlatformBlockedError) throw err;

      if (attempt < retryDelaysMs.length) {
        await sleep(retryDelaysMs[attempt]);
      }
    }
  }
  throw lastError;
}
