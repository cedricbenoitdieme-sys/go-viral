-- Structured run logs for the resilience layer (rate limiting, retries,
-- circuit breaker) so failures overnight are visible instead of silent.

create table public.scraping_logs (
  id uuid primary key default gen_random_uuid(),
  platform public.viral_platform not null,
  status text not null,
  message text,
  created_at timestamptz not null default now()
);

create index scraping_logs_platform_created_at_idx on public.scraping_logs (platform, created_at desc);

alter table public.scraping_logs enable row level security;

create policy "Public read access to scraping_logs"
  on public.scraping_logs
  for select
  to anon, authenticated
  using (true);
