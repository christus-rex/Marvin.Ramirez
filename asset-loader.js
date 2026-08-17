(() => {
  const VERSION = '20260817-diploma-fix2';

  const read = async (files) => {
    const parts = await Promise.all(files.map(async (file) => {
      const separator = file.includes('?') ? '&' : '?';
      const response = await fetch(`${file}${separator}v=${VERSION}`, { cache: 'no-store' });
      if (!response.ok) throw new Error(`Failed to load ${file}: ${response.status}`);
      return response.text();
    }));
    return parts.join('');
  };

  const clean = (value) => value.replace(/\s/g, '');

  const dataUri = (base64, type) => `data:${type};base64,${clean(base64)}`;

  const toBlobUrl = (base64, type) => {
    const binary = atob(clean(base64));
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return URL.createObjectURL(new Blob([bytes], { type }));
  };

  const loadProfile = async () => {
    const image = document.getElementById('profileImage');
    if (!image) return;

    try {
      const files = Array.from(
        { length: 8 },
        (_, i) => `data/profile-hq-${String(i + 1).padStart(2, '0')}.txt`
      );
      image.decoding = 'async';
      image.addEventListener('load', () => {
        image.dataset.loaded = 'true';
        image.classList.add('is-loaded');
      }, { once: true });
      image.addEventListener('error', () => {
        image.classList.add('asset-error');
        console.error('High-fidelity portrait could not be rendered.');
      }, { once: true });
      image.src = dataUri(await read(files), 'image/webp');
    } catch (error) {
      console.error('Portrait failed to load:', error);
      image.classList.add('asset-error');
    }
  };

  const loadCertificate = async () => {
    try {
      const files = Array.from(
        { length: 9 },
        (_, i) => `data/cert-hq-${String(i + 1).padStart(2, '0')}.txt`
      );
      const url = dataUri(await read(files), 'image/webp');
      const image = document.getElementById('certImage');
      const link = document.getElementById('certLink');
      if (image) {
        image.decoding = 'async';
        image.src = url;
      }
      if (link) link.href = url;
    } catch (error) {
      console.error('Certificate failed to load:', error);
    }
  };

  const loadEducationCredential = async () => {
    try {
      const url = dataUri(await read(['data/eastern-education-single.txt']), 'image/webp');
      const image = document.getElementById('educationCredentialImage');
      const link = document.getElementById('educationCredentialLink');
      if (image) {
        image.decoding = 'async';
        image.src = url;
      }
      if (link) link.href = url;
    } catch (error) {
      console.error('Education credential failed to load:', error);
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
  loadEducationCredential();
  loadResume();
})();
