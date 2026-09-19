export type Category = "saas_marketing" | "ai_dev_tips";

// --- saas_marketing: videos promoting a SaaS/tool, must be genuinely viral ---
export const SAAS_MIN_VIEWS = 100_000;
export const SAAS_MIN_LIKES = 10_000;
const SAAS_QUALIFY_SCORE = 5;

// --- ai_dev_tips: 2026+ tips/warnings about developing with AI, with a lower
// reach bar than saas_marketing (50k views / 1k likes) ---
export const AI_DEV_MIN_VIEWS = 50_000;
export const AI_DEV_MIN_LIKES = 1_000;
const AI_DEV_EARLIEST_PUBLISH = new Date("2026-01-01T00:00:00Z");
const AI_DEV_QUALIFY_SCORE = 5;

// ---------------------------------------------------------------------------
// saas_marketing relevance (coarse keyword pre-filter; the eventual LLM pass
// fills saas_mentioned on what survives).
// ---------------------------------------------------------------------------
const SAAS_KEYWORDS = [
  "saas",
  "outil",
  "tool",
  "app",
  "application",
  "logiciel",
  "software",
  "automatis",
  "automation",
  "startup",
  "productivité",
  "productivity",
  "no-code",
  "nocode",
  "low-code",
  "crm",
  "dashboard",
  "plateforme",
  "platform",
  "workflow",
  "abonnement",
  "subscription",
  "freemium",
  "api",
  "mrr",
  "arr",
  "customers",
  "launch",
];

const STRONG_PROMO_PHRASES = [
  "j'ai créé",
  "j'ai lancé",
  "j'ai développé",
  "i built",
  "i made this",
  "i created",
  "i launched",
  "i started",
  "check out my",
  "lien en bio",
  "link in bio",
  "link in description",
  "sign up",
  "free trial",
];

const PRODUCT_URL_PATTERN = /\bhttps?:\/\/[^\s]+\.(com|io|app|ai|co)\b/i;

export function scoreSaasRelevance(text: string): number {
  const lower = text.toLowerCase();

  const matchedKeywords = SAAS_KEYWORDS.filter((kw) => lower.includes(kw)).length;
  let score = Math.min(matchedKeywords, 5);

  if (STRONG_PROMO_PHRASES.some((phrase) => lower.includes(phrase))) score += 2;
  if (PRODUCT_URL_PATTERN.test(text)) score += 3;

  return Math.max(0, Math.min(10, score));
}

// ---------------------------------------------------------------------------
// ai_dev_tips relevance. Word-boundary regexes, not substring checks: short
// tokens like "ai" or "api" would otherwise match "said" / "capital".
// ---------------------------------------------------------------------------
const AI_TERMS = [
  "ai",
  "a\\.i\\.",
  "cursor",
  "claude",
  "claude code",
  "chatgpt",
  "gpt",
  "copilot",
  "codex",
  "windsurf",
  "gemini",
  "llm",
  "llms",
  "vibe coding",
  "vibecoding",
  "vibe coder",
  "ai agent",
  "ai agents",
  "agentic",
  "mcp",
  "prompt",
  "prompts",
  "prompting",
  "lovable",
  "bolt",
  "v0",
  "replit",
];

const DEV_TERMS = [
  "code",
  "coding",
  "coder",
  "developer",
  "developers",
  "dev",
  "programming",
  "programmer",
  "software",
  "engineer",
  "engineering",
  "github",
  "repo",
  "codebase",
  "api",
  "backend",
  "frontend",
  "database",
  "app",
  "build",
  "deploy",
];

const ADVICE_TERMS = [
  "tip",
  "tips",
  "trick",
  "tricks",
  "hack",
  "hacks",
  "mistake",
  "mistakes",
  "avoid",
  "never",
  "stop",
  "don't",
  "dont",
  "best practice",
  "best practices",
  "rule",
  "rules",
  "lesson",
  "lessons",
  "workflow",
  "how to",
  "should",
  "wrong",
  "warning",
  "beginner",
  "beginners",
];

const SECURITY_TERMS = [
  "security",
  "secure",
  "insecure",
  "vulnerability",
  "vulnerabilities",
  "vulnerable",
  "leak",
  "leaked",
  "api key",
  "api keys",
  "secret",
  "secrets",
  "exposed",
  "hacked",
  "hack",
  "injection",
  "auth",
  "authentication",
  "credentials",
  "password",
  "passwords",
  "breach",
  ".env",
  "env file",
  "rls",
  "pentest",
  "exploit",
];

