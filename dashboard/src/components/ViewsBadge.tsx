const MILLION_THRESHOLD = 1_000_000
const HALF_MILLION_THRESHOLD = 500_000

export function ViewsBadge({ views }: { views: number }) {
  if (views >= MILLION_THRESHOLD) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-400/10 dark:text-amber-400">
        🔥 1M+ vues
      </span>
    )
  }
  if (views >= HALF_MILLION_THRESHOLD) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-800 dark:bg-sky-400/10 dark:text-sky-400">
        ⭐ 500K+ vues
      </span>
    )
  }
  return null
}
