import { Link } from 'react-router-dom'
import { formatDateTime, formatFull } from '../lib/format'
import type { ViralVideo } from '../types'
import { CloseIcon, ExternalLinkIcon, SparklesIcon } from './Icons'
import { PlatformBadge } from './PlatformBadge'
import { ViewsBadge } from './ViewsBadge'

interface VideoQuickModalProps {
  video: ViralVideo | null
  onClose: () => void
}

function getYouTubeEmbedUrl(videoUrl: string): string | null {
  const match = videoUrl.match(/\/shorts\/([\w-]+)/)
  if (match && match[1]) {
    return `https://www.youtube.com/embed/${match[1]}?autoplay=1&rel=0`
  }
  return null
}

export function VideoQuickModal({ video, onClose }: VideoQuickModalProps) {
  if (!video) return null

  const embedUrl = getYouTubeEmbedUrl(video.video_url)
  const engagementRate =
    video.views_count && video.likes_count
      ? ((video.likes_count / video.views_count) * 100).toFixed(2)
      : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative z-10 flex w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-white/[0.1] bg-[#0c1222] shadow-[0_25px_60px_rgba(0,0,0,0.8)] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-4">
          <div className="flex items-center gap-2.5">
            <PlatformBadge platform={video.platform} />
            {video.views_count >= 500_000 && <ViewsBadge views={video.views_count} />}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-white/[0.1] hover:text-white transition"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        {/* Video Player / Preview Area */}
        <div className="relative aspect-video w-full bg-black">
          {embedUrl ? (
            <iframe
              src={embedUrl}
              title="Aperçu vidéo"
              className="h-full w-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-6 text-center">
              <span className="text-slate-400 text-sm">
                Aperçu embarqué non supporté pour cette plateforme.
              </span>
              <a
                href={video.video_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-indigo-500"
              >
                <span>Ouvrir sur {video.platform}</span>
                <ExternalLinkIcon className="h-4 w-4" />
              </a>
            </div>
          )}
        </div>

        {/* Info & Stats */}
        <div className="flex flex-col gap-4 p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-white">{video.account_name ?? 'Compte inconnu'}</h3>
              {video.account_handle && (
                <p className="text-xs text-slate-400 font-mono-numeric">{video.account_handle}</p>
              )}
            </div>

            {video.saas_mentioned && (
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-purple-500/40 bg-purple-500/15 px-3 py-1.5 text-xs font-bold text-purple-300">
                <SparklesIcon className="h-3.5 w-3.5 text-purple-400" />
                <span>SaaS : {video.saas_mentioned}</span>
              </span>
            )}
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 font-mono-numeric">
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-2.5">
              <span className="text-[10px] text-slate-400 font-sans uppercase">Vues</span>
              <div className="text-sm font-bold text-white">{formatFull(video.views_count)}</div>
            </div>
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-2.5">
              <span className="text-[10px] text-slate-400 font-sans uppercase">Likes</span>
              <div className="text-sm font-bold text-pink-400">{formatFull(video.likes_count)}</div>
            </div>
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-2.5">
              <span className="text-[10px] text-slate-400 font-sans uppercase">Commentaires</span>
              <div className="text-sm font-bold text-cyan-400">{formatFull(video.comments_count)}</div>
            </div>
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-2.5">
              <span className="text-[10px] text-slate-400 font-sans uppercase">Taux d'Engagement</span>
              <div className="text-sm font-bold text-emerald-400">{engagementRate ? `${engagementRate}%` : '—'}</div>
            </div>
          </div>

          {/* Action links */}
          <div className="flex items-center justify-between border-t border-white/[0.08] pt-4">
            <span className="text-xs text-slate-400">
              Publié le {formatDateTime(video.published_at)}
            </span>

            <div className="flex items-center gap-2">
              <a
                href={video.video_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.1] bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:bg-white/[0.08] hover:text-white"
              >
                <span>Plateforme d'origine</span>
                <ExternalLinkIcon className="h-3.5 w-3.5" />
              </a>

              <Link
                to={`/videos/${video.id}`}
                onClick={onClose}
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-1.5 text-xs font-bold text-white transition hover:bg-indigo-500 shadow-sm"
              >
                <span>Analyse complète</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
