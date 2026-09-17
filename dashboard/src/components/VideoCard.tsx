import { Link } from 'react-router-dom'
import { formatCompact, formatDate } from '../lib/format'
import { thumbnailForVideo } from '../lib/thumbnail'
import type { ViralVideo } from '../types'
import { ChatIcon, ExternalLinkIcon, EyeIcon, HeartIcon, PlayIcon, SparklesIcon } from './Icons'
import { PlatformBadge } from './PlatformBadge'
import { ViewsBadge } from './ViewsBadge'

interface VideoCardProps {
  video: ViralVideo
  viewMode?: 'grid' | 'list'
  onQuickView?: (video: ViralVideo) => void
}

export function VideoCard({ video, viewMode = 'grid', onQuickView }: VideoCardProps) {
  const thumbnail = thumbnailForVideo(video)
  const engagementRate =
    video.views_count && video.likes_count
      ? ((video.likes_count / video.views_count) * 100).toFixed(1)
      : null

  if (viewMode === 'list') {
    return (
      <div className="group flex items-center justify-between gap-4 rounded-2xl border border-white/[0.07] bg-[#0c1222]/60 p-3 backdrop-blur-md transition-all hover:border-indigo-500/40 hover:bg-[#131b31]/80 hover:shadow-[0_8px_25px_rgba(99,102,241,0.15)]">
        {/* Left: Thumbnail + Title */}
        <div className="flex items-center gap-3.5 min-w-0 flex-1">
          <div className="relative h-16 w-28 shrink-0 overflow-hidden rounded-xl bg-slate-900 border border-white/[0.06]">
            {thumbnail ? (
              <img src={thumbnail} alt="" loading="lazy" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 text-indigo-400">
                <PlayIcon className="h-5 w-5 opacity-70" />
              </div>
            )}
            <div className="absolute left-1.5 top-1.5">
              <PlatformBadge platform={video.platform} showLabel={false} />
            </div>
          </div>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <Link
                to={`/videos/${video.id}`}
                className="truncate text-sm font-bold text-white transition hover:text-indigo-300"
              >
                {video.account_name ?? 'Créateur inconnu'}
              </Link>
              {video.views_count >= 500_000 && <ViewsBadge views={video.views_count} />}
            </div>

            {video.account_handle && (
              <span className="truncate text-xs text-slate-400">{video.account_handle}</span>
            )}

            {video.saas_mentioned && (
              <span className="mt-1 inline-flex w-fit items-center gap-1 rounded-full border border-purple-500/30 bg-purple-500/10 px-2 py-0.5 text-[10px] font-bold text-purple-300">
                <SparklesIcon className="h-2.5 w-2.5" />
                {video.saas_mentioned}
              </span>
            )}
          </div>
        </div>

        {/* Right: Metrics & Actions */}
        <div className="flex items-center gap-6 shrink-0">
          <div className="flex items-center gap-4 text-xs font-mono-numeric">
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-slate-400 font-sans uppercase">Vues</span>
              <span className="font-bold text-white">{formatCompact(video.views_count)}</span>
            </div>
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-[10px] text-slate-400 font-sans uppercase">Likes</span>
              <span className="text-slate-300">{formatCompact(video.likes_count)}</span>
            </div>
            {engagementRate && (
              <div className="hidden md:flex flex-col items-end">
                <span className="text-[10px] text-slate-400 font-sans uppercase">Taux Engag.</span>
                <span className="font-bold text-emerald-400">{engagementRate}%</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {onQuickView && (
              <button
                type="button"
                onClick={() => onQuickView(video)}
                className="flex h-8 items-center gap-1.5 rounded-lg border border-white/[0.1] bg-white/[0.04] px-2.5 text-xs font-semibold text-slate-200 transition hover:bg-white/[0.1] hover:text-white"
              >
                Aperçu
              </button>
            )}
            <Link
              to={`/videos/${video.id}`}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white transition hover:bg-indigo-500 shadow-sm"
              title="Détails"
            >
              →
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Grid Mode Card
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0c1222]/80 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1.5 hover:border-indigo-500/50 hover:bg-[#121a30]/90 hover:shadow-[0_15px_35px_rgba(99,102,241,0.2)]">
      {/* Thumbnail Aspect Video */}
      <div className="relative aspect-video w-full overflow-hidden bg-slate-950">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 p-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.06] text-indigo-400 shadow-inner">
              <PlayIcon className="h-6 w-6 ml-0.5" />
            </div>
            <span className="text-xs font-medium text-slate-400">Aperçu direct</span>
          </div>
        )}

        {/* Ambient Dark Gradient on bottom of thumbnail */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0c1222] via-transparent to-black/30 pointer-events-none" />

        {/* Top Badges */}
        <div className="absolute left-2.5 top-2.5 flex items-center gap-1.5 z-10">
          <PlatformBadge platform={video.platform} />
        </div>

        <div className="absolute right-2.5 top-2.5 z-10">
          <ViewsBadge views={video.views_count} />
        </div>

        {/* Hover Quick Action Buttons */}
        <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 backdrop-blur-xs opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          {onQuickView && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                onQuickView(video)
              }}
              className="flex items-center gap-1.5 rounded-full bg-white/90 px-3.5 py-1.5 text-xs font-bold text-slate-900 shadow-lg transition hover:scale-105 hover:bg-white active:scale-95"
            >
              <PlayIcon className="h-3.5 w-3.5" />
              <span>Aperçu rapide</span>
            </button>
          )}

          <a
            href={video.video_url}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white border border-white/20 transition hover:bg-black hover:scale-105"
            title="Lien direct plateforme"
          >
            <ExternalLinkIcon className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      {/* Card Body */}
      <div className="flex flex-1 flex-col p-4">
        {/* Creator Info */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <Link
              to={`/videos/${video.id}`}
              className="truncate block text-sm font-bold text-white transition hover:text-indigo-300"
            >
              {video.account_name ?? 'Compte inconnu'}
            </Link>
            {video.account_handle && (
              <div className="truncate text-xs text-slate-400 font-mono-numeric">{video.account_handle}</div>
            )}
          </div>
        </div>

        {/* SaaS Tag Mention */}
        {video.saas_mentioned && (
          <div className="mt-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-purple-500/30 bg-purple-500/10 px-2.5 py-1 text-xs font-bold text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.15)]">
              <SparklesIcon className="h-3 w-3 text-purple-400" />
              <span>{video.saas_mentioned}</span>
            </span>
          </div>
        )}

        {/* Metrics Bar */}
        <div className="mt-4 flex items-center justify-between border-t border-white/[0.06] pt-3 text-xs text-slate-300 font-mono-numeric">
          <div className="flex items-center gap-1" title={`${video.views_count.toLocaleString('fr-FR')} vues`}>
            <EyeIcon className="h-3.5 w-3.5 text-indigo-400" />
            <span className="font-bold text-white">{formatCompact(video.views_count)}</span>
          </div>

          <div className="flex items-center gap-1" title="Likes">
            <HeartIcon className="h-3.5 w-3.5 text-pink-400" />
            <span>{formatCompact(video.likes_count)}</span>
          </div>

          <div className="flex items-center gap-1" title="Commentaires">
            <ChatIcon className="h-3.5 w-3.5 text-cyan-400" />
            <span>{formatCompact(video.comments_count)}</span>
          </div>

          {engagementRate && (
            <div className="flex items-center gap-0.5 font-bold text-emerald-400 text-[11px]" title="Taux d'engagement">
              <span>{engagementRate}%</span>
            </div>
          )}
        </div>

        {/* Footer info: published date & detail link */}
        <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
          <span>{formatDate(video.published_at)}</span>
          <Link
            to={`/videos/${video.id}`}
            className="font-semibold text-indigo-400 transition hover:text-indigo-300 flex items-center gap-0.5"
          >
            <span>Analyser</span>
            <span>→</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
