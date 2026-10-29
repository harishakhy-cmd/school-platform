(function () {
  const REG = /^sto[0-9]+-\d{3}[A-Za-z]$/i;
  let adminRole = 'ordinary_admin';
  let adminId = null;

  // Local state to keep track of loaded admins/exams
  let state = {
    admins: [],
    myExams: [],
    pendingExams: [],
    allExams: []
  };

  // Safe JSON API wrapper
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

  // --- 1. Tab Navigation & Title Handling ---
  const tabTitles = {
    'tab-overview': { title: 'Dashboard Overview', subtitle: 'Welcome back to the SCHOOL control center.' },
    'tab-classrooms': { title: 'Classroom & LMS Management', subtitle: 'Manage school classrooms, assign tutors, and review enrollments.' },
    'tab-academics': { title: 'Academic Structure', subtitle: 'Configure academic years, terms, classes, subjects, and tutors.' },
    'tab-students': { title: 'Student Directory', subtitle: 'Manage academic registrations and admin assignments.' },
    'tab-exams': { title: 'Exams & Question Editor', subtitle: 'Draft exams, provision questions, and view LaTeX previews.' },
    'tab-super-admins': { title: 'Hierarchy Management', subtitle: 'Super Admin: Manage administrative roles, permissions, and status.' },
    'tab-super-approvals': { title: 'Approvals & Broadcasts', subtitle: 'Super Admin: Review ordinary admin drafts and broadcast exams to student portal.' },
    'tab-settings': { title: 'System Settings & Tools', subtitle: 'Manage staff credentials, platform metrics, academic terms, and administrative configuration.' }
  };

  function initTabs() {
    const navItems = document.querySelectorAll('.nav-item[data-tab]');
    navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const tabId = item.getAttribute('data-tab');
        const tabPanel = document.getElementById(tabId);
        if (!tabPanel) {
          console.error(`Admin tab panel not found for "${tabId}".`);
          return;
        }
        
        // Update nav item active states
        navItems.forEach(n => {
          n.classList.remove('active');
          n.removeAttribute('aria-current');
        });
        item.classList.add('active');
        item.setAttribute('aria-current', 'page');

        // Toggle tab content visibility
        document.querySelectorAll('.tab-content').forEach(content => {
          content.classList.remove('active');
        });
        tabPanel.classList.add('active');

        // Update titles
        const meta = tabTitles[tabId] || { title: 'Admin Console', subtitle: '' };
        document.getElementById('tab-title').textContent = meta.title;
        document.getElementById('tab-subtitle').textContent = meta.subtitle;

        // Perform specific tab data loadings
        if (tabId === 'tab-overview') {
          void loadOverviewStats();
        } else if (tabId === 'tab-classrooms') {
          void loadAdminClassrooms();
        } else if (tabId === 'tab-academics') {
          void loadAdminAcademics();
        } else if (tabId === 'tab-students') {
          void loadStudentsDropdown();
        } else if (tabId === 'tab-exams') {
          void loadMyExams();
        } else if (tabId === 'tab-super-admins') {
          void loadAdminsTable();
        } else if (tabId === 'tab-super-approvals') {
          void loadApprovalQueue();
          void loadBroadcastQueue();
        }
      });
    });
  }

  // --- 2. Initial Auth & Identity Fetching ---
  async function loadAdminInfo() {
    try {
      const { res, data } = await apiJson('/api/admin/auth/me');
      if (res.status === 401) {
        window.location.href = '/admin-login.html';
        return;
      }
      if (data.ok && data.username) {
        adminRole = data.role;
        adminId = data.adminId;
        
        // Update profile badges
        document.getElementById('profile-username').textContent = data.username;
        document.getElementById('profile-role').textContent = data.role === 'super_admin' ? 'Super Admin' : 'Ordinary Admin';
        document.getElementById('profile-role').className = data.role === 'super_admin' ? 'badge-role super' : 'badge-role ordinary';
        document.getElementById('profile-code').textContent = data.admin_code || 'ODA01-000A';
        try {
          const { res: profileRes, data: profileData } = await apiJson('/api/admin/settings/profile');
          if (profileRes.ok) {
            window.renderProfilePhoto(
              document.getElementById('admin-avatar-photo'),
              document.getElementById('admin-avatar-icon'),
              profileData.profile.avatar_url
            );
          } else {
            console.error('Could not load admin profile photo:', profileData.error || profileRes.status);
          }
        } catch (photoError) {
          console.error('Could not load admin profile photo:', photoError);
        }

        // Unlock Super Admin Controls if authorized
        if (data.role === 'super_admin') {
          document.querySelectorAll('.super-admin-only').forEach(el => el.classList.remove('hidden'));
          void loadOverviewStats();
          void loadPendingCount();
        } else {
          void loadOverviewStats();
        }

        // Initialize Settings Panel with role permission
        if (typeof window.initAdminSettings === 'function') {
          window.initAdminSettings(data.role === 'super_admin');
        }
      }
    } catch (err) {
      console.error('Error loading admin info:', err);
    }
  }

  function bindProfilePhotoUpload() {
    const photoButton = document.getElementById('btn-change-admin-photo');
    const photoInput = document.getElementById('admin-photo-input');
    const photoStatus = document.getElementById('admin-photo-status');
    if (!photoButton || !photoInput || !photoStatus) return;
    photoButton.addEventListener('click', () => photoInput.click());
    photoInput.addEventListener('change', async () => {
      const file = photoInput.files[0];
      if (!file) return;
      photoButton.disabled = true;
      photoStatus.textContent = 'Uploading…';
      try {
        const result = await window.uploadProfilePhoto(file, '/api/admin/settings/profile/photo');
        window.renderProfilePhoto(
          document.getElementById('admin-avatar-photo'),
          document.getElementById('admin-avatar-icon'),
          result.avatar_url
        );
        photoStatus.textContent = 'Profile photo updated.';
        window.dispatchEvent(new CustomEvent('profile-photo-updated', { detail: { photoUrl: result.avatar_url } }));
      } catch (error) {
        photoStatus.textContent = error.message;
      } finally {
        photoButton.disabled = false;
        photoInput.value = '';
      }
    });
  }

  // Logout wiring
  document.getElementById('btn-admin-logout').addEventListener('click', async () => {
    await fetch('/api/admin/auth/logout', { method: 'POST', credentials: 'same-origin' });
    window.location.href = '/admin-login.html';
  });

  // ── Change Password Modal ──────────────────────────────────────────────────
  (function initChangePasswordModal() {
    const modal    = document.getElementById('modal-change-password');
    const openBtn  = document.getElementById('btn-change-password');
    const closeBtn = document.getElementById('close-change-password');
    const cancelBtn= document.getElementById('cancel-change-password');
    const form     = document.getElementById('form-change-password');
    const alertBox = document.getElementById('change-pwd-alert');
    const submitBtn= document.getElementById('cpwd-submit-btn');

    function openModal() {
      form.reset();
      alertBox.style.display = 'none';
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="fa-solid fa-lock"></i> Change Password';
      modal.style.display = 'flex';
    }
    function closeModal() {
      modal.style.display = 'none';
      form.reset();
      alertBox.style.display = 'none';
    }

    if (openBtn)  openBtn.addEventListener('click', openModal);
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

    // Close on backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    // Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.style.display === 'flex') closeModal();
    });

    // Password strength meter
    const newInput     = document.getElementById('cpwd-new');
    const strengthFill = document.getElementById('cpwd-strength-fill');
    const strengthLabel= document.getElementById('cpwd-strength-label');
    if (newInput) {
      newInput.addEventListener('input', () => {
        const v = newInput.value;
        let score = 0;
        if (v.length >= 8)  score++;
        if (v.length >= 12) score++;
        if (/[A-Z]/.test(v)) score++;
        if (/[0-9]/.test(v)) score++;
        if (/[^A-Za-z0-9]/.test(v)) score++;
        const levels = [
          { label: '', color: '#2e3247', w: '0%' },
          { label: 'Very weak', color: '#e05252', w: '20%' },
          { label: 'Weak',      color: '#f5a623', w: '40%' },
          { label: 'Fair',      color: '#f5e642', w: '60%' },
          { label: 'Strong',    color: '#4caf7d', w: '80%' },
          { label: 'Very strong', color: '#2ecc71', w: '100%' },
        ];
        const lvl = levels[Math.min(score, 5)];
        strengthFill.style.width = lvl.w;
        strengthFill.style.background = lvl.color;
        strengthLabel.textContent = lvl.label;
        strengthLabel.style.color = lvl.color;
      });
    }

    function showAlert(msg, isError = true) {
      alertBox.textContent = msg;
      alertBox.style.display = 'block';
      alertBox.style.background  = isError ? 'rgba(224,82,82,0.15)' : 'rgba(76,175,125,0.15)';
      alertBox.style.color       = isError ? '#e05252' : '#4caf7d';
      alertBox.style.border      = isError ? '1px solid #e05252' : '1px solid #4caf7d';
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      alertBox.style.display = 'none';

      const currentPassword  = document.getElementById('cpwd-current').value;
      const newPassword      = document.getElementById('cpwd-new').value;
      const confirmPassword  = document.getElementById('cpwd-confirm').value;

      // Client-side checks
      if (!currentPassword || !newPassword || !confirmPassword) {
        return showAlert('Please fill in all three fields.');
      }
      if (newPassword.length < 8) {
        return showAlert('New password must be at least 8 characters.');
      }
      if (newPassword !== confirmPassword) {
        return showAlert('New password and confirmation do not match.');
      }
      if (newPassword === currentPassword) {
        return showAlert('New password must be different from your current password.');
      }

      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving…';

      try {
        const { res, data } = await apiJson('/api/admin/auth/change-password', {
          method: 'PUT',
          body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
        });

        if (res.ok && data.ok) {
          showAlert('✓ Password changed successfully! Please use your new password next time you log in.', false);
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<i class="fa-solid fa-lock"></i> Change Password';
          form.reset();
          // Auto-close after 2.5 s
          setTimeout(closeModal, 2500);
        } else {
          showAlert(data.error || 'Failed to change password. Please try again.');
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<i class="fa-solid fa-lock"></i> Change Password';
        }
      } catch (err) {
        showAlert('Network error. Please try again.');
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fa-solid fa-lock"></i> Change Password';
      }
    });
  })();


  async function loadOverviewStats() {
    try {
      // 1. Fetch Students
      const { res: studentRes, data: studentData } = await apiJson('/api/admin/students');
      if (studentRes.ok) {
        document.getElementById('stat-students-count').textContent = studentData.students.length;
      }
      
      // 2. Fetch Exams
      const { res: examRes, data: examData } = await apiJson('/api/admin/exams');
      if (examRes.ok) {
        document.getElementById('stat-exams-count').textContent = examData.exams.length;
        
        // Load exam dropdown for results filter
        const examSelect = document.getElementById('results-exam');
        if (examSelect) {
          examSelect.innerHTML = '<option value="">-- All Exams --</option>';
          examData.exams.forEach(exam => {
            const option = document.createElement('option');
            option.value = exam.exam_id;
            option.textContent = exam.title;
            examSelect.appendChild(option);
          });
        }
      }

      // 3. Super Admin Approvals Count
      if (adminRole === 'super_admin') {
        const { res: pendingRes, data: pendingData } = await apiJson('/api/admin/exams/pending');
        if (pendingRes.ok) {
          document.getElementById('stat-pending-count').textContent = pendingData.exams.length;
          updatePendingCountBadge(pendingData.exams.length);
        }
      } else {
        document.getElementById('stat-pending-count').textContent = 'N/A';
      }
    } catch (err) {
      console.error('Overview stats load error:', err);
    }
  }

  async function loadPendingCount() {
    if (adminRole !== 'super_admin') return;
    try {
      const { res, data } = await apiJson('/api/admin/exams/pending');
      if (res.ok) {
        updatePendingCountBadge(data.exams.length);
      }
    } catch {}
  }

  function updatePendingCountBadge(count) {
    const badge = document.getElementById('pending-count');
    if (badge) {
      if (count > 0) {
        badge.textContent = count;
        badge.classList.remove('hidden');
      } else {
        badge.classList.add('hidden');
      }
    }
  }

  // Helper to show inline alerts
  function showMessage(msgId, text, isError) {
    const msg = document.getElementById(msgId);
    if (!msg) return;
    msg.classList.add('hidden');
    msg.className = isError ? 'error alert-premium error-border' : 'success alert-premium success-border';
    msg.innerHTML = isError 
      ? `<i class="fa-solid fa-circle-exclamation"></i> ${text}`
      : `<i class="fa-solid fa-circle-check"></i> ${text}`;
    msg.classList.remove('hidden');
  }

  function hideMessage(msgId) {
    const msg = document.getElementById(msgId);
    if (msg) msg.classList.add('hidden');
  }

  // --- 4. Forms Submission Wiring ---
  function wireForm(formId, msgId, url, buildBody, callback) {
    const form = document.getElementById(formId);
    if (!form) return;
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      hideMessage(msgId);
      const body = buildBody(new FormData(form));
      
      // Perform frontend validation for student reg codes
      if (formId === 'form-student') {
        const reg = String(body.registration_number || '').trim();
        if (!REG.test(reg)) {
          showMessage(msgId, 'Registration must match format STO1-001A (STO, digits, hyphen, 3 digits, letter).', true);
          return;
        }
      }

      try {
        const isPut = formId === 'form-assign';
        const { res, data } = await apiJson(url, {
          method: isPut ? 'PUT' : 'POST',
          body: JSON.stringify(body)
        });
        if (res.status === 401) {
          window.location.href = '/admin-login.html';
          return;
        }
        if (!res.ok) {
          showMessage(msgId, data.error || 'Operation failed', true);
          return;
        }
        showMessage(msgId, data.message || 'Saved successfully.', false);
        form.reset();
        if (callback) callback(data);
      } catch {
        showMessage(msgId, 'Network connection error.', true);
      }
    });
  }

  // Student Registry form
  wireForm('form-student', 'st-msg', '/api/admin/students', (fd) => ({
    registration_number: String(fd.get('registration_number') || '').trim(),
    name: String(fd.get('name') || '').trim(),
    admin_id: fd.get('admin_id') ? parseInt(fd.get('admin_id'), 10) : null
  }), () => {
    void loadOverviewStats();
  });

  // Assign Student to Admin form
  wireForm('form-assign', 'assign-msg', '/api/admin/students/assign', (fd) => ({
    registration_number: String(fd.get('registration_number') || '').trim(),
    admin_id: fd.get('admin_id') ? parseInt(fd.get('admin_id'), 10) : null
  }), () => {
    void loadOverviewStats();
  });

  // Create New Exam Form
  wireForm('form-exam', 'ex-msg', '/api/admin/exams', (fd) => ({
    title: String(fd.get('title') || '').trim(),
    duration: fd.get('duration')
  }), () => {
    void loadMyExams();
    void loadOverviewStats();
    if (adminRole === 'super_admin') {
      void loadPendingCount();
    }
  });

  // Save new Provisioned Question Form
  wireForm('form-question', 'q-msg', '/api/admin/questions', (fd) => ({
    exam_id: fd.get('exam_id'),
    question_text: String(fd.get('question_text') || '').trim(),
    option_a: String(fd.get('option_a') || '').trim(),
    option_b: String(fd.get('option_b') || '').trim(),
    option_c: String(fd.get('option_c') || '').trim(),
    option_d: String(fd.get('option_d') || '').trim(),
    correct_answer: fd.get('correct_answer'),
    question_type: document.getElementById('q-type').value,
    supports_formatting: document.getElementById('q-formatting').checked ? 1 : 0
  }), () => {
    // Reset preview window
    const preview = document.getElementById('preview-viewport');
    if (preview) {
      preview.innerHTML = `
        <div class="empty-preview-msg">
          <i class="fa-solid fa-square-poll-horizontal"></i>
          <p>Start typing question prompt or options above to see formulas compile here.</p>
        </div>
      `;
    }
  });

  // Provision New Admin User Form (Super Admin only)
  wireForm('form-create-admin', 'super-admin-msg', '/api/admin/admins', (fd) => ({
    username: String(fd.get('username') || '').trim(),
    password: String(fd.get('password') || ''),
    role: fd.get('role') || 'ordinary_admin'
  }), () => {
    void loadAdminsTable();
  });

  // --- 5. Dynamic Dropdowns & Lists Rendering ---
  async function loadStudentsDropdown() {
    if (adminRole !== 'super_admin') {
      // Ordinary admins can't list administrative dropdown details.
      const selects = ['st-admin', 'assign-admin'];
      selects.forEach(sId => {
        const s = document.getElementById(sId);
        if (s) {
          s.innerHTML = `<option value="">-- Assigned To You --</option>`;
        }
      });
      return;
    }
    try {
      const { res, data } = await apiJson('/api/admin/admins');
      if (!res.ok) return;
      
      const stAdminSelect = document.getElementById('st-admin');
      const assignAdminSelect = document.getElementById('assign-admin');
      
      const optionsHtml = '<option value="">-- No specific admin --</option>' + 
        data.admins.map(admin => `<option value="${admin.id}">${escapeHtml(admin.username)} (${admin.role === 'super_admin' ? 'Super' : 'Ordinary'})</option>`).join('');
      
      if (stAdminSelect) stAdminSelect.innerHTML = optionsHtml;
      
      if (assignAdminSelect) {
        assignAdminSelect.innerHTML = '<option value="">-- Unassign / Public --</option>' + 
          data.admins.map(admin => `<option value="${admin.id}">${escapeHtml(admin.username)}</option>`).join('');
      }
    } catch (err) {
      console.error('Admins list loading failed:', err);
    }
  }

  // Student results fetching and rendering
  const btnLoadResults = document.getElementById('btn-load-results');
  if (btnLoadResults) {
    btnLoadResults.addEventListener('click', async () => {
      const container = document.getElementById('results-container');
      const examSelect = document.getElementById('results-exam');
      const examId = examSelect ? examSelect.value : '';
      
      container.innerHTML = '<p class="muted text-center" style="padding: 2rem 0;"><i class="fa-solid fa-spinner fa-spin"></i> Retrieving scores...</p>';
      
      try {
        let url = '/api/admin/results';
        if (examId) {
          url += `?exam_id=${encodeURIComponent(examId)}`;
        }
        
        const { res, data } = await apiJson(url);
        if (res.status === 401) {
          window.location.href = '/admin-login.html';
          return;
        }
        if (!res.ok) {
          container.innerHTML = `<p class="error alert-premium error-border"><i class="fa-solid fa-triangle-exclamation"></i> ${data.error || 'Failed to load results'}</p>`;
          return;
        }
        
        if (data.results.length === 0) {
          container.innerHTML = '<p class="muted text-center" style="padding: 2rem 0;">No results found for your assigned students.</p>';
          return;
        }
        
        let html = `
          <table class="table-premium">
            <thead>
              <tr>
                <th>Student</th>
                <th>Registration</th>
                <th>Exam</th>
                <th>Score</th>
                <th>Total</th>
                <th>Status</th>
                <th>Submitted</th>
              </tr>
            </thead>
            <tbody>
        `;
        
        data.results.forEach(result => {
          const submittedAt = result.end_time ? new Date(result.end_time).toLocaleString() : 'N/A';
          const scoreDisplay = result.score !== null ? `<span class="score-pill">${result.score}</span>` : '<span class="score-pill pending">N/A</span>';
          
          html += `
            <tr>
              <td><strong>${escapeHtml(result.student_name)}</strong></td>
              <td><span class="reg-pill">${escapeHtml(result.registration_number)}</span></td>
              <td>${escapeHtml(result.exam_title)}</td>
              <td>${scoreDisplay}</td>
              <td>${result.total_questions}</td>
              <td><span class="status-indicator-inline ${result.status.toLowerCase()}">${result.status}</span></td>
              <td class="font-small font-mono">${submittedAt}</td>
            </tr>
          `;
        });
        
        html += '</tbody></table>';
        container.innerHTML = html;
      } catch (err) {
        container.innerHTML = '<p class="error text-center alert-premium error-border"><i class="fa-solid fa-triangle-exclamation"></i> Connection timed out.</p>';
        console.error('Error loading results:', err);
      }
    });
  }

  // Load Students List Table
  const btnLoadStudents = document.getElementById('btn-load-students');
  if (btnLoadStudents) {
    btnLoadStudents.addEventListener('click', async () => {
      const container = document.getElementById('students-container');
      container.innerHTML = '<p class="muted text-center" style="padding: 2rem 0;"><i class="fa-solid fa-spinner fa-spin"></i> Fetching roster...</p>';
      
      try {
        const { res, data } = await apiJson('/api/admin/students');
        if (res.status === 401) {
          window.location.href = '/admin-login.html';
          return;
        }
        if (!res.ok) {
          container.innerHTML = `<p class="error alert-premium error-border"><i class="fa-solid fa-triangle-exclamation"></i> ${data.error || 'Failed to load students'}</p>`;
          return;
        }
        
        if (data.students.length === 0) {
          container.innerHTML = '<p class="muted text-center" style="padding: 2rem 0;">No student accounts are currently registered under your scope.</p>';
          return;
        }
        
        let html = `
          <table class="table-premium">
            <thead>
              <tr>
                <th>Registration</th>
                <th>Full Name</th>
                <th>Assigned Supervisor</th>
              </tr>
            </thead>
            <tbody>
        `;
        
        data.students.forEach(student => {
          const adminDetails = student.admin_username 
            ? `<span class="badge-role ordinary">${escapeHtml(student.admin_username)} (${student.admin_code || 'ODA'})</span>`
            : '<span class="badge-role unassigned">Public / General</span>';
            
          html += `
            <tr>
              <td><span class="reg-pill">${escapeHtml(student.registration_number)}</span></td>
              <td><strong>${escapeHtml(student.name)}</strong></td>
              <td>${adminDetails}</td>
            </tr>
          `;
        });
        
        html += '</tbody></table>';
        container.innerHTML = html;
      } catch (err) {
        container.innerHTML = '<p class="error text-center alert-premium error-border"><i class="fa-solid fa-triangle-exclamation"></i> Network transmission error.</p>';
        console.error('Error loading students:', err);
      }
    });
  }

  // --- 6. Exams & Rejected Drafts List ---
  async function loadMyExams() {
    const container = document.getElementById('my-exams-container');
    if (!container) return;
    container.innerHTML = '<p class="muted"><i class="fa-solid fa-spinner fa-spin"></i> Retrieving exams...</p>';

    try {
      const { res, data } = await apiJson('/api/admin/exams/my');
      if (!res.ok) {
        container.innerHTML = '<p class="error">Could not load exams.</p>';
        return;
      }
      
      state.myExams = data.exams;
      if (data.exams.length === 0) {
        container.innerHTML = '<p class="muted">You have not submitted or created any exams yet.</p>';
        return;
      }

      let html = `
        <table class="table-premium">
          <thead>
            <tr>
              <th>ID</th>
              <th>Exam Title</th>
              <th>Duration</th>
              <th>Approval State</th>
              <th>Broadcast Status</th>
              <th>Notes / Feedback</th>
            </tr>
          </thead>
          <tbody>
      `;

      data.exams.forEach(ex => {
        const appStatus = ex.approval_status || 'pending';
        const isBrd = ex.is_broadcasted ? 'Yes' : 'No';
        const appBadgeClass = appStatus === 'approved' ? 'success' : appStatus === 'rejected' ? 'danger' : 'warning';
        const brdBadgeClass = ex.is_broadcasted ? 'active' : 'suspended';
        
        let reasonCol = '<span class="muted font-small">No feedback</span>';
        if (appStatus === 'rejected' && ex.rejection_reason) {
          reasonCol = `<span class="feedback-reason"><i class="fa-solid fa-triangle-exclamation"></i> Reason: <strong>${escapeHtml(ex.rejection_reason)}</strong></span>`;
        } else if (appStatus === 'approved') {
          reasonCol = '<span class="feedback-reason approved"><i class="fa-solid fa-circle-check"></i> Ready for launch</span>';
        }

        html += `
          <tr>
            <td class="font-mono">${ex.exam_id}</td>
            <td><strong>${escapeHtml(ex.title)}</strong></td>
            <td>${ex.duration} minutes</td>
            <td><span class="status-indicator-inline ${appStatus}">${appStatus.toUpperCase()}</span></td>
            <td><span class="status-indicator-inline ${brdBadgeClass}">${isBrd}</span></td>
            <td>${reasonCol}</td>
          </tr>
        `;
      });

      html += '</tbody></table>';
      container.innerHTML = html;
    } catch (err) {
      container.innerHTML = '<p class="error">Network exception while loading exams.</p>';
    }
  }

  // --- 7. Super Admin: Admin Roster & Role updates ---
  async function loadAdminsTable() {
    if (adminRole !== 'super_admin') return;
    const tbody = document.getElementById('admins-list-container');
    if (!tbody) return;

    try {
      const { res, data } = await apiJson('/api/admin/admins');
      if (!res.ok) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center error">Could not load roster.</td></tr>';
        return;
      }
      
      state.admins = data.admins;
      if (data.admins.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center muted">No administrator accounts exist.</td></tr>';
        return;
      }

      let html = '';
      data.admins.forEach(ad => {
        const statusBadge = `<span class="status-indicator-inline ${ad.status}">${ad.status.toUpperCase()}</span>`;
        const roleBadge = `<span class="badge-role ${ad.role}">${ad.role === 'super_admin' ? 'Super' : 'Ordinary'}</span>`;
        
        // Disable action buttons on self
        const isSelf = ad.username === document.getElementById('profile-username').textContent;
        let actions = '';
        if (isSelf) {
          actions = '<span class="muted font-small">Current User</span>';
        } else {
          const actBtn = ad.status === 'pending' || ad.status === 'suspended' 
            ? `<button class="btn btn-action-small success-bg action-activate" data-id="${ad.id}" title="Activate Admin"><i class="fa-solid fa-circle-check"></i> Activate</button>`
            : `<button class="btn btn-action-small danger-bg action-suspend" data-id="${ad.id}" title="Suspend Admin"><i class="fa-solid fa-ban"></i> Suspend</button>`;
          
          const promoteBtn = ad.role === 'ordinary_admin'
            ? `<button class="btn btn-action-small warning-bg action-promote" data-id="${ad.id}" title="Promote to Super Admin"><i class="fa-solid fa-arrow-up-right-dots"></i> Promote</button>`
            : '';

          actions = `<div class="action-buttons-group">${actBtn} ${promoteBtn}</div>`;
        }

        html += `
          <tr>
            <td class="font-mono font-small">${escapeHtml(ad.admin_code || 'N/A')}</td>
            <td><strong>${escapeHtml(ad.username)}</strong></td>
            <td>${roleBadge}</td>
            <td>${statusBadge}</td>
            <td class="font-small font-mono">${ad.created_by || 'System'}</td>
            <td>${actions}</td>
          </tr>
        `;
      });

      tbody.innerHTML = html;
      wireAdminRosterActions();
    } catch {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center error">Network error loading admins.</td></tr>';
    }
  }

  function wireAdminRosterActions() {
    const alertId = 'admin-management-msg';
    
    // Activate Admin Action
    document.querySelectorAll('.action-activate').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        hideMessage(alertId);
        try {
          const { res, data } = await apiJson(`/api/admin/admins/${id}/activate`, { method: 'PUT' });
          if (res.ok) {
            showMessage(alertId, 'Administrator account activated successfully.', false);
            void loadAdminsTable();
          } else {
            showMessage(alertId, data.error || 'Failed to activate', true);
          }
        } catch {
          showMessage(alertId, 'Network error.', true);
        }
      });
    });

    // Suspend Admin Action
    document.querySelectorAll('.action-suspend').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        hideMessage(alertId);
        try {
          const { res, data } = await apiJson(`/api/admin/admins/${id}/suspend`, { method: 'PUT' });
          if (res.ok) {
            showMessage(alertId, 'Administrator suspended successfully.', false);
            void loadAdminsTable();
          } else {
            showMessage(alertId, data.error || 'Failed to suspend', true);
          }
        } catch {
          showMessage(alertId, 'Network error.', true);
        }
      });
    });

    // Promote Admin Action
    document.querySelectorAll('.action-promote').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        hideMessage(alertId);
        if (!confirm('Are you sure you want to promote this administrator? This grants full super administrator system access.')) return;
        try {
          const { res, data } = await apiJson(`/api/admin/admins/${id}/promote`, { method: 'PUT' });
          if (res.ok) {
            showMessage(alertId, 'Administrator promoted to Super Admin role successfully.', false);
            void loadAdminsTable();
          } else {
            showMessage(alertId, data.error || 'Failed to promote', true);
          }
        } catch {
          showMessage(alertId, 'Network error.', true);
        }
      });
    });
  }

  // --- 8. Super Admin: Approval Workflows & Broadcasts ---
  async function loadApprovalQueue() {
    if (adminRole !== 'super_admin') return;
    const tbody = document.getElementById('approvals-list-container');
    if (!tbody) return;

    try {
      const { res, data } = await apiJson('/api/admin/exams/pending');
      if (!res.ok) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center error">Could not load approvals.</td></tr>';
        return;
      }

      state.pendingExams = data.exams;
      if (data.exams.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center muted" style="padding: 2rem 0;">No exams currently pending review.</td></tr>';
        return;
      }

      let html = '';
      data.exams.forEach(ex => {
        html += `
          <tr>
            <td class="font-mono font-small">${ex.exam_id}</td>
            <td><strong>${escapeHtml(ex.title)}</strong></td>
            <td>${ex.duration} mins</td>
            <td><span class="badge-role ordinary">${escapeHtml(ex.created_by_username)} (${ex.created_by_code || 'ODA'})</span></td>
            <td>
              <div class="action-buttons-group">
                <button class="btn btn-action-small success-bg action-approve-exam" data-id="${ex.exam_id}"><i class="fa-solid fa-circle-check"></i> Approve</button>
                <button class="btn btn-action-small danger-bg action-reject-exam" data-id="${ex.exam_id}"><i class="fa-solid fa-circle-xmark"></i> Reject</button>
              </div>
            </td>
          </tr>
        `;
      });

      tbody.innerHTML = html;
      wireApprovalActions();
    } catch {
      tbody.innerHTML = '<tr><td colspan="5" class="text-center error">Network exception fetching approvals.</td></tr>';
    }
  }

  function wireApprovalActions() {
    const alertId = 'super-approvals-msg';

    // Approve exam directly
    document.querySelectorAll('.action-approve-exam').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        hideMessage(alertId);
        try {
          const { res, data } = await apiJson(`/api/admin/exams/${id}/approve`, { method: 'PUT' });
          if (res.ok) {
            showMessage(alertId, 'Exam approved successfully.', false);
            void loadApprovalQueue();
            void loadPendingCount();
            void loadBroadcastQueue();
          } else {
            showMessage(alertId, data.error || 'Failed to approve', true);
          }
        } catch {
          showMessage(alertId, 'Network error.', true);
        }
      });
    });

    // Toggle Rejection Modal overlay
    document.querySelectorAll('.action-reject-exam').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        document.getElementById('reject-exam-id').value = id;
        document.getElementById('reject-reason').value = '';
        document.getElementById('rejection-modal').classList.remove('hidden');
      });
    });
  }

  // Reject Modal Submissions
  const formRejectExam = document.getElementById('form-reject-exam');
  if (formRejectExam) {
    formRejectExam.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('reject-exam-id').value;
      const reason = document.getElementById('reject-reason').value.trim();
      const alertId = 'super-approvals-msg';

      document.getElementById('rejection-modal').classList.add('hidden');
      hideMessage(alertId);

      try {
        const { res, data } = await apiJson(`/api/admin/exams/${id}/reject`, {
          method: 'PUT',
          body: JSON.stringify({ reason })
        });
        if (res.ok) {
          showMessage(alertId, 'Exam rejected and sent back to ordinary admin.', false);
          void loadApprovalQueue();
          void loadPendingCount();
        } else {
          showMessage(alertId, data.error || 'Failed to reject exam', true);
        }
      } catch {
        showMessage(alertId, 'Network error.', true);
      }
    });
  }

  const btnCancelReject = document.getElementById('btn-cancel-reject');
  if (btnCancelReject) {
    btnCancelReject.addEventListener('click', () => {
      document.getElementById('rejection-modal').classList.add('hidden');
    });
  }

  // Load Exam Broadcast queue
  async function loadBroadcastQueue() {
    if (adminRole !== 'super_admin') return;
    const tbody = document.getElementById('broadcasts-list-container');
    if (!tbody) return;

    try {
      const { res, data } = await apiJson('/api/admin/exams');
      if (!res.ok) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center error">Could not load exams roster.</td></tr>';
        return;
      }

      state.allExams = data.exams;
      // We only broadcast exams that are APPROVED
      const approvedExams = data.exams;
      if (approvedExams.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center muted" style="padding: 2rem 0;">No approved exams available.</td></tr>';
        return;
      }

      let html = '';
      approvedExams.forEach(ex => {
        // Show status indicating if broadcasted
        const isBrd = ex.is_broadcasted ? true : false;
        const stateBadge = isBrd 
          ? `<span class="status-indicator-inline active"><i class="fa-solid fa-circle-nodes"></i> Broadcasted</span>`
          : `<span class="status-indicator-inline suspended"><i class="fa-solid fa-pause"></i> Draft Approval</span>`;
          
        const actionBtn = isBrd 
          ? '<span class="muted font-small"><i class="fa-solid fa-check-double"></i> Live for Students</span>'
          : `<button class="btn btn-action-small success-bg action-broadcast-exam" data-id="${ex.exam_id}"><i class="fa-solid fa-tower-broadcast"></i> Broadcast</button>`;

        html += `
          <tr>
            <td class="font-mono font-small">${ex.exam_id}</td>
            <td><strong>${escapeHtml(ex.title)}</strong></td>
            <td>${ex.duration} mins</td>
            <td>${stateBadge}</td>
            <td>${actionBtn}</td>
          </tr>
        `;
      });

      tbody.innerHTML = html;
      wireBroadcastActions();
    } catch {
      tbody.innerHTML = '<tr><td colspan="5" class="text-center error">Network exception loading Broadcast metrics.</td></tr>';
    }
  }

  function wireBroadcastActions() {
    const alertId = 'super-broadcasts-msg';

    document.querySelectorAll('.action-broadcast-exam').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        hideMessage(alertId);
        try {
          const { res, data } = await apiJson(`/api/admin/exams/${id}/broadcast`, { method: 'PUT' });
          if (res.ok) {
            showMessage(alertId, 'Exam broadcasted successfully! It is now active for students.', false);
            void loadBroadcastQueue();
            void loadOverviewStats();
          } else {
            showMessage(alertId, data.error || 'Failed to broadcast', true);
          }
        } catch {
          showMessage(alertId, 'Network error.', true);
        }
      });
    });
  }

  // --- 9. KaTeX Scientific Question Editor Live Preview Parser ---
  const qPromptInput = document.getElementById('q-text');
  const qAInput = document.getElementById('q-a');
  const qBInput = document.getElementById('q-b');
  const qCInput = document.getElementById('q-c');
  const qDInput = document.getElementById('q-d');

  function initLiveQuestionPreview() {
    const inputs = [qPromptInput, qAInput, qBInput, qCInput, qDInput];
    inputs.forEach(input => {
      if (input) {
        input.addEventListener('input', debounce(updatePreviewViewport, 200));
      }
    });

    const checkbox = document.getElementById('q-formatting');
    if (checkbox) {
      checkbox.addEventListener('change', updatePreviewViewport);
    }
  }

  function parseLaTeX(text) {
    if (!text) return '';
    // Look for $$ ... $$ patterns
    const regex = /\$\$([\s\S]*?)\$\$/g;
    
    // Return HTML string with parsed KaTeX or fallback
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

  function updatePreviewViewport() {
    const preview = document.getElementById('preview-viewport');
    const formattingEnabled = document.getElementById('q-formatting').checked;
    
    if (!preview) return;

    const pText = qPromptInput ? qPromptInput.value.trim() : '';
    const oA = qAInput ? qAInput.value.trim() : '';
    const oB = qBInput ? qBInput.value.trim() : '';
    const oC = qCInput ? qCInput.value.trim() : '';
    const oD = qDInput ? qDInput.value.trim() : '';

    if (!pText && !oA && !oB && !oC && !oD) {
      preview.innerHTML = `
        <div class="empty-preview-msg">
          <i class="fa-solid fa-square-poll-horizontal"></i>
          <p>Start typing question prompt or options above to see formulas compile here.</p>
        </div>
      `;
      return;
    }

    const processedPrompt = formattingEnabled ? parseLaTeX(pText) : escapeHtml(pText);
    const processedA = formattingEnabled ? parseLaTeX(oA) : escapeHtml(oA);
    const processedB = formattingEnabled ? parseLaTeX(oB) : escapeHtml(oB);
    const processedC = formattingEnabled ? parseLaTeX(oC) : escapeHtml(oC);
    const processedD = formattingEnabled ? parseLaTeX(oD) : escapeHtml(oD);

    let html = `
      <div class="preview-question-box">
        <div class="preview-prompt-label">Live Prompt Rendering</div>
        <div class="preview-prompt-content">${processedPrompt || '<span class="muted font-small">No text prompt</span>'}</div>
        
        <div class="preview-options-label">Options Rendering</div>
        <div class="preview-options-grid">
          <div class="preview-option-tile"><span class="opt-badge">A</span> ${processedA || '<span class="muted">Empty</span>'}</div>
          <div class="preview-option-tile"><span class="opt-badge">B</span> ${processedB || '<span class="muted">Empty</span>'}</div>
          <div class="preview-option-tile"><span class="opt-badge">C</span> ${processedC || '<span class="muted">Empty</span>'}</div>
          <div class="preview-option-tile"><span class="opt-badge">D</span> ${processedD || '<span class="muted">Empty</span>'}</div>
        </div>
      </div>
    `;

    preview.innerHTML = html;
  }

  // --- Classrooms & Academic Structure Loaders ---
  async function loadAdminClassrooms() {
    const tbody = document.getElementById('admin-classrooms-tbody');
    if (!tbody) return;
    try {
      const { res, data } = await apiJson('/api/classrooms');
      const list = data.classrooms || [];
      if (!list.length) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center muted">No classrooms created yet. Click "Create New Classroom" to get started.</td></tr>';
        return;
      }
      tbody.innerHTML = list.map(c => `
        <tr>
          <td><code>${escapeHtml(c.class_code)}</code></td>
          <td><strong>${escapeHtml(c.name)}</strong></td>
          <td>${escapeHtml(c.subject_name || c.subject_code || '-')}</td>
          <td>${escapeHtml(c.tutor_name || c.tutor_username || 'Unassigned')}</td>
          <td>${escapeHtml(c.term_name || '-')}</td>
          <td><span class="badge badge-primary">${c.student_count || 0} Students</span></td>
          <td>
            <a href="/classroom.html?id=${c.id}" class="btn btn-admin-primary btn-sm" target="_blank"><i class="fa-solid fa-arrow-up-right-from-square"></i> Open</a>
          </td>
        </tr>
      `).join('');
    } catch {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center text-danger">Failed to load classrooms.</td></tr>';
    }
  }

  async function loadAdminAcademics() {
    try {
      const [termsRes, classesRes, subjectsRes] = await Promise.all([
        apiJson('/api/admin/terms'),
        apiJson('/api/admin/classes'),
        apiJson('/api/admin/subjects')
      ]);

      const termsBox = document.getElementById('terms-list-box');
      const terms = termsRes.data.terms || [];
      if (termsBox) {
        termsBox.innerHTML = terms.length ? terms.map(t => `
          <div class="p-2 mb-1 border-bottom d-flex justify-content-between">
            <span><strong>${escapeHtml(t.term_name)}</strong> (${escapeHtml(t.academic_year)})</span>
            ${t.is_current ? '<span class="badge badge-success">Active</span>' : ''}
          </div>
        `).join('') : '<p class="muted small">No terms created.</p>';
      }

      const classesBox = document.getElementById('classes-list-box');
      const classes = classesRes.data.classes || [];
      if (classesBox) {
        classesBox.innerHTML = classes.length ? classes.map(cl => `
          <div class="p-2 mb-1 border-bottom">
            <code>${escapeHtml(cl.code)}</code> — <strong>${escapeHtml(cl.name)}</strong>
          </div>
        `).join('') : '<p class="muted small">No classes created.</p>';
      }

      const subjectsBox = document.getElementById('subjects-list-box');
      const subjects = subjectsRes.data.subjects || [];
      if (subjectsBox) {
        subjectsBox.innerHTML = subjects.length ? subjects.map(s => `
          <div class="p-2 mb-1 border-bottom">
            <code>${escapeHtml(s.code)}</code> — <strong>${escapeHtml(s.name)}</strong>
          </div>
        `).join('') : '<p class="muted small">No subjects created.</p>';
      }
    } catch (e) {
      console.error(e);
    }
  }

  // Utility functions
  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function debounce(func, wait) {
    let timeout;
    return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  // --- 10. Initialization ---
  async function init() {
    initTabs();
    bindProfilePhotoUpload();
    await loadAdminInfo();
    initLiveQuestionPreview();
  }

  void init();
})();

/**
 * toggleCpwdVis — global helper called by inline onclick on password eye-icons.
 * Toggles a password input between text/password and swaps the eye icon.
 */
function toggleCpwdVis(inputId, iconSpan) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const isHidden = input.type === 'password';
  input.type = isHidden ? 'text' : 'password';
  const icon = iconSpan.querySelector('i');
  if (icon) {
    icon.className = isHidden ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye';
  }
}