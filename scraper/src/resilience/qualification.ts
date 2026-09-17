export const MIN_VIEWS = 100_000;
export const MIN_LIKES = 1_000;
const RELEVANCE_QUALIFY_THRESHOLD = 5;

// Coarse keyword pre-filter, not a real classifier — good enough to cut
// obvious noise before the eventual LLM pass (saas_mentioned) runs on
// what's left. Deliberately generic across platforms/languages (FR + EN).
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
];

const STRONG_PROMO_PHRASES = [
  "j'ai créé",
  "j'ai lancé",
  "j'ai développé",
  "i built",
  "i made this",
  "i created",
  "i launched",
  "check out my",
  "lien en bio",
  "link in bio",
];

const PRODUCT_URL_PATTERN = /\bhttps?:\/\/[^\s]+\.(com|io|app)\b/i;

export function scoreSaasRelevance(text: string): number {
  const lower = text.toLowerCase();

  const matchedKeywords = SAAS_KEYWORDS.filter((kw) => lower.includes(kw)).length;
  let score = Math.min(matchedKeywords, 5); // up to 5 pts for keyword coverage

  if (STRONG_PROMO_PHRASES.some((phrase) => lower.includes(phrase))) score += 2;
  if (PRODUCT_URL_PATTERN.test(text)) score += 3; // strong signal: an actual product link

  return Math.max(0, Math.min(10, score));
}

export function detectEngagementSuspect(
  viewsCount: number,
  likesCount: number | null,
  commentsCount: number | null,
): boolean {
  if (likesCount == null) return false; // nothing to judge without a real number

  const ratio = likesCount / Math.max(viewsCount, 1);
  if (ratio < 0.005 || ratio > 0.15) return true;

  // Zero comments on a video with real engagement is a common bought-likes tell.
  if (commentsCount === 0 && likesCount >= MIN_LIKES) return true;

  return false;
}

export interface QualificationInput {
  viewsCount: number;
  likesCount: number | null;
  commentsCount: number | null;
  text: string; // title + description/caption, concatenated by the caller
}

export interface QualificationResult {
  passesHardGate: boolean;
  rejectionReason: string | null;
  saasRelevanceScore: number | null;
  engagementSuspect: boolean;
  isQualified: boolean;
}

export function qualifyVideo(input: QualificationInput): QualificationResult {
  if (input.viewsCount < MIN_VIEWS) {
    return {
      passesHardGate: false,
      rejectionReason: `views_count ${input.viewsCount} < ${MIN_VIEWS}`,
      saasRelevanceScore: null,
      engagementSuspect: false,
      isQualified: false,
    };
  }
  if (input.likesCount == null || input.likesCount < MIN_LIKES) {
    return {
      passesHardGate: false,
      rejectionReason: `likes_count ${input.likesCount ?? "null"} < ${MIN_LIKES}`,
      saasRelevanceScore: null,
      engagementSuspect: false,
      isQualified: false,
    };
  }

  const saasRelevanceScore = scoreSaasRelevance(input.text);
  const engagementSuspect = detectEngagementSuspect(input.viewsCount, input.likesCount, input.commentsCount);
  const isQualified = saasRelevanceScore >= RELEVANCE_QUALIFY_THRESHOLD;

  return { passesHardGate: true, rejectionReason: null, saasRelevanceScore, engagementSuspect, isQualified };
}
