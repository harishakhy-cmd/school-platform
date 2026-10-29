/**
 * admin-settings.js
 * Comprehensive, fully-interactive admin settings panel for CBT & Virtual Academy
 * Loaded after admin.js
 *
 * 12 Functional Settings Panels:
 *  1. My Profile          — live avatar preview, edit credentials, recovery link, unsaved tracker
 *  2. General Settings    — branding, helpline, session timeout, maintenance toggle & warning
 *  3. CBT & Exam Security — pass mark, tab switch limit, proctoring toggles, security rating, presets
 *  4. Virtual Classroom   — entry mic/cam defaults, whiteboard, chat drawer, capacity indicator, presets
 *  5. Staff & Admins      — list, role filter pills, live search, add staff modal, edit modal, reset pwd
 *  6. Academic Terms      — CRUD, set current active, duration calculator, date range validation, filter
 *  7. Class Levels        — CRUD, code auto-generator, live search filter, count badge
 *  8. Subjects            — CRUD, code auto-generator, live search filter, count badge
 *  9. Metrics & Storage   — live stats cards, DB table size bars, auto-refresh countdown (30s)
 *  10. System Diagnostics — ping latency, orphan clean tool, email transport verification
 *  11. Backup & Tools     — snapshot JSON export, broadcast with presets & live preview, modal purge
 *  12. Audit Trail        — activity logs, action filter, free search, detail inspector modal, JSON export
 */