function buildMatcher(terms: string[]): RegExp {
  const escaped = terms.map((t) => (t.includes("\\") ? t : t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  return new RegExp(`(?<![a-z0-9])(?:${escaped.join("|")})(?![a-z0-9])`, "gi");
}

const AI_MATCHER = buildMatcher(AI_TERMS);
const DEV_MATCHER = buildMatcher(DEV_TERMS);
const ADVICE_MATCHER = buildMatcher(ADVICE_TERMS);
const SECURITY_MATCHER = buildMatcher(SECURITY_TERMS);

function distinctMatches(matcher: RegExp, text: string): number {
  const found = new Set((text.match(matcher) ?? []).map((m) => m.toLowerCase()));
  return found.size;
}

export function scoreAiDevRelevance(text: string): number {
  const ai = distinctMatches(AI_MATCHER, text);

  // Without a real AI-tooling signal it's just generic dev/advice content.
  if (ai === 0) return Math.min(3, distinctMatches(DEV_MATCHER, text) + distinctMatches(ADVICE_MATCHER, text));

  let score = Math.min(ai, 3) * 1.5; // up to 4.5 for AI-tool coverage
  score += Math.min(distinctMatches(DEV_MATCHER, text), 2); // up to 2 for dev context
  score += Math.min(distinctMatches(ADVICE_MATCHER, text), 2); // up to 2 for tip/mistake framing
  if (distinctMatches(SECURITY_MATCHER, text) > 0) score += 2; // security angle is the most wanted

  return Math.max(0, Math.min(10, Math.round(score)));
}

// ---------------------------------------------------------------------------
// Engagement sanity check (likes/views ratio, zero-comment tell).
// ---------------------------------------------------------------------------
export function detectEngagementSuspect(
  viewsCount: number,
  likesCount: number | null,
  commentsCount: number | null,
): boolean {
  if (likesCount == null) return false;

  const ratio = likesCount / Math.max(viewsCount, 1);
  if (ratio < 0.005 || ratio > 0.15) return true;

  // Zero comments on a video with real engagement is a common bought-likes tell.
  if (commentsCount === 0 && likesCount >= SAAS_MIN_LIKES) return true;

  return false;
}

export interface QualificationInput {
  category: Category;
  viewsCount: number;
  likesCount: number | null;
  commentsCount: number | null;
  publishedAt: string | null;
  text: string; // title + description/caption, concatenated by the caller
}

export interface QualificationResult {
  passesHardGate: boolean;
  rejectionReason: string | null;
  saasRelevanceScore: number | null;
  aiDevRelevanceScore: number | null;
  engagementSuspect: boolean;
  isQualified: boolean;
}

function rejected(reason: string): QualificationResult {
  return {
    passesHardGate: false,
    rejectionReason: reason,
    saasRelevanceScore: null,
    aiDevRelevanceScore: null,
    engagementSuspect: false,
    isQualified: false,
  };
}

export function qualifyVideo(input: QualificationInput): QualificationResult {
  if (input.category === "ai_dev_tips") {
    const published = input.publishedAt ? new Date(input.publishedAt) : null;
    if (!published || Number.isNaN(published.getTime())) return rejected("published_at unknown");
    if (published < AI_DEV_EARLIEST_PUBLISH) {
      return rejected(`published_at ${published.toISOString().slice(0, 10)} is before 2026`);
    }

    if (input.viewsCount < AI_DEV_MIN_VIEWS) {
      return rejected(`views_count ${input.viewsCount} < ${AI_DEV_MIN_VIEWS}`);
    }
    if (input.likesCount == null || input.likesCount < AI_DEV_MIN_LIKES) {
      return rejected(`likes_count ${input.likesCount ?? "null"} < ${AI_DEV_MIN_LIKES}`);
    }

    const aiDevRelevanceScore = scoreAiDevRelevance(input.text);
    return {
      passesHardGate: true,
      rejectionReason: null,
      saasRelevanceScore: null,
      aiDevRelevanceScore,
      engagementSuspect: detectEngagementSuspect(input.viewsCount, input.likesCount, input.commentsCount),
      isQualified: aiDevRelevanceScore >= AI_DEV_QUALIFY_SCORE,
    };
  }

  if (input.viewsCount < SAAS_MIN_VIEWS) {
    return rejected(`views_count ${input.viewsCount} < ${SAAS_MIN_VIEWS}`);
  }
  if (input.likesCount == null || input.likesCount < SAAS_MIN_LIKES) {
    return rejected(`likes_count ${input.likesCount ?? "null"} < ${SAAS_MIN_LIKES}`);
  }

  const saasRelevanceScore = scoreSaasRelevance(input.text);
  return {
    passesHardGate: true,
    rejectionReason: null,
    saasRelevanceScore,
    aiDevRelevanceScore: null,
    engagementSuspect: detectEngagementSuspect(input.viewsCount, input.likesCount, input.commentsCount),
    isQualified: saasRelevanceScore >= SAAS_QUALIFY_SCORE,
  };
}
