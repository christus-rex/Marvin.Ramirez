(() => {
  const API_BASE = 'https://counterapi.com/api';
  const NAMESPACE = 'christus-rex.github.io';
  const CACHE_PREFIX = 'marvin-portfolio-analytics:';
  const REDUCED_MOTION = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  const RESUME_DOWNLOAD_IDS = new Set([
    '1-x9CWEKG3XUHW4QFA-6PKvqYLFIgXTUZ',
    '1dKfGFVppYUdJ0SDFnmy8WgaLYyyoJ94w'
  ]);

  const legacyCounter = document.querySelector('.visitor-counter');
  if (!legacyCounter) return;

  // Keep the analytics and recruiter-conversion enhancement self-contained.
  if (!document.querySelector('link[data-portfolio-analytics-style]')) {
    const stylesheet = document.createElement('link');
    stylesheet.rel = 'stylesheet';
    stylesheet.href = 'visitor-counter.css?v=20260819-recruiter1';
    stylesheet.dataset.portfolioAnalyticsStyle = 'true';
    document.head.appendChild(stylesheet);
  }

  const originalHeroActions = document.querySelector('.hero-copy .hero-actions');
  if (originalHeroActions && !document.querySelector('.opportunity-panel')) {
    originalHeroActions.outerHTML = `
      <div class="opportunity-panel" aria-label="Availability and recruiter actions">
        <div class="opportunity-head">
          <span class="opportunity-status-dot" aria-hidden="true"></span>
          <div>
            <strong>Available for opportunities</strong>
            <span>IT Support · Endpoint Engineering · Data Center · Field Service</span>
          </div>
        </div>
        <div class="opportunity-actions">
          <a class="button" href="https://drive.google.com/uc?export=download&id=1-x9CWEKG3XUHW4QFA-6PKvqYLFIgXTUZ" target="_blank" rel="noopener" data-track="resume-download" data-track-key="general-it">Download résumé</a>
          <a class="button button-ghost" href="mailto:Marv875@gmail.com" data-track="recruiter-action" data-track-key="email-click">Email me</a>
          <a class="button button-ghost" href="https://www.linkedin.com/in/marvin-alberto-ramirez-bonilla-54261410" target="_blank" rel="noopener noreferrer" data-track="recruiter-action" data-track-key="linkedin-click">LinkedIn</a>
          <a class="button button-ghost" href="tel:+12407530643" data-track="recruiter-action" data-track-key="phone-click">Call</a>
        </div>
        <div class="opportunity-meta">
          <span>Fredericksburg, Virginia</span>
          <span>On-site · Remote · Field</span>
          <a href="#experience">View experience</a>
          <a href="#resumes">Résumé options</a>
        </div>
      </div>`;
  }

  legacyCounter.outerHTML = `
    <div class="portfolio-analytics" role="group" aria-label="Portfolio activity">
      <span class="analytics-metric" title="Approximate unique visitors">
        <span class="analytics-dot" aria-hidden="true"></span>
        <span class="analytics-copy">
          <span class="analytics-label">Unique visitors</span>
          <strong id="visitorCount" aria-live="polite" aria-atomic="true">…</strong>
        </span>
      </span>
      <span class="analytics-metric" title="Résumé PDF downloads">
        <span class="analytics-dot" aria-hidden="true"></span>
        <span class="analytics-copy">
          <span class="analytics-label">Résumé downloads</span>
          <strong id="resumeDownloadCount" aria-live="polite" aria-atomic="true">…</strong>
        </span>
      </span>
      <span class="analytics-metric" title="Credential and diploma views">
        <span class="analytics-dot" aria-hidden="true"></span>
        <span class="analytics-copy">
          <span class="analytics-label">Credential views</span>
          <strong id="credentialViewCount" aria-live="polite" aria-atomic="true">…</strong>
        </span>
      </span>
    </div>`;

  const analyticsRoot = document.querySelector('.portfolio-analytics');
  const metrics = {
    visitors: document.getElementById('visitorCount'),
    resume: document.getElementById('resumeDownloadCount'),
    credentials: document.getElementById('credentialViewCount')
  };

  const cacheKey = (name) => `${CACHE_PREFIX}${name}`;

  const readCached = (name) => {
    try {
      const raw = localStorage.getItem(cacheKey(name));
      if (raw === null) return null;
      const value = Number(raw);
      return Number.isFinite(value) && value >= 0 ? value : null;
    } catch (_) {
      return null;
    }
  };

  const writeCached = (name, value) => {
    try {
      localStorage.setItem(cacheKey(name), String(value));
    } catch (_) {
      // Storage can be unavailable in privacy modes; live counters still work.
    }
  };

  const parseDisplayedNumber = (element) => {
    const raw = String(element?.textContent || '').replace(/[^0-9.-]/g, '');
    if (!raw) return null;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const formatCount = (value) => new Intl.NumberFormat().format(value);

  const render = (name, rawValue, { animate = true, cache = true } = {}) => {
    const element = metrics[name];
    const value = Number(rawValue);
    if (!element || !Number.isFinite(value) || value < 0) return;

    if (cache) writeCached(name, value);
    const metric = element.closest('.analytics-metric');
    metric?.classList.add('analytics-metric-ready');
    metric?.removeAttribute('data-error');

    const from = parseDisplayedNumber(element);
    if (REDUCED_MOTION || !animate || from === value) {
      element.textContent = formatCount(value);
      return;
    }

    const start = from ?? 0;
    const duration = 420;
    const startedAt = performance.now();

    const tick = (now) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      element.textContent = formatCount(Math.round(start + (value - start) * eased));
      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  };

  const markUnavailable = (name) => {
    const element = metrics[name];
    if (!element) return;
    const metric = element.closest('.analytics-metric');
    metric?.setAttribute('data-error', 'true');
    metric?.setAttribute('title', `${metric.title || 'Metric'} — live total temporarily unavailable`);
    if (readCached(name) === null) element.textContent = '—';
  };

  const endpoint = (action, key, params = {}) => {
    const query = new URLSearchParams(params).toString();
    return `${API_BASE}/${encodeURIComponent(NAMESPACE)}/${encodeURIComponent(action)}/${encodeURIComponent(key)}${query ? `?${query}` : ''}`;
  };

  const requestCounter = async (action, key, params = {}, options = {}) => {
    const response = await fetch(endpoint(action, key, params), {
      method: 'GET',
      mode: 'cors',
      cache: 'no-store',
      credentials: 'omit',
      referrerPolicy: 'strict-origin-when-cross-origin',
      keepalive: Boolean(options.keepalive)
    });
    if (!response.ok) throw new Error(`Counter request failed: ${response.status}`);
    const data = await response.json();
    const value = Number(data.value);
    if (!Number.isFinite(value) || value < 0) throw new Error('Invalid counter value');
    return value;
  };

  Object.keys(metrics).forEach((name) => {
    const cached = readCached(name);
    if (cached !== null) render(name, cached, { animate: false, cache: false });
  });

  const refreshTotals = async () => {
    const jobs = [
      requestCounter('visitor', 'marvin-ramirez', { unique: 'true' })
        .then((value) => render('visitors', value))
        .catch(() => markUnavailable('visitors')),
      requestCounter('resume-download', 'resume-pdf', { readOnly: 'true' })
        .then((value) => render('resume', value))
        .catch(() => markUnavailable('resume')),
      requestCounter('credential-view', 'any', { readOnly: 'true' })
        .then((value) => render('credentials', value))
        .catch(() => markUnavailable('credentials'))
    ];
    await Promise.allSettled(jobs);
  };

  const incrementResume = (resumeKey = 'general-it') => {
    const current = parseDisplayedNumber(metrics.resume);
    if (current !== null) render('resume', current + 1, { animate: true });

    requestCounter('resume-download', 'resume-pdf', {}, { keepalive: true })
      .then((value) => render('resume', value))
      .catch(() => markUnavailable('resume'));

    requestCounter('resume-download-detail', resumeKey, {}, { keepalive: true }).catch(() => {
      // Variant detail is supplemental; the master résumé total remains authoritative.
    });
  };

  const incrementCredential = (key) => {
    const current = parseDisplayedNumber(metrics.credentials);
    if (current !== null) render('credentials', current + 1, { animate: true });

    requestCounter('credential-view', key, {}, { keepalive: true })
      .then(() => requestCounter('credential-view', 'any', { readOnly: 'true' }))
      .then((value) => render('credentials', value))
      .catch(() => markUnavailable('credentials'));
  };

  const trackRecruiterAction = (key) => {
    if (!key) return;
    requestCounter('recruiter-action', key, {}, { keepalive: true }).catch(() => {
      // Recruiter-intent events are intentionally silent; they must never block navigation.
    });
  };

  const getGoogleDriveId = (href) => {
    try {
      const url = new URL(href, window.location.href);
      if (url.hostname !== 'drive.google.com') return null;
      return url.searchParams.get('id');
    } catch (_) {
      return null;
    }
  };

  document.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const link = target.closest('a');
    if (!link) return;

    const href = link.getAttribute('href') || '';
    const explicitTrack = link.dataset.track;
    const explicitKey = link.dataset.trackKey;

    if (explicitTrack === 'resume-download') {
      incrementResume(explicitKey || 'general-it');
      return;
    }

    if (explicitTrack === 'recruiter-action') {
      trackRecruiterAction(explicitKey);
      return;
    }

    if (href.startsWith('mailto:')) {
      trackRecruiterAction('email-click');
      return;
    }

    if (href.startsWith('tel:')) {
      trackRecruiterAction('phone-click');
      return;
    }

    if (href.includes('linkedin.com/in/')) {
      trackRecruiterAction('linkedin-click');
      return;
    }

    const driveId = getGoogleDriveId(href);
    if (href.includes('export=download') && driveId && RESUME_DOWNLOAD_IDS.has(driveId)) {
      incrementResume(driveId === '1dKfGFVppYUdJ0SDFnmy8WgaLYyyoJ94w' ? 'data-center' : 'general-it');
      return;
    }

    if (link.id === 'certLink') {
      incrementCredential('comptia-a-plus');
      return;
    }

    if (link.id === 'educationCredentialLink') {
      incrementCredential('eastern-center-network-admin');
      return;
    }

    if (href.includes('1xUyDk8hZVfvkH5Q1zyFi1_C7lyl9K5RN')) {
      incrementCredential('upper-moreland-diploma');
    }
  }, { passive: true });

  analyticsRoot?.setAttribute('data-analytics-ready', 'true');
  refreshTotals();
})();