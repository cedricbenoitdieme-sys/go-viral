import { PLATFORMS, PLATFORM_LABELS, type SortDirection, type SortField, type VideoFilters } from '../types'

interface FilterBarProps {
  filters: VideoFilters
  onChange: (filters: VideoFilters) => void
}

const SORT_OPTIONS: { field: SortField; label: string }[] = [
  { field: 'views_count', label: 'Nombre de vues' },
  { field: 'collected_at', label: 'Date de collecte' },
]

export function FilterBar({ filters, onChange }: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-end gap-4 rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-neutral-600 dark:text-neutral-400">Plateforme</span>
        <select
          className="rounded-md border border-neutral-300 bg-white px-2 py-1.5 dark:border-neutral-700 dark:bg-neutral-950"
          value={filters.platform}
          onChange={(e) => onChange({ ...filters, platform: e.target.value as VideoFilters['platform'] })}
        >
          <option value="all">Toutes</option>
          {PLATFORMS.map((platform) => (
            <option key={platform} value={platform}>
              {PLATFORM_LABELS[platform]}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-neutral-600 dark:text-neutral-400">Trier par</span>
        <div className="flex gap-1">
          <select
            className="rounded-md border border-neutral-300 bg-white px-2 py-1.5 dark:border-neutral-700 dark:bg-neutral-950"
            value={filters.sortField}
            onChange={(e) => onChange({ ...filters, sortField: e.target.value as SortField })}
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.field} value={option.field}>
                {option.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="rounded-md border border-neutral-300 px-2 py-1.5 dark:border-neutral-700"
            title={filters.sortDirection === 'desc' ? 'Décroissant' : 'Croissant'}
            onClick={() =>
              onChange({
                ...filters,
                sortDirection: (filters.sortDirection === 'desc' ? 'asc' : 'desc') as SortDirection,
              })
            }
          >
            {filters.sortDirection === 'desc' ? '↓' : '↑'}
          </button>
        </div>
      </label>

      <label className="flex items-center gap-2 pb-1.5 text-sm">
        <input
          type="checkbox"
          checked={filters.asksAboutSaas}
          onChange={(e) => onChange({ ...filters, asksAboutSaas: e.target.checked })}
        />
        <span className="text-neutral-700 dark:text-neutral-300">Commentaires demandent le SaaS</span>
      </label>
    </div>
  )
}
