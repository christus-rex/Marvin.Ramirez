(() => {
  const read = async (files) => {
    const parts = await Promise.all(files.map(async (file) => {
      const separator = file.includes('?') ? '&' : '?';
      const response = await fetch(`${file}${separator}v=20260817-portrait2`, { cache: 'no-store' });
      if (!response.ok) throw new Error(`Failed to load ${file}: ${response.status}`);
      return response.text();
    }));
    return parts.join('');
  };

  const cleanBase64 = (base64) => base64.replace(/\s/g, '');

  const toBlobUrl = (base64, type) => {
    const clean = cleanBase64(base64);
    const binary = atob(clean);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return URL.createObjectURL(new Blob([bytes], { type }));
  };

  const loadProfile = async () => {
    const image = document.getElementById('profileImage');
    if (!image) return;

    try {
      const encoded = cleanBase64(await read(['data/profile-1.txt', 'data/profile-2.txt']));

      // Use a data URI for the portrait. This avoids the Android/Chrome blob rendering
      // path that previously left the hero image in a broken-image state.
      image.addEventListener('load', () => {
        image.dataset.loaded = 'true';
        image.classList.add('is-loaded');
      }, { once: true });
      image.addEventListener('error', () => {
        image.classList.add('asset-error');
        console.error('Portrait data URI could not be rendered.');
      }, { once: true });
      image.src = `data:image/jpeg;base64,${encoded}`;
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

  loadProfile();
  loadCertificate();
  loadResume();
})();
