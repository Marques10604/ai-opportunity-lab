-- Enable pg_cron extension
create extension if not exists pg_cron;

-- Schedule the cleanup job
-- This will run every day at midnight (00:00)
-- It deletes records from detected_problems that are older than 15 days.
select cron.schedule(
  'auto-cleanup-detected-problems',
  '0 0 * * *',
  $$ delete from public.detected_problems where created_at < now() - interval '15 days' $$
);
