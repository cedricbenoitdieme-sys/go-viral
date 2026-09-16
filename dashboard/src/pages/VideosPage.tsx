import { useState } from 'react'
import { FilterBar } from '../components/FilterBar'
import { VideoCard } from '../components/VideoCard'
import { useVideos } from '../hooks/useVideos'
import type { VideoFilters } from '../types'

const DEFAULT_FILTERS: VideoFilters = {
  platform: 'all',
  asksAboutSaas: false,
  sortField: 'views_count',
  sortDirection: 'desc',
}

export function VideosPage() {
  const [filters, setFilters] = useState<VideoFilters>(DEFAULT_FILTERS)
  const { videos, loading, error } = useVideos(filters)

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-4 p-6">
      <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">Vidéos virales</h1>

      <FilterBar filters={filters} onChange={setFilters} />

      {error && (
        <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800 dark:border-red-400/40 dark:bg-red-400/10 dark:text-red-400">
          Erreur : {error}
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-sm text-neutral-500 dark:text-neutral-400">Chargement…</div>
      ) : videos.length === 0 ? (
        <div className="py-12 text-center text-sm text-neutral-500 dark:text-neutral-400">Aucune vidéo trouvée.</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {videos.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      )}
    </div>
  )
}
