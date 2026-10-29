(function () {
  const listSection = document.getElementById('exam-list-section');
  const runSection = document.getElementById('exam-run-section');
  const examListEl = document.getElementById('exam-list');
  const studentLabel = document.getElementById('student-label');
  const banner = document.getElementById('banner');
  const timerDisplay = document.getElementById('timer');
  const timerSub = document.getElementById('timer-sub');
  const examTitleRun = document.getElementById('exam-title-run');
  const paletteEl = document.getElementById('palette');
  const qMeta = document.getElementById('q-meta');
  const qText = document.getElementById('q-text');
  const optionsEl = document.getElementById('options');
  const btnLogout = document.getElementById('btn-logout');
  const btnSubmit = document.getElementById('btn-submit');
  const btnBackList = document.getElementById('btn-back-list');

  let state = {
    examId: null,
    endTime: null,
    serverSkew: 0,
    questionOrder: [],
    questions: [],
    answers: {},
    currentIndex: 0,
    timerId: null
  };

  function showBanner(type, text) {
    banner.className = type === 'error' ? 'error alert-premium error-border' : 'success alert-premium success-border';
    banner.innerHTML = type === 'error'
      ? `<i class="fa-solid fa-circle-exclamation"></i> ${text}`
      : `<i class="fa-solid fa-circle-check"></i> ${text}`;
    banner.classList.remove('hidden');
  }

  function hideBanner() {
    banner.classList.add('hidden');
  }

  async function apiJson(url, options = {}) {
    const { headers: extra = {}, ...rest } = options;
    const headers = { ...extra };
    const method = (rest.method || 'GET').toUpperCase();
    if (method !== 'GET' && method !== 'HEAD') {
      headers['Content-Type'] = 'application/json';
    }
    const res = await fetch(url, {
      credentials: 'same-origin',
      ...rest,
      headers
    });
    const data = await res.json().catch(() => ({}));
    return { res, data };
  }

  function formatRemain(ms) {
    if (ms <= 0) return '00:00';
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
  }

  function stopTimer() {
    if (state.timerId) {
      clearInterval(state.timerId);
      state.timerId = null;
    }
  }

  function startTimer() {
    stopTimer();
    state.timerId = setInterval(() => {
      const now = Date.now() - state.serverSkew;
      const left = state.endTime - now;
      timerDisplay.textContent = formatRemain(left);
      
      // Make timer pulse when under 2 minutes
      if (left < 120000) {
        timerDisplay.classList.add('timer-low');
      } else {
        timerDisplay.classList.remove('timer-low');
      }

      if (left <= 0) {
        stopTimer();
        void submitExam(true);
      }
    }, 250);
    const now = Date.now() - state.serverSkew;
    timerDisplay.textContent = formatRemain(state.endTime - now);
  }

  function questionById(id) {
    return state.questions.find((q) => q.question_id === id) || null;
  }

  function renderPalette() {
    paletteEl.innerHTML = '';
    state.questionOrder.forEach((qid, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'palette-btn';
      btn.textContent = String(idx + 1);
      if (idx === state.currentIndex) btn.classList.add('current');
      if (state.answers[qid]) btn.classList.add('answered');
      btn.addEventListener('click', () => {
        state.currentIndex = idx;
        renderQuestion();
        renderPalette();
      });
      paletteEl.appendChild(btn);
    });
  }

  // --- KaTeX Mathematical Parser Helper ---
  function parseLaTeX(text) {
    if (!text) return '';
    const regex = /\$\$([\s\S]*?)\$\$/g;
    
    return text.replace(regex, (match, formula) => {
      try {
        if (typeof katex !== 'undefined') {
          return katex.renderToString(formula.trim(), {
            displayMode: match.includes('\n') || formula.length > 25,
            throwOnError: false
          });
        } else {
          return `<span class="katex-fallback-formula font-mono">${escapeHtml(formula)}</span>`;
        }
      } catch (err) {
        console.error('KaTeX compile failure:', err);
        return `<span class="katex-error font-mono">${escapeHtml(formula)}</span>`;
      }
    });
  }

  function renderQuestion() {
    const qid = state.questionOrder[state.currentIndex];
    const q = questionById(qid);
    if (!q) return;
    
    qMeta.textContent = `Question ${state.currentIndex + 1} of ${state.questionOrder.length}`;
    
    // Render question prompt with LaTeX support
    const supportsFormatting = q.supports_formatting || false;
    qText.innerHTML = supportsFormatting ? parseLaTeX(q.question_text) : escapeHtml(q.question_text);
    
    // Update Question Type Badge
    const typeBadge = document.getElementById('q-type-badge');
    if (typeBadge) {
      const qType = q.question_type || 'text';
      if (qType === 'GEO_INTERACTIVE' || qType === 'geography' || q.geo_config) {
        typeBadge.innerHTML = '<i class="fa-solid fa-earth-africa"></i> Geography & Map';
        typeBadge.className = 'q-badge science';
      } else if (qType === 'GRAPH_INTERACTIVE' || q.graph_config) {
        typeBadge.innerHTML = '<i class="fa-solid fa-chart-line"></i> Interactive Graph';
        typeBadge.className = 'q-badge math';
      } else if (qType === 'math') {
        typeBadge.innerHTML = '<i class="fa-solid fa-calculator"></i> Mathematics';
        typeBadge.className = 'q-badge math';
      } else if (qType === 'science') {
        typeBadge.innerHTML = '<i class="fa-solid fa-microscope"></i> Scientific';
        typeBadge.className = 'q-badge science';
      } else {
        typeBadge.innerHTML = '<i class="fa-solid fa-font"></i> General Text';
        typeBadge.className = 'q-badge text';
      }
    }

    // Embed Interactive Graph if configured
    const existingGraphEmbed = document.getElementById('cbt-graph-embed-wrapper');
    if (existingGraphEmbed) existingGraphEmbed.remove();

    // Embed Interactive Map if configured
    const existingMapEmbed = document.getElementById('cbt-map-embed-wrapper');
    if (existingMapEmbed) existingMapEmbed.remove();

    if (q.question_type === 'GEO_INTERACTIVE' || q.question_type === 'geography' || q.geo_config) {
      const mapWrapper = document.createElement('div');
      mapWrapper.id = 'cbt-map-embed-wrapper';
      mapWrapper.style.cssText = 'width:100%; height:340px; margin:12px 0; border:1px solid #CBD5E1; border-radius:8px; overflow:hidden; position:relative; background:#FAFAFC;';
      
      const mapContainer = document.createElement('div');
      mapContainer.id = 'cbt-question-map';
      mapContainer.style.cssText = 'width:100%; height:100%;';
      mapWrapper.appendChild(mapContainer);

      const coordBadge = document.createElement('div');
      coordBadge.id = 'cbt-map-coord-badge';
      coordBadge.style.cssText = 'position:absolute; bottom:8px; left:8px; background:rgba(15,23,42,0.85); color:#fff; font-size:11px; padding:3px 8px; border-radius:4px; z-index:1000; font-family:monospace;';
      coordBadge.textContent = 'Click map to drop location pin';
      mapWrapper.appendChild(coordBadge);

      qText.parentNode.insertBefore(mapWrapper, optionsEl);

      try {
        let geoCfg = typeof q.geo_config === 'string' ? JSON.parse(q.geo_config) : (q.geo_config || {});
        let center = geoCfg.center || [1.3733, 32.2903];
        let zoom = geoCfg.zoom || 7;

        if (typeof L !== 'undefined') {
          const examMap = L.map(mapContainer).setView(center, zoom);
          L.tileLayer(
            'https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png?key=cb1_4tlk_1_c350409336a0563b146c80d8',
            {
              maxZoom: 19,
              attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
            }
          ).addTo(examMap);

          let pinMarker = null;

          if (state.answers[qid] && typeof state.answers[qid] === 'string' && state.answers[qid].includes(',')) {
            const parts = state.answers[qid].replace(/[()]/g, '').split(',');
            const lat = parseFloat(parts[0]);
            const lng = parseFloat(parts[1]);
            if (!isNaN(lat) && !isNaN(lng)) {
              pinMarker = L.marker([lat, lng]).addTo(examMap);
              coordBadge.textContent = `Selected: ${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`;
            }
          }

          examMap.on('click', (ev) => {
            const lat = ev.latlng.lat;
            const lng = ev.latlng.lng;
            if (pinMarker) {
              pinMarker.setLatLng(ev.latlng);
            } else {
              pinMarker = L.marker(ev.latlng).addTo(examMap);
            }
            coordBadge.textContent = `Selected: ${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`;
            const ptStr = `(${lat.toFixed(4)}, ${lng.toFixed(4)})`;
            state.answers[qid] = ptStr;
            renderPalette();

            apiJson(`/api/exams/${state.examId}/answer`, {
              method: 'POST',
              body: JSON.stringify({
                question_id: qid,
                selected_option: q.correct_answer || 'A',
                graph_answer: { lat, lng }
              })
            });
          });

          setTimeout(() => examMap.invalidateSize(), 200);
        }
      } catch (mErr) {
        console.warn('Error embedding CBT question map:', mErr);
      }
    }

    if (q.question_type === 'GRAPH_INTERACTIVE' || q.graph_config) {
      const graphWrapper = document.createElement('div');
      graphWrapper.id = 'cbt-graph-embed-wrapper';
      graphWrapper.style.cssText = 'width:100%; height:320px; margin:12px 0; border:1px solid #CBD5E1; border-radius:8px; overflow:hidden; position:relative; background:#FAFAFC;';
      
      const graphContainer = document.createElement('div');
      graphContainer.id = 'cbt-question-graph';
      graphContainer.style.cssText = 'width:100%; height:100%;';
      graphWrapper.appendChild(graphContainer);
      
      qText.parentNode.insertBefore(graphWrapper, optionsEl);

      try {
        let gCfg = typeof q.graph_config === 'string' ? JSON.parse(q.graph_config) : (q.graph_config || {});
        let gEngine = new GraphEngine(graphContainer, {
          xMin: gCfg.xMin || -10,
          xMax: gCfg.xMax || 10,
          yMin: gCfg.yMin || -10,
          yMax: gCfg.yMax || 10,
          xLabel: gCfg.xLabel || 'x',
          yLabel: gCfg.yLabel || 'y',
          mode: 'interactive_question',
          onPointSelected: (pt) => {
            const ptStr = `(${pt.x.toFixed(2)}, ${pt.y.toFixed(2)})`;
            state.answers[qid] = ptStr;
            renderPalette();
            apiJson(`/api/exams/${state.examId}/answer`, {
              method: 'POST',
              body: JSON.stringify({ question_id: qid, selected_option: 'A', graph_answer: pt })
            });
          }
        });

        if (gCfg.functions && Array.isArray(gCfg.functions)) {
          gEngine.setFunctions(gCfg.functions);
        } else if (gCfg.expr) {
          gEngine.addFunction(gCfg.expr, { color: '#2563EB' });
        }
      } catch (gErr) {
        console.warn('Error embedding CBT question graph:', gErr);
      }
    }

    optionsEl.innerHTML = '';
    const letters = [
      ['A', q.option_a],
      ['B', q.option_b],
      ['C', q.option_c],
      ['D', q.option_d]
    ];
    const selected = state.answers[qid] || null;
    
    // Only render option buttons if options are provided
    if (q.option_a || q.option_b) {
      letters.forEach(([key, label]) => {
        if (!label) return;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'option';
        if (selected === key) btn.classList.add('selected');
        
        const k = document.createElement('span');
        k.className = 'option-key';
        k.textContent = key;
        
        const t = document.createElement('span');
        t.innerHTML = supportsFormatting ? parseLaTeX(label) : escapeHtml(label);
        
        btn.appendChild(k);
        btn.appendChild(t);
        btn.addEventListener('click', () => void pickOption(qid, key));
        optionsEl.appendChild(btn);
      });
    }
  }

  async function pickOption(questionId, letter) {
    state.answers[questionId] = letter;
    renderQuestion();
    renderPalette();
    const { res, data } = await apiJson(`/api/exams/${state.examId}/answer`, {
      method: 'POST',
      body: JSON.stringify({ question_id: questionId, selected_option: letter })
    });
    if (res.status === 403 && data.code === 'TIME_EXPIRED') {
      showBanner('error', data.error || 'Time expired.');
      window.location.href = `/result.html?examId=${encodeURIComponent(state.examId)}`;
      return;
    }
    if (res.status === 403 && data.code === 'ALREADY_SUBMITTED') {
      window.location.href = `/result.html?examId=${encodeURIComponent(state.examId)}`;
      return;
    }
    if (!res.ok) {
      showBanner('error', data.error || 'Could not save answer.');
    } else {
      hideBanner();
    }
  }

  function showListUi() {
    listSection.classList.remove('hidden');
    runSection.classList.add('hidden');
    stopTimer();
    state.examId = null;
  }

  function showRunUi() {
    listSection.classList.add('hidden');
    runSection.classList.remove('hidden');
  }

  async function loadExams() {
    const { res, data } = await apiJson('/api/exams', { method: 'GET' });
    if (res.status === 401) {
      window.location.href = '/login.html';
      return;
    }
    if (!res.ok) {
      examListEl.innerHTML = '<p class="muted">Could not load active assessments.</p>';
      return;
    }
    
    if (data.exams.length === 0) {
      examListEl.innerHTML = '<p class="muted text-center" style="padding: 2rem 0; width: 100%; grid-column: 1/-1;">There are no active examinations broadcasted to your portal at this time.</p>';
      return;
    }

    examListEl.innerHTML = '';
    data.exams.forEach((ex) => {
      const tile = document.createElement('div');
      tile.className = 'exam-tile-premium';
      
      const badgeClass =
        ex.attemptStatus === 'Submitted'
          ? 'badge-done'
          : ex.attemptStatus === 'InProgress'
            ? 'badge-progress'
            : 'badge-notstarted';
            
      const badgeText =
        ex.attemptStatus === 'Submitted'
          ? '<i class="fa-solid fa-circle-check"></i> Submitted'
          : ex.attemptStatus === 'InProgress'
            ? '<i class="fa-solid fa-spinner fa-spin"></i> In progress'
            : '<i class="fa-solid fa-hourglass"></i> Not started';
            
      const btn = document.createElement('button');
      btn.className = 'btn btn-student-primary';
      
      if (ex.attemptStatus === 'Submitted') {
        btn.className = 'btn btn-student-ghost';
        btn.innerHTML = '<i class="fa-solid fa-chart-simple"></i> View Score';
        btn.addEventListener('click', () => {
          window.location.href = `/result.html?examId=${encodeURIComponent(ex.exam_id)}`;
        });
      } else if (ex.attemptStatus === 'InProgress') {
        btn.innerHTML = '<i class="fa-solid fa-play"></i> Resume Test';
        btn.addEventListener('click', () => void startExam(ex.exam_id));
      } else {
        btn.innerHTML = '<i class="fa-solid fa-circle-play"></i> Start Test';
        btn.addEventListener('click', () => void startExam(ex.exam_id));
      }
      
      tile.innerHTML = `
        <div class="tile-meta">
          <h3>${escapeHtml(ex.title)}</h3>
          <span class="badge ${badgeClass}">${badgeText}</span>
        </div>
        <p class="muted"><i class="fa-regular fa-clock"></i> Duration Limit: <strong>${ex.duration} minutes</strong></p>
      `;
      tile.appendChild(btn);
      examListEl.appendChild(tile);
    });
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  async function startExam(examId) {
    hideBanner();
    const { res, data } = await apiJson(`/api/exams/${examId}/start`, {
      method: 'POST',
      body: JSON.stringify({})
    });
    if (res.status === 401) {
      window.location.href = '/login.html';
      return;
    }
    if (res.status === 403 && data.code === 'ALREADY_SUBMITTED') {
      showBanner('error', data.error || 'Test attempt already submitted.');
      return;
    }
    if (res.status === 409) {
      showBanner('error', data.error || 'Another exam is currently in progress.');
      return;
    }
    if (!res.ok) {
      showBanner('error', data.error || 'Could not start exam.');
      return;
    }
    state.examId = examId;
    await loadSession();
  }

  async function loadSession() {
    hideBanner();
    const { res, data } = await apiJson(`/api/exams/${state.examId}/session`, { method: 'GET' });
    if (res.status === 403 && data.code === 'TOKEN_MISMATCH') {
      showBanner('error', data.error || 'Session token verification conflict.');
      showListUi();
      await loadExams();
      return;
    }
    if (res.status === 403 && data.code === 'TIME_EXPIRED') {
      window.location.href = `/result.html?examId=${encodeURIComponent(state.examId)}`;
      return;
    }
    if (res.status === 403 && data.code === 'ALREADY_SUBMITTED') {
      window.location.href = `/result.html?examId=${encodeURIComponent(state.examId)}`;
      return;
    }
    if (!res.ok) {
      showBanner('error', data.error || 'Could not load exam session.');
      showListUi();
      await loadExams();
      return;
    }
    state.endTime = data.endTime;
    state.serverSkew = Date.now() - (data.serverNow || Date.now());
    state.questionOrder = data.questionOrder || [];
    state.questions = data.questions || [];
    state.answers = data.answers || {};
    state.currentIndex = 0;
    examTitleRun.textContent = data.exam.title;
    timerSub.textContent = `Strict Submission at ${new Date(data.endTime).toLocaleTimeString()}`;
    showRunUi();
    renderPalette();
    renderQuestion();
    startTimer();
  }

  async function submitExam(auto) {
    if (!state.examId) return;
    stopTimer();
    const { res, data } = await apiJson(`/api/exams/${state.examId}/submit`, {
      method: 'POST',
      body: JSON.stringify({})
    });
    if (res.status === 403 && data.code === 'TIME_EXPIRED' && data.result) {
      window.location.href = `/result.html?examId=${encodeURIComponent(state.examId)}`;
      return;
    }
    if (!res.ok) {
      showBanner('error', data.error || 'Submit transmission failed.');
      if (!auto) await loadExams();
      showListUi();
      return;
    }
    window.location.href = `/result.html?examId=${encodeURIComponent(state.examId)}`;
  }

  btnSubmit.addEventListener('click', () => {
    if (!confirm('Are you absolutely sure you want to finalize and submit? You will not be able to change your answers.')) return;
    void submitExam(false);
  });

  btnBackList.addEventListener('click', () => {
    showListUi();
    void loadExams();
  });

  btnLogout.addEventListener('click', async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
    window.location.href = '/login.html';
  });

  async function init() {
    const { res, data } = await apiJson('/api/auth/me', { method: 'GET' });
    if (res.status === 401) {
      window.location.href = '/login.html';
      return;
    }
    studentLabel.innerHTML = data.name
      ? `<i class="fa-solid fa-user-tie"></i> ${escapeHtml(data.name)} <span class="student-reg-sub">(${escapeHtml(data.registration_number)})</span>`
      : `<i class="fa-solid fa-user-tie"></i> ${escapeHtml(data.registration_number)}`;
    await loadExams();
  }

  void init();
})();
