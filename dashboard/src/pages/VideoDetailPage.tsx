import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CommentItem } from '../components/CommentItem'
import { Header } from '../components/Header'
import {
  ChatIcon,
  ExternalLinkIcon,
  EyeIcon,
  FireIcon,
  HeartIcon,
  SparklesIcon,
  TrendingUpIcon,
} from '../components/Icons'
import { PlatformBadge } from '../components/PlatformBadge'
import { ViewsBadge } from '../components/ViewsBadge'
import { useVideoDetail } from '../hooks/useVideoDetail'
import { formatDateTime, formatFull } from '../lib/format'
import { thumbnailForVideo } from '../lib/thumbnail'

function getYouTubeEmbedUrl(videoUrl: string): string | null {
  const match = videoUrl.match(/\/shorts\/([\w-]+)/)
  return match && match[1] ? `https://www.youtube.com/embed/${match[1]}?autoplay=0&rel=0` : null
}

export function VideoDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { video, comments, loading, error } = useVideoDetail(id)
  const [commentFilter, setCommentFilter] = useState<'all' | 'saas_only'>('all')

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070a12] text-[#f1f5f9] bg-ambient-grid">
        <Header />
        <div className="mx-auto flex max-w-5xl items-center justify-center py-32">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
            <span className="text-xs text-slate-400">Analyse de la vidéo en cours…</span>
          </div>
        </div>
      </div>
    )
  }

  if (error || !video) {
    return (
      <div className="min-h-screen bg-[#070a12] text-[#f1f5f9] bg-ambient-grid">
        <Header />
        <div className="mx-auto max-w-xl py-24 px-4 text-center">
          <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-8 backdrop-blur-md">
            <h2 className="text-lg font-bold text-white">Vidéo introuvable</h2>
            <p className="mt-2 text-xs text-red-300">{error ?? 'Cette vidéo n’a pas pu être chargée.'}</p>
            <Link
              to="/"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white/[0.1] px-4 py-2 text-xs font-bold text-white transition hover:bg-white/[0.2]"
            >
              ← Retour au flux principal
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const thumbnail = thumbnailForVideo(video)
  const embedUrl = getYouTubeEmbedUrl(video.video_url)
  const saasComments = comments.filter((c) => c.asks_about_saas)
  const filteredComments = commentFilter === 'saas_only' ? saasComments : comments

  const engagementRate =
    video.views_count && video.likes_count
      ? ((video.likes_count / video.views_count) * 100).toFixed(2)
      : null

  return (
    <div className="min-h-screen bg-[#070a12] text-[#f1f5f9] bg-ambient-grid pb-16">
      <Header />

      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:py-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-1.5 text-xs font-semibold text-slate-300 transition hover:bg-white/[0.08] hover:text-white"
          >
            <span>← Retour aux vidéos</span>
          </Link>

          <div className="flex items-center gap-2">
            <PlatformBadge platform={video.platform} />
            <ViewsBadge views={video.views_count} />
          </div>
        </div>

        {/* Top Split Section: Player + Creator/SaaS Card */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left: Video Player or Large Poster */}
          <div className="lg:col-span-7 flex flex-col gap-3">
            <div className="relative aspect-video w-full overflow-hidden rounded-3xl border border-white/[0.1] bg-black shadow-[0_20px_50px_rgba(0,0,0,0.7)]">
              {embedUrl ? (
                <iframe
                  src={embedUrl}
                  title="Lecteur vidéo"
                  className="h-full w-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : thumbnail ? (
                <img src={thumbnail} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-slate-500">
                  Lecteur non disponible
                </div>
              )}
            </div>

            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] text-slate-400">
                Collecté le : {formatDateTime(video.collected_at)}
              </span>
              <a
                href={video.video_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition"
              >
                <span>Voir sur la plateforme d'origine</span>
                <ExternalLinkIcon className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>

          {/* Right: Creator Info & SaaS Detection Card */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            {/* Creator Card */}
            <div className="glass-panel flex flex-col gap-4 rounded-3xl p-5 sm:p-6">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Profil Créateur
                </span>
                <h1 className="mt-1 text-xl font-extrabold text-white">
                  {video.account_name ?? 'Compte inconnu'}
                </h1>
                {video.account_handle && (
                  <span className="font-mono-numeric text-xs text-indigo-400">
                    {video.account_handle}
                  </span>
                )}
              </div>

              {/* SaaS Mention Highlight */}
              {video.saas_mentioned ? (
                <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-r from-purple-500/15 via-indigo-500/10 to-transparent p-4">
                  <div className="flex items-center gap-2 text-purple-300">
                    <SparklesIcon className="h-4 w-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">
                      SaaS Détecté & Analysé
                    </span>
                  </div>
                  <div className="mt-1.5 text-lg font-black text-white">
                    {video.saas_mentioned}
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-300">
                    <span>Lien en commentaire :</span>
                    <span
                      className={`font-bold ${
                        video.saas_link_in_comments ? 'text-emerald-400' : 'text-slate-400'
                      }`}
                    >
                      {video.saas_link_in_comments ? '✓ Présent' : '✗ Non détecté'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 text-xs text-slate-400">
                  Aucun SaaS spécifique n’a été étiqueté pour cette vidéo.
                </div>
              )}

              {/* Quick Summary Numbers */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/[0.06] font-mono-numeric">
                <div className="rounded-xl bg-white/[0.03] p-3">
                  <span className="text-[10px] text-slate-400 font-sans uppercase">Publié le</span>
                  <div className="text-xs font-bold text-white">{formatDateTime(video.published_at)}</div>
                </div>
                <div className="rounded-xl bg-white/[0.03] p-3">
                  <span className="text-[10px] text-slate-400 font-sans uppercase">Intention d'achat</span>
                  <div className="text-xs font-bold text-amber-400">
                    {saasComments.length} commentaire(s)
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4 font-mono-numeric">
          <div className="glass-panel rounded-2xl p-4 transition hover:border-indigo-500/30">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold uppercase font-sans">Vues Totales</span>
              <EyeIcon className="h-4 w-4 text-indigo-400" />
            </div>
            <div className="mt-2 text-2xl font-bold text-white">{formatFull(video.views_count)}</div>
          </div>

          <div className="glass-panel rounded-2xl p-4 transition hover:border-pink-500/30">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold uppercase font-sans">Likes</span>
              <HeartIcon className="h-4 w-4 text-pink-400" />
            </div>
            <div className="mt-2 text-2xl font-bold text-pink-400">{formatFull(video.likes_count)}</div>
          </div>

          <div className="glass-panel rounded-2xl p-4 transition hover:border-cyan-500/30">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold uppercase font-sans">Commentaires</span>
              <ChatIcon className="h-4 w-4 text-cyan-400" />
            </div>
            <div className="mt-2 text-2xl font-bold text-cyan-400">{formatFull(video.comments_count)}</div>
          </div>

          <div className="glass-panel rounded-2xl p-4 transition hover:border-emerald-500/30">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold uppercase font-sans">Taux d'Engagement</span>
              <TrendingUpIcon className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="mt-2 text-2xl font-bold text-emerald-400">
              {engagementRate ? `${engagementRate}%` : '—'}
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <div className="glass-panel flex flex-col gap-4 rounded-3xl p-5 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-white/[0.08] pb-4">
            <div>
              <h2 className="text-base font-bold text-white sm:text-lg">
                Commentaires & Signaux d'Achat ({comments.length})
              </h2>
              <p className="text-xs text-slate-400">
                Analyse des retours d'utilisateurs et des demandes de liens d'accès au logiciel.
              </p>
            </div>

            {/* Comments Filter Tabs */}
            <div className="flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.03] p-1">
              <button
                type="button"
                onClick={() => setCommentFilter('all')}
                className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
                  commentFilter === 'all'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Tous ({comments.length})
              </button>
              <button
                type="button"
                onClick={() => setCommentFilter('saas_only')}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-semibold transition ${
                  commentFilter === 'saas_only'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : 'text-amber-400 hover:text-amber-300'
                }`}
              >
                <FireIcon className="h-3 w-3 fill-current" />
                <span>Demandes SaaS ({saasComments.length})</span>
              </button>
            </div>
          </div>

          {filteredComments.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              Aucun commentaire à afficher pour ce filtre.
            </div>
          ) : (
            <ul className="flex flex-col gap-3">
              {filteredComments.map((comment) => (
                <CommentItem key={comment.id} comment={comment} />
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  )
}
