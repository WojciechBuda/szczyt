-- 0007 · Hard per-visitor limit for the support chat (paid LLM calls).
-- The Edge Function calls chat_rate_check() with a hash of the visitor's IP; the check and the
-- insert happen in one transaction, so parallel requests cannot slip past the limit.
-- Idempotent: safe to run more than once.

create table if not exists public.chat_rate_limits (
  id         bigint generated always as identity primary key,
  key_hash   text        not null,
  created_at timestamptz not null default now()
);
create index if not exists chat_rate_limits_key_idx on public.chat_rate_limits (key_hash, created_at desc);

-- Only the service role (Edge Function) may touch it: RLS on, no policies.
alter table public.chat_rate_limits enable row level security;
revoke all on public.chat_rate_limits from anon, authenticated;

-- Returns 0 when the request is allowed (and records it), otherwise the number of seconds
-- until the oldest hit in the window expires.
create or replace function public.chat_rate_check(p_key text, p_limit int, p_window_seconds int)
returns int
language plpgsql
security definer
set search_path = public
as '
declare
  v_hits int;
  v_oldest timestamptz;
begin
  -- Serialise concurrent calls for the same key.
  perform pg_advisory_xact_lock(hashtext(p_key));

  -- Housekeeping: drop rows older than a day.
  delete from public.chat_rate_limits where created_at < now() - interval ''1 day'';

  select count(*), min(created_at) into v_hits, v_oldest
  from public.chat_rate_limits
  where key_hash = p_key and created_at > now() - make_interval(secs => p_window_seconds);

  if v_hits >= p_limit then
    return greatest(1, ceil(extract(epoch from (v_oldest + make_interval(secs => p_window_seconds) - now())))::int);
  end if;

  insert into public.chat_rate_limits (key_hash) values (p_key);
  return 0;
end;
';

revoke all on function public.chat_rate_check(text, int, int) from public, anon, authenticated;
grant execute on function public.chat_rate_check(text, int, int) to service_role;
