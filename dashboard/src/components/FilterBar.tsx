import { PLATFORMS, PLATFORM_LABELS, type Platform, type SortField, type VideoFilters } from '../types'
import { FireIcon, InstagramIcon, LayoutGridIcon, LayoutListIcon, SearchIcon, TikTokIcon, TwitterIcon, YouTubeIcon } from './Icons'

interface FilterBarProps {
  filters: VideoFilters
  onChange: (filters: VideoFilters) => void
  searchQuery: string
  onSearchChange: (query: string) => void
  viewMode: 'grid' | 'list'
  onViewModeChange: (mode: 'grid' | 'list') => void
  platformCounts?: Record<string, number>
}

const SORT_OPTIONS: { field: SortField; label: string }[] = [
  { field: 'views_count', label: 'Vues' },
  { field: 'collected_at', label: 'Récence' },
  { field: 'published_at', label: 'Publication' },
]

export function FilterBar({
  filters,
  onChange,
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
  platformCounts = {},
}: FilterBarProps) {
  const getPlatformIcon = (platform: Platform) => {
    switch (platform) {
      case 'youtube_shorts':
        return <YouTubeIcon className="h-4 w-4 text-red-500" />
      case 'tiktok':
        return <TikTokIcon className="h-4 w-4 text-cyan-400" />
      case 'instagram':
        return <InstagramIcon className="h-4 w-4 text-pink-400" />
      case 'twitter':
        return <TwitterIcon className="h-4 w-4 text-sky-400" />
      default:
        return null
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-white/[0.08] bg-[#0c1222]/70 p-3.5 backdrop-blur-xl sm:p-4 shadow-[0_8px_30px_rgb(0,0,0,0.25)]">
      {/* Top row: Search input + View mode toggle */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Rechercher par créateur, handle (@tech) ou nom de SaaS (Shopify, Linear...)"
            className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] py-2.5 pl-10 pr-9 text-xs text-white placeholder-slate-400 outline-none transition focus:border-indigo-500/50 focus:bg-white/[0.07] focus:ring-2 focus:ring-indigo-500/20"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <div className="flex items-center rounded-xl border border-white/[0.08] bg-white/[0.03] p-1">
            <button
              type="button"
              onClick={() => onViewModeChange('grid')}
              className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
                viewMode === 'grid'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Vue Grille"
            >
              <LayoutGridIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange('list')}
              className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
                viewMode === 'list'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Vue Liste Compacte"
            >
              <LayoutListIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom row: Platform chips, SaaS comments switch & Sort dropdown */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/[0.05]">
        {/* Platform tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => onChange({ ...filters, platform: 'all' })}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition active:scale-95 ${
              filters.platform === 'all'
                ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)]'
                : 'border border-white/[0.06] bg-white/[0.03] text-slate-300 hover:bg-white/[0.08] hover:text-white'
            }`}
          >
            <span>Toutes</span>
            {platformCounts['all'] !== undefined && (
              <span className="rounded-md bg-black/20 px-1.5 py-0.2 text-[10px] font-mono-numeric">
                {platformCounts['all']}
              </span>
            )}
          </button>

          {PLATFORMS.map((platform) => {
            const isSelected = filters.platform === platform
            const count = platformCounts[platform]

            return (
              <button
                key={platform}
                type="button"
                onClick={() => onChange({ ...filters, platform })}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition active:scale-95 ${
                  isSelected
                    ? 'bg-white/[0.12] text-white border border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.2)]'
                    : 'border border-white/[0.06] bg-white/[0.03] text-slate-300 hover:bg-white/[0.08] hover:text-white'
                }`}
              >
                {getPlatformIcon(platform)}
                <span>{PLATFORM_LABELS[platform]}</span>
                {count !== undefined && (
                  <span className="rounded-md bg-black/20 px-1.5 py-0.2 text-[10px] font-mono-numeric text-slate-300">
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Right controls: SaaS Filter Pill + Sort controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Asks about SaaS pill button */}
          <button
            type="button"
            onClick={() => onChange({ ...filters, asksAboutSaas: !filters.asksAboutSaas })}
            className={`inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all active:scale-95 ${
              filters.asksAboutSaas
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                : 'border border-white/[0.06] bg-white/[0.03] text-slate-400 hover:bg-white/[0.08] hover:text-slate-200'
            }`}
          >
            <FireIcon className={`h-3.5 w-3.5 ${filters.asksAboutSaas ? 'text-amber-400 fill-current' : 'text-slate-400'}`} />
            <span>Demande le SaaS</span>
            <span
              className={`h-2 w-2 rounded-full ${
                filters.asksAboutSaas ? 'bg-amber-400 animate-pulse' : 'bg-slate-600'
              }`}
            />
          </button>

          {/* Sort selector */}
          <div className="flex items-center rounded-xl border border-white/[0.08] bg-white/[0.03] p-0.5">
            <span className="pl-2.5 pr-1 text-[11px] font-medium text-slate-400">Trier:</span>
            <select
              className="bg-transparent py-1 pl-1 pr-2 text-xs font-semibold text-slate-200 outline-none cursor-pointer"
              value={filters.sortField}
              onChange={(e) => onChange({ ...filters, sortField: e.target.value as SortField })}
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.field} value={option.field} className="bg-[#0f172a] text-white">
                  {option.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-300 transition hover:bg-white/[0.1] hover:text-white"
              title={filters.sortDirection === 'desc' ? 'Ordre décroissant' : 'Ordre croissant'}
              onClick={() =>
                onChange({
                  ...filters,
                  sortDirection: filters.sortDirection === 'desc' ? 'asc' : 'desc',
                })
              }
            >
              {filters.sortDirection === 'desc' ? '↓' : '↑'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
