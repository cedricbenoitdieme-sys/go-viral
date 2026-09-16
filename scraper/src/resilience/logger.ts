import { supabase } from "../supabase.js";
import type { Platform } from "./config.js";

export type LogStatus = "info" | "success" | "error" | "blocked" | "circuit_open" | "summary";

export async function logEvent(platform: Platform, status: LogStatus, message: string): Promise<void> {
  const line = `[${platform}] ${status}: ${message}`;
  if (status === "error" || status === "blocked" || status === "circuit_open") {
    console.error(line);
  } else {
    console.log(line);
  }

  const { error } = await supabase.from("scraping_logs").insert({ platform, status, message });
  if (error) {
    // Logging must never take the scraper down — surface it to the console and move on.
    console.error(`Failed to write scraping_logs row for ${platform}:`, error.message);
  }
}

export class RunStats {
  sent = 0;
  succeeded = 0;
  failed = 0;
  blocked = 0;

  recordSuccess(): void {
    this.sent += 1;
    this.succeeded += 1;
  }

  recordFailure(): void {
    this.sent += 1;
    this.failed += 1;
  }

  recordBlocked(): void {
    this.sent += 1;
    this.blocked += 1;
  }

  summary(): string {
    return `${this.sent} requests sent, ${this.succeeded} succeeded, ${this.failed} failed, ${this.blocked} blocked`;
  }
}
