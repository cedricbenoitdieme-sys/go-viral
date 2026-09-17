import { Link } from 'react-router-dom'

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-ambient-grid min-h-screen">
      <header className="sticky top-0 z-20 border-b border-white/5 bg-[#070a12]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-sm font-bold text-white shadow-[0_0_20px_rgba(99,102,241,0.35)]">
              GV
            </span>
            <span className="font-semibold tracking-tight text-white">
              Go Viral
              <span className="ml-2 hidden text-xs font-normal text-white/40 sm:inline">SaaS Viral Intelligence</span>
            </span>
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
    </div>
  )
}
