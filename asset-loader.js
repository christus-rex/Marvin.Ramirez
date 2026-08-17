(() => {
  const VERSION = '20260817-logo1';

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

  const loadBrandLogo = async () => {
    try {
      const url = dataUri(await read(['data/logo-01.txt', 'data/logo-02.txt']), 'image/webp');

      const mark = document.querySelector('.brand-mark');
      if (mark) {
        const logo = document.createElement('img');
        logo.src = url;
        logo.alt = '';
        logo.setAttribute('aria-hidden', 'true');
        logo.decoding = 'async';
        mark.textContent = '';
        mark.appendChild(logo);
        mark.classList.add('brand-logo-mark');
      }

      const hero = document.querySelector('.hero');
      if (hero && !hero.querySelector('.portfolio-brand-watermark')) {
        const watermark = document.createElement('img');
        watermark.src = url;
        watermark.alt = '';
        watermark.setAttribute('aria-hidden', 'true');
        watermark.className = 'portfolio-brand-watermark';
        hero.appendChild(watermark);
      }

      let favicon = document.querySelector('link[rel="icon"]');
      if (!favicon) {
        favicon = document.createElement('link');
        favicon.rel = 'icon';
        document.head.appendChild(favicon);
      }
      favicon.type = 'image/webp';
      favicon.href = url;

      if (!document.getElementById('portfolio-brand-style')) {
        const style = document.createElement('style');
        style.id = 'portfolio-brand-style';
        style.textContent = `
          .brand-logo-mark {
            width: 40px !important;
            height: 40px !important;
            padding: 2px;
            border-radius: 999px !important;
            overflow: hidden;
            background: rgba(4, 7, 12, .88) !important;
            border: 1px solid rgba(244, 202, 90, .38);
            box-shadow: 0 0 0 1px rgba(255,255,255,.05), 0 8px 22px rgba(0,0,0,.28), 0 0 18px rgba(228,181,61,.13);
          }
          .brand-logo-mark img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            border-radius: inherit;
          }
          .hero { position: relative; }
          .hero-grid { position: relative; z-index: 1; }
          .portfolio-brand-watermark {
            position: absolute;
            z-index: 0;
            right: -80px;
            bottom: -70px;
            width: min(40vw, 520px);
            max-width: none;
            opacity: .065;
            pointer-events: none;
            user-select: none;
            filter: saturate(.9) drop-shadow(0 0 34px rgba(232,187,72,.12));
          }
          @media (max-width: 640px) {
            .portfolio-brand-watermark {
              width: 300px;
              right: -90px;
              bottom: -28px;
              opacity: .055;
            }
          }
        `;
        document.head.appendChild(style);
      }
    } catch (error) {
      console.error('Portfolio logo failed to load:', error);
    }
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

  loadBrandLogo();
  loadProfile();
  loadCertificate();
  loadEducationCredential();
  loadResume();
})();
