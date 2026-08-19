-- Private portfolio analytics storage for Supabase.
-- Tables are not directly readable/writable by anon or authenticated clients.
-- Public portfolio events enter through the Edge Function, which uses service_role.

create table if not exists public.portfolio_analytics_counters (
  event_name text primary key,
  value bigint not null default 0 check (value >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.portfolio_analytics_events (
  id bigint generated always as identity primary key,
  event_name text not null,
  dedupe_hash text,
  created_at timestamptz not null default now()
);

create unique index if not exists portfolio_analytics_events_unique_dedupe
  on public.portfolio_analytics_events (event_name, dedupe_hash)
  where dedupe_hash is not null;

create index if not exists portfolio_analytics_events_created_at
  on public.portfolio_analytics_events (created_at desc);

create table if not exists public.portfolio_analytics_rate_limits (
  bucket_hash text primary key,
  hits integer not null default 0 check (hits >= 0),
  expires_at timestamptz not null
);

create table if not exists public.portfolio_analytics_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.portfolio_analytics_counters enable row level security;
alter table public.portfolio_analytics_events enable row level security;
alter table public.portfolio_analytics_rate_limits enable row level security;
alter table public.portfolio_analytics_admins enable row level security;

revoke all on public.portfolio_analytics_counters from anon, authenticated;
revoke all on public.portfolio_analytics_events from anon, authenticated;
revoke all on public.portfolio_analytics_rate_limits from anon, authenticated;
revoke all on public.portfolio_analytics_admins from anon, authenticated;

create or replace function public.record_portfolio_event(
  p_event text,
  p_dedupe_hash text default null,
  p_rate_hash text default null,
  p_rate_limit integer default 12
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_allowed constant text[] := array[
    'visitor.unique',
    'resume.total',
    'resume.general-it',
    'resume.data-center',
    'credential.total',
    'credential.comptia-a-plus',
    'credential.eastern-center-network-admin',
    'credential.upper-moreland-diploma',
    'recruiter.linkedin',
    'recruiter.email',
    'recruiter.phone'
  ];
  v_hits integer;
  v_inserted bigint;
begin
  if p_event is null or not (p_event = any(v_allowed)) then
    raise exception 'Unsupported analytics event';
  end if;

  if p_rate_hash is not null then
    insert into public.portfolio_analytics_rate_limits(bucket_hash, hits, expires_at)
    values (p_rate_hash, 1, now() + interval '2 minutes')
    on conflict (bucket_hash) do update
      set hits = public.portfolio_analytics_rate_limits.hits + 1,
          expires_at = greatest(public.portfolio_analytics_rate_limits.expires_at, excluded.expires_at)
    returning hits into v_hits;

    if v_hits > greatest(1, least(p_rate_limit, 60)) then
      return false;
    end if;
  end if;

  insert into public.portfolio_analytics_events(event_name, dedupe_hash)
  values (p_event, nullif(p_dedupe_hash, ''))
  on conflict do nothing
  returning id into v_inserted;

  if v_inserted is null then
    return false;
  end if;

  insert into public.portfolio_analytics_counters(event_name, value, updated_at)
  values (p_event, 1, now())
  on conflict (event_name) do update
    set value = public.portfolio_analytics_counters.value + 1,
        updated_at = now();

  return true;
end;
$$;

revoke all on function public.record_portfolio_event(text, text, text, integer) from public, anon, authenticated;
grant execute on function public.record_portfolio_event(text, text, text, integer) to service_role;

create or replace function public.get_portfolio_analytics()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_result jsonb;
begin
  if auth.uid() is null or not exists (
    select 1 from public.portfolio_analytics_admins a where a.user_id = auth.uid()
  ) then
    raise exception 'Analytics access denied' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'counters', coalesce((
      select jsonb_object_agg(event_name, value)
      from public.portfolio_analytics_counters
    ), '{}'::jsonb),
    'daily', coalesce((
      select jsonb_agg(day_row order by day_row->>'day')
      from (
        select jsonb_build_object(
          'day', to_char(date_trunc('day', created_at), 'YYYY-MM-DD'),
          'event', event_name,
          'value', count(*)
        ) as day_row
        from public.portfolio_analytics_events
        where created_at >= now() - interval '30 days'
        group by date_trunc('day', created_at), event_name
      ) q
    ), '[]'::jsonb),
    'generated_at', now()
  ) into v_result;

  return v_result;
end;
$$;

revoke all on function public.get_portfolio_analytics() from public, anon;
grant execute on function public.get_portfolio_analytics() to authenticated;

-- Periodic cleanup can be scheduled later with pg_cron if desired.
-- Safe manual cleanup:
-- delete from public.portfolio_analytics_rate_limits where expires_at < now();
