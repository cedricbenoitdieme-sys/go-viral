export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Random delay in [minMs, maxMs] — the jitter between actions the spec asks for. */
export function jitterDelay(minMs: number, maxMs: number): Promise<void> {
  const ms = minMs + Math.random() * (maxMs - minMs);
  return sleep(ms);
}

/**
 * Simple sliding-window request counter (a token bucket with a 1-hour window).
 * Call `waitForSlot()` before each request; it blocks until under the cap.
 */
export class RateLimiter {
  private timestamps: number[] = [];

  constructor(private readonly maxPerHour: number) {}

  async waitForSlot(): Promise<void> {
    const windowMs = 60 * 60_000;
    for (;;) {
      const now = Date.now();
      this.timestamps = this.timestamps.filter((t) => now - t < windowMs);
      if (this.timestamps.length < this.maxPerHour) {
        this.timestamps.push(now);
        return;
      }
      const oldest = this.timestamps[0];
      const waitMs = oldest + windowMs - now;
      await sleep(Math.max(waitMs, 1_000));
    }
  }
}
