import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = document.querySelector('meta[name="supabase-url"]')?.content || '';
const anonKey = document.querySelector('meta[name="supabase-anon-key"]')?.content || '';
const configured = supabaseUrl.startsWith('https://') && !supabaseUrl.includes('PLACEHOLDER') && anonKey && !anonKey.includes('PLACEHOLDER');
const ADMIN_EMAIL = 'speeddevil@gmail.com';
const DASHBOARD_URL = 'https://christus-rex.github.io/Marvin.Ramirez/private-analytics-dashboard/';
const RESEND_SECONDS = 60;

const configNotice = document.getElementById('configNotice');
const authPanel = document.getElementById('authPanel');
const dashboard = document.getElementById('dashboard');
const loginForm = document.getElementById('loginForm');
const authMessage = document.getElementById('authMessage');
const signOut = document.getElementById('signOut');
const emailInput = document.getElementById('email');
const submitButton = loginForm?.querySelector('button[type="submit"]');
const recoveryForm = document.getElementById('recoveryForm');
const localhostUrlInput = document.getElementById('localhostUrl');
const recoveryMessage = document.getElementById('recoveryMessage');
const recoveryPanel = document.getElementById('recoveryPanel');

if (!configured) {
  configNotice.hidden = false;
  authPanel.hidden = true;
  throw new Error('Private analytics dashboard is not configured yet.');
}

if (emailInput) {
  emailInput.value = ADMIN_EMAIL;
  emailInput.readOnly = true;
  emailInput.autocomplete = 'username';
}

const supabase = createClient(supabaseUrl, anonKey, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
});

const fmt = new Intl.NumberFormat();
const pct = (part, total) => total > 0 ? `${((part / total) * 100).toFixed(1)}%` : '0.0%';
const value = (counters, key) => Number(counters?.[key] || 0);
let cooldownTimer = null;

const startCooldown = (seconds = RESEND_SECONDS) => {
  if (!submitButton) return;
  clearInterval(cooldownTimer);
  let remaining = Math.max(1, seconds);
  submitButton.disabled = true;
  submitButton.textContent = `Try again in ${remaining}s`;
  cooldownTimer = setInterval(() => {
    remaining -= 1;
    if (remaining <= 0) {
      clearInterval(cooldownTimer);
      submitButton.disabled = false;
      submitButton.textContent = 'Send secure link';
      return;
    }
    submitButton.textContent = `Try again in ${remaining}s`;
  }, 1000);
};

const renderRows = (target, rows) => {
  const max = Math.max(1, ...rows.map((row) => row.value));
  target.innerHTML = rows.map((row) => `
    <div class="${target.id === 'funnel' ? 'funnel-row' : 'breakdown-row'}">
      <span class="row-label">${row.label}${row.meta ? ` <small>· ${row.meta}</small>` : ''}</span>
      <strong class="row-value">${fmt.format(row.value)}</strong>
      <span class="bar-track" aria-hidden="true"><span class="bar" style="width:${Math.max(1, (row.value / max) * 100)}%"></span></span>
    </div>`).join('');
};

const renderDashboard = (data) => {
  const counters = data?.counters || {};
  const visitors = value(counters, 'visitor.unique');
  const resumes = value(counters, 'resume.total');
  const credentials = value(counters, 'credential.total');
  const linkedin = value(counters, 'recruiter.linkedin');
  const email = value(counters, 'recruiter.email');
  const phone = value(counters, 'recruiter.phone');
  const actions = linkedin + email + phone;

  document.getElementById('visitors').textContent = fmt.format(visitors);
  document.getElementById('resumes').textContent = fmt.format(resumes);
  document.getElementById('credentials').textContent = fmt.format(credentials);
  document.getElementById('actions').textContent = fmt.format(actions);
  document.getElementById('generatedAt').textContent = data?.generated_at ? `Updated ${new Date(data.generated_at).toLocaleString()}` : '';

  renderRows(document.getElementById('funnel'), [
    { label: 'Unique visitors', value: visitors, meta: '100%' },
    { label: 'Résumé downloads', value: resumes, meta: pct(resumes, visitors) },
    { label: 'Credential views', value: credentials, meta: pct(credentials, visitors) },
    { label: 'Recruiter actions', value: actions, meta: pct(actions, visitors) },
    { label: 'Direct contact intent', value: email + phone, meta: pct(email + phone, visitors) }
  ]);

  renderRows(document.getElementById('actionBreakdown'), [
    { label: 'LinkedIn', value: linkedin, meta: pct(linkedin, actions) },
    { label: 'Email', value: email, meta: pct(email, actions) },
    { label: 'Phone', value: phone, meta: pct(phone, actions) },
    { label: 'General IT résumé', value: value(counters, 'resume.general-it') },
    { label: 'Data Center résumé', value: value(counters, 'resume.data-center') }
  ]);

  const daily = Array.isArray(data?.daily) ? [...data.daily].reverse() : [];
  document.getElementById('dailyRows').innerHTML = daily.length
    ? daily.map((row) => `<tr><td>${row.day || '—'}</td><td>${row.event || '—'}</td><td>${fmt.format(Number(row.value || 0))}</td></tr>`).join('')
    : '<tr><td colspan="3" class="empty">No private analytics events recorded yet.</td></tr>';
};

