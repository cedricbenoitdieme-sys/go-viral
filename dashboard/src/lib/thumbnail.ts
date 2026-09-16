import type { ViralVideo } from '../types'

function youtubeVideoId(videoUrl: string): string | null {
  const match = videoUrl.match(/\/shorts\/([\w-]+)/)
  return match ? match[1] : null
}

// No thumbnail_url column in the schema: for platforms where the ID is
// embedded in the URL and the CDN pattern is stable (YouTube), derive it
// instead of storing a redundant column. Other platforms fall back to a
// plain clickable link until they have their own collector.
export function thumbnailForVideo(video: Pick<ViralVideo, 'platform' | 'video_url'>): string | null {
  if (video.platform === 'youtube_shorts') {
    const id = youtubeVideoId(video.video_url)
    return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null
  }
  return null
}
