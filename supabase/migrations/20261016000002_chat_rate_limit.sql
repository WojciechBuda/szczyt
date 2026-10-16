-- 0007 · Hard per-visitor limit for the support chat (paid LLM calls).
-- The Edge Function records one row per message (visitor IP hashed with SHA-256) and counts the rows
-- of the last hour. Table only: no functions, so the Supabase dashboard SQL editor runs it as is.
-- Idempotent: safe to run more than once.

create table if not exists public.chat_rate_limits (
  id         bigint generated always as identity primary key,
  key_hash   text        not null,
  created_at timestamptz not null default now()
);
create index if not exists chat_rate_limits_key_idx on public.chat_rate_limits (key_hash, created_at);

-- Only the service role (Edge Function) may touch it: RLS on, no policies.
alter table public.chat_rate_limits enable row level security;
revoke all on public.chat_rate_limits from anon, authenticated;

-- Leftover from an earlier draft of this migration, if it was ever created.
drop function if exists public.chat_rate_check(text, int, int);
