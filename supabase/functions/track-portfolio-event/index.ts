import { createClient } from 'npm:@supabase/supabase-js@2';

const PROD_ORIGINS = new Set([
  'https://christus-rex.github.io'
]);

const ALLOWED_EVENTS = new Set([
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
]);

type AnalyticsEvent = {
  name: string;
  dedupeKey?: string;
};

const json = (body: unknown, status: number, origin?: string) => new Response(
  JSON.stringify(body),
  {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      ...(origin ? {
        'access-control-allow-origin': origin,
        'vary': 'Origin'
      } : {})
    }
  }
);

const sha256Hex = async (value: string) => {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(value)
  );
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
};

Deno.serve(async (request) => {
  const origin = request.headers.get('origin') ?? '';
  const environment = Deno.env.get('ANALYTICS_ENVIRONMENT') ?? 'production';
  const isLocal = environment !== 'production' && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
  const originAllowed = PROD_ORIGINS.has(origin) || isLocal;

  if (request.method === 'OPTIONS') {
    if (!originAllowed) return new Response(null, { status: 403 });
    return new Response(null, {
      status: 204,
      headers: {
        'access-control-allow-origin': origin,
        'access-control-allow-methods': 'POST, OPTIONS',
        'access-control-allow-headers': 'content-type',
        'access-control-max-age': '86400',
        'vary': 'Origin'
      }
    });
  }

  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  if (!originAllowed) return json({ error: 'Origin not allowed' }, 403);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const hashSalt = Deno.env.get('ANALYTICS_HASH_SALT');
  if (!supabaseUrl || !serviceRoleKey || !hashSalt) {
    return json({ error: 'Analytics backend is not configured' }, 503, origin);
  }

  let payload: { events?: AnalyticsEvent[] };
  try {
    payload = await request.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400, origin);
  }

  const events = Array.isArray(payload.events) ? payload.events.slice(0, 3) : [];
  if (!events.length) return json({ error: 'No analytics events supplied' }, 400, origin);

  for (const item of events) {
    if (!item || typeof item.name !== 'string' || !ALLOWED_EVENTS.has(item.name)) {
      return json({ error: 'Unsupported analytics event' }, 400, origin);
    }
    if (item.dedupeKey !== undefined && (
      typeof item.dedupeKey !== 'string' ||
      item.dedupeKey.length < 8 ||
      item.dedupeKey.length > 160
    )) {
      return json({ error: 'Invalid dedupe key' }, 400, origin);
    }
  }

  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const clientIp = forwarded || request.headers.get('cf-connecting-ip') || 'unknown';
  const minuteBucket = Math.floor(Date.now() / 60_000);

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  let accepted = 0;
  for (const item of events) {
    const dedupeHash = item.dedupeKey
      ? await sha256Hex(`${hashSalt}|dedupe|${item.name}|${item.dedupeKey}`)
      : null;
    const rateHash = await sha256Hex(`${hashSalt}|rate|${clientIp}|${item.name}|${minuteBucket}`);
    const rateLimit = item.name === 'visitor.unique' ? 4 : 12;

    const { data, error } = await supabase.rpc('record_portfolio_event', {
      p_event: item.name,
      p_dedupe_hash: dedupeHash,
      p_rate_hash: rateHash,
      p_rate_limit: rateLimit
    });

    if (error) {
      console.error('analytics_event_error', item.name, error.code ?? error.message);
      continue;
    }
    if (data === true) accepted += 1;
  }

  // Deliberately return no counter values. The public site gets write-only analytics access.
  return json({ ok: true, accepted }, 202, origin);
});