(function () {
  'use strict';

  // ── Helpers ─────────────────────────────────────────────────────────────────

  function esc(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  async function api(url, opts = {}) {
    const res = await fetch(url, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
      ...opts,
    });
    let data = {};
    try { data = await res.json(); } catch (e) { /* empty */ }
    return { res, data };
  }

  function showAlert(id, msg, type = 'error') {
    const el = document.getElementById(id);
    if (!el) return;
    el.className = `stg-alert ${type}`;
    el.textContent = msg;
    el.style.display = 'block';
    setTimeout(() => { if (el) el.style.display = 'none'; }, 5000);
  }

  function setLoading(btnId, loading) {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    btn.disabled = loading;
    if (loading) {
      btn._origHTML = btn.innerHTML;
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Please wait…';
    } else if (btn._origHTML) {
      btn.innerHTML = btn._origHTML;
    }
  }

  function formatDate(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: '2-digit' });
  }

  function formatDateTime(d) {
    if (!d) return '—';
    return new Date(d).toLocaleString('en-GB', {
      year: 'numeric', month: 'short', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  }

  function timeAgo(d) {
    if (!d) return '';
    const s = Math.floor((Date.now() - new Date(d)) / 1000);
    if (s < 60) return `${Math.max(1, s)}s ago`;
    if (s < 3600) return `${Math.floor(s/60)}m ago`;
    if (s < 86400) return `${Math.floor(s/3600)}h ago`;
    return `${Math.floor(s/86400)}d ago`;
  }

  function badge(text, color) {
    return `<span class="stg-badge stg-badge-${color}">${esc(text)}</span>`;
  }

  function roleBadge(role) {
    if (role === 'super_admin') return badge('Super Admin', 'purple');
    if (role === 'tutor') return badge('Tutor', 'blue');
    return badge('Admin', 'gray');
  }

  function statusBadge(status) {
    if (status === 'active')    return badge('Active', 'green');
    if (status === 'suspended') return badge('Suspended', 'red');
    return badge('Pending', 'yellow');
  }

  function setText(id, v) {
    const el = document.getElementById(id);
    if (el) el.textContent = v;
  }
  function setVal(id, v) {
    const el = document.getElementById(id);
    if (el) el.value = v;
  }
  function setCheck(id, bool) {
    const el = document.getElementById(id);
    if (el) el.checked = Boolean(bool);
  }
  function getCheck(id) {
    const el = document.getElementById(id);
    return el ? el.checked : false;
  }

  function openModal(id) {
    const m = document.getElementById(id);
    if (m) m.style.display = 'flex';
  }
  function closeModal(id) {
    const m = document.getElementById(id);
    if (m) m.style.display = 'none';
  }
  window.stgCloseModal = closeModal;

  // ── State ────────────────────────────────────────────────────────────────────

  const state = {
    isSuperAdmin: false,
    myProfile: null,
    admins: [],
    selectedRoleFilter: '',
    terms: [],
    classes: [],
    subjects: [],
    cachedLogs: [],
    cachedStats: null,
    autoRefreshTimer: null,
    autoRefreshSecs: 30,
    dbTableFilter: '',
  };

  // ── Panel routing ─────────────────────────────────────────────────────────────

  let currentPanel = 'profile';

  function switchPanel(name) {
    // If navigating away from stats, stop auto-refresh timer to conserve network
    if (currentPanel === 'stats' && name !== 'stats') {
      stopAutoRefresh();
    }

    currentPanel = name;
    document.querySelectorAll('.settings-panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.settings-nav-item').forEach(n => n.classList.remove('active'));

    const panel = document.getElementById(`stg-panel-${name}`);
    if (panel) panel.classList.add('active');
    const navItem = document.querySelector(`[data-stg-panel="${name}"]`);
    if (navItem) navItem.classList.add('active');

    // Lazy-load panel data
    const loaders = {
      profile:        loadProfile,
      general:        loadGeneralConfig,
      'cbt-policies': loadCbtPolicies,
      'live-config':  loadLiveConfig,
      users:          loadUsers,
      terms:          loadTerms,
      classes:        loadClasses,
      subjects:       loadSubjects,
      stats:          loadStats,
      diagnostics:    runDiagnostics,
      activity:       loadActivity,
    };
    if (loaders[name]) loaders[name]();
  }

  // ── 1. MY PROFILE ────────────────────────────────────────────────────────────

  function previewAvatar(url) {
    const avEl = document.getElementById('stg-profile-avatar');
    if (!avEl) return;
    const p = state.myProfile || {};
    const fallbackInitial = (p.username || p.full_name || '?').charAt(0).toUpperCase();

    if (url && url.trim()) {
      avEl.innerHTML = `<img src="${esc(url.trim())}" alt="Avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" onerror="this.parentElement.textContent='${esc(fallbackInitial)}'" />`;
    } else {
      avEl.textContent = fallbackInitial;
    }
  }

  function markProfileUnsaved(unsaved = true) {
    const badgeEl = document.getElementById('stg-profile-unsaved');
    if (badgeEl) badgeEl.style.display = unsaved ? 'inline-block' : 'none';
  }

  async function loadProfile() {
    const { res, data } = await api('/api/admin/settings/profile');
    if (!res.ok) return;
    const p = data.profile;
    state.myProfile = p;

    previewAvatar(p.avatar_url);
    window.renderProfilePhoto(
      document.getElementById('admin-avatar-photo'),
      document.getElementById('admin-avatar-icon'),
      p.avatar_url
    );

    // Read-only account overview
    setText('stg-info-username', p.username || '—');
    setText('stg-info-role', p.role ? p.role.replace(/_/g, ' ') : '—');
    setText('stg-info-code', p.admin_code || '—');
    setText('stg-info-status', p.status || '—');
    setText('stg-info-since', formatDate(p.created_at));

    // Editable profile fields
    setVal('stg-edit-fullname', p.full_name || '');
    setVal('stg-edit-email', p.email || '');
    setVal('stg-edit-avatar', p.avatar_url || '');
    markProfileUnsaved(false);

    // Recovery email status
    const recoveryEl = document.getElementById('stg-recovery-email-status');
    if (recoveryEl) {
      if (p.email) {
        recoveryEl.innerHTML = `Recovery email: <strong>${esc(p.email)}</strong> — password reset links will be sent here.`;
        recoveryEl.style.color = '#16a34a';
      } else {
        recoveryEl.innerHTML = `<span style="color:#dc2626">⚠ No recovery email set.</span> Add a Contact Email above and save your profile to enable password recovery.`;
      }
    }
  }

  async function saveProfile() {
    const full_name = document.getElementById('stg-edit-fullname').value.trim();
    const email = document.getElementById('stg-edit-email').value.trim();
    const avatar_url = document.getElementById('stg-edit-avatar').value.trim();

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showAlert('stg-profile-alert', 'Please provide a valid email address');
      return;
    }

    setLoading('stg-profile-save-btn', true);
    const { res, data } = await api('/api/admin/settings/profile', {
      method: 'PUT',
      body: JSON.stringify({ full_name, email, avatar_url }),
    });
    setLoading('stg-profile-save-btn', false);

    if (res.ok && data.ok) {
      showAlert('stg-profile-alert', '✓ Profile updated successfully', 'success');
      markProfileUnsaved(false);
      loadProfile();
    } else {
      showAlert('stg-profile-alert', data.error || 'Failed to update profile');
    }
  }

  // ── 2. GENERAL PLATFORM SETTINGS ─────────────────────────────────────────────

  async function loadGeneralConfig() {
    const { res, data } = await api('/api/admin/settings/config');
    if (!res.ok) return;
    const c = data.config || {};
    setVal('cfg-institution-name', c.institution_name || '');
    setVal('cfg-institution-tagline', c.institution_tagline || '');
    setVal('cfg-support-email', c.support_email || '');
    setVal('cfg-support-phone', c.support_phone || '');
    setVal('cfg-session-timeout', c.session_timeout_minutes || '60');
    setVal('cfg-maintenance-msg', c.maintenance_message || '');

    const mMode = document.getElementById('cfg-maintenance-mode');
    const isMaintenance = c.maintenance_mode === 'true';
    if (mMode) mMode.checked = isMaintenance;

    const banner = document.getElementById('stg-maintenance-banner');
    if (banner) banner.style.display = isMaintenance ? 'block' : 'none';
  }

  async function saveGeneralConfig() {
    const mMode = document.getElementById('cfg-maintenance-mode');
    const isM = mMode && mMode.checked;
    const settings = {
      institution_name: document.getElementById('cfg-institution-name').value.trim(),
      institution_tagline: document.getElementById('cfg-institution-tagline').value.trim(),
      support_email: document.getElementById('cfg-support-email').value.trim(),
      support_phone: document.getElementById('cfg-support-phone').value.trim(),
      session_timeout_minutes: document.getElementById('cfg-session-timeout').value,
      maintenance_mode: isM ? 'true' : 'false',
      maintenance_message: document.getElementById('cfg-maintenance-msg').value.trim()
    };

    setLoading('stg-general-save-btn', true);
    const { res, data } = await api('/api/admin/settings/config', {
      method: 'PUT',
      body: JSON.stringify({ settings })
    });
    setLoading('stg-general-save-btn', false);

    if (res.ok && data.ok) {
      showAlert('stg-general-alert', '✓ General platform settings saved successfully', 'success');
      const banner = document.getElementById('stg-maintenance-banner');
      if (banner) banner.style.display = isM ? 'block' : 'none';
    } else {
      showAlert('stg-general-alert', data.error || 'Failed to save settings');
    }
  }

  function resetGeneralDefaults() {
    if (!confirm('Restore recommended standard configuration defaults (Session: 60 mins, Maintenance: OFF)?')) return;
    setVal('cfg-institution-name', 'Apex CBT & Digital Academy');
    setVal('cfg-institution-tagline', 'Empowering Next-Generation Digital Learning & Examination');
    setVal('cfg-support-email', 'support@apexcbt.edu');
    setVal('cfg-support-phone', '+1 (800) 555-0199');
    setVal('cfg-session-timeout', '60');
    setCheck('cfg-maintenance-mode', false);
    setVal('cfg-maintenance-msg', 'The examination portal is undergoing scheduled maintenance. Please check back shortly.');
    const banner = document.getElementById('stg-maintenance-banner');
    if (banner) banner.style.display = 'none';
    showAlert('stg-general-alert', 'Standard defaults populated. Click "Save Changes" to commit.', 'success');
  }

  // ── 3. CBT & EXAM SECURITY POLICIES ─────────────────────────────────────────

  function updateCbtSecurityRating() {
    let score = 0;
    if (getCheck('cfg-enforce-fullscreen')) score += 25;
    if (getCheck('cfg-disable-copy-paste')) score += 25;
    if (getCheck('cfg-auto-submit-timer')) score += 20;

    const tabLimit = parseInt(document.getElementById('cfg-tab-switch-limit').value || '3', 10);
    if (tabLimit <= 3 && tabLimit > 0) score += 15;

    if (getCheck('cfg-shuffle-questions')) score += 8;
    if (getCheck('cfg-shuffle-options')) score += 7;

    const badgeEl = document.getElementById('stg-cbt-security-badge');
    const textEl = document.getElementById('stg-cbt-security-text');
    if (!badgeEl || !textEl) return;

    if (score >= 80) {
      badgeEl.style.background = '#dcfce7';
      badgeEl.style.color = '#15803d';
      textEl.innerHTML = '<i class="fa-solid fa-shield-halved"></i> Maximum Proctoring (Strict Exam Hall Lockdown)';
    } else if (score >= 40) {
      badgeEl.style.background = '#eff6ff';
      badgeEl.style.color = '#1d4ed8';
      textEl.innerHTML = '<i class="fa-solid fa-shield"></i> Standard Proctoring (Active Monitored Session)';
    } else {
      badgeEl.style.background = '#fef3c7';
      badgeEl.style.color = '#b45309';
      textEl.innerHTML = '<i class="fa-solid fa-book-open"></i> Relaxed / Formative Practice Mode';
    }
  }

  function updatePassFeedback() {
    const val = parseInt(document.getElementById('cfg-pass-percentage').value || '50', 10);
    const fb = document.getElementById('stg-pass-feedback');
    if (!fb) return;

    if (val < 40) {
      fb.textContent = `Lenient passing mark (${val}%) — low threshold`;
      fb.style.color = '#b45309';
    } else if (val < 60) {
      fb.textContent = `Standard institutional passing grade (${val}%)`;
      fb.style.color = '#16a34a';
    } else if (val < 75) {
      fb.textContent = `Competitive passing standard (${val}%)`;
      fb.style.color = '#2563eb';
    } else {
      fb.textContent = `Honors / rigorous distinction benchmark (${val}%)`;
      fb.style.color = '#7c3aed';
    }
  }

  function applyStrictExamPreset() {
    setVal('cfg-pass-percentage', '50');
    setVal('cfg-tab-switch-limit', '2');
    setCheck('cfg-enforce-fullscreen', true);
    setCheck('cfg-disable-copy-paste', true);
    setCheck('cfg-auto-submit-timer', true);
    setCheck('cfg-show-instant-result', false);
    setCheck('cfg-shuffle-questions', true);
    setCheck('cfg-shuffle-options', true);
    updateCbtSecurityRating();
    updatePassFeedback();
    showAlert('stg-cbt-alert', 'Strict Exam Preset populated! Click "Save Policies" to apply.', 'success');
  }

  function applyPracticeExamPreset() {
    setVal('cfg-pass-percentage', '40');
    setVal('cfg-tab-switch-limit', '5');
    setCheck('cfg-enforce-fullscreen', false);
    setCheck('cfg-disable-copy-paste', false);
    setCheck('cfg-auto-submit-timer', false);
    setCheck('cfg-show-instant-result', true);
    setCheck('cfg-shuffle-questions', true);
    setCheck('cfg-shuffle-options', false);
    updateCbtSecurityRating();
    updatePassFeedback();
    showAlert('stg-cbt-alert', 'Practice Mode Preset populated! Click "Save Policies" to apply.', 'success');
  }

  async function loadCbtPolicies() {
    const { res, data } = await api('/api/admin/settings/config');
    if (!res.ok) return;
    const c = data.config || {};
    setVal('cfg-pass-percentage', c.cbt_pass_percentage || '50');
    setVal('cfg-tab-switch-limit', c.cbt_tab_switch_limit || '3');

    setCheck('cfg-enforce-fullscreen', c.cbt_enforce_fullscreen === 'true');
    setCheck('cfg-disable-copy-paste', c.cbt_disable_copy_paste === 'true');
    setCheck('cfg-auto-submit-timer', c.cbt_auto_submit_timer === 'true');
    setCheck('cfg-show-instant-result', c.cbt_show_instant_result === 'true');
    setCheck('cfg-shuffle-questions', c.cbt_shuffle_questions_default === 'true');
    setCheck('cfg-shuffle-options', c.cbt_shuffle_options_default === 'true');

    updateCbtSecurityRating();
    updatePassFeedback();
  }

  async function saveCbtPolicies() {
    const settings = {
      cbt_pass_percentage: document.getElementById('cfg-pass-percentage').value,
      cbt_tab_switch_limit: document.getElementById('cfg-tab-switch-limit').value,
      cbt_enforce_fullscreen: getCheck('cfg-enforce-fullscreen') ? 'true' : 'false',
      cbt_disable_copy_paste: getCheck('cfg-disable-copy-paste') ? 'true' : 'false',
      cbt_auto_submit_timer: getCheck('cfg-auto-submit-timer') ? 'true' : 'false',
      cbt_show_instant_result: getCheck('cfg-show-instant-result') ? 'true' : 'false',
      cbt_shuffle_questions_default: getCheck('cfg-shuffle-questions') ? 'true' : 'false',
      cbt_shuffle_options_default: getCheck('cfg-shuffle-options') ? 'true' : 'false'
    };

    setLoading('stg-cbt-save-btn', true);
    const { res, data } = await api('/api/admin/settings/config', {
      method: 'PUT',
      body: JSON.stringify({ settings })
    });
    setLoading('stg-cbt-save-btn', false);

    if (res.ok && data.ok) {
      showAlert('stg-cbt-alert', '✓ Examination & anti-cheating policies saved', 'success');
      updateCbtSecurityRating();
      updatePassFeedback();
    } else {
      showAlert('stg-cbt-alert', data.error || 'Failed to save policies');
    }
  }

  // ── 4. VIRTUAL CLASSROOM DEFAULTS ────────────────────────────────────────────

  function updateLiveCapacityFeedback() {
    const val = parseInt(document.getElementById('cfg-max-participants').value || '150', 10);
    const fb = document.getElementById('stg-capacity-feedback');
    if (!fb) return;

    if (val <= 50) {
      fb.textContent = `Interactive seminar / tutorial room (${val} max students)`;
      fb.style.color = '#15803d';
    } else if (val <= 150) {
      fb.textContent = `Medium lecture hall (${val} max students)`;
      fb.style.color = '#2563eb';
    } else {
      fb.textContent = `High-capacity plenary auditorium (${val} max students)`;
      fb.style.color = '#7c3aed';
    }
  }

  function applyLecturePreset() {
    setCheck('cfg-student-mic', false);
    setCheck('cfg-student-cam', false);
    setCheck('cfg-student-whiteboard', false);
    setCheck('cfg-student-chat', true);
    setVal('cfg-max-participants', '200');
    updateLiveCapacityFeedback();
    showAlert('stg-live-alert', 'Lecture Mode Preset applied! Click "Save Permissions" to commit.', 'success');
  }

  function applyWorkshopPreset() {
    setCheck('cfg-student-mic', true);
    setCheck('cfg-student-cam', true);
    setCheck('cfg-student-whiteboard', true);
    setCheck('cfg-student-chat', true);
    setVal('cfg-max-participants', '50');
    updateLiveCapacityFeedback();
    showAlert('stg-live-alert', 'Interactive Workshop Preset applied! Click "Save Permissions" to commit.', 'success');
  }

  async function loadLiveConfig() {
    const { res, data } = await api('/api/admin/settings/config');
    if (!res.ok) return;
    const c = data.config || {};
    setCheck('cfg-student-mic', c.live_default_student_mic === 'true');
    setCheck('cfg-student-cam', c.live_default_student_cam === 'true');
    setCheck('cfg-student-whiteboard', c.live_default_student_whiteboard === 'true');
    setCheck('cfg-student-chat', c.live_default_student_chat === 'true');
    setVal('cfg-max-participants', c.live_max_participants || '150');
    updateLiveCapacityFeedback();
  }

  async function saveLiveConfig() {
    const settings = {
      live_default_student_mic: getCheck('cfg-student-mic') ? 'true' : 'false',
      live_default_student_cam: getCheck('cfg-student-cam') ? 'true' : 'false',
      live_default_student_whiteboard: getCheck('cfg-student-whiteboard') ? 'true' : 'false',
      live_default_student_chat: getCheck('cfg-student-chat') ? 'true' : 'false',
      live_max_participants: document.getElementById('cfg-max-participants').value
    };

    setLoading('stg-live-save-btn', true);
    const { res, data } = await api('/api/admin/settings/config', {
      method: 'PUT',
      body: JSON.stringify({ settings })
    });
    setLoading('stg-live-save-btn', false);

    if (res.ok && data.ok) {
      showAlert('stg-live-alert', '✓ Virtual classroom default policies updated', 'success');
    } else {
      showAlert('stg-live-alert', data.error || 'Failed to save policies');
    }
  }

  // ── 5. STAFF & ADMINS MANAGEMENT ─────────────────────────────────────────────

  async function loadUsers() {
    if (!state.isSuperAdmin) return;
    const tbody = document.getElementById('stg-users-tbody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="6" class="stg-loading"><i class="fa-solid fa-spinner"></i> Loading…</td></tr>';

    const { res, data } = await api('/api/admin/settings/admins');
    if (!res.ok) { tbody.innerHTML = '<tr><td colspan="6">Failed to load</td></tr>'; return; }

    state.admins = data.admins || [];
    renderUsersTable();
  }

  function renderUsersTable() {
    const tbody = document.getElementById('stg-users-tbody');
    if (!tbody) return;

    const filter = ((document.getElementById('stg-users-filter') || {}).value || '').toLowerCase().trim();
    const roleFilter = state.selectedRoleFilter || '';

    const list = state.admins.filter(a => {
      // Role filter check
      if (roleFilter && a.role !== roleFilter) return false;

      // Text search check
      if (filter) {
        const u = (a.username || '').toLowerCase();
        const f = (a.full_name || '').toLowerCase();
        const e = (a.email || '').toLowerCase();
        const c = (a.admin_code || '').toLowerCase();
        if (!u.includes(filter) && !f.includes(filter) && !e.includes(filter) && !c.includes(filter)) {
          return false;
        }
      }
      return true;
    });

    // Update staff count summary badge
    const badgeEl = document.getElementById('stg-staff-count-badge');
    if (badgeEl) {
      const supers = state.admins.filter(a => a.role === 'super_admin').length;
      const tutors = state.admins.filter(a => a.role === 'tutor').length;
      const ords = state.admins.filter(a => a.role === 'ordinary_admin').length;
      badgeEl.textContent = `(${state.admins.length} Total: ${supers} Super, ${tutors} Tutors, ${ords} Ordinary)`;
    }

    if (!list.length) {
      tbody.innerHTML = '<tr><td colspan="6" class="stg-empty"><i class="fa-solid fa-users"></i>No personnel match the filter</td></tr>';
      return;
    }

    tbody.innerHTML = list.map(a => `
      <tr>
        <td><strong>${esc(a.username)}</strong><br><small style="color:#94a3b8">${esc(a.full_name || '')}</small></td>
        <td>${esc(a.email || '—')}</td>
        <td>${roleBadge(a.role)}</td>
        <td>${statusBadge(a.status)}</td>
        <td>${esc(a.admin_code || '—')}</td>
        <td>
          <div class="actions">
            <button class="stg-btn stg-btn-secondary stg-btn-sm" onclick="stgEditUser(${a.id})">
              <i class="fa-solid fa-pencil"></i> Edit
            </button>
            <button class="stg-btn stg-btn-warning stg-btn-sm" onclick="stgResetUserPwd(${a.id}, '${esc(a.username)}')">
              <i class="fa-solid fa-key"></i> Reset Pwd
            </button>
            ${a.status === 'active'
              ? `<button class="stg-btn stg-btn-danger stg-btn-sm" onclick="stgSetUserStatus(${a.id},'suspended')"><i class="fa-solid fa-ban"></i> Suspend</button>`
              : `<button class="stg-btn stg-btn-success stg-btn-sm" onclick="stgSetUserStatus(${a.id},'active')"><i class="fa-solid fa-check"></i> Activate</button>`
            }
          </div>
        </td>
      </tr>`).join('');
  }

  window.stgEditUser = function (id) {
    const admin = state.admins.find(a => a.id === id);
    if (!admin) return;

    setVal('stg-edit-user-id', id);
    setVal('stg-edit-user-username', admin.username);
    setVal('stg-edit-user-fullname', admin.full_name || '');
    setVal('stg-edit-user-email', admin.email || '');
    setVal('stg-edit-user-role', admin.role);
    setVal('stg-edit-user-status', admin.status);
    document.getElementById('stg-edit-user-alert').style.display = 'none';
    openModal('stg-modal-edit-user');
  };

  window.stgResetUserPwd = function (id, username) {
    setVal('stg-reset-pwd-id', id);
    setText('stg-reset-pwd-username', username);
    setVal('stg-reset-pwd-new', '');
    document.getElementById('stg-reset-pwd-alert').style.display = 'none';
    openModal('stg-modal-reset-pwd');
  };

  window.stgSetUserStatus = async function (id, status) {
    const label = status === 'active' ? 'activate' : 'suspend';
    if (!confirm(`${label.charAt(0).toUpperCase() + label.slice(1)} this admin?`)) return;
    const { res, data } = await api(`/api/admin/settings/admins/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
    if (res.ok && data.ok) {
      const a = state.admins.find(x => x.id === id);
      if (a) a.status = status;
      renderUsersTable();
    } else {
      alert(data.error || 'Failed to update status');
    }
  };

  async function saveEditUser() {
    const id = document.getElementById('stg-edit-user-id').value;
    const full_name = document.getElementById('stg-edit-user-fullname').value.trim();
    const email = document.getElementById('stg-edit-user-email').value.trim();
    const role = document.getElementById('stg-edit-user-role').value;
    const status = document.getElementById('stg-edit-user-status').value;

    setLoading('stg-edit-user-save', true);
    const { res, data } = await api(`/api/admin/settings/admins/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ full_name, email, role, status }),
    });
    setLoading('stg-edit-user-save', false);

    if (res.ok && data.ok) {
      closeModal('stg-modal-edit-user');
      await loadUsers();
    } else {
      showAlert('stg-edit-user-alert', data.error || 'Update failed');
    }
  }

  async function saveResetPwd() {
    const id = document.getElementById('stg-reset-pwd-id').value;
    const newPassword = document.getElementById('stg-reset-pwd-new').value;

    if (!newPassword || newPassword.length < 8) {
      showAlert('stg-reset-pwd-alert', 'Password must be at least 8 characters');
      return;
    }

    setLoading('stg-reset-pwd-save', true);
    const { res, data } = await api(`/api/admin/settings/admins/${id}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ newPassword }),
    });
    setLoading('stg-reset-pwd-save', false);

    if (res.ok && data.ok) {
      showAlert('stg-reset-pwd-alert', '✓ Password reset successfully', 'success');
      setTimeout(() => closeModal('stg-modal-reset-pwd'), 1800);
    } else {
      showAlert('stg-reset-pwd-alert', data.error || 'Reset failed');
    }
  }

  async function saveAddUser() {
    const username = document.getElementById('stg-add-user-username').value.trim();
    const full_name = document.getElementById('stg-add-user-fullname').value.trim();
    const email = document.getElementById('stg-add-user-email').value.trim();
    const password = document.getElementById('stg-add-user-password').value;
    const role = document.getElementById('stg-add-user-role').value;

    if (!username || username.length < 3) {
      showAlert('stg-add-user-alert', 'Username must be at least 3 characters');
      return;
    }
    if (!password || password.length < 8) {
      showAlert('stg-add-user-alert', 'Password must be at least 8 characters');
      return;
    }

    setLoading('stg-add-user-save', true);
    const { res, data } = await api('/api/admin/admins', {
      method: 'POST',
      body: JSON.stringify({
        username,
        password,
        full_name,
        email,
        role,
        status: 'active'
      })
    });
    setLoading('stg-add-user-save', false);

    if (res.ok && data.ok) {
      closeModal('stg-modal-add-user');
      ['stg-add-user-username', 'stg-add-user-fullname', 'stg-add-user-email', 'stg-add-user-password'].forEach(id => setVal(id, ''));
      await loadUsers();
      alert(`✓ Account "${username}" created successfully (${data.admin_code || 'Active'}).`);
    } else {
      showAlert('stg-add-user-alert', data.error || 'Failed to create account');
    }
  }

  // ── 6. ACADEMIC TERMS ────────────────────────────────────────────────────────

  function updateTermDurationCalc() {
    const s = document.getElementById('stg-term-add-start').value;
    const e = document.getElementById('stg-term-add-end').value;
    const calcEl = document.getElementById('stg-term-duration-calc');
    if (!calcEl) return;

    if (s && e) {
      const d1 = new Date(s);
      const d2 = new Date(e);
      const diffMs = d2 - d1;
      const days = Math.round(diffMs / (1000 * 60 * 60 * 24));

      calcEl.style.display = 'block';
      if (days <= 0) {
        calcEl.innerHTML = `<span style="color:#ef4444;"><i class="fa-solid fa-circle-exclamation"></i> End date must be after start date.</span>`;
      } else {
        const weeks = (days / 7).toFixed(1);
        calcEl.innerHTML = `<i class="fa-solid fa-clock"></i> Calculated Term Duration: <strong>${weeks} weeks</strong> (${days} calendar days)`;
        calcEl.style.color = '#2563eb';
      }
    } else {
      calcEl.style.display = 'none';
    }
  }

  async function loadTerms() {
    const tbody = document.getElementById('stg-terms-tbody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="6" class="stg-loading"><i class="fa-solid fa-spinner"></i> Loading…</td></tr>';

    const { res, data } = await api('/api/admin/settings/terms');
    if (!res.ok) { tbody.innerHTML = '<tr><td colspan="6">Failed to load</td></tr>'; return; }

    state.terms = data.terms || [];
    renderTermsTable();
  }

  function renderTermsTable() {
    const tbody = document.getElementById('stg-terms-tbody');
    if (!tbody) return;

    const filter = ((document.getElementById('stg-terms-filter') || {}).value || '').toLowerCase().trim();
    const list = state.terms.filter(t =>
      !filter ||
      (t.academic_year || '').toLowerCase().includes(filter) ||
      (t.term_name || '').toLowerCase().includes(filter)
    );

    if (!list.length) {
      tbody.innerHTML = '<tr><td colspan="6" class="stg-empty">No academic terms found. Add one above.</td></tr>';
      return;
    }

    tbody.innerHTML = list.map(t => `
      <tr style="${t.is_current ? 'background:#f0fdf4;' : ''}">
        <td><strong>${esc(t.academic_year)}</strong> ${t.is_current ? '<span class="stg-current-star" title="Current term" style="color:#16a34a;margin-left:4px;">★ Active</span>' : ''}</td>
        <td>${esc(t.term_name)}</td>
        <td>${formatDate(t.start_date)}</td>
        <td>${formatDate(t.end_date)}</td>
        <td>${t.is_current ? badge('Current', 'green') : badge('Inactive', 'gray')}</td>
        <td>
          <div class="actions">
            ${!t.is_current && state.isSuperAdmin ? `<button class="stg-btn stg-btn-success stg-btn-sm" onclick="stgSetCurrentTerm(${t.id})"><i class="fa-solid fa-star"></i> Set Current</button>` : ''}
            ${state.isSuperAdmin ? `<button class="stg-btn stg-btn-secondary stg-btn-sm" onclick="stgEditTerm(${t.id})"><i class="fa-solid fa-pencil"></i> Edit</button>` : ''}
            ${state.isSuperAdmin && !t.is_current ? `<button class="stg-btn stg-btn-danger stg-btn-sm" onclick="stgDeleteTerm(${t.id})"><i class="fa-solid fa-trash"></i></button>` : ''}
          </div>
        </td>
      </tr>`).join('');
  }

  window.stgSetCurrentTerm = async function (id) {
    if (!confirm('Set this as the current academic term? This will deactivate the existing current term.')) return;
    const { res, data } = await api(`/api/admin/settings/terms/${id}/current`, { method: 'PUT' });
    if (res.ok && data.ok) loadTerms();
    else alert(data.error || 'Failed to set current term');
  };

  window.stgEditTerm = function (id) {
    const term = state.terms.find(t => t.id === id);
    if (!term) return;
    setVal('stg-term-edit-id', id);
    setVal('stg-term-edit-year', term.academic_year);
    setVal('stg-term-edit-name', term.term_name);
    setVal('stg-term-edit-start', (term.start_date || '').slice(0,10));
    setVal('stg-term-edit-end', (term.end_date || '').slice(0,10));
    document.getElementById('stg-term-edit-alert').style.display = 'none';
    openModal('stg-modal-edit-term');
  };

  window.stgDeleteTerm = async function (id) {
    if (!confirm('Delete this term? This cannot be undone.')) return;
    const { res, data } = await api(`/api/admin/settings/terms/${id}`, { method: 'DELETE' });
    if (res.ok && data.ok) loadTerms();
    else alert(data.error || 'Cannot delete this term');
  };

  async function saveTerm(isEdit = false) {
    const alertId = isEdit ? 'stg-term-edit-alert' : 'stg-term-add-alert';
    const saveBtn = isEdit ? 'stg-term-edit-save' : 'stg-term-add-save';
    const id = isEdit ? document.getElementById('stg-term-edit-id').value : null;

    const body = {
      academic_year: document.getElementById(isEdit ? 'stg-term-edit-year' : 'stg-term-add-year').value.trim(),
      term_name: document.getElementById(isEdit ? 'stg-term-edit-name' : 'stg-term-add-name').value.trim(),
      start_date: document.getElementById(isEdit ? 'stg-term-edit-start' : 'stg-term-add-start').value,
      end_date: document.getElementById(isEdit ? 'stg-term-edit-end' : 'stg-term-add-end').value,
    };

    if (!body.academic_year || !body.term_name || !body.start_date || !body.end_date) {
      showAlert(alertId, 'All fields are required');
      return;
    }

    if (new Date(body.end_date) <= new Date(body.start_date)) {
      showAlert(alertId, 'End date must be after start date');
      return;
    }

    setLoading(saveBtn, true);
    const { res, data } = await api(
      isEdit ? `/api/admin/settings/terms/${id}` : '/api/admin/settings/terms',
      { method: isEdit ? 'PUT' : 'POST', body: JSON.stringify(body) }
    );
    setLoading(saveBtn, false);

    if (res.ok && data.ok) {
      if (isEdit) closeModal('stg-modal-edit-term');
      else {
        ['stg-term-add-year','stg-term-add-name','stg-term-add-start','stg-term-add-end'].forEach(i => setVal(i,''));
        const calcEl = document.getElementById('stg-term-duration-calc');
        if (calcEl) calcEl.style.display = 'none';
        showAlert(alertId, '✓ Term added successfully', 'success');
      }
      loadTerms();
    } else {
      showAlert(alertId, data.error || 'Failed to save term');
    }
  }

  // ── 7. CLASS LEVELS ──────────────────────────────────────────────────────────

  async function loadClasses() {
    const tbody = document.getElementById('stg-classes-tbody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="3" class="stg-loading"><i class="fa-solid fa-spinner"></i> Loading…</td></tr>';

    const { res, data } = await api('/api/admin/settings/classes');
    if (!res.ok) { tbody.innerHTML = '<tr><td colspan="3">Failed to load</td></tr>'; return; }

    state.classes = data.classes || [];
    renderClassesTable();
  }

  function renderClassesTable() {
    const tbody = document.getElementById('stg-classes-tbody');
    if (!tbody) return;

    const filter = ((document.getElementById('stg-classes-filter') || {}).value || '').toLowerCase().trim();
    const list = state.classes.filter(c =>
      !filter ||
      (c.name || '').toLowerCase().includes(filter) ||
      (c.code || '').toLowerCase().includes(filter)
    );

    const countEl = document.getElementById('stg-classes-count-badge');
    if (countEl) countEl.textContent = `(${state.classes.length} Total)`;

    if (!list.length) {
      tbody.innerHTML = '<tr><td colspan="3" class="stg-empty">No classes match filter</td></tr>';
      return;
    }
    tbody.innerHTML = list.map(c => `
      <tr>
        <td><strong>${esc(c.name)}</strong></td>
        <td><code>${esc(c.code || '—')}</code></td>
        <td>
          <div class="actions">
            ${state.isSuperAdmin ? `<button class="stg-btn stg-btn-secondary stg-btn-sm" onclick="stgEditClass(${c.id})"><i class="fa-solid fa-pencil"></i> Edit</button>` : ''}
            ${state.isSuperAdmin ? `<button class="stg-btn stg-btn-danger stg-btn-sm" onclick="stgDeleteClass(${c.id})"><i class="fa-solid fa-trash"></i></button>` : ''}
          </div>
        </td>
      </tr>`).join('');
  }

  window.stgEditClass = function (id) {
    const cls = state.classes.find(c => c.id === id);
    if (!cls) return;
    setVal('stg-class-edit-id', id);
    setVal('stg-class-edit-name', cls.name);
    setVal('stg-class-edit-code', cls.code || '');
    document.getElementById('stg-class-edit-alert').style.display = 'none';
    openModal('stg-modal-edit-class');
  };

  window.stgDeleteClass = async function (id) {
    if (!confirm('Delete this class? It cannot be deleted if classrooms reference it.')) return;
    const { res, data } = await api(`/api/admin/settings/classes/${id}`, { method: 'DELETE' });
    if (res.ok && data.ok) loadClasses();
    else alert(data.error || 'Cannot delete this class');
  };

  async function saveClass(isEdit = false) {
    const alertId = isEdit ? 'stg-class-edit-alert' : 'stg-class-add-alert';
    const saveBtn = isEdit ? 'stg-class-edit-save' : 'stg-class-add-save';
    const id = isEdit ? document.getElementById('stg-class-edit-id').value : null;

    const body = {
      name: document.getElementById(isEdit ? 'stg-class-edit-name' : 'stg-class-add-name').value.trim(),
      code: document.getElementById(isEdit ? 'stg-class-edit-code' : 'stg-class-add-code').value.trim(),
    };
    if (!body.name) { showAlert(alertId, 'Class name is required'); return; }

    setLoading(saveBtn, true);
    const { res, data } = await api(
      isEdit ? `/api/admin/settings/classes/${id}` : '/api/admin/settings/classes',
      { method: isEdit ? 'PUT' : 'POST', body: JSON.stringify(body) }
    );
    setLoading(saveBtn, false);

    if (res.ok && data.ok) {
      if (isEdit) closeModal('stg-modal-edit-class');
      else {
        setVal('stg-class-add-name','');
        setVal('stg-class-add-code','');
        showAlert(alertId,'✓ Class added successfully','success');
      }
      loadClasses();
    } else {
      showAlert(alertId, data.error || 'Failed to save class');
    }
  }

  // ── 8. SUBJECTS ──────────────────────────────────────────────────────────────

  async function loadSubjects() {
    const tbody = document.getElementById('stg-subjects-tbody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="3" class="stg-loading"><i class="fa-solid fa-spinner"></i> Loading…</td></tr>';

    const { res, data } = await api('/api/admin/settings/subjects');
    if (!res.ok) { tbody.innerHTML = '<tr><td colspan="3">Failed to load</td></tr>'; return; }

    state.subjects = data.subjects || [];
    renderSubjectsTable();
  }

  function renderSubjectsTable() {
    const tbody = document.getElementById('stg-subjects-tbody');
    if (!tbody) return;

    const filter = ((document.getElementById('stg-subjects-filter') || {}).value || '').toLowerCase().trim();
    const list = state.subjects.filter(s =>
      !filter ||
      (s.name || '').toLowerCase().includes(filter) ||
      (s.code || '').toLowerCase().includes(filter)
    );

    const countEl = document.getElementById('stg-subjects-count-badge');
    if (countEl) countEl.textContent = `(${state.subjects.length} Total)`;

    if (!list.length) {
      tbody.innerHTML = '<tr><td colspan="3" class="stg-empty">No subjects match filter</td></tr>';
      return;
    }
    tbody.innerHTML = list.map(s => `
      <tr>
        <td><strong>${esc(s.name)}</strong></td>
        <td><code>${esc(s.code || '—')}</code></td>
        <td>
          <div class="actions">
            ${state.isSuperAdmin ? `<button class="stg-btn stg-btn-secondary stg-btn-sm" onclick="stgEditSubject(${s.id})"><i class="fa-solid fa-pencil"></i> Edit</button>` : ''}
            ${state.isSuperAdmin ? `<button class="stg-btn stg-btn-danger stg-btn-sm" onclick="stgDeleteSubject(${s.id})"><i class="fa-solid fa-trash"></i></button>` : ''}
          </div>
        </td>
      </tr>`).join('');
  }

  window.stgEditSubject = function (id) {
    const subj = state.subjects.find(s => s.id === id);
    if (!subj) return;
    setVal('stg-subj-edit-id', id);
    setVal('stg-subj-edit-name', subj.name);
    setVal('stg-subj-edit-code', subj.code || '');
    document.getElementById('stg-subj-edit-alert').style.display = 'none';
    openModal('stg-modal-edit-subject');
  };

  window.stgDeleteSubject = async function (id) {
    if (!confirm('Delete this subject? It cannot be deleted if referenced by classrooms or exams.')) return;
    const { res, data } = await api(`/api/admin/settings/subjects/${id}`, { method: 'DELETE' });
    if (res.ok && data.ok) loadSubjects();
    else alert(data.error || 'Cannot delete this subject');
  };

  async function saveSubject(isEdit = false) {
    const alertId = isEdit ? 'stg-subj-edit-alert' : 'stg-subj-add-alert';
    const saveBtn = isEdit ? 'stg-subj-edit-save' : 'stg-subj-add-save';
    const id = isEdit ? document.getElementById('stg-subj-edit-id').value : null;

    const body = {
      name: document.getElementById(isEdit ? 'stg-subj-edit-name' : 'stg-subj-add-name').value.trim(),
      code: document.getElementById(isEdit ? 'stg-subj-edit-code' : 'stg-subj-add-code').value.trim(),
    };
    if (!body.name) { showAlert(alertId, 'Subject title is required'); return; }

    setLoading(saveBtn, true);
    const { res, data } = await api(
      isEdit ? `/api/admin/settings/subjects/${id}` : '/api/admin/settings/subjects',
      { method: isEdit ? 'PUT' : 'POST', body: JSON.stringify(body) }
    );
    setLoading(saveBtn, false);

    if (res.ok && data.ok) {
      if (isEdit) closeModal('stg-modal-edit-subject');
      else {
        setVal('stg-subj-add-name','');
        setVal('stg-subj-add-code','');
        showAlert(alertId,'✓ Subject added successfully','success');
      }
      loadSubjects();
    } else {
      showAlert(alertId, data.error || 'Failed to save subject');
    }
  }

  // ── 9. SYSTEM STATS & DB STORAGE ─────────────────────────────────────────────

  function stopAutoRefresh() {
    if (state.autoRefreshTimer) {
      clearInterval(state.autoRefreshTimer);
      state.autoRefreshTimer = null;
    }
    const statusEl = document.getElementById('stg-stats-auto-status');
    if (statusEl) statusEl.textContent = 'OFF';
  }

  function toggleAutoRefresh() {
    if (state.autoRefreshTimer) {
      stopAutoRefresh();
    } else {
      state.autoRefreshSecs = 30;
      const statusEl = document.getElementById('stg-stats-auto-status');
      if (statusEl) statusEl.textContent = `ON (${state.autoRefreshSecs}s)`;

      state.autoRefreshTimer = setInterval(() => {
        state.autoRefreshSecs--;
        if (state.autoRefreshSecs <= 0) {
          state.autoRefreshSecs = 30;
          loadStats();
        }
        if (statusEl) statusEl.textContent = `ON (${state.autoRefreshSecs}s)`;
      }, 1000);
    }
  }

  async function loadStats() {
    const el = document.getElementById('stg-stats-area');
    if (!el) return;
    el.innerHTML = '<div class="stg-loading"><i class="fa-solid fa-spinner"></i> Loading live statistics…</div>';

    const { res, data } = await api('/api/admin/settings/stats');
    if (!res.ok) { el.innerHTML = '<div class="stg-empty"><i class="fa-solid fa-circle-exclamation"></i>Could not load stats</div>'; return; }

    const s = data.stats;
    state.cachedStats = s;

    const statCards = [
      { icon: '👨‍🎓', value: s.students,          label: 'Total Students' },
      { icon: '👨‍💼', value: s.activeAdmins,       label: 'Active Staff' },
      { icon: '📝', value: s.exams,              label: 'Total Exams' },
      { icon: '🏫', value: s.activeClassrooms,   label: 'Active Classrooms' },
      { icon: '📡', value: s.activeLiveSessions, label: 'Live Sessions' },
      { icon: '✅', value: s.totalAttempts,      label: 'Exam Attempts' },
    ];

    let html = '<div class="stg-stats-grid">';
    statCards.forEach(c => {
      html += `<div class="stg-stat-card">
        <div class="stg-stat-icon">${c.icon}</div>
        <div class="stg-stat-value">${c.value ?? '—'}</div>
        <div class="stg-stat-label">${c.label}</div>
      </div>`;
    });
    html += '</div>';

    // Database size breakdown table
    html += `<div class="stg-card" style="margin-top:0;">
      <div class="stg-card-header" style="justify-content:space-between;flex-wrap:wrap;gap:10px;">
        <div class="stg-card-title"><i class="fa-solid fa-database"></i> Database Infrastructure Storage</div>
        <div style="font-size:0.83rem;color:#475569;">
          <strong>MySQL:</strong> ${esc(s.mysqlVersion || '—')} &nbsp;|&nbsp;
          <strong>Total Schema:</strong> ${s.dbSizeMb ? s.dbSizeMb + ' MB' : '—'}
        </div>
      </div>
      <div class="stg-card-body" style="padding:0;">`;

    if (s.tableSizes && s.tableSizes.length > 0) {
      const maxSz = Math.max(...s.tableSizes.map(t => parseFloat(t.size_mb) || 0), 0.01);
      html += '<div class="stg-table-wrap" style="border:none;border-radius:0;"><table class="stg-table stg-db-table"><thead><tr><th>Table Name</th><th>Size (MB)</th><th style="min-width:140px;">Proportional Usage</th></tr></thead><tbody>';
      s.tableSizes.forEach(t => {
        const sz = parseFloat(t.size_mb) || 0;
        const pct = Math.max(3, Math.round((sz / maxSz) * 100));
        html += `<tr>
          <td><code>${esc(t.TABLE_NAME)}</code></td>
          <td><strong>${sz.toFixed(2)}</strong> MB</td>
          <td><div class="stg-db-bar"><div class="stg-db-bar-fill" style="width:${pct}%"></div></div></td>
        </tr>`;
      });
      html += '</tbody></table></div>';
    }

    html += '</div></div>';
    el.innerHTML = html;
  }

  // ── 10. SYSTEM DIAGNOSTICS & INTEGRITY ───────────────────────────────────────

  async function testEmailServer() {
    setLoading('stg-test-email-btn', true);
    const { res, data } = await api('/api/admin/settings/test-email', { method: 'POST' });
    setLoading('stg-test-email-btn', false);

    if (res.ok && data.connectionOk) {
      alert(`✓ Email transport (${data.transport}) is verified and operational!`);
    } else if (!data.emailConfigured) {
      alert(`ℹ Email is not configured. Set EMAIL_GMAIL_USER and EMAIL_GMAIL_APP_PASS in .env to enable reset links and notifications.`);
    } else {
      alert(`⚠ Email connection failed: ${data.error || 'Connection timed out'}`);
    }
  }

  async function cleanOrphanRecords() {
    if (!confirm('Clean all orphaned exam attempts and responses with no corresponding students?')) return;
    setLoading('stg-clean-orphans-btn', true);
    const { res, data } = await api('/api/admin/settings/clean-orphans', { method: 'POST' });
    setLoading('stg-clean-orphans-btn', false);

    if (res.ok && data.ok) {
      alert(`✓ ${data.message}`);
      runDiagnostics();
    } else {
      alert(data.error || 'Failed to clean orphans');
    }
  }

  async function runDiagnostics() {
    const resultBox = document.getElementById('stg-diag-result');
    if (!resultBox) return;
    setLoading('stg-run-diag-btn', true);
    resultBox.innerHTML = '<div class="stg-loading"><i class="fa-solid fa-spinner"></i> Running comprehensive integrity scan...</div>';

    const { res, data } = await api('/api/admin/settings/diagnostics');
    setLoading('stg-run-diag-btn', false);

    if (!res.ok || !data.ok) {
      resultBox.innerHTML = '<div class="stg-alert error">Failed to run diagnostic scan</div>';
      return;
    }

    const d = data.diagnostics;
    const latencyColor = d.dbLatencyMs < 30 ? '#10b981' : (d.dbLatencyMs < 100 ? '#f59e0b' : '#ef4444');
    const integrityOk = d.orphanAttempts === 0 && d.orphanResponses === 0;

    const emailOk     = d.emailStatus === 'ok';
    const emailMissing = d.emailStatus === 'not_configured' || !d.emailStatus;
    const emailIcon   = emailOk ? '📧' : (emailMissing ? '📭' : '⚠️');
    const emailColor  = emailOk ? '#10b981' : (emailMissing ? '#94a3b8' : '#ef4444');
    const emailLabel  = emailOk
      ? `Ready (${d.emailTransportType || 'smtp'})`
      : (emailMissing ? 'Not Configured' : 'Error');

    resultBox.innerHTML = `
      <div class="stg-stats-grid">
        <div class="stg-stat-card">
          <div class="stg-stat-icon">⚡</div>
          <div class="stg-stat-value" style="color:${latencyColor};">${d.dbLatencyMs} ms</div>
          <div class="stg-stat-label">DB Ping Latency (${d.dbStatus})</div>
        </div>
        <div class="stg-stat-card">
          <div class="stg-stat-icon">${integrityOk ? '🛡️' : '⚠️'}</div>
          <div class="stg-stat-value" style="color:${integrityOk ? '#10b981' : '#ef4444'};">${integrityOk ? 'Healthy' : 'Warning'}</div>
          <div class="stg-stat-label">Relational Integrity (${d.orphanAttempts + d.orphanResponses} orphans)</div>
          ${!integrityOk ? `<button type="button" class="stg-btn stg-btn-danger stg-btn-sm" id="stg-clean-orphans-btn" style="margin-top:8px;"><i class="fa-solid fa-broom"></i> Clean Orphans</button>` : ''}
        </div>
        <div class="stg-stat-card">
          <div class="stg-stat-icon">📋</div>
          <div class="stg-stat-value">${d.unapprovedExams}</div>
          <div class="stg-stat-label">Pending Approval Exams</div>
        </div>
        <div class="stg-stat-card">
          <div class="stg-stat-icon">👥</div>
          <div class="stg-stat-value">${d.pendingAdmins}</div>
          <div class="stg-stat-label">Admins Pending Activation</div>
        </div>
        <div class="stg-stat-card">
          <div class="stg-stat-icon">${emailIcon}</div>
          <div class="stg-stat-value" style="color:${emailColor};">${emailLabel}</div>
          <div class="stg-stat-label">Email Transport Status</div>
        </div>
      </div>

      <div class="stg-card">
        <div class="stg-card-header">
          <div class="stg-card-title"><i class="fa-solid fa-list-check"></i> Diagnostic Component Verification</div>
          <span style="font-size:0.75rem;color:#64748b;">Checked: ${new Date(d.checkedAt).toLocaleTimeString()}</span>
        </div>
        <div class="stg-card-body" style="padding:0;">
          <div class="stg-table-wrap" style="border:none;">
            <table class="stg-table">
              <thead>
                <tr>
                  <th>Component / Metric</th>
                  <th>Observed Value</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Database Response Time</td>
                  <td>${d.dbLatencyMs} ms</td>
                  <td>${badge(d.dbStatus, d.dbLatencyMs < 50 ? 'green' : 'yellow')}</td>
                </tr>
                <tr>
                  <td>Email Transport Delivery</td>
                  <td>${emailOk ? (d.emailTransportType || 'smtp') : (emailMissing ? 'not configured in .env' : 'connection failure')}</td>
                  <td>${badge(emailOk ? 'Ready' : (emailMissing ? 'Not Set' : 'Error'), emailOk ? 'green' : (emailMissing ? 'yellow' : 'red'))}</td>
                </tr>
                <tr>
                  <td>Orphaned Student Test Attempts</td>
                  <td>${d.orphanAttempts} record(s)</td>
                  <td>${badge(d.orphanAttempts === 0 ? 'Passed' : 'Needs Clean', d.orphanAttempts === 0 ? 'green' : 'red')}</td>
                </tr>
                <tr>
                  <td>Orphaned Question Responses</td>
                  <td>${d.orphanResponses} record(s)</td>
                  <td>${badge(d.orphanResponses === 0 ? 'Passed' : 'Needs Clean', d.orphanResponses === 0 ? 'green' : 'red')}</td>
                </tr>
                <tr>
                  <td>Active Live Virtual Classrooms</td>
                  <td>${d.activeSessions} active room(s)</td>
                  <td>${badge('Normal', 'blue')}</td>
                </tr>
                <tr>
                  <td>Question Bank Inventory</td>
                  <td>${d.totalQuestions} questions provisioned</td>
                  <td>${badge('Operational', 'green')}</td>
                </tr>
                <tr>
                  <td>Enrolled Student Directory</td>
                  <td>${d.totalStudents} registrations</td>
                  <td>${badge('Synced', 'green')}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    // Wire dynamic clean orphans button if rendered
    const cleanBtn = document.getElementById('stg-clean-orphans-btn');
    if (cleanBtn) cleanBtn.addEventListener('click', cleanOrphanRecords);
  }

  // ── 11. DATA MANAGEMENT, BACKUP & TOOLS ──────────────────────────────────────

  const NOTICE_PRESETS = {
    maintenance: {
      title: 'Scheduled System Maintenance Notice',
      msg: 'The examination portal will undergo scheduled maintenance tonight between 11:00 PM and 1:00 AM. Please ensure all ongoing tasks are completed before this period.'
    },
    exam: {
      title: 'Upcoming CBT Examination Verification',
      msg: 'All candidates are requested to verify their classroom enrollments and test compatibility before the upcoming examination date. Contact ICT support if you encounter any issues.'
    },
    break: {
      title: 'Academic Mid-Term Break Notice',
      msg: 'All academic activities and online live sessions are paused for the mid-term break. Regular examination and lecture schedules resume next Monday.'
    }
  };

  function updateNoticePreview() {
    const title = (document.getElementById('stg-notice-title') || {}).value || '';
    const msg = (document.getElementById('stg-notice-msg') || {}).value || '';
    const previewEl = document.getElementById('stg-notice-preview');
    const pTitle = document.getElementById('stg-notice-preview-title');
    const pMsg = document.getElementById('stg-notice-preview-msg');

    if (!previewEl || !pTitle || !pMsg) return;

    if (title.trim() || msg.trim()) {
      previewEl.style.display = 'block';
      pTitle.textContent = title.trim() || 'Notice Title';
      pMsg.textContent = msg.trim() || 'Notice message body will appear here...';
    } else {
      previewEl.style.display = 'none';
    }
  }

  async function sendBroadcastNotice() {
    const title = document.getElementById('stg-notice-title').value.trim();
    const message = document.getElementById('stg-notice-msg').value.trim();

    if (!title || !message) {
      showAlert('stg-broadcast-alert', 'Please provide both title and notice text');
      return;
    }

    setLoading('stg-send-notice-btn', true);
    const { res, data } = await api('/api/admin/settings/broadcast-notice', {
      method: 'POST',
      body: JSON.stringify({ title, message, type: 'announcement' })
    });
    setLoading('stg-send-notice-btn', false);

    if (res.ok && data.ok) {
      showAlert('stg-broadcast-alert', `✓ ${data.message}`, 'success');
      setVal('stg-notice-title', '');
      setVal('stg-notice-msg', '');
      const sel = document.getElementById('stg-notice-template');
      if (sel) sel.value = '';
      updateNoticePreview();
    } else {
      showAlert('stg-broadcast-alert', data.error || 'Failed to dispatch notice');
    }
  }

  async function executePurgeAttempts() {
    setLoading('stg-modal-purge-btn', true);
    const { res, data } = await api('/api/admin/settings/purge-attempts', { method: 'POST' });
    setLoading('stg-modal-purge-btn', false);

    if (res.ok && data.ok) {
      closeModal('stg-modal-purge-confirm');
      showAlert('stg-purge-alert', `✓ ${data.message}`, 'success');
      if (state.cachedStats) loadStats();
    } else {
      alert(data.error || 'Purge failed');
    }
  }

  // ── 12. AUDIT TRAIL & LOGS ───────────────────────────────────────────────────

  async function loadActivity() {
    if (!state.isSuperAdmin) return;
    const container = document.getElementById('stg-activity-list');
    if (!container) return;
    container.innerHTML = '<div class="stg-loading"><i class="fa-solid fa-spinner"></i> Loading activity log…</div>';

    const { res, data } = await api('/api/admin/settings/activity');
    if (!res.ok) { container.innerHTML = '<div class="stg-empty"><i class="fa-solid fa-circle-exclamation"></i>Could not load activity log</div>'; return; }

    state.cachedLogs = data.logs || [];
    renderActivityList();
  }

  function renderActivityList() {
    const container = document.getElementById('stg-activity-list');
    if (!container) return;

    const textFilter = ((document.getElementById('stg-activity-filter') || {}).value || '').toLowerCase().trim();
    const actionFilter = (document.getElementById('stg-activity-action-filter') || {}).value || '';

    const filtered = state.cachedLogs.filter(l => {
      const act = (l.action || '').toUpperCase();
      const user = (l.username || l.admin_username || 'system').toLowerCase();
      const detail = (l.details || '').toLowerCase();

      if (actionFilter && !act.includes(actionFilter.toUpperCase())) return false;
      if (textFilter && !act.toLowerCase().includes(textFilter) && !user.includes(textFilter) && !detail.includes(textFilter)) {
        return false;
      }
      return true;
    });

    if (!filtered.length) {
      container.innerHTML = '<div class="stg-empty"><i class="fa-solid fa-clock-rotate-left"></i>No matching activity logs found</div>';
      return;
    }

    container.innerHTML = filtered.map((l, idx) => {
      const act = l.action || 'ACTIVITY';
      const isLogin = act.includes('LOGIN');
      const isPwd = act.includes('PASSWORD');
      const isDanger = act.includes('PURGE') || act.includes('FAILED') || act.includes('BLOCKED');
      const dotColor = isDanger ? '#ef4444' : (isLogin ? '#10b981' : (isPwd ? '#f59e0b' : '#3b82f6'));

      return `
        <div class="stg-log-item" onclick="stgInspectLog(${idx})" title="Click to view audit metadata" style="display:flex;align-items:flex-start;gap:12px;padding:8px 10px;border-bottom:1px solid #f1f5f9;">
          <div class="stg-log-dot" style="width:10px;height:10px;border-radius:50%;background:${dotColor};margin-top:5px;flex-shrink:0;"></div>
          <div class="stg-log-text" style="flex:1;">
            <div style="font-size:0.86rem;color:#0f172a;">
              <strong>${esc(l.username || l.admin_username || 'System')}</strong>
              <span style="font-family:monospace;font-size:0.78rem;background:#f1f5f9;padding:2px 6px;border-radius:4px;margin-left:6px;color:#475569;">${esc(act)}</span>
            </div>
            ${l.details ? `<div style="font-size:0.8rem;color:#64748b;margin-top:2px;">${esc(l.details)}</div>` : ''}
          </div>
          <div class="stg-log-time" style="font-size:0.75rem;color:#94a3b8;white-space:nowrap;">${timeAgo(l.created_at || l.timestamp)}</div>
        </div>`;
    }).join('');
  }

  window.stgInspectLog = function (idx) {
    const log = state.cachedLogs[idx];
    if (!log) return;

    setText('stg-log-detail-time', formatDateTime(log.created_at || log.timestamp));
    setText('stg-log-detail-user', log.username || log.admin_username || 'System');
    setText('stg-log-detail-action', log.action || 'ACTIVITY');
    setText('stg-log-detail-target', `${log.target_type || 'system'} (ID: ${log.target_id ?? 'N/A'})`);

    const msgEl = document.getElementById('stg-log-detail-msg');
    if (msgEl) {
      msgEl.textContent = log.details ? String(log.details) : JSON.stringify(log, null, 2);
    }
    openModal('stg-modal-log-details');
  };

  function exportActivityLogs() {
    if (!state.cachedLogs.length) {
      alert('No activity logs available to export.');
      return;
    }
    const blob = new Blob([JSON.stringify(state.cachedLogs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-trail-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── Init ─────────────────────────────────────────────────────────────────────

  function initSettings(isSuperAdmin) {
    state.isSuperAdmin = isSuperAdmin;

    // Unlock super-admin navigation and sections
    if (isSuperAdmin) {
      document.querySelectorAll('.settings-nav-item.super-only').forEach(el => el.classList.add('unlocked'));
      document.querySelectorAll('.stg-super-only').forEach(el => el.style.display = '');
    } else {
      document.querySelectorAll('.stg-super-only').forEach(el => el.style.display = 'none');
    }

    // 1. Navigation items
    document.querySelectorAll('[data-stg-panel]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        switchPanel(btn.getAttribute('data-stg-panel'));
      });
    });

    // 2. Profile bindings
    const profileSave = document.getElementById('stg-profile-save-btn');
    if (profileSave) profileSave.addEventListener('click', saveProfile);

    const avatarInput = document.getElementById('stg-edit-avatar');
    if (avatarInput) {
      avatarInput.addEventListener('input', () => {
        previewAvatar(avatarInput.value);
        markProfileUnsaved(true);
      });
    }

    ['stg-edit-fullname', 'stg-edit-email'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('input', () => markProfileUnsaved(true));
    });

    const removeAvatarBtn = document.getElementById('stg-remove-avatar-btn');
    if (removeAvatarBtn) {
      removeAvatarBtn.addEventListener('click', () => {
        setVal('stg-edit-avatar', '');
        previewAvatar('');
        markProfileUnsaved(true);
      });
    }

    const profilePhotoButton = document.getElementById('stg-upload-avatar-btn');
    const profilePhotoInput = document.getElementById('stg-profile-photo-input');
    if (profilePhotoButton && profilePhotoInput) {
      profilePhotoButton.addEventListener('click', () => profilePhotoInput.click());
      profilePhotoInput.addEventListener('change', async () => {
        const file = profilePhotoInput.files[0];
        if (!file) return;
        setLoading('stg-upload-avatar-btn', true);
        try {
          const result = await window.uploadProfilePhoto(file, '/api/admin/settings/profile/photo');
          const photoUrl = result.avatar_url;
          setVal('stg-edit-avatar', photoUrl);
          if (state.myProfile) state.myProfile.avatar_url = photoUrl;
          previewAvatar(photoUrl);
          window.renderProfilePhoto(
            document.getElementById('admin-avatar-photo'),
            document.getElementById('admin-avatar-icon'),
            photoUrl
          );
          markProfileUnsaved(false);
          showAlert('stg-profile-alert', 'Profile photo uploaded.', 'success');
          window.dispatchEvent(new CustomEvent('profile-photo-updated', { detail: { photoUrl } }));
        } catch (error) {
          showAlert('stg-profile-alert', error.message);
        } finally {
          setLoading('stg-upload-avatar-btn', false);
          profilePhotoInput.value = '';
        }
      });
    }
    window.addEventListener('profile-photo-updated', (event) => {
      const photoUrl = event.detail?.photoUrl;
      if (!photoUrl) return;
      setVal('stg-edit-avatar', photoUrl);
      if (state.myProfile) state.myProfile.avatar_url = photoUrl;
      previewAvatar(photoUrl);
      markProfileUnsaved(false);
    });

    // 3. General Config bindings
    const genSave = document.getElementById('stg-general-save-btn');
    if (genSave) genSave.addEventListener('click', saveGeneralConfig);

    const genReset = document.getElementById('stg-general-reset-btn');
    if (genReset) genReset.addEventListener('click', resetGeneralDefaults);

    const mModeCheck = document.getElementById('cfg-maintenance-mode');
    if (mModeCheck) {
      mModeCheck.addEventListener('change', () => {
        const banner = document.getElementById('stg-maintenance-banner');
        if (banner) banner.style.display = mModeCheck.checked ? 'block' : 'none';
      });
    }

    // 4. CBT Policies bindings
    const cbtSave = document.getElementById('stg-cbt-save-btn');
    if (cbtSave) cbtSave.addEventListener('click', saveCbtPolicies);

    const presetStrict = document.getElementById('stg-preset-strict');
    if (presetStrict) presetStrict.addEventListener('click', applyStrictExamPreset);

    const presetPractice = document.getElementById('stg-preset-practice');
    if (presetPractice) presetPractice.addEventListener('click', applyPracticeExamPreset);

    const passInput = document.getElementById('cfg-pass-percentage');
    if (passInput) passInput.addEventListener('input', updatePassFeedback);

    const tabInput = document.getElementById('cfg-tab-switch-limit');
    if (tabInput) tabInput.addEventListener('input', updateCbtSecurityRating);

    [
      'cfg-enforce-fullscreen', 'cfg-disable-copy-paste', 'cfg-auto-submit-timer',
      'cfg-show-instant-result', 'cfg-shuffle-questions', 'cfg-shuffle-options'
    ].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('change', updateCbtSecurityRating);
    });

    // 5. Virtual Classroom bindings
    const liveSave = document.getElementById('stg-live-save-btn');
    if (liveSave) liveSave.addEventListener('click', saveLiveConfig);

    const presetLecture = document.getElementById('stg-preset-lecture');
    if (presetLecture) presetLecture.addEventListener('click', applyLecturePreset);

    const presetWorkshop = document.getElementById('stg-preset-workshop');
    if (presetWorkshop) presetWorkshop.addEventListener('click', applyWorkshopPreset);

    const maxPartInput = document.getElementById('cfg-max-participants');
    if (maxPartInput) maxPartInput.addEventListener('input', updateLiveCapacityFeedback);

    // 6. Staff & Admin Management bindings
    const addStaffBtn = document.getElementById('stg-btn-add-staff');
    if (addStaffBtn) {
      addStaffBtn.addEventListener('click', () => {
        ['stg-add-user-username', 'stg-add-user-fullname', 'stg-add-user-email', 'stg-add-user-password'].forEach(i => setVal(i, ''));
        setVal('stg-add-user-role', 'ordinary_admin');
        const alertEl = document.getElementById('stg-add-user-alert');
        if (alertEl) alertEl.style.display = 'none';
        openModal('stg-modal-add-user');
      });
    }

    const addStaffSave = document.getElementById('stg-add-user-save');
    if (addStaffSave) addStaffSave.addEventListener('click', saveAddUser);

    const usersFilter = document.getElementById('stg-users-filter');
    if (usersFilter) usersFilter.addEventListener('input', renderUsersTable);

    document.querySelectorAll('#stg-users-role-filters button').forEach(pill => {
      pill.addEventListener('click', () => {
        document.querySelectorAll('#stg-users-role-filters button').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        state.selectedRoleFilter = pill.getAttribute('data-role') || '';
        renderUsersTable();
      });
    });

    const editUserSave = document.getElementById('stg-edit-user-save');
    if (editUserSave) editUserSave.addEventListener('click', saveEditUser);

    const resetPwdSave = document.getElementById('stg-reset-pwd-save');
    if (resetPwdSave) resetPwdSave.addEventListener('click', saveResetPwd);

    // 7. Academic Terms bindings
    const termAddSave = document.getElementById('stg-term-add-save');
    if (termAddSave) termAddSave.addEventListener('click', () => saveTerm(false));

    const termEditSave = document.getElementById('stg-term-edit-save');
    if (termEditSave) termEditSave.addEventListener('click', () => saveTerm(true));

    const termStartInput = document.getElementById('stg-term-add-start');
    const termEndInput = document.getElementById('stg-term-add-end');
    if (termStartInput) termStartInput.addEventListener('change', updateTermDurationCalc);
    if (termEndInput) termEndInput.addEventListener('change', updateTermDurationCalc);

    const termsFilter = document.getElementById('stg-terms-filter');
    if (termsFilter) termsFilter.addEventListener('input', renderTermsTable);

    // 8. Classes bindings
    const classAddSave = document.getElementById('stg-class-add-save');
    if (classAddSave) classAddSave.addEventListener('click', () => saveClass(false));

    const classEditSave = document.getElementById('stg-class-edit-save');
    if (classEditSave) classEditSave.addEventListener('click', () => saveClass(true));

    const classesFilter = document.getElementById('stg-classes-filter');
    if (classesFilter) classesFilter.addEventListener('input', renderClassesTable);

    // Auto-generate class code hint
    const classNameInput = document.getElementById('stg-class-add-name');
    if (classNameInput) {
      classNameInput.addEventListener('input', () => {
        const codeInput = document.getElementById('stg-class-add-code');
        if (codeInput && !codeInput.value.trim()) {
          const val = classNameInput.value.trim().toUpperCase();
          const match = val.match(/\b([A-Z0-9])/g);
          if (match && match.length >= 2) {
            codeInput.placeholder = match.join('');
          }
        }
      });
    }

    // 9. Subjects bindings
    const subjAddSave = document.getElementById('stg-subj-add-save');
    if (subjAddSave) subjAddSave.addEventListener('click', () => saveSubject(false));

    const subjEditSave = document.getElementById('stg-subj-edit-save');
    if (subjEditSave) subjEditSave.addEventListener('click', () => saveSubject(true));

    const subjectsFilter = document.getElementById('stg-subjects-filter');
    if (subjectsFilter) subjectsFilter.addEventListener('input', renderSubjectsTable);

    const subjNameInput = document.getElementById('stg-subj-add-name');
    if (subjNameInput) {
      subjNameInput.addEventListener('input', () => {
        const codeInput = document.getElementById('stg-subj-add-code');
        if (codeInput && !codeInput.value.trim()) {
          const words = subjNameInput.value.trim().split(/\s+/);
          if (words.length === 1 && words[0].length >= 3) {
            codeInput.placeholder = words[0].slice(0, 4).toUpperCase();
          } else if (words.length > 1) {
            codeInput.placeholder = words.map(w => w.slice(0, 3).toUpperCase()).join('-');
          }
        }
      });
    }

    // 10. System Stats bindings
    const statsAutoBtn = document.getElementById('stg-stats-auto-btn');
    if (statsAutoBtn) statsAutoBtn.addEventListener('click', toggleAutoRefresh);

    // 11. Diagnostics bindings
    const diagBtn = document.getElementById('stg-run-diag-btn');
    if (diagBtn) diagBtn.addEventListener('click', runDiagnostics);

    const testEmailBtn = document.getElementById('stg-test-email-btn');
    if (testEmailBtn) testEmailBtn.addEventListener('click', testEmailServer);

    // 12. Backup & Tools bindings
    const noticeTemplateSel = document.getElementById('stg-notice-template');
    if (noticeTemplateSel) {
      noticeTemplateSel.addEventListener('change', () => {
        const preset = NOTICE_PRESETS[noticeTemplateSel.value];
        if (preset) {
          setVal('stg-notice-title', preset.title);
          setVal('stg-notice-msg', preset.msg);
        }
        updateNoticePreview();
      });
    }

    const noticeTitleInput = document.getElementById('stg-notice-title');
    const noticeMsgInput = document.getElementById('stg-notice-msg');
    if (noticeTitleInput) noticeTitleInput.addEventListener('input', updateNoticePreview);
    if (noticeMsgInput) noticeMsgInput.addEventListener('input', updateNoticePreview);

    const noticeBtn = document.getElementById('stg-send-notice-btn');
    if (noticeBtn) noticeBtn.addEventListener('click', sendBroadcastNotice);

    // Purge confirmation modal flow
    const purgeBtn = document.getElementById('stg-purge-btn');
    if (purgeBtn) {
      purgeBtn.addEventListener('click', () => {
        setVal('stg-purge-confirm-input', '');
        const modalBtn = document.getElementById('stg-modal-purge-btn');
        if (modalBtn) modalBtn.disabled = true;
        openModal('stg-modal-purge-confirm');
      });
    }

    const purgeInput = document.getElementById('stg-purge-confirm-input');
    if (purgeInput) {
      purgeInput.addEventListener('input', () => {
        const modalBtn = document.getElementById('stg-modal-purge-btn');
        if (modalBtn) modalBtn.disabled = purgeInput.value.trim() !== 'PURGE';
      });
    }

    const modalPurgeBtn = document.getElementById('stg-modal-purge-btn');
    if (modalPurgeBtn) modalPurgeBtn.addEventListener('click', executePurgeAttempts);

    // 13. Activity Log bindings
    const actFilter = document.getElementById('stg-activity-filter');
    if (actFilter) actFilter.addEventListener('input', renderActivityList);

    const actActionFilter = document.getElementById('stg-activity-action-filter');
    if (actActionFilter) actActionFilter.addEventListener('change', renderActivityList);

    const exportActBtn = document.getElementById('stg-export-activity-btn');
    if (exportActBtn) exportActBtn.addEventListener('click', exportActivityLogs);

    // 14. Global refresh buttons
    document.querySelectorAll('[data-stg-refresh]').forEach(btn => {
      btn.addEventListener('click', () => {
        const panel = btn.getAttribute('data-stg-refresh');
        const loaders = {
          stats: loadStats,
          users: loadUsers,
          terms: loadTerms,
          classes: loadClasses,
          subjects: loadSubjects,
          activity: loadActivity
        };
        if (loaders[panel]) loaders[panel]();
      });
    });

    // 15. Global modal backdrop & escape dismissal
    document.querySelectorAll('.stg-modal-backdrop').forEach(m => {
      m.addEventListener('click', (e) => { if (e.target === m) m.style.display = 'none'; });
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.stg-modal-backdrop').forEach(m => { m.style.display = 'none'; });
      }
    });

    // 16. Modal password visibility toggles
    document.querySelectorAll('[data-stg-toggle-pwd]').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-stg-toggle-pwd');
        const input = document.getElementById(targetId);
        if (!input) return;
        input.type = input.type === 'password' ? 'text' : 'password';
        const icon = btn.querySelector('i');
        if (icon) icon.className = input.type === 'password' ? 'fa-solid fa-eye' : 'fa-solid fa-eye-slash';
      });
    });

    // 17. Security card password change trigger
    const secChangePwdBtn = document.getElementById('stg-btn-open-change-pwd');
    if (secChangePwdBtn) {
      secChangePwdBtn.addEventListener('click', () => {
        const mainBtn = document.getElementById('btn-change-password');
        if (mainBtn) mainBtn.click();
        else {
          const modal = document.getElementById('modal-change-password');
          if (modal) modal.style.display = 'flex';
        }
      });
    }

    // Load initial panel
    switchPanel('profile');
  }

  // Expose initialization function for admin.js
  window.initAdminSettings = initSettings;

})();
