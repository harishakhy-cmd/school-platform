(function () {
  const params = new URLSearchParams(window.location.search);
  const examId = params.get('examId');
  const content = document.getElementById('content');
  const titleEl = document.getElementById('result-title');
  const banner = document.getElementById('banner');
  const btnLogout = document.getElementById('btn-logout');

  function showBanner(type, text) {
    banner.className = type === 'error' ? 'error' : 'success';
    banner.textContent = text;
    banner.classList.remove('hidden');
  }

  btnLogout.addEventListener('click', async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
    window.location.href = '/login.html';
  });

  async function load() {
    if (!examId) {
      content.innerHTML = '<p class="muted">Missing exam in URL.</p>';
      return;
    }
    const res = await fetch(`/api/exams/${encodeURIComponent(examId)}/result`, {
      credentials: 'same-origin'
    });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401) {
      window.location.href = '/login.html';
      return;
    }
    if (res.status === 400 && data.code === 'IN_PROGRESS') {
      showBanner('error', 'This exam is still in progress.');
      content.innerHTML =
        '<a class="btn btn-primary" href="/exam.html">Return to exams</a>';
      return;
    }
    if (!res.ok) {
      content.innerHTML = `<p class="muted">${data.error || 'Could not load result.'}</p>`;
      return;
    }
    titleEl.textContent = data.title || '';
    const pct = data.total ? Math.round((data.score / data.total) * 100) : 0;
    content.innerHTML = `
      <div class="score-big">${data.score} / ${data.total}</div>
      <p class="muted">Score: ${pct}%</p>
      <p class="muted" style="margin-top:1rem">
        Submitted: ${data.submittedAt ? new Date(data.submittedAt).toLocaleString() : '—'}
      </p>
      <p style="margin-top:1.5rem">
        <a class="btn btn-primary" href="/exam.html">Back to exams</a>
      </p>
    `;
  }

  void load();
})();
