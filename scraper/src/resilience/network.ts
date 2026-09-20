import { sleep } from "./rateLimiter.js";

// Lightweight connectivity probe, independent of the platforms being scraped.
const PROBE_URL = "https://www.gstatic.com/generate_204";

export async function isOnline(): Promise<boolean> {
  // Two tries: a cold DNS/TLS handshake can miss the first window on a healthy link.
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(PROBE_URL, { signal: AbortSignal.timeout(8_000) });
      if (res.status === 204 || res.ok) return true;
    } catch {
      // fall through to the next attempt
    }
  }
  return false;
}

/**
 * Blocks until the machine is back online (laptop asleep, wifi drop, ISP
 * outage). Waiting here — instead of letting page loads time out — keeps an
 * outage from burning retry attempts or tripping the circuit breaker, which
 * exist to catch *platform* trouble, not ours.
 */
export async function waitForNetwork(maxWaitMs = 20 * 60_000): Promise<void> {
  if (await isOnline()) return;

  console.log("[network] offline — pausing until connectivity returns");
  const startedAt = Date.now();
  while (Date.now() - startedAt < maxWaitMs) {
    await sleep(15_000);
    if (await isOnline()) {
      console.log(`[network] back online after ${Math.round((Date.now() - startedAt) / 1000)}s`);
      return;
    }
  }
  throw new Error(`network still offline after ${Math.round(maxWaitMs / 60_000)}min`);
}
