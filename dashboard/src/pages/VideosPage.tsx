import { useMemo, useState } from 'react'
import { FilterBar } from '../components/FilterBar'
import { Header } from '../components/Header'
import { SparklesIcon } from '../components/Icons'
import { StatsOverview } from '../components/StatsOverview'
import { VideoCard } from '../components/VideoCard'
import { VideoQuickModal } from '../components/VideoQuickModal'
import { useVideos } from '../hooks/useVideos'
import { CATEGORIES, CATEGORY_LABELS, type Category, type VideoFilters, type ViralVideo } from '../types'

// Viral SaaS videos are ranked by reach; AI-dev tips are only interesting while
// fresh, so they default to newest-published first.
function defaultFiltersFor(category: Category): VideoFilters {
  return {
    category,
    platform: 'all',
    asksAboutSaas: false,
    sortField: category === 'ai_dev_tips' ? 'published_at' : 'views_count',
    sortDirection: 'desc',
  }
}

const CATEGORY_HERO: Record<Category, { badge: string; title: string; description: string }> = {
  saas_marketing: {
    badge: 'SaaS Viral Feed',
    title: 'Vidéos Virales & Insights SaaS',
    description:
      "Vidéos qui font la promotion d'un SaaS et dépassent 100k vues / 10k likes : formats, hooks de rétention et produits plébiscités par l'audience.",
  },
  ai_dev_tips: {
    badge: 'AI Dev Radar',
    title: 'Astuces & Pièges du Dev avec l’IA',
    description:
      'Contenus 2026 (50k vues / 1k likes minimum), du plus récent au plus ancien : conseils pour mieux développer avec l’IA, erreurs à éviter et failles de sécurité que le vibe coding introduit (marché US).',
  },
}

export function VideosPage() {
  const [filters, setFilters] = useState<VideoFilters>(() => defaultFiltersFor('saas_marketing'))
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedQuickVideo, setSelectedQuickVideo] = useState<ViralVideo | null>(null)

  const { videos, loading, error } = useVideos(filters)

  // Client-side search filtering by creator name, handle or SaaS mentioned
  const filteredVideos = useMemo(() => {
    if (!searchQuery.trim()) return videos
    const query = searchQuery.toLowerCase().trim()
    return videos.filter((v) => {
      const matchName = v.account_name?.toLowerCase().includes(query)
      const matchHandle = v.account_handle?.toLowerCase().includes(query)
      const matchSaas = v.saas_mentioned?.toLowerCase().includes(query)
      return matchName || matchHandle || matchSaas
    })
  }, [videos, searchQuery])

  // Counts by platform
  const platformCounts = useMemo(() => {
    const counts: Record<string, number> = { all: videos.length }
    videos.forEach((v) => {
      counts[v.platform] = (counts[v.platform] || 0) + 1
    })
    return counts
  }, [videos])

  return (
    <div className="min-h-screen bg-[#070a12] text-[#f1f5f9] bg-ambient-grid">
      {/* Global Top Navigation */}
      <Header totalVideos={videos.length} onRefresh={() => window.location.reload()} />

      <main className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:py-8">
        {/* Category tabs */}
        <div className="inline-flex w-fit gap-1 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-1 backdrop-blur-md">
          {CATEGORIES.map((category) => {
            const active = filters.category === category
            return (
              <button
                key={category}
                type="button"
                onClick={() => {
                  if (!active) setFilters(defaultFiltersFor(category))
                }}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  active
                    ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-[0_0_20px_rgba(99,102,241,0.35)]'
                    : 'text-slate-400 hover:bg-white/[0.06] hover:text-white'
                }`}
              >
                {CATEGORY_LABELS[category]}
              </button>
            )
          })}
        </div>

        {/* Page Hero Banner */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-bold text-indigo-300">
              <SparklesIcon className="h-3.5 w-3.5 text-indigo-400" />
              {CATEGORY_HERO[filters.category].badge}
            </span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl lg:text-4xl">
            {CATEGORY_HERO[filters.category].title}
          </h1>
          <p className="max-w-2xl text-sm text-slate-400">{CATEGORY_HERO[filters.category].description}</p>
        </div>

        {/* Real-time KPI Stats Overview */}
        <StatsOverview videos={videos} />

        {/* Filter Controls Bar */}
        <FilterBar
          filters={filters}
          onChange={setFilters}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          platformCounts={platformCounts}
        />

        {/* Error message */}
        {error && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300 backdrop-blur-md">
            <div className="font-bold">Erreur de chargement :</div>
            <div className="text-xs opacity-90">{error}</div>
          </div>
        )}

        {/* Content Area */}
        {loading ? (
          /* High-end Skeleton Loaders */
          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                : 'flex flex-col gap-3'
            }
          >
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div
                key={i}
                className="overflow-hidden rounded-2xl border border-white/[0.05] bg-white/[0.02] p-3 animate-pulse"
              >
                <div className="aspect-video w-full rounded-xl bg-white/[0.05]" />
                <div className="mt-3 flex flex-col gap-2">
                  <div className="h-4 w-3/4 rounded bg-white/[0.06]" />
                  <div className="h-3 w-1/2 rounded bg-white/[0.04]" />
                  <div className="mt-2 flex justify-between pt-2 border-t border-white/[0.04]">
                    <div className="h-3 w-12 rounded bg-white/[0.05]" />
                    <div className="h-3 w-12 rounded bg-white/[0.05]" />
                    <div className="h-3 w-12 rounded bg-white/[0.05]" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredVideos.length === 0 ? (
          /* Clean Empty State */
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-white/[0.1] bg-white/[0.02] py-16 px-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400">
              <SparklesIcon className="h-6 w-6" />
            </div>
            <h3 className="mt-3 text-base font-bold text-white">Aucune vidéo ne correspond à vos critères</h3>
            <p className="mt-1 text-xs text-slate-400 max-w-sm">
              Essayez de modifier votre recherche par mot-clé ou désactivez certains filtres de plateforme.
            </p>
            <button
              type="button"
              onClick={() => {
                setFilters(defaultFiltersFor(filters.category))
                setSearchQuery('')
              }}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white/[0.08] px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/[0.15]"
            >
              Réinitialiser les filtres
            </button>
          </div>
        ) : (
          /* Videos Grid / List */
          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                : 'flex flex-col gap-2.5'
            }
          >
            {filteredVideos.map((video) => (
              <VideoCard
                key={video.id}
                video={video}
                viewMode={viewMode}
                onQuickView={(v) => setSelectedQuickVideo(v)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Quick Play & Detail Modal */}
      <VideoQuickModal
        video={selectedQuickVideo}
        onClose={() => setSelectedQuickVideo(null)}
      />
    </div>
  )
}
