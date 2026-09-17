import { FireIcon, SparklesIcon } from './Icons'

const MILLION_THRESHOLD = 1_000_000
const HALF_MILLION_THRESHOLD = 500_000

export function ViewsBadge({ views }: { views: number }) {
  if (views >= MILLION_THRESHOLD) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold text-amber-300 bg-amber-500/15 border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.25)] backdrop-blur-md animate-pulse">
        <FireIcon className="w-3.5 h-3.5 text-amber-400 fill-current" />
        <span>1M+ VIRAL</span>
      </span>
    )
  }
  if (views >= HALF_MILLION_THRESHOLD) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold text-indigo-300 bg-indigo-500/15 border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.2)] backdrop-blur-md">
        <SparklesIcon className="w-3.5 h-3.5 text-indigo-400" />
        <span>500K+ TREND</span>
      </span>
    )
  }
  return null
}
