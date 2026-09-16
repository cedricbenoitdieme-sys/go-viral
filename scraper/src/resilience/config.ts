export type Platform = "youtube_shorts" | "tiktok" | "instagram" | "twitter";

export interface PlatformConfig {
  /** Jittered delay range between actions (navigation, scroll, extraction), in ms. */
  minDelayMs: number;
  maxDelayMs: number;
  /** Token-bucket style cap: max requests allowed in any trailing 60-minute window. */
  maxRequestsPerHour: number;
  /** Volume cap for one unattended run (a "night"), independent of the hourly rate. */
  maxVideosPerRun: number;
  /** Backoff schedule for transient errors (network/timeout) — one retry per entry. */
  retryDelaysMs: number[];
  /** How long to pause a platform after a block is detected (captcha, 429, 403). */
  blockCooldownMs: number;
  /** Consecutive failures (post-retry) before the circuit breaker disables the platform. */
  circuitBreakerThreshold: number;
}

function envNumber(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function buildConfig(prefix: string, defaults: PlatformConfig): PlatformConfig {
  return {
    minDelayMs: envNumber(`RATE_LIMIT_${prefix}_MIN_DELAY_MS`, defaults.minDelayMs),
    maxDelayMs: envNumber(`RATE_LIMIT_${prefix}_MAX_DELAY_MS`, defaults.maxDelayMs),
    maxRequestsPerHour: envNumber(`RATE_LIMIT_${prefix}_MAX_PER_HOUR`, defaults.maxRequestsPerHour),
    maxVideosPerRun: envNumber(`RATE_LIMIT_${prefix}_MAX_PER_RUN`, defaults.maxVideosPerRun),
    retryDelaysMs: defaults.retryDelaysMs,
    blockCooldownMs: envNumber(`RATE_LIMIT_${prefix}_BLOCK_COOLDOWN_MS`, defaults.blockCooldownMs),
    circuitBreakerThreshold: envNumber(`RATE_LIMIT_${prefix}_CIRCUIT_THRESHOLD`, defaults.circuitBreakerThreshold),
  };
}

const DEFAULT_RETRY_DELAYS_MS = [5_000, 15_000, 45_000];

// YouTube here means Playwright scraping of youtube.com (no official API key),
// not the Data API v3 — it gets the same protections as the others, just with
// slightly more headroom since plain page loads draw less scrutiny than the
// heavier interaction TikTok/Instagram scraping needs.
export const PLATFORM_CONFIG: Record<Platform, PlatformConfig> = {
  youtube_shorts: buildConfig("YOUTUBE_SHORTS", {
    minDelayMs: 1_500,
    maxDelayMs: 3_000,
    maxRequestsPerHour: 400,
    maxVideosPerRun: 300,
    retryDelaysMs: DEFAULT_RETRY_DELAYS_MS,
    blockCooldownMs: 30 * 60_000,
    circuitBreakerThreshold: 5,
  }),
  tiktok: buildConfig("TIKTOK", {
    minDelayMs: 3_000,
    maxDelayMs: 8_000,
    maxRequestsPerHour: 150,
    maxVideosPerRun: 200,
    retryDelaysMs: DEFAULT_RETRY_DELAYS_MS,
    blockCooldownMs: 45 * 60_000,
    circuitBreakerThreshold: 5,
  }),
  instagram: buildConfig("INSTAGRAM", {
    minDelayMs: 3_000,
    maxDelayMs: 8_000,
    maxRequestsPerHour: 150,
    maxVideosPerRun: 200,
    retryDelaysMs: DEFAULT_RETRY_DELAYS_MS,
    blockCooldownMs: 45 * 60_000,
    circuitBreakerThreshold: 5,
  }),
  twitter: buildConfig("TWITTER", {
    minDelayMs: 3_000,
    maxDelayMs: 8_000,
    maxRequestsPerHour: 150,
    maxVideosPerRun: 200,
    retryDelaysMs: DEFAULT_RETRY_DELAYS_MS,
    blockCooldownMs: 45 * 60_000,
    circuitBreakerThreshold: 5,
  }),
};
