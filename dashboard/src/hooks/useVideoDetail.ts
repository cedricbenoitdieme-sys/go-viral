import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { ViralVideo, ViralVideoComment } from '../types'

export function useVideoDetail(videoId: string | undefined) {
  const [video, setVideo] = useState<ViralVideo | null>(null)
  const [comments, setComments] = useState<ViralVideoComment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!videoId) return
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)

      const [videoResult, commentsResult] = await Promise.all([
        supabase.from('viral_videos').select('*').eq('id', videoId).single(),
        supabase
          .from('viral_video_comments')
          .select('*')
          .eq('video_id', videoId)
          .order('asks_about_saas', { ascending: false }),
      ])

      if (cancelled) return

      if (videoResult.error) {
        setError(videoResult.error.message)
      } else {
        setVideo(videoResult.data)
      }

      if (commentsResult.error) {
        setError((prev) => prev ?? commentsResult.error!.message)
      } else {
        setComments(commentsResult.data ?? [])
      }

      setLoading(false)
    }

    load()
    return () => {
      cancelled = true
    }
  }, [videoId])

  return { video, comments, loading, error }
}
