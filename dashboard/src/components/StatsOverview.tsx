import { formatCompact } from '../lib/format'
import type { ViralVideo } from '../types'
import { ChatIcon, EyeIcon, FireIcon, SparklesIcon } from './Icons'

interface StatsOverviewProps {
  videos: ViralVideo[]
}

export function StatsOverview({ videos }: StatsOverviewProps) {
  const totalViews = videos.reduce((acc, v) => acc + (v.views_count || 0), 0)
  const totalLikes = videos.reduce((acc, v) => acc + (v.likes_count || 0), 0)
  const saasVideosCount = videos.filter((v) => Boolean(v.saas_mentioned)).length
  const overMillionCount = videos.filter((v) => v.views_count >= 1_000_000).length

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
      {/* Total Views */}
      <div className="glass-panel relative overflow-hidden rounded-2xl p-4 transition hover:border-indigo-500/30">
        <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-indigo-500/10 blur-xl" />
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-xs font-semibold tracking-wide uppercase">Vues Agrégées</span>
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
            <EyeIcon className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="font-mono-numeric text-2xl font-bold tracking-tight text-white sm:text-3xl">
            {formatCompact(totalViews)}
          </span>
          <span className="text-[11px] font-semibold text-emerald-400">Impact Max</span>
        </div>
        <div className="mt-1 text-[11px] text-slate-400">
          Moyenne : <span className="font-mono-numeric text-slate-300 font-medium">{formatCompact(videos.length ? Math.round(totalViews / videos.length) : 0)} / vid</span>
        </div>
      </div>

      {/* Videos 1M+ */}
      <div className="glass-panel relative overflow-hidden rounded-2xl p-4 transition hover:border-amber-500/30">
        <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-amber-500/10 blur-xl" />
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-xs font-semibold tracking-wide uppercase">Mega Virales (1M+)</span>
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
            <FireIcon className="h-4 w-4 fill-current" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="font-mono-numeric text-2xl font-bold tracking-tight text-amber-300 sm:text-3xl">
            {overMillionCount}
          </span>
          <span className="rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-bold text-amber-400">
            {videos.length ? Math.round((overMillionCount / videos.length) * 100) : 0}% du total
          </span>
        </div>
        <div className="mt-1 text-[11px] text-slate-400">Hits viraux à déconstruire</div>
      </div>

      {/* SaaS Mentions */}
      <div className="glass-panel relative overflow-hidden rounded-2xl p-4 transition hover:border-purple-500/30">
        <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-purple-500/10 blur-xl" />
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-xs font-semibold tracking-wide uppercase">SaaS Détectés</span>
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400">
            <SparklesIcon className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="font-mono-numeric text-2xl font-bold tracking-tight text-purple-300 sm:text-3xl">
            {saasVideosCount}
          </span>
          <span className="text-[11px] font-medium text-slate-400">produits</span>
        </div>
        <div className="mt-1 text-[11px] text-slate-400">
          Exemples concrets de conversion
        </div>
      </div>

      {/* Total Likes / Engagement */}
      <div className="glass-panel relative overflow-hidden rounded-2xl p-4 transition hover:border-pink-500/30">
        <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-pink-500/10 blur-xl" />
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-xs font-semibold tracking-wide uppercase">Likes & Réactions</span>
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-pink-500/10 text-pink-400">
            <ChatIcon className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="font-mono-numeric text-2xl font-bold tracking-tight text-pink-300 sm:text-3xl">
            {formatCompact(totalLikes)}
          </span>
          <span className="text-[11px] font-semibold text-pink-400">Engagements</span>
        </div>
        <div className="mt-1 text-[11px] text-slate-400">Validation d'intérêt massif</div>
      </div>
    </div>
  )
}
