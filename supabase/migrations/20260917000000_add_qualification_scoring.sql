-- Stricter qualification pipeline: hard views/likes gate (rejects go to
-- rejected_videos for audit), a keyword-based SaaS-relevance pre-filter
-- score, and an engagement-suspect flag for manual review. Videos that pass
-- the hard gate but score below the relevance threshold are KEPT with
-- is_qualified = false rather than discarded, so the threshold can be
-- retuned later without re-scraping.

alter table public.viral_videos
  add column if not exists is_qualified boolean not null default false,
  add column if not exists engagement_suspect boolean not null default false,
  add column if not exists saas_relevance_score integer;

alter table public.viral_videos
  add constraint viral_videos_saas_relevance_score_check
  check (saas_relevance_score is null or saas_relevance_score between 0 and 10);

create index if not exists viral_videos_is_qualified_idx on public.viral_videos (is_qualified) where is_qualified;

create table if not exists public.rejected_videos (
  id uuid primary key default gen_random_uuid(),
  platform public.viral_platform not null,
  video_url text not null,
  account_name text,
  account_handle text,
  views_count bigint not null default 0,
  likes_count bigint,
  comments_count bigint,
  rejection_reason text not null,
  created_at timestamptz not null default now(),
  constraint rejected_videos_video_url_key unique (video_url)
);

alter table public.rejected_videos enable row level security;

create policy "Public read access to rejected_videos"
  on public.rejected_videos
  for select
  to anon, authenticated
  using (true);
