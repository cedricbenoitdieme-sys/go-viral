import type { ViralVideoComment } from '../types'

export function CommentItem({ comment }: { comment: ViralVideoComment }) {
  return (
    <li
      className={`rounded-md border p-3 text-sm ${
        comment.asks_about_saas
          ? 'border-amber-300 bg-amber-50 dark:border-amber-400/40 dark:bg-amber-400/10'
          : 'border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900'
      }`}
    >
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="font-medium text-neutral-700 dark:text-neutral-300">{comment.author ?? 'Anonyme'}</span>
        {comment.asks_about_saas && (
          <span className="shrink-0 rounded-full bg-amber-200 px-2 py-0.5 text-xs font-medium text-amber-900 dark:bg-amber-400/20 dark:text-amber-300">
            Demande le SaaS
          </span>
        )}
      </div>
      <p className="text-neutral-800 dark:text-neutral-200">{comment.comment_text}</p>
    </li>
  )
}
