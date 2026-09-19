import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { VideoFilters, ViralVideo } from '../types'

export function useVideos(filters: VideoFilters) {
  const [videos, setVideos] = useState<ViralVideo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)

      // The "asks_about_saas" filter lives on the child table, so resolve
      // matching video ids first rather than relying on an inner-join
      // select (which would duplicate a video row per matching comment).
      let matchingVideoIds: string[] | null = null
      if (filters.asksAboutSaas) {
        const { data, error: commentsError } = await supabase
          .from('viral_video_comments')
          .select('video_id')
          .eq('asks_about_saas', true)

        if (commentsError) {
          if (!cancelled) {
            setError(commentsError.message)
            setLoading(false)
          }
          return
        }

        matchingVideoIds = [...new Set((data ?? []).map((row) => row.video_id))]
        if (matchingVideoIds.length === 0) {
          if (!cancelled) {
            setVideos([])
            setLoading(false)
          }
          return
        }
      }

      // Only fully-qualified videos (views/likes threshold + SaaS-relevance
      // score) surface here — see rejected_videos and is_qualified=false rows
      // for the ones held back pending a manual/threshold review.
      let query = supabase
        .from('viral_videos')
        .select('*')
        .eq('is_qualified', true)
        .eq('category', filters.category)
        .order(filters.sortField, { ascending: filters.sortDirection === 'asc' })

      if (filters.platform !== 'all') {
        query = query.eq('platform', filters.platform)
      }
      if (matchingVideoIds) {
        query = query.in('id', matchingVideoIds)
      }

      const { data, error: videosError } = await query
      if (cancelled) return

      if (videosError) {
        setError(videosError.message)
      } else {
        setVideos(data ?? [])
      }
      setLoading(false)
    }

    load()
    return () => {
      cancelled = true
    }
  }, [filters.category, filters.platform, filters.asksAboutSaas, filters.sortField, filters.sortDirection])

  return { videos, loading, error }
}
