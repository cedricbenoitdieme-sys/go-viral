import { FireIcon, SparklesIcon } from './Icons'

interface HeaderProps {
  totalVideos?: number
  onRefresh?: () => void
  isRefreshing?: boolean
}

export function Header({ totalVideos = 0, onRefresh, isRefreshing = false }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-white/[0.08] bg-[#070a12]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Logo & Brand */}
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 shadow-[0_0_20px_rgba(99,102,241,0.35)]">
            <FireIcon className="h-5 w-5 text-white fill-white" />
            <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#070a12] bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-tight text-lg text-white">
                GO <span className="bg-gradient-to-r from-indigo-400 via-pink-400 to-amber-300 bg-clip-text text-transparent">VIRAL</span>
              </span>
              <span className="hidden items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 sm:inline-flex">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                RADAR ACTIF
              </span>
            </div>
            <span className="text-[11px] font-medium text-slate-400">
              SaaS Growth & Viral Video Intelligence
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {totalVideos > 0 && (
            <div className="hidden sm:flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs text-slate-300">
              <span className="text-slate-400 font-normal">Base qualifiée :</span>
              <span className="font-mono-numeric font-bold text-indigo-300">{totalVideos} vidéos</span>
            </div>
          )}

          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.05] px-3.5 py-1.5 text-xs font-semibold text-slate-200 transition-all hover:bg-white/[0.1] hover:text-white hover:border-indigo-500/40 active:scale-95 disabled:opacity-50"
              title="Rafraîchir les données"
            >
              <svg
                className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-indigo-400' : 'text-slate-400'}`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
                <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                <path d="M16 21h5v-5" />
              </svg>
              <span>{isRefreshing ? 'Mise à jour…' : 'Actualiser'}</span>
            </button>
          )}

          <div className="flex items-center gap-1.5 rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-300">
            <SparklesIcon className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden md:inline">Intelligence SaaS</span>
          </div>
        </div>
      </div>
    </header>
  )
}
