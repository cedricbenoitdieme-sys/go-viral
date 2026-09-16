import { PLATFORM_LABELS, type Platform } from '../types'

const PLATFORM_STYLES: Record<Platform, string> = {
  youtube_shorts: 'bg-red-100 text-red-800 dark:bg-red-400/10 dark:text-red-400',
  tiktok: 'bg-neutral-200 text-neutral-800 dark:bg-neutral-400/10 dark:text-neutral-300',
  instagram: 'bg-pink-100 text-pink-800 dark:bg-pink-400/10 dark:text-pink-400',
  twitter: 'bg-blue-100 text-blue-800 dark:bg-blue-400/10 dark:text-blue-400',
}

export function PlatformBadge({ platform }: { platform: Platform }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${PLATFORM_STYLES[platform]}`}>
      {PLATFORM_LABELS[platform]}
    </span>
  )
}
