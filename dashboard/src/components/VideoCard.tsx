import { Link } from 'react-router-dom'
import { formatCompact, formatDate } from '../lib/format'
import { thumbnailForVideo } from '../lib/thumbnail'
import type { ViralVideo } from '../types'
import { PlatformBadge } from './PlatformBadge'
import { ViewsBadge } from './ViewsBadge'

export function VideoCard({ video }: { video: ViralVideo }) {
  const thumbnail = thumbnailForVideo(video)

  return (
    <Link
      to={`/videos/${video.id}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-neutral-200 bg-white transition hover:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-600"
    >
      <div className="relative aspect-video bg-neutral-100 dark:bg-neutral-800">
        {thumbnail ? (
          <img src={thumbnail} alt="" loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <a
            href={video.video_url}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex h-full w-full flex-col items-center justify-center gap-1 text-sm text-neutral-500 hover:text-neutral-700 dark:text-neutral-400"
          >
            <span className="text-2xl">↗</span>
            Voir la vidéo
          </a>
        )}
        <div className="absolute left-2 top-2">
          <PlatformBadge platform={video.platform} />
        </div>
        {video.views_count >= 500_000 && (
          <div className="absolute right-2 top-2">
            <ViewsBadge views={video.views_count} />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <div className="truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">
          {video.account_name ?? 'Compte inconnu'}
        </div>
        {video.account_handle && (
          <div className="-mt-1.5 truncate text-xs text-neutral-500 dark:text-neutral-400">{video.account_handle}</div>
        )}

        {video.saas_mentioned && (
          <span className="w-fit rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-800 dark:bg-violet-400/10 dark:text-violet-400">
            {video.saas_mentioned}
          </span>
        )}

        <div className="mt-auto flex items-center gap-3 text-xs text-neutral-600 dark:text-neutral-400">
          <span title={`${video.views_count.toLocaleString('fr-FR')} vues`}>👁 {formatCompact(video.views_count)}</span>
          <span>❤️ {formatCompact(video.likes_count)}</span>
          <span>💬 {formatCompact(video.comments_count)}</span>
        </div>
        <div className="text-xs text-neutral-400 dark:text-neutral-500">Publié le {formatDate(video.published_at)}</div>
      </div>
    </Link>
  )
}
