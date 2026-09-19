export type Platform = 'youtube_shorts' | 'tiktok' | 'instagram' | 'twitter'

export type Category = 'saas_marketing' | 'ai_dev_tips'

export const CATEGORIES: Category[] = ['saas_marketing', 'ai_dev_tips']

export const CATEGORY_LABELS: Record<Category, string> = {
  saas_marketing: 'SaaS Marketing',
  ai_dev_tips: 'AI Dev Tips',
}

export interface ViralVideo {
  id: string
  platform: Platform
  video_url: string
  account_name: string | null
  account_handle: string | null
  views_count: number
  likes_count: number | null
  comments_count: number | null
  saves_count: number | null
  published_at: string | null
  collected_at: string
  saas_mentioned: string | null
  saas_link_in_comments: boolean
  is_qualified: boolean
  engagement_suspect: boolean
  saas_relevance_score: number | null
  ai_dev_relevance_score: number | null
  category: Category | null
}

export interface ViralVideoComment {
  id: string
  video_id: string
  comment_text: string
  asks_about_saas: boolean
  author: string | null
}

export const PLATFORMS: Platform[] = ['youtube_shorts', 'tiktok', 'instagram', 'twitter']

export const PLATFORM_LABELS: Record<Platform, string> = {
  youtube_shorts: 'YouTube Shorts',
  tiktok: 'TikTok',
  instagram: 'Instagram',
  twitter: 'Twitter/X',
}

export type SortField = 'views_count' | 'collected_at' | 'published_at'
export type SortDirection = 'asc' | 'desc'

export interface VideoFilters {
  category: Category
  platform: Platform | 'all'
  asksAboutSaas: boolean
  sortField: SortField
  sortDirection: SortDirection
}
