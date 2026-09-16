-- The YouTube Data API v3 collection flow (Edge Function + pg_cron job) is
-- superseded by an external Playwright scraper (see /scraper), since no
-- YouTube API key is available. Drop the now-orphaned cron job.

do $$
begin
  perform cron.unschedule('collect-youtube-shorts');
exception
  when others then
    null; -- job may already be gone (e.g. unscheduled manually before this migration ran)
end $$;