const loadAnalytics = async () => {
  authMessage.textContent = '';
  if (recoveryMessage) recoveryMessage.textContent = '';
  const { data, error } = await supabase.rpc('get_portfolio_analytics');
  if (error) {
    dashboard.hidden = true;
    authPanel.hidden = false;
    authMessage.textContent = error.code === '42501'
      ? 'This signed-in account is not approved for analytics access.'
      : 'Analytics could not be loaded. Please sign out and try again.';
    return;
  }
  authPanel.hidden = true;
  dashboard.hidden = false;
  signOut.hidden = false;
  renderDashboard(data);
};

const syncAuth = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    const signedInEmail = session.user?.email?.toLowerCase();
    if (signedInEmail !== ADMIN_EMAIL) {
      await supabase.auth.signOut();
      dashboard.hidden = true;
      authPanel.hidden = false;
      signOut.hidden = true;
      authMessage.textContent = 'This account is not approved for analytics access.';
      return;
    }
    await loadAnalytics();
  } else {
    dashboard.hidden = true;
    authPanel.hidden = false;
    signOut.hidden = true;
  }
};

const sessionTokensFromUrl = (rawUrl) => {
  let url;
  try {
    url = new URL(rawUrl.trim());
  } catch (_) {
    throw new Error('Paste the complete localhost URL from the browser address bar.');
  }

  const allowedHost = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
  if (!allowedHost) {
    throw new Error('For safety, recovery only accepts a localhost redirect URL.');
  }

  const hash = new URLSearchParams(url.hash.replace(/^#/, ''));
  const query = url.searchParams;
  const accessToken = hash.get('access_token') || query.get('access_token');
  const refreshToken = hash.get('refresh_token') || query.get('refresh_token');

  if (!accessToken || !refreshToken) {
    throw new Error('That URL does not contain a recoverable Supabase session. Use the newest successful magic-link redirect.');
  }

  return { accessToken, refreshToken };
};

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (submitButton?.disabled) return;

  const email = new FormData(loginForm).get('email')?.toString().trim().toLowerCase();
  if (email !== ADMIN_EMAIL) {
    authMessage.textContent = 'Use the approved administrator account.';
    return;
  }

  authMessage.textContent = 'Sending secure sign-in link…';
  const { error } = await supabase.auth.signInWithOtp({
    email: ADMIN_EMAIL,
    options: {
      shouldCreateUser: false,
      emailRedirectTo: DASHBOARD_URL
    }
  });

  if (error) {
    const rateLimited = error.status === 429 || error.code === 'over_email_send_rate_limit' || /rate limit/i.test(error.message || '');
    authMessage.textContent = rateLimited
      ? 'Too many sign-in emails were requested. Please wait for the countdown, then request one new link and use only the newest email.'
      : `Sign-in link could not be sent: ${error.message || 'authentication error'}`;
    if (rateLimited) startCooldown();
    return;
  }

  authMessage.textContent = 'Secure sign-in link sent. Use only the newest email; each link works once.';
  if (recoveryPanel) recoveryPanel.open = true;
  startCooldown();
});

recoveryForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!localhostUrlInput || !recoveryMessage) return;

  recoveryMessage.textContent = 'Validating recovered session…';
  let tokens;
  try {
    tokens = sessionTokensFromUrl(localhostUrlInput.value);
  } catch (error) {
    recoveryMessage.textContent = error.message;
    return;
  }

  localhostUrlInput.value = '';
  const { data, error } = await supabase.auth.setSession({
    access_token: tokens.accessToken,
    refresh_token: tokens.refreshToken
  });

  tokens.accessToken = '';
  tokens.refreshToken = '';

  if (error || !data?.session) {
    recoveryMessage.textContent = 'That localhost session is invalid or expired. Request one new magic link and use its first redirect only.';
    return;
  }

  const signedInEmail = data.session.user?.email?.toLowerCase();
  if (signedInEmail !== ADMIN_EMAIL) {
    await supabase.auth.signOut();
    recoveryMessage.textContent = 'The recovered session belongs to an unapproved account.';
    return;
  }

  history.replaceState({}, '', DASHBOARD_URL);
  recoveryMessage.textContent = 'Secure session recovered.';
  await loadAnalytics();
});

signOut.addEventListener('click', async () => {
  await supabase.auth.signOut();
  await syncAuth();
});

supabase.auth.onAuthStateChange(() => {
  setTimeout(syncAuth, 0);
});

await syncAuth();
