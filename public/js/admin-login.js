(function () {
  const form = document.getElementById('admin-login-form');
  const msg = document.getElementById('msg');
  const submitButton = form.querySelector('button[type="submit"]');

  function showError(text) {
    msg.className = 'error';
    msg.textContent = text;
    msg.classList.remove('hidden');
  }

  fetch('/api/admin/auth/me', { credentials: 'same-origin' })
    .then((r) => {
      if (r.ok) window.location.href = '/admin.html';
    })
    .catch(() => {});

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    msg.classList.add('hidden');
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    if (!username || !password) {
      showError('Enter username and password.');
      return;
    }
    try {
      submitButton.disabled = true;
      submitButton.querySelector('span').textContent = 'Signing in…';
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ username, password })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showError(data.error || 'Sign in failed.');
        return;
      }
      window.location.href = '/admin.html';
    } catch {
      showError('Network error.');
    } finally {
      submitButton.disabled = false;
      submitButton.querySelector('span').textContent = 'Sign in securely';
    }
  });
})();
