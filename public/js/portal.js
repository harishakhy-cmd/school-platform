'use strict';

document.addEventListener('DOMContentLoaded', async () => {
  let currentUser = null;
  let currentRole = 'student';

  // 1. Authenticate user & load session
  try {
    const authRes = await fetch('/api/auth/me');
    const authData = await authRes.json();

    if (authData.registration_number) {
      currentUser = authData;
      currentRole = 'student';
      document.getElementById('user-display-name').textContent = authData.name || 'Student';
      document.getElementById('user-reg-code').textContent = authData.registration_number;
      document.getElementById('greeting-title').textContent = `Welcome back, ${authData.name || 'Student'}!`;
    } else {
      // Check admin/tutor session
      const adminRes = await fetch('/api/admin/auth/me');
      const adminData = await adminRes.json();
      if (adminData.username) {
        currentUser = adminData;
        currentRole = adminData.role || 'tutor';
        document.getElementById('user-display-name').textContent = adminData.username;
        document.getElementById('user-reg-code').textContent = adminData.admin_code || adminData.role;
        document.getElementById('greeting-title').textContent = `Welcome back, ${adminData.username}!`;
        document.getElementById('user-avatar-icon').className = 'fa-solid fa-user-tie';
      } else {
        window.location.href = '/login.html';
        return;
      }
    }
  } catch {
    window.location.href = '/login.html';
    return;
  }

  const photoImage = document.getElementById('user-avatar-photo');
  const photoFallback = document.getElementById('user-avatar-icon');
  const photoInput = document.getElementById('user-photo-input');
  const photoButton = document.getElementById('btn-change-user-photo');
  const photoStatus = document.getElementById('user-photo-status');
  const renderUserPhoto = (url) => window.renderProfilePhoto(photoImage, photoFallback, url);
  if (currentRole === 'student') {
    renderUserPhoto(currentUser.profile_photo_url);
  } else {
    try {
      const profileRes = await fetch('/api/admin/settings/profile', { credentials: 'same-origin' });
      const profileData = await profileRes.json();
      if (profileRes.ok) renderUserPhoto(profileData.profile?.avatar_url);
      else if (profileRes.status === 403) photoButton.hidden = true;
      else photoStatus.textContent = profileData.error || 'Could not load profile photo.';
    } catch (error) {
      photoStatus.textContent = 'Could not load profile photo.';
      console.error('Error loading portal profile photo:', error);
    }
  }
  photoButton.addEventListener('click', () => photoInput.click());
  photoInput.addEventListener('change', async () => {
    const file = photoInput.files[0];
    if (!file) return;
    photoStatus.textContent = 'Uploading photo…';
    photoButton.disabled = true;
    try {
      const endpoint = currentRole === 'student'
        ? '/api/auth/profile/photo'
        : '/api/admin/settings/profile/photo';
      const result = await window.uploadProfilePhoto(file, endpoint);
      const photoUrl = result.profile_photo_url || result.avatar_url;
      renderUserPhoto(photoUrl);
      if (currentRole === 'student') currentUser.profile_photo_url = photoUrl;
      photoStatus.textContent = 'Profile photo updated.';
      window.dispatchEvent(new CustomEvent('profile-photo-updated', { detail: { photoUrl } }));
    } catch (error) {
      photoStatus.textContent = error.message;
    } finally {
      photoButton.disabled = false;
      photoInput.value = '';
    }
  });

  // 2. Load Classrooms
  loadClassrooms();

  // 3. Load CBT Examinations
  loadCBTExams();

  // 4. Load Notifications
  loadNotifications();

  // 5. Load Pending Assignments & Calendar
  loadCalendarAndTasks();

  // Logout button
  document.getElementById('btn-portal-logout').addEventListener('click', async () => {
    try {
      if (currentRole === 'student') {
        await fetch('/api/auth/logout', { method: 'POST' });
      } else {
        await fetch('/api/admin/auth/logout', { method: 'POST' });
      }
    } finally {
      window.location.href = '/login.html';
    }
  });

  // Notifications Bell toggle
  const notifBell = document.getElementById('btn-notif-bell');
  const notifPanel = document.getElementById('notif-panel');
  notifBell.addEventListener('click', () => {
    notifPanel.classList.toggle('hidden');
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.notif-dropdown-wrapper')) {
      notifPanel.classList.add('hidden');
    }
  });

  document.getElementById('btn-mark-all-read').addEventListener('click', async () => {
    await fetch('/api/notifications/read-all', { method: 'PUT' });
    loadNotifications();
  });

  // AI Assistant Modal
  const aiModal = document.getElementById('ai-modal');
  const btnOpenAi = document.getElementById('btn-open-ai');
  const btnCloseAi = document.getElementById('btn-close-ai');

  btnOpenAi.addEventListener('click', () => aiModal.classList.remove('hidden'));
  btnCloseAi.addEventListener('click', () => aiModal.classList.add('hidden'));

  async function handleAiAction(action) {
    const prompt = document.getElementById('ai-prompt').value.trim();
    if (!prompt) {
      alert('Please enter a concept or question to ask the AI.');
      return;
    }

    const box = document.getElementById('ai-response-box');
    const content = document.getElementById('ai-response-content');
    box.classList.remove('hidden');
    content.innerHTML = '<p class="muted"><i class="fa-solid fa-spinner fa-spin"></i> Generating explanation...</p>';

    try {
      const res = await fetch('/api/ai/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, action })
      });
      const data = await res.json();
      if (!res.ok) {
        content.innerHTML = `<p class="text-danger"><i class="fa-solid fa-triangle-exclamation"></i> ${data.error || 'AI assistance unavailable'}</p>`;
        return;
      }
      content.innerHTML = `<div class="markdown-body">${data.response.replace(/\n/g, '<br>')}</div>`;
    } catch {
      content.innerHTML = '<p class="text-danger">Failed to reach AI service.</p>';
    }
  }

  document.getElementById('btn-ai-explain').addEventListener('click', () => handleAiAction('explain'));
  document.getElementById('btn-ai-practice').addEventListener('click', () => handleAiAction('practice_questions'));
  document.getElementById('btn-ai-summarize').addEventListener('click', () => handleAiAction('summarize'));

  // --- Helpers ---
  async function loadClassrooms() {
    const grid = document.getElementById('classrooms-grid');
    try {
      const res = await fetch('/api/classrooms');
      const data = await res.json();
      const classrooms = data.classrooms || [];

      document.getElementById('classrooms-count-badge').textContent = `${classrooms.length} Class${classrooms.length === 1 ? '' : 'es'}`;
      document.getElementById('stat-enrollments').textContent = classrooms.length;

      if (!classrooms.length) {
        grid.innerHTML = `
          <div class="empty-state p-4 text-center">
            <i class="fa-solid fa-chalkboard fa-2x muted mb-2"></i>
            <p>No classrooms enrolled yet. Contact your administrator or tutor for registration.</p>
          </div>
        `;
        return;
      }

      grid.innerHTML = classrooms.map(c => `
        <div class="classroom-card card">
          <div class="classroom-card-header">
            <span class="subject-pill">${c.subject_name || c.subject_code || 'General'}</span>
            <span class="class-code-badge">${c.class_code}</span>
          </div>
          <div class="classroom-card-body">
            <h3 class="classroom-title">${c.name}</h3>
            <p class="classroom-meta-text">
              <i class="fa-solid fa-chalkboard-user"></i> ${c.tutor_name || c.tutor_username || 'Assigned Tutor'}
            </p>
            ${c.term_name ? `<p class="classroom-meta-text"><i class="fa-solid fa-calendar"></i> ${c.term_name} (${c.academic_year || ''})</p>` : ''}
          </div>
          <div class="classroom-card-footer">
            <span class="student-count-text"><i class="fa-solid fa-users"></i> ${c.student_count || 0} Students</span>
            <a href="/classroom.html?id=${c.id}" class="btn btn-primary btn-sm">Enter Classroom <i class="fa-solid fa-arrow-right"></i></a>
          </div>
        </div>
      `).join('');
    } catch {
      grid.innerHTML = '<p class="text-danger p-3">Failed to load classrooms.</p>';
    }
  }

  async function loadCBTExams() {
    const list = document.getElementById('portal-exams-list');
    try {
      const res = await fetch('/api/exams');
      const data = await res.json();
      const exams = data.exams || [];

      let completedCount = 0;

      if (!exams.length) {
        list.innerHTML = '<p class="muted p-3">No active examinations at this time.</p>';
        return;
      }

      list.innerHTML = exams.map(e => {
        let statusBadge = '<span class="badge badge-warning">Not Started</span>';
        let actionBtn = `<button type="button" class="btn btn-primary btn-sm btn-start-exam" data-id="${e.exam_id}"><i class="fa-solid fa-play"></i> Start Exam</button>`;

        if (e.attemptStatus === 'InProgress') {
          statusBadge = '<span class="badge badge-accent">In Progress</span>';
          actionBtn = `<button type="button" class="btn btn-accent btn-sm btn-start-exam" data-id="${e.exam_id}"><i class="fa-solid fa-rotate-right"></i> Resume Exam</button>`;
        } else if (e.attemptStatus === 'Submitted') {
          completedCount++;
          statusBadge = '<span class="badge badge-success">Submitted</span>';
          actionBtn = `<a href="/result.html?exam_id=${e.exam_id}" class="btn btn-outline btn-sm"><i class="fa-solid fa-square-poll-vertical"></i> View Result</a>`;
        }

        return `
          <div class="exam-item-card card">
            <div class="exam-info">
              <h4>${e.title}</h4>
              <span class="muted small"><i class="fa-solid fa-clock"></i> ${e.duration} Minutes</span>
            </div>
            <div class="exam-status-action">
              ${statusBadge}
              ${actionBtn}
            </div>
          </div>
        `;
      }).join('');

      document.getElementById('stat-cbt-completed').textContent = completedCount;

      // Bind Start/Resume buttons
      document.querySelectorAll('.btn-start-exam').forEach(btn => {
        btn.addEventListener('click', async () => {
          const examId = btn.getAttribute('data-id');
          btn.disabled = true;
          btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Initializing...';
          try {
            const startRes = await fetch(`/api/exams/${examId}/start`, { method: 'POST' });
            const startData = await startRes.json();
            if (!startRes.ok) {
              alert(startData.error || 'Could not start exam');
              btn.disabled = false;
              btn.textContent = 'Start Exam';
              return;
            }
            window.location.href = `/exam.html?exam_id=${examId}`;
          } catch {
            alert('Failed to connect to exam server.');
            btn.disabled = false;
          }
        });
      });
    } catch {
      list.innerHTML = '<p class="text-danger p-3">Failed to load CBT examinations.</p>';
    }
  }

  async function loadNotifications() {
    try {
      const res = await fetch('/api/notifications');
      const data = await res.json();
      const notifs = data.notifications || [];
      const unread = data.unreadCount || 0;

      const badge = document.getElementById('notif-badge');
      if (unread > 0) {
        badge.textContent = unread;
        badge.classList.remove('hidden');
      } else {
        badge.classList.add('hidden');
      }

      const list = document.getElementById('notif-list');
      if (!notifs.length) {
        list.innerHTML = '<p class="muted p-3 text-center">No notifications yet.</p>';
        return;
      }

      list.innerHTML = notifs.map(n => `
        <div class="notif-item ${n.is_read ? '' : 'unread'}" data-id="${n.id}">
          <div class="notif-title">${n.title}</div>
          <div class="notif-message">${n.message}</div>
          <div class="notif-time">${new Date(n.created_at).toLocaleDateString()}</div>
        </div>
      `).join('');
    } catch (e) {
      console.error(e);
    }
  }

  async function loadCalendarAndTasks() {
    try {
      const res = await fetch('/api/calendar');
      const data = await res.json();
      const events = data.events || [];

      const schedList = document.getElementById('upcoming-schedule-list');
      if (!events.length) {
        schedList.innerHTML = '<p class="muted p-2 text-center">No upcoming events scheduled.</p>';
      } else {
        schedList.innerHTML = events.slice(0, 5).map(ev => `
          <div class="schedule-item">
            <div class="sched-date">${new Date(ev.start_time).toLocaleDateString([], { month: 'short', day: 'numeric' })}</div>
            <div class="sched-details">
              <strong>${ev.title}</strong>
              <span class="small muted">${ev.classroom_name ? ev.classroom_name + ' | ' : ''}${ev.event_type}</span>
            </div>
          </div>
        `).join('');
      }
    } catch (e) {
      console.error(e);
    }
  }
});
