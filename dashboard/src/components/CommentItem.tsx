import type { ViralVideoComment } from '../types'
import { FireIcon } from './Icons'

function getInitials(name: string | null): string {
  if (!name) return '?'
  const clean = name.replace('@', '').trim()
  return clean.slice(0, 2).toUpperCase()
}

export function CommentItem({ comment }: { comment: ViralVideoComment }) {
  const initials = getInitials(comment.author)

  return (
    <li
      className={`group relative flex flex-col gap-2 rounded-2xl border p-4 transition-all duration-200 ${
        comment.asks_about_saas
          ? 'border-amber-500/40 bg-gradient-to-br from-amber-500/[0.08] via-[#0c1222] to-amber-500/[0.03] shadow-[0_0_20px_rgba(245,158,11,0.12)]'
          : 'border-white/[0.06] bg-[#0c1222]/60 hover:border-white/[0.12]'
      }`}
    >
      {/* Top row: Author avatar + Name + Intent Badge */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div
            className={`flex h-7 w-7 items-center justify-center rounded-lg text-[11px] font-bold ${
              comment.asks_about_saas
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-white/[0.06] text-slate-300'
            }`}
          >
            {initials}
          </div>
          <span className="text-xs font-semibold text-slate-200">
            {comment.author ?? 'Spectateur anonyme'}
          </span>
        </div>

        {comment.asks_about_saas && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/50 bg-amber-500/15 px-2.5 py-0.5 text-[10px] font-bold text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.2)]">
            <FireIcon className="h-3 w-3 text-amber-400 fill-current" />
            <span>Demande le lien SaaS</span>
          </span>
        )}
      </div>

      {/* Comment text body */}
      <p className="text-xs leading-relaxed text-slate-300 pl-9 font-normal">
        "{comment.comment_text}"
      </p>
    </li>
  )
}
