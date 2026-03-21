-- Enable pg_cron extension
create extension if not exists pg_cron;

-- Schedule the cleanup job
-- This will run every day at midnight (00:00)
-- It deletes records from detected_problems that are older than 15 days.
-- Since the other tables (tools, tool_combinations, etc.) should have foreign keys with ON DELETE CASCADE,
-- deleting from detected_problems will clean up everything else.

select cron.schedule(
  'auto-cleanup-detected-problems',
  '0 0 * * *',
  $$ delete from public.detected_problems where created_at < now() - interval '15 days' $$
);
