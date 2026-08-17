(() => {
  const VERSION = '20260817-credentials-preview1';

  const CREDENTIALS = {
    eastern: {
      institution: 'Eastern Center for Arts and Technology',
      program: 'Computer Network Administration Program',
      date: 'June 2004',
      location: 'Willow Grove, Pennsylvania',
      view: 'https://drive.google.com/file/d/1L9G7QeaieD0zqoPQQyu3kOOYmtPBIF7R/view?usp=drivesdk',
      download: 'https://drive.google.com/uc?export=download&id=1L9G7QeaieD0zqoPQQyu3kOOYmtPBIF7R'
    },
    upper: {
      institution: 'Upper Moreland High School',
      program: 'High School Diploma',
      date: 'June 2004',
      location: 'Willow Grove, Pennsylvania',
      view: 'https://drive.google.com/file/d/1xUyDk8hZVfvkH5Q1zyFi1_C7lyl9K5RN/view?usp=drivesdk',
      download: 'https://drive.google.com/uc?export=download&id=1xUyDk8hZVfvkH5Q1zyFi1_C7lyl9K5RN'
    }
  };

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
          .brand-logo-mark img { width: 100%; height: 100%; object-fit: cover; border-radius: inherit; }
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
            .portfolio-brand-watermark { width: 300px; right: -90px; bottom: -28px; opacity: .055; }
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
      const files = Array.from({ length: 8 }, (_, i) => `data/profile-hq-${String(i + 1).padStart(2, '0')}.txt`);
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
      const files = Array.from({ length: 9 }, (_, i) => `data/cert-hq-${String(i + 1).padStart(2, '0')}.txt`);
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
      if (link) {
        link.href = CREDENTIALS.eastern.view;
        link.target = '_blank';
        link.rel = 'noopener';
        link.setAttribute('aria-label', 'View Eastern Center credential PDF');
      }
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

  const upgradeEducationCredentials = () => {
    const section = document.getElementById('education');
    if (!section || section.dataset.upgraded === 'true') return;
    section.dataset.upgraded = 'true';

    const kicker = section.querySelector('.section-kicker');
    const heading = section.querySelector('h2');
    const grid = section.querySelector('.education-grid');
    if (kicker) kicker.textContent = 'Education credentials';
    if (heading) heading.textContent = 'Education & academic credentials';

    if (heading && !section.querySelector('.education-intro')) {
      const intro = document.createElement('p');
      intro.className = 'education-intro';
      intro.textContent = 'Credential previews are paired with explicit view and PDF download controls for easy employer review.';
      heading.insertAdjacentElement('afterend', intro);
    }

    const items = grid ? Array.from(grid.querySelectorAll(':scope > article')) : [];
    [CREDENTIALS.eastern, CREDENTIALS.upper].forEach((credential, index) => {
      const article = items[index];
      if (!article) return;
      article.classList.add('education-credential-card');

      if (!article.querySelector('.credential-badge')) {
        const badge = document.createElement('span');
        badge.className = 'credential-badge';
        badge.textContent = 'Education credential';
        article.insertAdjacentElement('afterbegin', badge);
      }

      const title = article.querySelector('h3');
      const program = article.querySelector('p');
      const location = article.querySelector('span:not(.credential-badge)');
      if (title) title.classList.add('credential-institution');
      if (program) {
        program.classList.add('credential-program');
        program.textContent = credential.program;
      }
      if (location) location.classList.add('credential-location');

      if (!article.querySelector('.credential-meta')) {
        const meta = document.createElement('div');
        meta.className = 'credential-meta';
        meta.innerHTML = `<span>${credential.date}</span><span>${credential.location}</span>`;
        (location || program || title).insertAdjacentElement('afterend', meta);
        if (location) location.style.display = 'none';
      }

      const figure = article.querySelector('figure');
      if (figure) {
        figure.removeAttribute('style');
        figure.classList.add('education-document');
        const previewLink = figure.querySelector('a');
        if (previewLink) {
          previewLink.href = credential.view;
          previewLink.target = '_blank';
          previewLink.rel = 'noopener';
          previewLink.classList.add('education-document-preview');
          previewLink.setAttribute('aria-label', `View ${credential.institution} credential PDF`);
        }
        const caption = figure.querySelector('figcaption');
        if (caption) {
          caption.innerHTML = `<strong>${credential.program}</strong><span>${credential.date} · High-fidelity PDF copy available</span>`;
        }
      }

      if (!article.querySelector('.credential-actions')) {
        const actions = document.createElement('div');
        actions.className = 'credential-actions';
        actions.innerHTML = `
          <a class="credential-action credential-action-secondary" href="${credential.view}" target="_blank" rel="noopener">View credential</a>
          <a class="credential-action credential-action-primary" href="${credential.download}" target="_blank" rel="noopener">Download PDF</a>
        `;
        article.appendChild(actions);

        const note = document.createElement('p');
        note.className = 'credential-preservation';
        note.textContent = `Digitally preserved credential copy · ${credential.date}`;
        article.appendChild(note);
      }
    });

    if (!document.getElementById('education-credentials-style')) {
      const style = document.createElement('style');
      style.id = 'education-credentials-style';
      style.textContent = `
        #education { background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%); }
        #education .education-intro {
          max-width: 720px;
          margin: 18px 0 0;
          color: #5f6d80;
          font-size: 1rem;
        }
        #education .education-grid {
          gap: 24px;
          margin-top: 42px;
          align-items: stretch;
        }
        #education .education-credential-card {
          display: flex;
          flex-direction: column;
          padding: 26px;
          border: 1px solid #dbe3ee;
          border-radius: 22px;
          background: #ffffff;
          box-shadow: 0 18px 46px rgba(15, 23, 42, .08);
          position: relative;
          overflow: hidden;
        }
        #education .education-credential-card::before {
          content: '';
          position: absolute;
          inset: 0 0 auto;
          height: 4px;
          background: linear-gradient(90deg, #2563eb, #22d3ee);
        }
        #education .credential-badge {
          display: inline-flex;
          align-self: flex-start;
          margin: 3px 0 13px;
          padding: 6px 10px;
          border-radius: 999px;
          background: #eff6ff;
          color: #1d4ed8;
          font-size: .68rem;
          font-weight: 800;
          letter-spacing: .11em;
          text-transform: uppercase;
        }
        #education .credential-institution {
          margin: 0;
          font-size: 1.3rem;
          line-height: 1.15;
        }
        #education .credential-program {
          margin: 9px 0 0;
          color: #344054;
          font-weight: 700;
          font-size: .96rem;
        }
        #education .credential-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 8px 16px;
          margin-top: 10px;
          color: #667085;
          font-size: .82rem;
        }
        #education .credential-meta span + span::before {
          content: '•';
          margin-right: 16px;
          color: #94a3b8;
        }
        #education .education-document {
          margin: 22px 0 0 !important;
          transform: none !important;
          border-radius: 16px;
          border: 1px solid #d8e0eb;
          background: #f3f6fa;
          box-shadow: none !important;
          overflow: hidden;
        }
        #education .education-document-preview {
          min-height: 410px;
          padding: 14px;
          display: grid;
          place-items: center;
          background:
            linear-gradient(45deg, rgba(148,163,184,.05) 25%, transparent 25%, transparent 75%, rgba(148,163,184,.05) 75%),
            linear-gradient(45deg, rgba(148,163,184,.05) 25%, transparent 25%, transparent 75%, rgba(148,163,184,.05) 75%);
          background-size: 24px 24px;
          background-position: 0 0, 12px 12px;
        }
        #education .education-document-preview img {
          width: auto;
          max-width: 100%;
          max-height: 410px;
          object-fit: contain;
          border-radius: 8px;
          box-shadow: 0 9px 28px rgba(15,23,42,.18);
        }
        #education .education-document figcaption {
          display: flex;
          flex-direction: column;
          gap: 3px;
          padding: 13px 15px 15px;
          background: #ffffff;
          color: #667085;
          font-size: .76rem;
        }
        #education .education-document figcaption strong { color: #27364b; font-size: .8rem; }
        #education .credential-actions {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-top: 18px;
        }
        #education .credential-action {
          min-height: 44px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0 14px;
          border-radius: 11px;
          text-decoration: none;
          font-weight: 800;
          font-size: .84rem;
          transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease;
        }
        #education .credential-action:hover { transform: translateY(-1px); }
        #education .credential-action-primary {
          color: #fff;
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          box-shadow: 0 8px 20px rgba(37,99,235,.18);
        }
        #education .credential-action-secondary {
          color: #27364b;
          border: 1px solid #cbd5e1;
          background: #fff;
        }
        #education .credential-preservation {
          margin: 11px 0 0;
          color: #77859a;
          font-size: .72rem;
          font-weight: 500;
          text-align: center;
        }
        @media (max-width: 980px) {
          #education .education-document-preview { min-height: 360px; }
          #education .education-document-preview img { max-height: 360px; }
        }
        @media (max-width: 640px) {
          #education .education-grid { gap: 18px; margin-top: 30px; }
          #education .education-credential-card { padding: 20px; }
          #education .education-document-preview { min-height: 300px; padding: 10px; }
          #education .education-document-preview img { max-height: 300px; }
          #education .credential-actions { grid-template-columns: 1fr; }
          #education .credential-meta { display: block; }
          #education .credential-meta span { display: block; }
          #education .credential-meta span + span { margin-top: 2px; }
          #education .credential-meta span + span::before { display: none; }
        }
      `;
      document.head.appendChild(style);
    }

    const jsonLd = document.querySelector('script[type="application/ld+json"]');
    if (jsonLd) {
      try {
        const data = JSON.parse(jsonLd.textContent);
        data.hasCredential = [
          {
            '@type': 'EducationalOccupationalCredential',
            name: CREDENTIALS.eastern.program,
            credentialCategory: 'Certificate',
            recognizedBy: { '@type': 'EducationalOrganization', name: CREDENTIALS.eastern.institution }
          },
          {
            '@type': 'EducationalOccupationalCredential',
            name: CREDENTIALS.upper.program,
            credentialCategory: 'Diploma',
            recognizedBy: { '@type': 'EducationalOrganization', name: CREDENTIALS.upper.institution }
          }
        ];
        jsonLd.textContent = JSON.stringify(data);
      } catch (error) {
        console.warn('Credential structured data could not be updated:', error);
      }
    }
  };

  upgradeEducationCredentials();
  loadBrandLogo();
  loadProfile();
  loadCertificate();
  loadEducationCredential();
  loadResume();
})();
