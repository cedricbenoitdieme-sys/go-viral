import { Link, useParams } from 'react-router-dom'
import { CommentItem } from '../components/CommentItem'
import { PlatformBadge } from '../components/PlatformBadge'
import { ViewsBadge } from '../components/ViewsBadge'
import { useVideoDetail } from '../hooks/useVideoDetail'
import { formatDateTime, formatFull } from '../lib/format'
import { thumbnailForVideo } from '../lib/thumbnail'

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-neutral-200 p-3 dark:border-neutral-800">
      <div className="text-xs text-neutral-500 dark:text-neutral-400">{label}</div>
      <div className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{value}</div>
    </div>
  )
}

export function VideoDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { video, comments, loading, error } = useVideoDetail(id)

  if (loading) {
    return <div className="p-6 text-sm text-neutral-500 dark:text-neutral-400">Chargement…</div>
  }

  if (error || !video) {
    return (
      <div className="p-6 text-sm text-red-800 dark:text-red-400">
        {error ?? 'Vidéo introuvable.'} <Link to="/" className="underline">Retour</Link>
      </div>
    )
  }

  const thumbnail = thumbnailForVideo(video)

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 p-6">
      <Link to="/" className="text-sm text-neutral-500 hover:underline dark:text-neutral-400">
        ← Retour aux vidéos
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row">
        {thumbnail && (
          <img src={thumbnail} alt="" className="aspect-video w-full rounded-lg object-cover sm:w-64" />
        )}
        <div className="flex flex-1 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <PlatformBadge platform={video.platform} />
            <ViewsBadge views={video.views_count} />
            {video.saas_mentioned && (
              <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-800 dark:bg-violet-400/10 dark:text-violet-400">
                {video.saas_mentioned}
              </span>
            )}
          </div>
          <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
            {video.account_name ?? 'Compte inconnu'}
          </h1>
          {video.account_handle && <div className="text-sm text-neutral-500 dark:text-neutral-400">{video.account_handle}</div>}
          <a
            href={video.video_url}
            target="_blank"
            rel="noreferrer"
            className="w-fit text-sm text-blue-600 hover:underline dark:text-blue-400"
          >
            Voir la vidéo originale ↗
          </a>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric label="Vues" value={formatFull(video.views_count)} />
        <Metric label="Likes" value={formatFull(video.likes_count)} />
        <Metric label="Commentaires" value={formatFull(video.comments_count)} />
        <Metric label="Sauvegardes" value={formatFull(video.saves_count)} />
        <Metric label="Publié le" value={formatDateTime(video.published_at)} />
        <Metric label="Collecté le" value={formatDateTime(video.collected_at)} />
        <Metric label="Lien SaaS en commentaire" value={video.saas_link_in_comments ? 'Oui' : 'Non'} />
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          Commentaires collectés ({comments.length})
        </h2>
        {comments.length === 0 ? (
          <div className="text-sm text-neutral-500 dark:text-neutral-400">Aucun commentaire collecté.</div>
        ) : (
          <ul className="flex flex-col gap-2">
            {comments.map((comment) => (
              <CommentItem key={comment.id} comment={comment} />
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
