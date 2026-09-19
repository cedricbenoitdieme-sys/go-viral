-- Two collection categories:
--   saas_marketing : viral (>=100k views, >=10k likes) videos promoting a SaaS/tool
--   ai_dev_tips    : 2026+ tips/warnings about developing with AI (>=50k views, >=1k likes)
-- Idempotent: safe to run more than once.

alter table public.viral_videos add column if not exists category text;
alter table public.viral_videos add column if not exists ai_dev_relevance_score integer;

alter table public.viral_videos drop constraint if exists viral_videos_category_check;
alter table public.viral_videos
  add constraint viral_videos_category_check
  check (category is null or category in ('saas_marketing', 'ai_dev_tips'));

alter table public.viral_videos drop constraint if exists viral_videos_ai_dev_relevance_score_check;
alter table public.viral_videos
  add constraint viral_videos_ai_dev_relevance_score_check
  check (ai_dev_relevance_score is null or ai_dev_relevance_score between 0 and 10);

-- Everything collected so far was gathered under the SaaS-marketing goal.
update public.viral_videos set category = 'saas_marketing' where category is null;

-- ai_dev_tips has a lower views floor (50k) than the old blanket 100k check, so it must go.
-- (Per-category views/likes thresholds are enforced by the scraper.)
alter table public.viral_videos drop constraint if exists viral_videos_views_count_check;

-- The saas_marketing likes floor went from 1k to 10k: un-qualify stored rows below it
-- (kept in the table, just no longer surfaced).
update public.viral_videos
set is_qualified = false
where category = 'saas_marketing' and (likes_count is null or likes_count < 10000);

create index if not exists viral_videos_category_idx on public.viral_videos (category);

alter table public.rejected_videos add column if not exists category text;
