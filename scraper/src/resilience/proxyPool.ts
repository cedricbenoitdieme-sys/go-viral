export interface ProxyConfig {
  server: string;
  username?: string;
  password?: string;
}

function parseProxyUrl(raw: string): ProxyConfig {
  try {
    const url = new URL(raw);
    const server = `${url.protocol}//${url.host}`;
    return {
      server,
      username: url.username || undefined,
      password: url.password || undefined,
    };
  } catch {
    return { server: raw };
  }
}

/**
 * Optional proxy rotation. With no PROXIES configured this is a no-op and
 * callers fall back to the maxVideosPerRun volume cap instead — see
 * config.ts and the constraint note in index.ts.
 */
export class ProxyPool {
  private readonly proxies: ProxyConfig[];
  private index = 0;
  private requestsSinceRotation = 0;

  constructor(rawProxies: string[], private readonly rotateEveryN: number) {
    this.proxies = rawProxies.filter(Boolean).map(parseProxyUrl);
  }

  get enabled(): boolean {
    return this.proxies.length > 0;
  }

  current(): ProxyConfig | undefined {
    return this.proxies[this.index];
  }

  rotate(): void {
    if (this.proxies.length === 0) return;
    this.index = (this.index + 1) % this.proxies.length;
    this.requestsSinceRotation = 0;
  }

  /** Call after each request; rotates automatically every N requests. */
  noteRequest(): void {
    if (!this.enabled) return;
    this.requestsSinceRotation += 1;
    if (this.requestsSinceRotation >= this.rotateEveryN) {
      this.rotate();
    }
  }
}

export function loadProxyPoolFromEnv(rotateEveryN = 20): ProxyPool {
  const raw = process.env.SCRAPER_PROXIES ?? "";
  const proxies = raw.split(",").map((p) => p.trim()).filter(Boolean);
  return new ProxyPool(proxies, rotateEveryN);
}
