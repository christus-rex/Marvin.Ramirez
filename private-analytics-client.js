(() => {
  const endpoint = 'https://lidpzxfnaezzjzrvfpnu.supabase.co/functions/v1/track-portfolio-event';
  const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxpZHB6eGZuYWV6emp6cnZmcG51Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcxMTMwNzAsImV4cCI6MjEwMjY4OTA3MH0.Q26rzbTb87EID5Wokz5Ghq8XT4eA0_0hrEVe2dkNC4Y';

  const VISITOR_KEY = 'marvin-portfolio-private-visitor-id';
  const RESUME_IDS = new Map([
    ['1-x9CWEKG3XUHW4QFA-6PKvqYLFIgXTUZ', 'resume.general-it'],
    ['1dKfGFVppYUdJ0SDFnmy8WgaLYyyoJ94w', 'resume.data-center']
  ]);

  const getVisitorId = () => {
    try {
      let id = localStorage.getItem(VISITOR_KEY);
      if (!id) {
        id = crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        localStorage.setItem(VISITOR_KEY, id);
      }
      return id;
    } catch (_) {
      return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    }
  };

  const send = (events) => {
    if (!Array.isArray(events) || !events.length) return;
    fetch(endpoint, {
      method: 'POST',
      mode: 'cors',
      cache: 'no-store',
      credentials: 'omit',
      referrerPolicy: 'strict-origin-when-cross-origin',
      keepalive: true,
      headers: {
        'content-type': 'application/json',
        'apikey': anonKey,
        'authorization': `Bearer ${anonKey}`
      },
      body: JSON.stringify({ events: events.slice(0, 3) })
    }).catch(() => {
      // Analytics must never interfere with portfolio navigation.
    });
  };

  const getDriveId = (href) => {
    try {
      const url = new URL(href, location.href);
      if (url.hostname !== 'drive.google.com') return null;
      return url.searchParams.get('id') || url.pathname.match(/\/d\/([^/]+)/)?.[1] || null;
    } catch (_) {
      return null;
    }
  };

  const visitorId = getVisitorId();
  send([{ name: 'visitor.unique', dedupeKey: visitorId }]);

  document.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const link = target.closest('a');
    if (!link) return;

    const href = link.getAttribute('href') || '';
    const explicitTrack = link.dataset.track;
    const explicitKey = link.dataset.trackKey;

    if (explicitTrack === 'recruiter-action') {
      const mapped = {
        'linkedin-click': 'recruiter.linkedin',
        'email-click': 'recruiter.email',
        'phone-click': 'recruiter.phone'
      }[explicitKey];
      if (mapped) send([{ name: mapped }]);
      return;
    }

    if (explicitTrack === 'resume-download') {
      const detail = explicitKey === 'data-center' ? 'resume.data-center' : 'resume.general-it';
      send([{ name: 'resume.total' }, { name: detail }]);
      return;
    }

    if (href.startsWith('mailto:')) { send([{ name: 'recruiter.email' }]); return; }
    if (href.startsWith('tel:')) { send([{ name: 'recruiter.phone' }]); return; }
    if (href.includes('linkedin.com/in/')) { send([{ name: 'recruiter.linkedin' }]); return; }

    const driveId = getDriveId(href);
    if (href.includes('export=download') && driveId && RESUME_IDS.has(driveId)) {
      send([{ name: 'resume.total' }, { name: RESUME_IDS.get(driveId) }]);
      return;
    }

    if (link.id === 'certLink') {
      send([{ name: 'credential.total' }, { name: 'credential.comptia-a-plus' }]);
      return;
    }

    if (link.id === 'educationCredentialLink') {
      send([{ name: 'credential.total' }, { name: 'credential.eastern-center-network-admin' }]);
      return;
    }

    if (href.includes('1xUyDk8hZVfvkH5Q1zyFi1_C7lyl9K5RN')) {
      send([{ name: 'credential.total' }, { name: 'credential.upper-moreland-diploma' }]);
    }
  }, { passive: true });
})();
