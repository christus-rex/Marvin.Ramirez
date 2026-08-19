import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = document.querySelector('meta[name="supabase-url"]')?.content || '';
const anonKey = document.querySelector('meta[name="supabase-anon-key"]')?.content || '';
const configured = supabaseUrl.startsWith('https://') && !supabaseUrl.includes('PLACEHOLDER') && anonKey && !anonKey.includes('PLACEHOLDER');

const configNotice = document.getElementById('configNotice');
const authPanel = document.getElementById('authPanel');
const dashboard = document.getElementById('dashboard');
const loginForm = document.getElementById('loginForm');
const authMessage = document.getElementById('authMessage');
const signOut = document.getElementById('signOut');

if (!configured) {
  configNotice.hidden = false;
  authPanel.hidden = true;
  throw new Error('Private analytics dashboard is not configured yet.');
}

const supabase = createClient(supabaseUrl, anonKey, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
});

const fmt = new Intl.NumberFormat();
const pct = (part, total) => total > 0 ? `${((part / total) * 100).toFixed(1)}%` : '0.0%';
const value = (counters, key) => Number(counters?.[key] || 0);

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
  const { data, error } = await supabase.rpc('get_portfolio_analytics');
  if (error) {
    dashboard.hidden = true;
    authPanel.hidden = false;
    authMessage.textContent = error.code === '42501'
      ? 'This account is signed in but is not approved for analytics access.'
      : 'Analytics could not be loaded.';
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
    await loadAnalytics();
  } else {
    dashboard.hidden = true;
    authPanel.hidden = false;
    signOut.hidden = true;
  }
};

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const email = new FormData(loginForm).get('email')?.toString().trim();
  if (!email) return;
  authMessage.textContent = 'Sending secure sign-in link…';
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: location.href.split('#')[0].split('?')[0]
    }
  });
  authMessage.textContent = error
    ? 'Sign-in link could not be sent. Use the approved administrator account.'
    : 'Secure sign-in link sent. Check your email.';
});

signOut.addEventListener('click', async () => {
  await supabase.auth.signOut();
  await syncAuth();
});

supabase.auth.onAuthStateChange(() => {
  setTimeout(syncAuth, 0);
});

await syncAuth();
