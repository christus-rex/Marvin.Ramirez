create table if not exists public.portfolio_analytics_admin_emails (
  email text primary key,
  created_at timestamptz not null default now()
);

alter table public.portfolio_analytics_admin_emails enable row level security;
revoke all on public.portfolio_analytics_admin_emails from anon, authenticated;

insert into public.portfolio_analytics_admin_emails(email)
values ('speeddevil@gmail.com')
on conflict (email) do nothing;

create or replace function public.get_portfolio_analytics()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_result jsonb;
  v_email text;
begin
  v_email := lower(coalesce(auth.jwt() ->> 'email', ''));

  if auth.uid() is null or v_email = '' or not exists (
    select 1 from public.portfolio_analytics_admin_emails a where lower(a.email) = v_email
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
