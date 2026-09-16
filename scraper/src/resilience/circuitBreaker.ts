/**
 * Tracks consecutive failures for one platform. Trips (opens) after
 * `threshold` failures in a row and stays open for the rest of the run.
 * Also supports a separate timed pause for block detection (captcha/429/403),
 * which self-clears after `pauseFor(ms)` elapses instead of lasting forever.
 */
export class CircuitBreaker {
  private consecutiveFailures = 0;
  private tripped = false;
  private pausedUntil: number | null = null;

  constructor(private readonly threshold: number) {}

  recordSuccess(): void {
    this.consecutiveFailures = 0;
  }

  /** Returns true if this failure just tripped the breaker. */
  recordFailure(): boolean {
    this.consecutiveFailures += 1;
    if (this.consecutiveFailures >= this.threshold) {
      this.tripped = true;
      return true;
    }
    return false;
  }

  pauseFor(ms: number): void {
    this.pausedUntil = Date.now() + ms;
  }

  isOpen(): boolean {
    if (this.tripped) return true;
    if (this.pausedUntil !== null && Date.now() < this.pausedUntil) return true;
    if (this.pausedUntil !== null) this.pausedUntil = null; // cooldown elapsed, auto-clear
    return false;
  }
}
