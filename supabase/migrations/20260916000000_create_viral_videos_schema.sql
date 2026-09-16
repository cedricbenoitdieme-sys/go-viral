-- Viral video collection schema (YouTube Shorts first, other platforms to follow)

create extension if not exists pgcrypto;

create type public.viral_platform as enum (
  'youtube_shorts',
  'tiktok',
  'instagram',
  'twitter'
);

create table public.viral_videos (
  id uuid primary key default gen_random_uuid(),
  platform public.viral_platform not null,
  video_url text not null,
  account_name text,
  account_handle text,
  views_count bigint not null default 0,
  likes_count bigint,
  comments_count bigint,
  saves_count bigint,
  published_at timestamptz,
  collected_at timestamptz not null default now(),
  saas_mentioned text,
  saas_link_in_comments boolean not null default false,
  constraint viral_videos_video_url_key unique (video_url),
  constraint viral_videos_views_count_check check (views_count >= 100000)
);

create index viral_videos_platform_idx on public.viral_videos (platform);
create index viral_videos_views_count_idx on public.viral_videos (views_count desc);
create index viral_videos_saas_mentioned_idx on public.viral_videos (saas_mentioned) where saas_mentioned is not null;

create table public.viral_video_comments (
  id uuid primary key default gen_random_uuid(),
  video_id uuid not null references public.viral_videos (id) on delete cascade,
  comment_text text not null,
  asks_about_saas boolean not null default false,
  author text
);

create index viral_video_comments_video_id_idx on public.viral_video_comments (video_id);
create index viral_video_comments_asks_about_saas_idx on public.viral_video_comments (video_id) where asks_about_saas;

-- RLS: public read (internal dashboard), writes reserved to the service role
-- (the service role bypasses RLS entirely, so no write policy is defined here
-- and inserts/updates/deletes from anon/authenticated roles are denied by default).

alter table public.viral_videos enable row level security;
alter table public.viral_video_comments enable row level security;

create policy "Public read access to viral_videos"
  on public.viral_videos
  for select
  to anon, authenticated
  using (true);

create policy "Public read access to viral_video_comments"
  on public.viral_video_comments
  for select
  to anon, authenticated
  using (true);
