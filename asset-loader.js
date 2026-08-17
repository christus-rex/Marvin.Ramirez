(async () => {
  const read = async (files) => (
    await Promise.all(files.map(async (file) => {
      const response = await fetch(file);
      if (!response.ok) throw new Error(`Failed to load ${file}`);
      return response.text();
    }))
  ).join('');

  const toBlobUrl = (base64, type) => {
    const binary = atob(base64.replace(/\s/g, ''));
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return URL.createObjectURL(new Blob([bytes], { type }));
  };

  try {
    const [profile, cert, resume] = await Promise.all([
      read(['data/profile-1.txt', 'data/profile-2.txt']),
      read(['data/cert-small-1.txt', 'data/cert-small-2.txt']),
      read(['data/resume.txt'])
    ]);

    const profileUrl = toBlobUrl(profile, 'image/jpeg');
    const certUrl = toBlobUrl(cert, 'image/jpeg');
    const resumeUrl = toBlobUrl(resume, 'application/pdf');

    const profileImage = document.getElementById('profileImage');
    if (profileImage) profileImage.src = profileUrl;

    const certImage = document.getElementById('certImage');
    if (certImage) certImage.src = certUrl;

    const certLink = document.getElementById('certLink');
    if (certLink) certLink.href = certUrl;

    document.querySelectorAll('[data-resume-download]').forEach((link) => {
      link.href = resumeUrl;
      link.download = 'Marvin_Ramirez_Professional_Resume.pdf';
    });
  } catch (error) {
    console.error('Portfolio assets failed to load:', error);
  }
})();
