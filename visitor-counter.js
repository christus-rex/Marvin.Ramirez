(() => {
  const counterEl = document.getElementById('visitorCount');
  if (!counterEl) return;

  const endpoint = 'https://counterapi.com/api/christus-rex.github.io/visitor/marvin-ramirez?unique=true';

  const renderCount = (value) => {
    const count = Number(value);
    if (!Number.isFinite(count) || count < 0) throw new Error('Invalid visitor count');
    counterEl.textContent = new Intl.NumberFormat().format(count);
    counterEl.closest('.visitor-counter')?.classList.add('visitor-counter-ready');
  };

  fetch(endpoint, {
    method: 'GET',
    mode: 'cors',
    cache: 'no-store',
    credentials: 'omit',
    referrerPolicy: 'strict-origin-when-cross-origin'
  })
    .then((response) => {
      if (!response.ok) throw new Error(`Counter request failed: ${response.status}`);
      return response.json();
    })
    .then((data) => renderCount(data.value))
    .catch(() => {
      counterEl.textContent = '—';
      counterEl.closest('.visitor-counter')?.setAttribute('title', 'Visitor count is temporarily unavailable');
    });
})();
