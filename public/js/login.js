(function () {
  const form = document.getElementById('login-form');
  const msg = document.getElementById('msg');
  const submitButton = form.querySelector('button[type="submit"]');
  const REG = /^(?:STO[0-9]+-\d{3}[A-Z]|[A-Z0-9][A-Z0-9/_\-.]{2,31})$/i;

  function showError(text) {
    msg.className = 'error';
    msg.textContent = text;
    msg.classList.remove('hidden');
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    msg.classList.add('hidden');
    const registration_number = document.getElementById('registration_number').value.trim();
    if (!registration_number) {
      showError('Please enter your registration number.');
      return;
    }
    if (!REG.test(registration_number)) {
      showError('Enter a valid registration number, such as STO1-001A or 2026/ICT/001.');
      return;
    }
    try {
      submitButton.disabled = true;
      submitButton.querySelector('span').textContent = 'Signing in…';
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registration_number }),
        credentials: 'same-origin'
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showError(data.error || 'Login failed.');
        return;
      }
      window.location.href = '/portal.html';
    } catch {
      showError('Network error. Is the server running?');
    } finally {
      submitButton.disabled = false;
      submitButton.querySelector('span').textContent = 'Continue to portal';
    }
  });
})();
