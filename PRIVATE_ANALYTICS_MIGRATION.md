# Private Portfolio Analytics — Cutover Runbook

This branch prepares the portfolio to replace public CounterAPI storage with a private Supabase-backed analytics pipeline.

## Security model

- Public portfolio: write-only event submission through `track-portfolio-event` Edge Function.
- Edge Function: strict event whitelist, exact production Origin allowlist, hashed dedupe identifiers, hashed per-minute rate buckets.
- Database tables: Row Level Security enabled; no direct anon/authenticated table access.
- Counter mutation RPC: callable only by `service_role` from the Edge Function.
- Dashboard read RPC: callable only by authenticated users who are also present in `portfolio_analytics_admins`.
- Dashboard: magic-link authentication with `shouldCreateUser: false`; no public signup path.
- No service-role key or reusable private token is stored in browser code or committed to GitHub.

## Files

- `supabase/migrations/20260819_private_portfolio_analytics.sql` — schema, RLS, admin allowlist, atomic event recorder, authenticated analytics reader.
- `supabase/functions/track-portfolio-event/index.ts` — write-only ingestion endpoint.
- `supabase/config.toml` — public Edge Function invocation; authorization is enforced by function design and private database roles.
- `private-analytics-client.js` — static-site event client; requires only the deployed Edge Function URL.
- `private-analytics-dashboard/` — authenticated dashboard UI.

## Deployment sequence

1. Create/connect a Supabase project.
2. Apply `20260819_private_portfolio_analytics.sql`.
3. Create the dashboard administrator as a Supabase Auth user.
4. Add that user's UUID to the private allowlist:

   ```sql
   insert into public.portfolio_analytics_admins(user_id)
   values ('ADMIN_AUTH_USER_UUID')
   on conflict do nothing;
   ```

5. Set Edge Function secret `ANALYTICS_HASH_SALT` to a long random value. Do not commit it.
6. Deploy `track-portfolio-event` with JWT verification disabled as configured in `supabase/config.toml`.
7. Replace dashboard placeholders with the Supabase project URL and public anon/publishable key. The anon/publishable key is not a database read credential; RLS and the admin RPC still protect analytics data.
8. Shadow-test `private-analytics-client.js` alongside the current CounterAPI tracker.
9. Seed legacy CounterAPI totals into the private counters once, if preserving historical totals is desired.
10. Switch `visitor-counter.js` to render authenticated/private backend values only where appropriate, and remove CounterAPI event writes from production.
11. Update the private Google Sheets dashboard to either link to the authenticated web dashboard or consume a protected export; remove its public CounterAPI source URLs.
12. Merge only after event counts, dedupe behavior, contact tracking, mobile behavior, and dashboard authorization are verified.

## Event names

- `visitor.unique`
- `resume.total`
- `resume.general-it`
- `resume.data-center`
- `credential.total`
- `credential.comptia-a-plus`
- `credential.eastern-center-network-admin`
- `credential.upper-moreland-diploma`
- `recruiter.linkedin`
- `recruiter.email`
- `recruiter.phone`

## Production safety

Do not merge this branch until the backend is deployed and its URL has been injected. The current production CounterAPI implementation remains active until cutover succeeds.
