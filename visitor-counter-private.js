(() => {
  const addStylesheet = (href, marker) => {
    if (document.querySelector(`link[${marker}]`)) return;
    const stylesheet = document.createElement('link');
    stylesheet.rel = 'stylesheet';
    stylesheet.href = href;
    stylesheet.setAttribute(marker, 'true');
    document.head.appendChild(stylesheet);
  };

  addStylesheet('visitor-counter.css?v=20260819-private1', 'data-portfolio-analytics-style');
  addStylesheet('portfolio-projects.css?v=20260819-private1', 'data-portfolio-projects-style');

  const injectProjects = () => {
    if (document.getElementById('projects')) return;
    const experience = document.getElementById('experience');
    if (!experience) return;

    experience.insertAdjacentHTML('beforebegin', `
      <section class="section featured-projects" id="projects">
        <div class="shell">
          <div class="projects-intro">
            <div>
              <p class="section-kicker">Featured technical projects</p>
              <h2>Hands-on work that connects endpoint engineering to field infrastructure.</h2>
            </div>
            <p class="projects-summary">Selected examples from enterprise support, migration, automation, server hardware, structured cabling, and multi-site field operations. Each project is grounded in documented experience from the portfolio.</p>
          </div>

          <div class="projects-grid">
            <article class="project-card">
              <div class="project-card-head"><div><h3>Dell SupportAssist Deployment</h3><p class="project-context">Aqua America · Desktop Support Analyst III</p></div><span class="project-index">01</span></div>
              <div class="project-tags"><span class="project-tag">SCCM</span><span class="project-tag">Automation</span><span class="project-tag">Endpoint Engineering</span></div>
              <ul><li>Led an enterprise Dell SupportAssist deployment initiative.</li><li>Created SCCM scripts and task-sequence logic to support rollout and endpoint consistency.</li><li>Worked inside an environment supporting more than 1,000 end users across multiple sites.</li></ul>
              <p class="project-proof"><strong>Evidence:</strong> enterprise endpoint deployment, scripting, SCCM task sequences, and Tier 2–3 support.</p>
            </article>

            <article class="project-card">
              <div class="project-card-head"><div><h3>Enterprise Windows 10 Migration</h3><p class="project-context">TEKsystems / Aqua America · Migration Technician</p></div><span class="project-index">02</span></div>
              <div class="project-tags"><span class="project-tag">Windows 10</span><span class="project-tag">SCCM Imaging</span><span class="project-tag">User Migration</span></div>
              <ul><li>Migrated and imaged Windows systems using SCCM.</li><li>Backed up and restored user data while coordinating upgrade schedules.</li><li>Handled post-deployment troubleshooting and compatibility issues.</li></ul>
              <p class="project-proof"><strong>Evidence:</strong> deployment lifecycle support from scheduling through post-migration remediation.</p>
            </article>

            <article class="project-card">
              <div class="project-card-head"><div><h3>Multi-Site Field Infrastructure</h3><p class="project-context">Albertsons Companies / Pomeroy IT Solutions</p></div><span class="project-index">03</span></div>
              <div class="project-tags"><span class="project-tag">Rack & Stack</span><span class="project-tag">Structured Cabling</span><span class="project-tag">Field Service</span></div>
              <ul><li>Supported rack building, server hardware installation and maintenance, and component replacement.</li><li>Installed and troubleshot network equipment, POS systems, PCs, printers, and structured cabling.</li><li>Maintained SLA-focused service while mentoring and training technicians.</li></ul>
              <p class="project-proof"><strong>Evidence:</strong> regional, multi-site infrastructure support across retail environments.</p>
            </article>

            <article class="project-card">
              <div class="project-card-head"><div><h3>Server & Hardware Lifecycle Support</h3><p class="project-context">Field operations · Data-center-aligned experience</p></div><span class="project-index">04</span></div>
              <div class="project-tags"><span class="project-tag">Server Hardware</span><span class="project-tag">Break / Fix</span><span class="project-tag">Network Equipment</span></div>
              <ul><li>Built and configured custom servers and serviced production hardware in field environments.</li><li>Performed component replacement, hardware troubleshooting, cabling, and infrastructure deployment.</li><li>Combined hands-on hardware work with Windows deployment and network-device support.</li></ul>
              <p class="project-proof"><strong>Evidence:</strong> practical server, endpoint, network-edge, and break/fix experience across multiple roles.</p>
            </article>
          </div>
        </div>
      </section>`);

    const nav = document.querySelector('nav[aria-label="Primary navigation"]');
    if (nav && !nav.querySelector('a[href="#projects"]')) {
      const skillsLink = nav.querySelector('a[href="#skills"]');
      const projectsLink = document.createElement('a');
      projectsLink.href = '#projects';
      projectsLink.textContent = 'Projects';
      skillsLink?.insertAdjacentElement('afterend', projectsLink);
    }
  };

  const injectOpportunityPanel = () => {
    const originalHeroActions = document.querySelector('.hero-copy .hero-actions');
    if (!originalHeroActions || document.querySelector('.opportunity-panel')) return;

    originalHeroActions.outerHTML = `
      <div class="opportunity-panel" aria-label="Availability and recruiter actions">
        <div class="opportunity-head">
          <span class="opportunity-status-dot" aria-hidden="true"></span>
          <div><strong>Available for opportunities</strong><span>IT Support · Endpoint Engineering · Data Center · Field Service</span></div>
        </div>
        <div class="opportunity-actions">
          <a class="button" href="https://drive.google.com/uc?export=download&id=1-x9CWEKG3XUHW4QFA-6PKvqYLFIgXTUZ" target="_blank" rel="noopener" data-track="resume-download" data-track-key="general-it">Download résumé</a>
          <a class="button button-ghost" href="mailto:Marv875@gmail.com" data-track="recruiter-action" data-track-key="email-click">Email me</a>
          <a class="button button-ghost" href="https://www.linkedin.com/in/marvin-alberto-ramirez-bonilla-54261410" target="_blank" rel="noopener noreferrer" data-track="recruiter-action" data-track-key="linkedin-click">LinkedIn</a>
          <a class="button button-ghost" href="tel:+12407530643" data-track="recruiter-action" data-track-key="phone-click">Call</a>
        </div>
        <div class="opportunity-meta"><span>Fredericksburg, Virginia</span><span>On-site · Remote · Field</span><a href="#projects">Featured projects</a><a href="#resumes">Résumé options</a></div>
      </div>`;
  };

  injectProjects();
  injectOpportunityPanel();

  const legacyCounter = document.querySelector('.visitor-counter');
  if (legacyCounter) {
    legacyCounter.outerHTML = `
      <div class="portfolio-analytics" role="group" aria-label="Private portfolio analytics enabled">
        <span class="analytics-metric analytics-metric-ready" title="Portfolio engagement is stored privately">
          <span class="analytics-dot" aria-hidden="true"></span>
          <span class="analytics-copy"><span class="analytics-label">Portfolio analytics</span><strong>Private</strong></span>
        </span>
      </div>`;
  }
})();
