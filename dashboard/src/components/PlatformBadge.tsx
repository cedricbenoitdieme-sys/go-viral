import { PLATFORM_LABELS, type Platform } from '../types'
import { InstagramIcon, TikTokIcon, TwitterIcon, YouTubeIcon } from './Icons'

interface PlatformConfig {
  icon: React.ComponentType<{ className?: string }>
  label: string
  pillClass: string
  iconColor: string
}

const CONFIGS: Record<Platform, PlatformConfig> = {
  youtube_shorts: {
    icon: YouTubeIcon,
    label: PLATFORM_LABELS.youtube_shorts,
    pillClass: 'bg-red-500/10 text-red-400 border border-red-500/20 shadow-[0_0_12px_rgba(239,68,68,0.15)]',
    iconColor: 'text-red-500',
  },
  tiktok: {
    icon: TikTokIcon,
    label: PLATFORM_LABELS.tiktok,
    pillClass: 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 shadow-[0_0_12px_rgba(6,182,212,0.15)]',
    iconColor: 'text-cyan-400',
  },
  instagram: {
    icon: InstagramIcon,
    label: PLATFORM_LABELS.instagram,
    pillClass: 'bg-pink-500/10 text-pink-400 border border-pink-500/20 shadow-[0_0_12px_rgba(236,72,153,0.15)]',
    iconColor: 'text-pink-400',
  },
  twitter: {
    icon: TwitterIcon,
    label: PLATFORM_LABELS.twitter,
    pillClass: 'bg-sky-500/10 text-sky-300 border border-sky-500/20 shadow-[0_0_12px_rgba(14,165,233,0.15)]',
    iconColor: 'text-sky-400',
  },
}

export function PlatformBadge({ platform, showLabel = true }: { platform: Platform; showLabel?: boolean }) {
  const config = CONFIGS[platform] ?? CONFIGS.youtube_shorts
  const Icon = config.icon

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold backdrop-blur-md transition-all ${config.pillClass}`}
    >
      <Icon className={`w-3.5 h-3.5 ${config.iconColor}`} />
      {showLabel && <span>{config.label}</span>}
    </span>
  )
}
