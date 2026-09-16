-- Periodic collection job for collect-youtube-shorts.
--
-- Prerequisite (run once, manually, not via migration since it holds secrets):
--   select vault.create_secret('https://<project-ref>.supabase.co', 'project_url');
--   select vault.create_secret('<service_role_key>', 'service_role_key');
--
-- Project Settings > Vault in the Supabase dashboard, or the SQL editor, are the
-- places to run those two statements so the service role key never lands in a
-- migration file that gets committed to git.

create extension if not exists pg_cron;
create extension if not exists pg_net;

select
  cron.schedule(
    'collect-youtube-shorts',
    '0 */6 * * *', -- every 6 hours
    $$
    select net.http_post(
      url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/collect-youtube-shorts',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key')
      ),
      body := '{}'::jsonb
    );
    $$
  );
