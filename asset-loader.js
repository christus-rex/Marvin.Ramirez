(() => {
  const read = async (files) => {
    const parts = await Promise.all(files.map(async (file) => {
      const response = await fetch(file, { cache: 'no-store' });
      if (!response.ok) throw new Error(`Failed to load ${file}: ${response.status}`);
      return response.text();
    }));
    return parts.join('');
  };

  const toBlobUrl = (base64, type) => {
    const clean = base64.replace(/\s/g, '');
    const binary = atob(clean);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return URL.createObjectURL(new Blob([bytes], { type }));
  };

  const loadProfile = async () => {
    const image = document.getElementById('profileImage');
    if (!image) return;
    try {
      const encoded = await read(['data/profile-1.txt', 'data/profile-2.txt']);
      const url = toBlobUrl(encoded, 'image/jpeg');
      image.src = url;
      image.dataset.loaded = 'true';
      image.addEventListener('load', () => image.classList.add('is-loaded'), { once: true });
      image.addEventListener('error', () => console.error('Portrait blob could not be rendered.'), { once: true });
    } catch (error) {
      console.error('Portrait failed to load:', error);
      image.classList.add('asset-error');
    }
  };

  const loadCertificate = async () => {
    try {
      const encoded = await read(['data/cert-small-1.txt', 'data/cert-small-2.txt']);
      const url = toBlobUrl(encoded, 'image/jpeg');
      const image = document.getElementById('certImage');
      const link = document.getElementById('certLink');
      if (image) image.src = url;
      if (link) link.href = url;
    } catch (error) {
      console.error('Certificate failed to load:', error);
    }
  };

  const loadResume = async () => {
    try {
      const encoded = await read(['data/resume.txt']);
      const url = toBlobUrl(encoded, 'application/pdf');
      document.querySelectorAll('[data-resume-download]').forEach((link) => {
        link.href = url;
        link.download = 'Marvin_Ramirez_Professional_Resume.pdf';
      });
    } catch (error) {
      console.error('Résumé failed to load:', error);
    }
  };

  // Keep each asset independent: a bad résumé or certificate must never hide the portrait.
  loadProfile();
  loadCertificate();
  loadResume();
})();
