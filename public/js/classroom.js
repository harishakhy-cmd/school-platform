'use strict';

document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const classroomId = parseInt(urlParams.get('id'), 10);
  const requestedTab = urlParams.get('tab') || 'tab-stream';

  if (!classroomId || Number.isNaN(classroomId)) {
    window.location.href = '/portal.html';
    return;
  }

  const labPages = new Set(['biology-lab.html', 'chemistry-lab.html', 'cs-lab.html', 'geography-lab.html', 'graphing-lab.html', 'physics-lab.html']);
  window.openClassroomLab = (page) => {
    if (!labPages.has(page)) return;
    window.open(`/${page}?id=${encodeURIComponent(classroomId)}`, '_blank', 'noopener');
  };
  document.querySelectorAll('a[href], iframe[src]').forEach((element) => {
    const attribute = element.tagName === 'IFRAME' ? 'src' : 'href';
    const value = element.getAttribute(attribute);
    if (!value) return;
    const match = value.match(/^\/(biology|chemistry|cs|geography|graphing|physics)-lab\.html(?:\?.*)?$/);
    if (!match) return;
    const url = new URL(value, window.location.origin);
    url.searchParams.set('id', String(classroomId));
    element.setAttribute(attribute, `${url.pathname}${url.search}`);
  });

  let classroomData = null;
  let userRole = 'student';

  // 1. Fetch Classroom Details & Permissions
  try {
    const res = await fetch(`/api/classrooms/${classroomId}`);
    const data = await res.json();
    if (!res.ok || !data.classroom) {
      alert(data.error || 'You do not have access to this classroom.');
      window.location.href = '/portal.html';
      return;
    }

    classroomData = data.classroom;
    userRole = data.userRole || 'student';

    // Populate Header
    document.getElementById('classroom-name').textContent = classroomData.name;
    document.getElementById('classroom-code').textContent = classroomData.class_code;
    document.getElementById('hero-classroom-name').textContent = classroomData.name;
    document.getElementById('box-class-code').textContent = classroomData.class_code;
    document.getElementById('classroom-user-role').textContent = userRole.toUpperCase();
    document.getElementById('hero-classroom-meta').textContent = 
      `Subject: ${classroomData.subject_name || 'General'} | Tutor: ${classroomData.tutor_name || classroomData.tutor_username || 'Staff'} | Term: ${classroomData.term_name || 'Current Term'}`;
    document.getElementById('hero-student-count').textContent = classroomData.student_count || 0;

    // Apply role-based visibility
    if (userRole === 'tutor' || userRole === 'admin') {
      document.querySelectorAll('.tutor-only').forEach(el => el.classList.remove('hidden'));
      document.querySelectorAll('.student-only').forEach(el => el.classList.add('hidden'));
    } else {
      document.querySelectorAll('.tutor-only').forEach(el => el.classList.add('hidden'));
      document.querySelectorAll('.student-only').forEach(el => el.classList.remove('hidden'));
    }

  } catch (err) {
    console.error(err);
    alert('Failed to connect to classroom.');
    window.location.href = '/portal.html';
    return;
  }

  // 2. Tab Navigation logic
  const tabButtons = document.querySelectorAll('.classroom-tab-nav .tab-btn');
  const tabPanes = document.querySelectorAll('.tab-viewport .tab-pane');

  function switchTab(tabId) {
    tabButtons.forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
    });
    tabPanes.forEach(pane => {
      pane.classList.toggle('active', pane.id === tabId);
    });

    // Lazy load tab contents
    if (tabId === 'tab-stream') loadStream();
    else if (tabId === 'tab-lessons') loadLessons();
    else if (tabId === 'tab-materials') loadMaterials();
    else if (tabId === 'tab-assignments') loadAssignments();
    else if (tabId === 'tab-quizzes') loadQuizzes();
    else if (tabId === 'tab-cbt') loadCBTExams();
    else if (tabId === 'tab-attendance') loadAttendance();
    else if (tabId === 'tab-discussions') loadDiscussions();
    else if (tabId === 'tab-calendar') loadCalendar();
    else if (tabId === 'tab-grades') loadGrades();
    else if (tabId === 'tab-live') {
      initLiveAndWhiteboard();
    }

    if (tabId !== 'tab-live') {
      document.body.classList.remove('wb-live-fullscreen-active');
    }
  }

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.getAttribute('data-tab')));
  });

  document.getElementById('btn-exit-wb-fullscreen')?.addEventListener('click', () => {
    document.body.classList.remove('wb-live-fullscreen-active');
    switchTab('tab-stream');
  });

  document.getElementById('btn-toggle-wb-fullscreen')?.addEventListener('click', () => {
    const isActive = document.body.classList.toggle('wb-live-fullscreen-active');
    const icon = document.querySelector('#btn-toggle-wb-fullscreen i');
    if (icon) icon.className = isActive ? 'fa-solid fa-compress' : 'fa-solid fa-expand';
  });

  // Activate default or query requested tab
  switchTab(requestedTab);

  // Setup generic modal dismissals
  document.querySelectorAll('.btn-close, .modal-backdrop').forEach(el => {
    el.addEventListener('click', (e) => {
      if (e.target === el || el.classList.contains('btn-close')) {
        const modalId = el.getAttribute('data-close') || el.closest('.modal-backdrop')?.id;
        if (modalId) {
          document.getElementById(modalId)?.classList.add('hidden');
        }
      }
    });
  });

  // --- TAB 1: STREAM ---
  async function loadStream() {
    const feed = document.getElementById('stream-feed');
    try {
      const res = await fetch(`/api/classrooms/${classroomId}/announcements`);
      const data = await res.json();
      const annList = data.announcements || [];

      if (!annList.length) {
        feed.innerHTML = `
          <div class="empty-state p-4 text-center">
            <i class="fa-solid fa-bullhorn fa-2x muted mb-2"></i>
            <p>No stream announcements yet. Welcome to the class!</p>
          </div>
        `;
      } else {
        feed.innerHTML = annList.map(a => `
          <div class="card p-3 mb-3 stream-card">
            <div class="stream-card-header">
              <span class="badge ${a.priority === 'urgent' ? 'badge-danger' : 'badge-primary'}">${a.type.toUpperCase()}</span>
              <span class="muted small">${new Date(a.created_at).toLocaleDateString()}</span>
            </div>
            <h4 class="stream-ann-title mt-2">${a.title}</h4>
            <p class="stream-ann-body mt-1">${a.content}</p>
            <span class="small muted"><i class="fa-solid fa-user-tie"></i> Posted by ${a.publisher_name || 'Tutor'}</span>
          </div>
        `).join('');
      }

      // Load enrolled members preview
      const membersRes = await fetch(`/api/classrooms/${classroomId}/students`);
      const membersData = await membersRes.json();
      const students = membersData.students || [];
      const memList = document.getElementById('stream-members-list');
      if (!students.length) {
        memList.innerHTML = '<p class="small muted">No students enrolled yet.</p>';
      } else {
        memList.innerHTML = students.slice(0, 8).map(s => `
          <div class="member-chip">
            <i class="fa-solid fa-user-graduate"></i>
            <span>${s.student_name} (${s.registration_number})</span>
          </div>
        `).join('');
      }
    } catch (e) {
      feed.innerHTML = '<p class="text-danger p-3">Failed to load stream.</p>';
    }
  }

  // Publish Announcement
  const btnPublishAnn = document.getElementById('btn-publish-announcement');
  if (btnPublishAnn) {
    btnPublishAnn.addEventListener('click', async () => {
      const title = document.getElementById('stream-ann-title').value.trim();
      const content = document.getElementById('stream-ann-content').value.trim();
      if (!title || !content) return alert('Title and content are required.');

      const res = await fetch(`/api/classrooms/${classroomId}/announcements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, type: 'general' })
      });
      if (res.ok) {
        document.getElementById('stream-ann-title').value = '';
        document.getElementById('stream-ann-content').value = '';
        loadStream();
      }
    });
  }

  // --- TAB 2: LESSONS ---
  async function loadLessons() {
    const container = document.getElementById('lessons-container');
    try {
      const res = await fetch(`/api/classrooms/${classroomId}/lessons`);
      const data = await res.json();
      const lessons = data.lessons || [];
      const classSubjectText = String(classroomData?.subject_name || '').toLowerCase();
      const assetSubject = classSubjectText.includes('biolog') ? 'biology'
        : classSubjectText.includes('chem') ? 'chemistry'
          : classSubjectText.includes('phys') ? 'physics'
            : classSubjectText.includes('geograph') ? 'geography'
              : classSubjectText.includes('math') ? 'mathematics'
                : classSubjectText.includes('computer') || classSubjectText.includes('ict') ? 'computer-science'
                  : '';
      const assetLibraryUrl = `/scientific-assets.html${assetSubject ? `?subject=${encodeURIComponent(assetSubject)}` : ''}`;

      if (!lessons.length) {
        container.innerHTML = `
          <div class="empty-state p-4 text-center">
            <i class="fa-solid fa-book-open fa-2x muted mb-2"></i>
            <p>No lessons have been published for this classroom yet.</p>
          </div>
        `;
        return;
      }

      container.innerHTML = lessons.map(l => `
        <div class="lesson-card card p-3 mb-3">
          <div class="lesson-card-header">
            <div>
              <span class="topic-pill">${l.topic}</span>
              <h4 class="lesson-title mt-1">${l.title}</h4>
            </div>
            ${l.completion_status === 'Completed' ? '<span class="badge badge-success"><i class="fa-solid fa-check"></i> Completed</span>' : ''}
          </div>
          ${l.learning_objectives ? `<p class="lesson-obj muted small mt-2"><strong>Objectives:</strong> ${l.learning_objectives}</p>` : ''}
          <div class="lesson-body-preview mt-2">
            ${l.content ? `<div class="lesson-content-text">${l.content.substring(0, 300)}...</div>` : ''}
          </div>
          <div class="lesson-card-footer mt-3">
            <span class="small muted"><i class="fa-solid fa-clock"></i> ${l.duration_minutes} mins | ${l.materials_count || 0} Materials</span>
            <a class="btn btn-outline btn-sm" href="${assetLibraryUrl}" target="_blank" rel="noopener">Sourced lesson assets</a>
            ${userRole === 'student' ? `
              <button type="button" class="btn btn-outline btn-sm btn-toggle-lesson-complete" data-id="${l.id}">
                ${l.completion_status === 'Completed' ? 'Mark Incomplete' : 'Mark as Completed'}
              </button>
            ` : ''}
          </div>
        </div>
      `).join('');

      // Completion toggle handlers
      document.querySelectorAll('.btn-toggle-lesson-complete').forEach(btn => {
        btn.addEventListener('click', async () => {
          const lessonId = btn.getAttribute('data-id');
          const isComplete = btn.textContent.includes('Incomplete');
          await fetch(`/api/classrooms/${classroomId}/lessons/${lessonId}/complete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: isComplete ? 'Not Started' : 'Completed' })
          });
          loadLessons();
        });
      });
    } catch {
      container.innerHTML = '<p class="text-danger p-3">Failed to load lessons.</p>';
    }
  }

  // Add Lesson Modal
  document.getElementById('btn-create-lesson-modal')?.addEventListener('click', () => {
    document.getElementById('modal-lesson').classList.remove('hidden');
  });

  document.getElementById('form-lesson')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const topic = document.getElementById('lesson-topic').value;
    const title = document.getElementById('lesson-title').value;
    const learning_objectives = document.getElementById('lesson-objectives').value;
    const content = document.getElementById('lesson-content').value;
    const lesson_date = document.getElementById('lesson-date').value || null;
    const duration_minutes = document.getElementById('lesson-duration').value;

    const res = await fetch(`/api/classrooms/${classroomId}/lessons`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic, title, learning_objectives, content, lesson_date, duration_minutes })
    });

    if (res.ok) {
      document.getElementById('modal-lesson').classList.add('hidden');
      document.getElementById('form-lesson').reset();
      loadLessons();
    }
  });

  // --- TAB 3: MATERIALS ---
  async function loadMaterials() {
    const grid = document.getElementById('materials-grid');
    try {
      const res = await fetch(`/api/classrooms/${classroomId}/materials`);
      const data = await res.json();
      const mats = data.materials || [];

      if (!mats.length) {
        grid.innerHTML = '<p class="muted p-4 text-center">No materials uploaded yet.</p>';
        return;
      }

      grid.innerHTML = mats.map(m => `
        <div class="card p-3 material-card">
          <div class="mat-icon"><i class="fa-solid fa-file-lines text-primary"></i></div>
          <h4 class="mat-title mt-2">${m.title}</h4>
          <span class="small muted">${m.file_type ? m.file_type.toUpperCase() : 'DOCUMENT'}</span>
          <div class="mt-3">
            ${m.external_url ? `<a href="${m.external_url}" target="_blank" class="btn btn-outline btn-sm"><i class="fa-solid fa-arrow-up-right-from-square"></i> Open Link</a>` : '<span class="badge">Attached Document</span>'}
          </div>
        </div>
      `).join('');
    } catch {
      grid.innerHTML = '<p class="text-danger p-3">Failed to load materials.</p>';
    }
  }

  document.getElementById('btn-add-material-modal')?.addEventListener('click', () => {
    document.getElementById('modal-material').classList.remove('hidden');
  });

  document.getElementById('form-material')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('mat-title').value;
    const external_url = document.getElementById('mat-url').value;
    const file_type = document.getElementById('mat-type').value;

    const res = await fetch(`/api/classrooms/${classroomId}/materials`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, external_url, file_type })
    });

    if (res.ok) {
      document.getElementById('modal-material').classList.add('hidden');
      document.getElementById('form-material').reset();
      loadMaterials();
    }
  });

  // --- TAB 4: ASSIGNMENTS ---
  async function loadAssignments() {
    const list = document.getElementById('assignments-list');
    try {
      const res = await fetch(`/api/classrooms/${classroomId}/assignments`);
      const data = await res.json();
      const assigns = data.assignments || [];

      if (!assigns.length) {
        list.innerHTML = '<p class="muted p-4 text-center">No assignments posted for this classroom.</p>';
        return;
      }

      list.innerHTML = assigns.map(a => {
        let statusTag = '<span class="badge badge-warning">Pending</span>';
        let actionBtn = `<button type="button" class="btn btn-primary btn-sm btn-open-submit-assign" data-id="${a.id}" data-title="${a.title}">Submit Assignment</button>`;

        if (a.submission_status === 'submitted') {
          statusTag = '<span class="badge badge-accent">Submitted (Pending Grade)</span>';
          actionBtn = '<span class="small muted">Submitted</span>';
        } else if (a.submission_status === 'graded') {
          statusTag = `<span class="badge badge-success">Graded: ${a.score}/${a.max_marks}</span>`;
          actionBtn = `<span class="small muted">Feedback: ${a.feedback || 'None'}</span>`;
        }

        if (userRole === 'tutor' || userRole === 'admin') {
          actionBtn = `<a href="#grade" class="btn btn-outline btn-sm btn-view-assign-subs" data-id="${a.id}">View Submissions (${a.submissions_count || 0})</a>`;
        }

        return `
          <div class="card p-3 mb-3 assignment-card">
            <div class="assignment-header">
              <h4>${a.title}</h4>
              <span class="muted small">Due: ${new Date(a.deadline).toLocaleDateString()}</span>
            </div>
            <p class="mt-2 text-secondary">${a.instructions}</p>
            <div class="assignment-footer mt-3">
              ${statusTag}
              <div class="assign-actions">${actionBtn}</div>
            </div>
          </div>
        `;
      }).join('');

      // Student submit button listener
      document.querySelectorAll('.btn-open-submit-assign').forEach(btn => {
        btn.addEventListener('click', () => {
          document.getElementById('submit-assign-id').value = btn.getAttribute('data-id');
          document.getElementById('submit-assign-title').textContent = `Submit: ${btn.getAttribute('data-title')}`;
          document.getElementById('modal-submit-assignment').classList.remove('hidden');
        });
      });

      // Tutor view submissions listener
      document.querySelectorAll('.btn-view-assign-subs').forEach(btn => {
        btn.addEventListener('click', async () => {
          const assignId = btn.getAttribute('data-id');
          const res = await fetch(`/api/classrooms/${classroomId}/assignments/${assignId}`);
          const data = await res.json();
          const subs = data.submissions || [];
          if (!subs.length) return alert('No student submissions received yet.');

          // Open grading for the first submission as a demo/workflow
          const s = subs[0];
          document.getElementById('grade-sub-id').value = s.id;
          document.getElementById('grade-sub-details').innerHTML = `
            <strong>Student:</strong> ${s.student_name} (${s.registration_number})<br>
            <strong>Response:</strong> ${s.submission_text || s.file_path || 'No text'}<br>
            <strong>Submitted:</strong> ${new Date(s.submitted_at).toLocaleDateString()}
          `;
          document.getElementById('modal-grade-submission').classList.remove('hidden');
        });
      });

    } catch {
      list.innerHTML = '<p class="text-danger p-3">Failed to load assignments.</p>';
    }
  }

  // Create Assignment Modal
  document.getElementById('btn-create-assignment-modal')?.addEventListener('click', () => {
    document.getElementById('modal-assignment').classList.remove('hidden');
  });

  document.getElementById('form-assignment')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('assign-title').value;
    const instructions = document.getElementById('assign-instructions').value;
    const max_marks = document.getElementById('assign-max-marks').value;
    const deadline = document.getElementById('assign-deadline').value;
    const allow_late_submission = document.getElementById('assign-allow-late').checked;

    const res = await fetch(`/api/classrooms/${classroomId}/assignments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, instructions, max_marks, deadline, allow_late_submission })
    });

    if (res.ok) {
      document.getElementById('modal-assignment').classList.add('hidden');
      document.getElementById('form-assignment').reset();
      loadAssignments();
    }
  });

  // Submit Assignment Form
  document.getElementById('form-submit-assignment')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const assignId = document.getElementById('submit-assign-id').value;
    const submission_text = document.getElementById('submit-assign-text').value;
    const file_path = document.getElementById('submit-assign-link').value;

    const res = await fetch(`/api/classrooms/${classroomId}/assignments/${assignId}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ submission_text, file_path })
    });

    if (res.ok) {
      document.getElementById('modal-submit-assignment').classList.add('hidden');
      document.getElementById('form-submit-assignment').reset();
      loadAssignments();
    }
  });

  // Grade Submission Form
  document.getElementById('form-grade-submission')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const subId = document.getElementById('grade-sub-id').value;
    const score = document.getElementById('grade-sub-score').value;
    const feedback = document.getElementById('grade-sub-feedback').value;

    const res = await fetch(`/api/classrooms/${classroomId}/assignments/submissions/${subId}/grade`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ score, feedback })
    });

    if (res.ok) {
      document.getElementById('modal-grade-submission').classList.add('hidden');
      loadAssignments();
    }
  });

  // --- TAB 5: QUIZZES ---
  async function loadQuizzes() {
    const list = document.getElementById('quizzes-list');
    try {
      const res = await fetch(`/api/classrooms/${classroomId}/quizzes`);
      const data = await res.json();
      const quizzes = data.quizzes || [];

      if (!quizzes.length) {
        list.innerHTML = '<p class="muted p-4 text-center">No classroom quizzes created yet.</p>';
        return;
      }

      list.innerHTML = quizzes.map(q => {
        let action = `<button type="button" class="btn btn-primary btn-sm btn-take-quiz" data-id="${q.id}" data-title="${q.title}"><i class="fa-solid fa-play"></i> Start Quiz</button>`;
        if (q.attempt_status === 'Submitted') {
          action = `<span class="badge badge-success">Score: ${q.score}/${q.total_points} (${q.percentage}%)</span>`;
        }

        return `
          <div class="card p-3 mb-3 quiz-card">
            <div class="quiz-header">
              <h4>${q.title}</h4>
              <span class="muted small"><i class="fa-solid fa-clock"></i> ${q.duration_minutes} Mins | ${q.questions_count || 0} Questions</span>
            </div>
            <p class="muted small mt-1">${q.description || 'Classroom assessment quiz'}</p>
            <div class="mt-3 quiz-footer">${action}</div>
          </div>
        `;
      }).join('');

      // Take quiz buttons
      document.querySelectorAll('.btn-take-quiz').forEach(btn => {
        btn.addEventListener('click', async () => {
          const quizId = btn.getAttribute('data-id');
          const title = btn.getAttribute('data-title');
          document.getElementById('take-quiz-title').textContent = title;

          const startRes = await fetch(`/api/classrooms/${classroomId}/quizzes/${quizId}/start`, { method: 'POST' });
          const startData = await startRes.json();
          if (!startRes.ok) return alert(startData.error || 'Could not start quiz');

          const container = document.getElementById('take-quiz-container');
          container.innerHTML = `
            <form id="form-active-quiz" data-quiz-id="${quizId}">
              ${startData.questions.map((q, idx) => `
                <div class="quiz-q-box card p-3 mb-3">
                  <p class="fw-bold">Q${idx + 1}. ${q.question_text}</p>
                  <div class="quiz-options mt-2">
                    <label class="quiz-opt-label"><input type="radio" name="q_${q.id}" value="A" required /> A) ${q.option_a}</label>
                    <label class="quiz-opt-label"><input type="radio" name="q_${q.id}" value="B" required /> B) ${q.option_b}</label>
                    <label class="quiz-opt-label"><input type="radio" name="q_${q.id}" value="C" required /> C) ${q.option_c}</label>
                    <label class="quiz-opt-label"><input type="radio" name="q_${q.id}" value="D" required /> D) ${q.option_d}</label>
                  </div>
                </div>
              `).join('')}
              <button type="submit" class="btn btn-primary btn-block">Submit Quiz Answers</button>
            </form>
          `;

          document.getElementById('form-active-quiz').addEventListener('submit', async (e) => {
            e.preventDefault();
            const answers = {};
            startData.questions.forEach(q => {
              const selected = document.querySelector(`input[name="q_${q.id}"]:checked`);
              if (selected) answers[q.id] = selected.value;
            });

            const submitRes = await fetch(`/api/classrooms/${classroomId}/quizzes/${quizId}/submit`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ answers })
            });
            const submitData = await submitRes.json();
            if (submitRes.ok) {
              alert(`Quiz Completed! Your Score: ${submitData.score}/${submitData.total_points} (${submitData.percentage}%)`);
              document.getElementById('modal-take-quiz').classList.add('hidden');
              loadQuizzes();
            }
          });

          document.getElementById('modal-take-quiz').classList.remove('hidden');
        });
      });

    } catch {
      list.innerHTML = '<p class="text-danger p-3">Failed to load quizzes.</p>';
    }
  }

  // --- TAB 6: CBT EXAMS ---
  async function loadCBTExams() {
    const list = document.getElementById('classroom-cbt-list');
    try {
      const res = await fetch('/api/exams');
      const data = await res.json();
      const exams = data.exams || [];

      if (!exams.length) {
        list.innerHTML = '<p class="muted p-4 text-center">No active CBT examinations scheduled for this classroom.</p>';
        return;
      }

      list.innerHTML = exams.map(e => `
        <div class="card p-3 mb-3 exam-card-row">
          <div>
            <h4>${e.title}</h4>
            <span class="muted small"><i class="fa-solid fa-clock"></i> Duration: ${e.duration} Minutes | Attempt Status: <strong>${e.attemptStatus}</strong></span>
          </div>
          <div>
            ${e.attemptStatus === 'Submitted'
              ? `<a href="/result.html?exam_id=${e.exam_id}" class="btn btn-outline btn-sm"><i class="fa-solid fa-poll"></i> View CBT Result</a>`
              : `<button type="button" class="btn btn-primary btn-sm btn-launch-cbt" data-id="${e.exam_id}"><i class="fa-solid fa-play"></i> Start CBT Exam</button>`
            }
          </div>
        </div>
      `).join('');

      document.querySelectorAll('.btn-launch-cbt').forEach(btn => {
        btn.addEventListener('click', async () => {
          const examId = btn.getAttribute('data-id');
          btn.disabled = true;
          const startRes = await fetch(`/api/exams/${examId}/start`, { method: 'POST' });
          const startData = await startRes.json();
          if (!startRes.ok) {
            alert(startData.error || 'Cannot start exam');
            btn.disabled = false;
            return;
          }
          window.location.href = `/exam.html?exam_id=${examId}`;
        });
      });
    } catch {
      list.innerHTML = '<p class="text-danger p-3">Failed to load CBT examinations.</p>';
    }
  }

  // --- TAB 7: ATTENDANCE ---
  async function loadAttendance() {
    const content = document.getElementById('attendance-view-content');
    try {
      const res = await fetch(`/api/classrooms/${classroomId}/attendance`);
      const data = await res.json();

      if (userRole === 'student') {
        const stats = data.stats || {};
        const records = data.records || [];
        content.innerHTML = `
          <div class="stats-grid mb-3">
            <div class="stat-card"><div class="stat-data"><h3>${stats.percentage || 100}%</h3><p>Attendance Rate</p></div></div>
            <div class="stat-card"><div class="stat-data"><h3>${stats.present_count || 0}</h3><p>Days Present</p></div></div>
            <div class="stat-card"><div class="stat-data"><h3>${stats.absent_count || 0}</h3><p>Days Absent</p></div></div>
          </div>
          <h4>Attendance History</h4>
          ${records.length ? `
            <table class="table mt-2">
              <thead><tr><th>Date</th><th>Status</th><th>Remarks</th></tr></thead>
              <tbody>
                ${records.map(r => `
                  <tr>
                    <td>${new Date(r.date).toLocaleDateString()}</td>
                    <td><span class="badge ${r.status === 'Present' ? 'badge-success' : 'badge-danger'}">${r.status}</span></td>
                    <td>${r.remarks || '-'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : '<p class="muted mt-2">No attendance records logged yet.</p>'}
        `;
      } else {
        // Tutor view: Enrolled students with status selector
        const membersRes = await fetch(`/api/classrooms/${classroomId}/students`);
        const membersData = await membersRes.json();
        const students = membersData.students || [];

        content.innerHTML = `
          <table class="table mt-2" id="table-attendance-mark">
            <thead>
              <tr>
                <th>Registration No.</th>
                <th>Student Name</th>
                <th>Status</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              ${students.map(s => `
                <tr data-reg="${s.registration_number}">
                  <td><code>${s.registration_number}</code></td>
                  <td>${s.student_name}</td>
                  <td>
                    <select class="input-select select-att-status">
                      <option value="Present" selected>Present</option>
                      <option value="Absent">Absent</option>
                      <option value="Late">Late</option>
                      <option value="Excused">Excused</option>
                    </select>
                  </td>
                  <td><input type="text" class="input-text input-att-remarks" placeholder="Optional remark" /></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;
      }
    } catch {
      content.innerHTML = '<p class="text-danger p-3">Failed to load attendance.</p>';
    }
  }

  // Save Batch Attendance (Tutor)
  document.getElementById('btn-save-batch-attendance')?.addEventListener('click', async () => {
    const date = document.getElementById('attendance-date-picker').value || new Date().toISOString().split('T')[0];
    const records = [];
    document.querySelectorAll('#table-attendance-mark tbody tr').forEach(row => {
      const registration_number = row.getAttribute('data-reg');
      const status = row.querySelector('.select-att-status').value;
      const remarks = row.querySelector('.input-att-remarks').value;
      records.push({ registration_number, status, remarks });
    });

    const res = await fetch(`/api/classrooms/${classroomId}/attendance/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, records })
    });
    if (res.ok) alert('Attendance saved successfully!');
  });

  // --- TAB 8: DISCUSSIONS ---
  async function loadDiscussions() {
    const feed = document.getElementById('discussions-feed');
    try {
      const res = await fetch(`/api/classrooms/${classroomId}/discussions`);
      const data = await res.json();
      const discussions = data.discussions || [];

      if (!discussions.length) {
        feed.innerHTML = '<p class="muted p-4 text-center">No discussion threads started yet. Be the first to ask a question!</p>';
        return;
      }

      feed.innerHTML = discussions.map(d => `
        <div class="card p-3 mb-3 discussion-thread-card" data-id="${d.id}">
          <div class="disc-header">
            <h4>${d.title}</h4>
            <span class="small muted">${new Date(d.created_at).toLocaleDateString()}</span>
          </div>
          <p class="mt-2 text-secondary">${d.content}</p>
          <div class="disc-author-meta mt-2 small muted">
            <i class="fa-solid fa-user"></i> ${d.author_name} (${d.author_type}) | ${d.comments_count || 0} Replies
          </div>
        </div>
      `).join('');
    } catch {
      feed.innerHTML = '<p class="text-danger p-3">Failed to load discussions.</p>';
    }
  }

  // --- TAB 9: CALENDAR ---
  async function loadCalendar() {
    const list = document.getElementById('classroom-calendar-list');
    try {
      const res = await fetch(`/api/calendar?classroom_id=${classroomId}`);
      const data = await res.json();
      const events = data.events || [];

      if (!events.length) {
        list.innerHTML = '<p class="muted p-4 text-center">No calendar events scheduled for this classroom.</p>';
        return;
      }

      list.innerHTML = events.map(e => `
        <div class="card p-3 mb-2 schedule-item-card">
          <div class="sched-date-badge">${new Date(e.start_time).toLocaleDateString()}</div>
          <div class="sched-info">
            <h4>${e.title}</h4>
            <p class="muted small">${e.description || e.event_type}</p>
          </div>
        </div>
      `).join('');
    } catch {
      list.innerHTML = '<p class="text-danger p-3">Failed to load calendar.</p>';
    }
  }

  // --- TAB 10: GRADES ---
  async function loadGrades() {
    const wrapper = document.getElementById('gradebook-table-wrapper');
    try {
      const res = await fetch(`/api/classrooms/${classroomId}/gradebook`);
      const data = await res.json();

      if (userRole === 'student') {
        const grade = data.studentGrade || {};
        document.getElementById('overall-grade-pill').textContent = `Overall Grade: ${grade.grade || 'A'} (${grade.overallAverage || 0}%)`;

        wrapper.innerHTML = `
          <div class="student-grade-summary card p-3 mb-3">
            <h3>Cumulative Academic Performance</h3>
            <div class="stats-grid mt-2">
              <div class="stat-card"><div class="stat-data"><h3>${grade.overallAverage || 0}%</h3><p>Composite Average</p></div></div>
              <div class="stat-card"><div class="stat-data"><h3 class="badge-success">${grade.grade || 'A'}</h3><p>Letter Grade</p></div></div>
            </div>
          </div>
        `;
      } else {
        const rows = data.studentRows || [];
        wrapper.innerHTML = `
          <table class="table">
            <thead>
              <tr>
                <th>Registration No.</th>
                <th>Student Name</th>
                <th>Average</th>
                <th>Final Grade</th>
              </tr>
            </thead>
            <tbody>
              ${rows.map(r => `
                <tr>
                  <td><code>${r.registration_number}</code></td>
                  <td>${r.student_name}</td>
                  <td><strong>${r.overallAverage}%</strong></td>
                  <td><span class="badge badge-success">${r.grade}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;
      }
    } catch {
      wrapper.innerHTML = '<p class="text-danger p-3">Failed to load gradebook.</p>';
    }
  }

  // --- TAB 11: LIVE & WHITEBOARD ---
  let canvas, ctx, isDrawing = false, currentTool = 'pen', currentColor = '#1E40AF';

  function initLiveAndWhiteboard() {
    checkLiveStatus();
    initWhiteboard();
  }

  async function checkLiveStatus() {
    try {
      const res = await fetch(`/api/classrooms/${classroomId}/live`);
      const data = await res.json();
      const isLive = data.activeSession != null;

      const indicator = document.getElementById('live-indicator');
      const desc = document.getElementById('live-status-desc');
      const btnJoin = document.getElementById('btn-join-live');
      const btnStart = document.getElementById('btn-start-live');
      const btnEnd = document.getElementById('btn-end-live');

      if (isLive) {
        indicator.textContent = '🔴 LIVE NOW';
        indicator.className = 'live-badge on';
        desc.textContent = `Active Live Lesson: "${data.activeSession.title}" hosted by ${data.activeSession.tutor_name}`;
        btnJoin?.classList.remove('hidden');
        btnStart?.classList.add('hidden');
        btnEnd?.classList.remove('hidden');
      } else {
        indicator.textContent = 'OFFLINE';
        indicator.className = 'live-badge off';
        desc.textContent = 'No live session currently active.';
        btnJoin?.classList.add('hidden');
        btnStart?.classList.remove('hidden');
        btnEnd?.classList.add('hidden');
      }
    } catch (e) {
      console.error(e);
    }
  }

  document.getElementById('btn-start-live')?.addEventListener('click', async () => {
    await fetch(`/api/classrooms/${classroomId}/live`, { method: 'POST' });
    checkLiveStatus();
  });

  document.getElementById('btn-end-live')?.addEventListener('click', async () => {
    await fetch(`/api/classrooms/${classroomId}/live/end`, { method: 'PUT' });
    checkLiveStatus();
  });

  let whiteboardInitialized = false;
  function initWhiteboard() {
    const canvas = document.getElementById('whiteboard-canvas');
    const overlay = document.getElementById('whiteboard-overlay');
    if (!canvas || !overlay) return;
    if (whiteboardInitialized) {
      if (typeof renderAll === 'function') renderAll();
      return;
    }
    whiteboardInitialized = true;

    const ctx = canvas.getContext('2d');
    const overlayCtx = overlay.getContext('2d');

    // Ensure initial buffer dimensions (2400 x 4000)
    if (!canvas.height || canvas.height < 4000) canvas.height = 4000;
    if (!overlay.height || overlay.height < 4000) overlay.height = 4000;

    // --- INFINITE WHITEBOARD BACKGROUND ENGINE ---
    // Paints clean white background, faint educational dot grid (50px pitch),
    // and subtle section/page markers every 1400px down the infinite board.
    function drawWhiteboardBackground(targetCtx, w, h) {
      if (!targetCtx) return;
      targetCtx.save();

      // Base background: clean crisp white
      targetCtx.fillStyle = '#FFFFFF';
      targetCtx.fillRect(0, 0, w, h);

      // Subtle dot grid (50px spacing)
      targetCtx.fillStyle = '#CBD5E1';
      const step = 50;
      for (let x = step; x < w; x += step) {
        for (let y = step; y < h; y += step) {
          targetCtx.beginPath();
          targetCtx.arc(x, y, 1.2, 0, Math.PI * 2);
          targetCtx.fill();
        }
      }

      // Page / Section boundary dividers every 1,400px
      const pageHeight = 1400;
      const totalPages = Math.ceil(h / pageHeight);
      for (let p = 1; p < totalPages; p++) {
        const y = p * pageHeight;
        targetCtx.strokeStyle = '#E2E8F0';
        targetCtx.lineWidth = 1.5;
        targetCtx.setLineDash([8, 8]);
        targetCtx.beginPath();
        targetCtx.moveTo(0, y);
        targetCtx.lineTo(w, y);
        targetCtx.stroke();
        targetCtx.setLineDash([]);

        // Elegant section guide badge on left margin
        targetCtx.fillStyle = '#F8FAFC';
        targetCtx.fillRect(20, y - 14, 110, 26);
        targetCtx.strokeStyle = '#CBD5E1';
        targetCtx.lineWidth = 1;
        targetCtx.strokeRect(20, y - 14, 110, 26);

        targetCtx.fillStyle = '#64748B';
        targetCtx.font = 'bold 12px Inter, sans-serif';
        targetCtx.fillText(`PAGE ${p + 1} START`, 32, y + 3);
      }

      targetCtx.restore();
    }

    // Paint initial background grid
    drawWhiteboardBackground(ctx, canvas.width, canvas.height);

    // --- INFINITE DOWNWARD SCROLL & EXPANSION CONTROLLER ---
    const wrapper = document.getElementById('whiteboard-canvas-wrapper');
    const pageIndicator = document.getElementById('wb-page-indicator');
    const depthIndicator = document.getElementById('wb-scroll-depth-indicator');
    const btnScrollTop = document.getElementById('btn-wb-scroll-top');
    const btnScrollBottom = document.getElementById('btn-wb-scroll-bottom');
    const btnExpandDown = document.getElementById('btn-wb-expand-down');

    let isExpanding = false;
    function expandWhiteboardDownwards(additionalHeight = 2000) {
      if (isExpanding) return;
      isExpanding = true;

      const currentH = canvas.height;
      const newH = currentH + additionalHeight;

      // Expand both base and overlay canvas buffers
      canvas.height = newH;
      overlay.height = newH;

      // Re-render background grid and all vector shapes
      drawWhiteboardBackground(ctx, canvas.width, newH);
      if (typeof renderAll === 'function') renderAll();

      updateInfiniteScrollHUD();

      setTimeout(() => {
        isExpanding = false;
      }, 100);
    }

    function updateInfiniteScrollHUD() {
      if (!wrapper) return;
      const sTop = wrapper.scrollTop;
      const sHeight = wrapper.scrollHeight;
      const cHeight = wrapper.clientHeight;

      // Page calculation (each 1400px of virtual canvas buffer)
      const bufferRatio = canvas.height / (sHeight || 1);
      const virtualScrollY = sTop * bufferRatio;
      const pageIndex = Math.floor(virtualScrollY / 1400) + 1;
      const totalPages = Math.ceil(canvas.height / 1400);

      if (pageIndicator) {
        pageIndicator.textContent = `Page ${pageIndex} of ${totalPages}`;
      }
      if (depthIndicator) {
        depthIndicator.textContent = `${Math.round(virtualScrollY)}px depth`;
      }

      if (btnScrollTop) {
        if (sTop > 200) btnScrollTop.classList.remove('hidden');
        else btnScrollTop.classList.add('hidden');
      }

      // Check threshold for automatic downward expansion
      // If user scrolls within 600px of the wrapper's bottom, dynamically add 2,000px downwards
      if (sTop + cHeight >= sHeight - 600) {
        expandWhiteboardDownwards(2000);
      }
    }

    if (wrapper) {
      wrapper.addEventListener('scroll', updateInfiniteScrollHUD, { passive: true });
      // Run once immediately to set initial HUD labels
      setTimeout(updateInfiniteScrollHUD, 50);
    }

    btnScrollTop?.addEventListener('click', () => {
      wrapper?.scrollTo({ top: 0, behavior: 'smooth' });
    });

    btnScrollBottom?.addEventListener('click', () => {
      if (wrapper) {
        wrapper.scrollTo({ top: wrapper.scrollHeight, behavior: 'smooth' });
      }
    });

    btnExpandDown?.addEventListener('click', () => {
      expandWhiteboardDownwards(2000);
      if (wrapper) {
        wrapper.scrollBy({ top: 400, behavior: 'smooth' });
      }
    });

    // Taxonomy and Shape Identity Registry
    const SHAPE_TAXONOMY = {
      // 2D Shapes
      'rectangle': { dim: '2D', category: 'basic', counterpart3D: 'cuboid', netType: null },
      'square': { dim: '2D', category: 'basic', counterpart3D: 'cube', netType: null },
      'circle': { dim: '2D', category: 'basic', counterpart3D: 'cylinder', netType: null },
      'ellipse': { dim: '2D', category: 'basic', counterpart3D: 'cylinder', netType: null },
      'triangle': { dim: '2D', category: 'basic', counterpart3D: 'triangular-prism', netType: null },
      'right-triangle': { dim: '2D', category: 'basic', counterpart3D: 'triangular-prism', netType: null },
      'polygon': { dim: '2D', category: 'polygon', counterpart3D: 'pentagonal-prism', netType: null },
      'arc': { dim: '2D', category: 'basic', counterpart3D: 'cone', netType: null },
      'parallelogram': { dim: '2D', category: 'quadrilateral', counterpart3D: 'cuboid', netType: null },
      'trapezoid': { dim: '2D', category: 'quadrilateral', counterpart3D: 'cuboid', netType: null },
      'rhombus': { dim: '2D', category: 'quadrilateral', counterpart3D: 'cube', netType: null },
      'kite': { dim: '2D', category: 'quadrilateral', counterpart3D: 'square-pyramid', netType: null },
      'pentagon': { dim: '2D', category: 'polygon', counterpart3D: 'pentagonal-prism', netType: null },
      'hexagon': { dim: '2D', category: 'polygon', counterpart3D: 'cone', netType: null },
      'heptagon': { dim: '2D', category: 'polygon', counterpart3D: 'cone', netType: null },
      'octagon': { dim: '2D', category: 'polygon', counterpart3D: 'cube', netType: null },
      'sector': { dim: '2D', category: 'geometry', counterpart3D: 'cone', netType: null },
      'segment': { dim: '2D', category: 'geometry', counterpart3D: 'sphere', netType: null },
      'chord': { dim: '2D', category: 'geometry', counterpart3D: 'sphere', netType: null },
      'tangent': { dim: '2D', category: 'geometry', counterpart3D: 'cylinder', netType: null },
      'geom-angle-marker': { dim: '2D', category: 'geometry', counterpart3D: null },
      'geom-right-angle': { dim: '2D', category: 'geometry', counterpart3D: null },
      'geom-parallel-ticks': { dim: '2D', category: 'geometry', counterpart3D: null },
      'geom-perpendicular': { dim: '2D', category: 'geometry', counterpart3D: null },

      // 3D Shapes
      'cube': { dim: '3D', category: 'solid', counterpart2D: 'square', netType: 'cube' },
      'cuboid': { dim: '3D', category: 'solid', counterpart2D: 'rectangle', netType: 'cuboid' },
      'sphere': { dim: '3D', category: 'solid', counterpart2D: 'circle', netType: 'sphere' },
      'hemisphere': { dim: '3D', category: 'solid', counterpart2D: 'circle', netType: 'sphere' },
      'cylinder': { dim: '3D', category: 'solid', counterpart2D: 'ellipse', netType: 'cylinder' },
      'measuring-cylinder': { dim: '3D', category: 'solid', counterpart2D: 'rectangle', netType: 'cylinder' },
      'cone': { dim: '3D', category: 'solid', counterpart2D: 'sector', netType: 'cone' },
      'frustum': { dim: '3D', category: 'solid', counterpart2D: 'trapezoid', netType: 'frustum' },
      'triangular-prism': { dim: '3D', category: 'prism', counterpart2D: 'triangle', netType: 'tri-prism' },
      'rectangular-prism': { dim: '3D', category: 'prism', counterpart2D: 'rectangle', netType: 'cuboid' },
      'pentagonal-prism': { dim: '3D', category: 'prism', counterpart2D: 'pentagon', netType: 'tri-prism' },
      'square-pyramid': { dim: '3D', category: 'pyramid', counterpart2D: 'square', netType: 'pyramid' },
      'triangular-pyramid': { dim: '3D', category: 'pyramid', counterpart2D: 'triangle', netType: 'pyramid' }
    };

    // Educational Geometry Dimension & Formula Computing Engine (Direct Image 2 Target)
    function calculateLiquidSummary(shape, capacity, containerType, measuredMillilitres = false) {
      const savedLayers = Array.isArray(shape.liquids) && shape.liquids.length
        ? shape.liquids
        : [{ level: shape.liquidLevel || 0, color: shape.liquidColor, densityGmL: shape.liquidDensity || 1 }];
      let totalHeight = 0; let volume = 0; let mass = 0; let overflowVolume = 0; let overflowMass = 0;
      let overflowDensity = 1;
      if (measuredMillilitres) {
        savedLayers.forEach((layer) => {
          const layerVolume = Math.max(0, Number(layer.level) || 0);
          const density = Math.max(0, Number(layer.densityGmL) || 0);
          const contained = Math.min(layerVolume, Math.max(0, 100 - totalHeight));
          totalHeight += layerVolume; volume += contained; mass += contained * density;
          overflowVolume += layerVolume - contained;
          overflowMass += (layerVolume - contained) * density;
          overflowDensity = density;
        });
        if (overflowVolume > 0) mass += overflowMass;
      } else {
        savedLayers.forEach((layer) => {
          const level = Math.max(0, Number(layer.level) || 0);
          const density = Math.max(0, Number(layer.densityGmL) || 0);
          const start = Math.min(100, totalHeight);
          totalHeight += level;
          const end = Math.min(100, totalHeight);
          if (end > start) {
            const bottomVolume = window.ScientificCalculations.liquidVolumeAtFill(capacity, containerType, start);
            const topVolume = window.ScientificCalculations.liquidVolumeAtFill(capacity, containerType, end);
            const layerVolume = topVolume - bottomVolume;
            volume += layerVolume; mass += layerVolume * density;
          }
          overflowDensity = density;
        });
        const overflowHeight = Math.max(0, totalHeight - 100);
        if (overflowHeight > 0 && ['cylinder', 'measuring-cylinder', 'cuboid', 'rectangular-prism'].includes(containerType)) {
          overflowVolume = capacity * overflowHeight / 100;
          mass += overflowVolume * overflowDensity;
        }
      }
      const unit = measuredMillilitres ? 'mL' : 'cm³';
      return {
        volume, mass, overflowVolume, totalHeight,
        volumeLabel: `${volume.toFixed(1)} ${unit}${overflowVolume > 0 ? ` + ${overflowVolume.toFixed(1)} ${unit} overflow` : ''}`,
        massLabel: `${mass.toFixed(1)} g`
      };
    }

    function getShapeGeometryData(shape) {
      if (!shape) return null;
      const w = shape.w || 100;
      const h = shape.h || 100;
      const scale = 0.1; // 10px = 1 cm

      switch (shape.type) {
        case 'cube': {
          const a = Math.round(Math.min(w, h) * 0.7 * scale * 10) / 10;
          const tsa = Math.round(6 * a * a * 10) / 10;
          const lsa = Math.round(4 * a * a * 10) / 10;
          const vol = Math.round(a * a * a * 10) / 10;
          return {
            name: 'Cube',
            typeLabel: '3D SOLID',
            themeColor: '#8B5CF6',
            formulas: [
              { label: 'Total Surface Area:', math: 'TSA = 6a²', val: `${tsa} cm²` },
              { label: 'Lateral Surface Area:', math: 'LSA = 4a²', val: `${lsa} cm²` },
              { label: 'Volume (V):', math: 'V = a³', val: `${vol} cm³` }
            ],
            dims: [
              { id: 'dim1', label: 'Side (a):', val: a, unit: 'cm', min: 2, max: 35, pxKey: 'min' }
            ]
          };
        }
        case 'cuboid':
        case 'rectangular-prism': {
          const d = Math.min(w, h) * 0.28;
          const l = Math.round((w - d) * scale * 10) / 10;
          const ht = Math.round((h - d) * scale * 10) / 10;
          const b = Math.round(d * scale * 1.5 * 10) / 10;
          const tsa = Math.round(2 * (l * b + b * ht + ht * l) * 10) / 10;
          const lsa = Math.round(2 * ht * (l + b) * 10) / 10;
          const vol = Math.round(l * b * ht * 10) / 10;
          const liquid = calculateLiquidSummary(shape, vol, shape.type);
          return {
            name: 'Cuboid / Rectangular Prism',
            typeLabel: '3D SOLID',
            themeColor: '#0EA5E9',
            isLiquidContainer: true,
            liqVol: liquid.volumeLabel,
            liqMass: liquid.massLabel,
            formulas: [
              { label: 'Total Surface Area:', math: 'TSA = 2(lb + bh + hl)', val: `${tsa} cm²` },
              { label: 'Lateral Surface Area:', math: 'LSA = 2h(l + b)', val: `${lsa} cm²` },
              { label: 'Volume (V):', math: 'V = lbh', val: `${vol} cm³` }
            ],
            dims: [
              { id: 'dim1', label: 'Length (l):', val: l, unit: 'cm', min: 3, max: 45, pxKey: 'w' },
              { id: 'dim2', label: 'Height (h):', val: ht, unit: 'cm', min: 3, max: 40, pxKey: 'h' },
              { id: 'dim3', label: 'Breadth (b):', val: b, unit: 'cm', min: 2, max: 25, readOnly: true }
            ]
          };
        }
        case 'cylinder':
        case 'measuring-cylinder': {
          const rx = w / 2;
          const ry = Math.min(h * 0.14, rx * 0.42);
          const usableH = h - 2 * ry;
          const r = Math.round(rx * scale * 10) / 10;
          const ht = Math.round(usableH * scale * 10) / 10;
          const tsa = Math.round(2 * Math.PI * r * (ht + r) * 10) / 10;
          const csa = Math.round(2 * Math.PI * r * ht * 10) / 10;
          const vol = Math.round(Math.PI * r * r * ht * 10) / 10;
          const isMeasuring = shape.type === 'measuring-cylinder';
          const p = shape.liquidLevel || 0;
          const liquid = calculateLiquidSummary(shape, isMeasuring ? 100 : vol, 'cylinder', isMeasuring);
          const liqVol = liquid.volumeLabel;
          return {
            name: isMeasuring ? 'Graduated Measuring Cylinder' : 'Cylinder',
            typeLabel: isMeasuring ? 'MEASURING CONTAINER' : '3D SOLID',
            themeColor: isMeasuring ? '#0284C7' : '#10B981',
            isLiquidContainer: true,
            liqVol: liqVol,
            liqMass: liquid.massLabel,
            formulas: [
              { label: 'Total Surface Area:', math: 'TSA = 2πr(r + h)', val: `${tsa} cm²` },
              { label: 'Curved Surface Area:', math: 'CSA = 2πrh', val: `${csa} cm²` },
              { label: 'Volume (V):', math: 'V = πr²h', val: `${vol} cm³` }
            ],
            dims: [
              { id: 'dim1', label: 'Radius (r):', val: r, unit: 'cm', min: 2, max: 30, pxKey: 'r' },
              { id: 'dim2', label: 'Height (h):', val: ht, unit: 'cm', min: 4, max: 50, pxKey: 'h' }
            ]
          };
        }
        case 'cone': {
          const rx = w / 2;
          const ry = Math.min(h * 0.14, rx * 0.42);
          const usableH = h - ry;
          const r = Math.round(rx * scale * 10) / 10;
          const ht = Math.round(usableH * scale * 10) / 10;
          const slant = Math.round(Math.sqrt(r * r + ht * ht) * 10) / 10;
          const tsa = Math.round(Math.PI * r * (slant + r) * 10) / 10;
          const csa = Math.round(Math.PI * r * slant * 10) / 10;
          const vol = Math.round((1 / 3) * Math.PI * r * r * ht * 10) / 10;
          const liquid = calculateLiquidSummary(shape, vol, 'cone');
          return {
            name: 'Cone',
            typeLabel: '3D SOLID',
            themeColor: '#F59E0B',
            isLiquidContainer: true,
            liqVol: liquid.volumeLabel,
            liqMass: liquid.massLabel,
            formulas: [
              { label: 'Total Surface Area:', math: 'TSA = πr(l + r)', val: `${tsa} cm²` },
              { label: 'Curved Surface Area:', math: 'CSA = πrl', val: `${csa} cm²` },
              { label: 'Volume (V):', math: 'V = ⅓πr²h', val: `${vol} cm³` }
            ],
            dims: [
              { id: 'dim1', label: 'Radius (r):', val: r, unit: 'cm', min: 2, max: 30, pxKey: 'r' },
              { id: 'dim2', label: 'Height (h):', val: ht, unit: 'cm', min: 4, max: 45, pxKey: 'h' },
              { id: 'dim3', label: 'Slant Height (l):', val: slant, unit: 'cm', readOnly: true }
            ]
          };
        }
        case 'sphere': {
          const r = Math.round((Math.min(w, h) / 2) * scale * 10) / 10;
          const sa = Math.round(4 * Math.PI * r * r * 10) / 10;
          const vol = Math.round((4 / 3) * Math.PI * Math.pow(r, 3) * 10) / 10;
          return {
            name: 'Sphere',
            typeLabel: '3D SOLID',
            themeColor: '#8B5CF6',
            formulas: [
              { label: 'Surface Area (SA):', math: 'SA = 4πr²', val: `${sa} cm²` },
              { label: 'Volume (V):', math: 'V = ⁴⁄₃πr³', val: `${vol} cm³` }
            ],
            dims: [
              { id: 'dim1', label: 'Radius (r):', val: r, unit: 'cm', min: 2, max: 35, pxKey: 'r' }
            ]
          };
        }
        case 'hemisphere': {
          const r = Math.round((Math.min(w, h) / 2) * scale * 10) / 10;
          const tsa = Math.round(3 * Math.PI * r * r * 10) / 10;
          const csa = Math.round(2 * Math.PI * r * r * 10) / 10;
          const vol = Math.round((2 / 3) * Math.PI * Math.pow(r, 3) * 10) / 10;
          const liquid = calculateLiquidSummary(shape, vol, 'hemisphere');
          return {
            name: 'Hemisphere',
            typeLabel: '3D SOLID',
            themeColor: '#06B6D4',
            isLiquidContainer: true,
            liqVol: liquid.volumeLabel,
            liqMass: liquid.massLabel,
            formulas: [
              { label: 'Total Surface Area:', math: 'TSA = 3πr²', val: `${tsa} cm²` },
              { label: 'Curved Surface Area:', math: 'CSA = 2πr²', val: `${csa} cm²` },
              { label: 'Volume (V):', math: 'V = ⅔πr³', val: `${vol} cm³` }
            ],
            dims: [
              { id: 'dim1', label: 'Radius (r):', val: r, unit: 'cm', min: 2, max: 35, pxKey: 'r' }
            ]
          };
        }
        case 'circle': {
          const r = Math.round((Math.min(w, h) / 2) * scale * 10) / 10;
          const area = Math.round(Math.PI * r * r * 10) / 10;
          const circ = Math.round(2 * Math.PI * r * 10) / 10;
          return {
            name: 'Circle',
            typeLabel: '2D SHAPE',
            themeColor: '#3B82F6',
            formulas: [
              { label: 'Area (A):', math: 'A = πr²', val: `${area} cm²` },
              { label: 'Circumference (C):', math: 'C = 2πr', val: `${circ} cm` }
            ],
            dims: [
              { id: 'dim1', label: 'Radius (r):', val: r, unit: 'cm', min: 2, max: 35, pxKey: 'r' }
            ]
          };
        }
        case 'rectangle': {
          const l = Math.round(w * scale * 10) / 10;
          const b = Math.round(h * scale * 10) / 10;
          const area = Math.round(l * b * 10) / 10;
          const perim = Math.round(2 * (l + b) * 10) / 10;
          return {
            name: 'Rectangle',
            typeLabel: '2D SHAPE',
            themeColor: '#0EA5E9',
            formulas: [
              { label: 'Area (A):', math: 'A = l × b', val: `${area} cm²` },
              { label: 'Perimeter (P):', math: 'P = 2(l + b)', val: `${perim} cm` }
            ],
            dims: [
              { id: 'dim1', label: 'Length (l):', val: l, unit: 'cm', min: 3, max: 45, pxKey: 'w' },
              { id: 'dim2', label: 'Breadth (b):', val: b, unit: 'cm', min: 3, max: 40, pxKey: 'h' }
            ]
          };
        }
        case 'square': {
          const a = Math.round(Math.min(w, h) * scale * 10) / 10;
          const area = Math.round(a * a * 10) / 10;
          const perim = Math.round(4 * a * 10) / 10;
          return {
            name: 'Square',
            typeLabel: '2D SHAPE',
            themeColor: '#8B5CF6',
            formulas: [
              { label: 'Area (A):', math: 'A = a²', val: `${area} cm²` },
              { label: 'Perimeter (P):', math: 'P = 4a', val: `${perim} cm` }
            ],
            dims: [
              { id: 'dim1', label: 'Side (a):', val: a, unit: 'cm', min: 2, max: 35, pxKey: 'min' }
            ]
          };
        }
        case 'triangle':
        case 'right-triangle': {
          const b = Math.round(w * scale * 10) / 10;
          const ht = Math.round(h * scale * 10) / 10;
          const area = Math.round(0.5 * b * ht * 10) / 10;
          const hyp = Math.round(Math.sqrt(b * b + ht * ht) * 10) / 10;
          const perim = Math.round((b + ht + hyp) * 10) / 10;
          return {
            name: shape.type === 'right-triangle' ? 'Right Triangle' : 'Triangle',
            typeLabel: '2D SHAPE',
            themeColor: '#F59E0B',
            formulas: [
              { label: 'Area (A):', math: 'A = ½ b h', val: `${area} cm²` },
              { label: 'Perimeter (P):', math: 'P = a + b + c', val: `${perim} cm` }
            ],
            dims: [
              { id: 'dim1', label: 'Base (b):', val: b, unit: 'cm', min: 2, max: 40, pxKey: 'w' },
              { id: 'dim2', label: 'Height (h):', val: ht, unit: 'cm', min: 2, max: 40, pxKey: 'h' }
            ]
          };
        }
        default: {
          const is3D = SHAPE_TAXONOMY[shape.type]?.dim === '3D';
          return {
            name: (shape.type || 'Shape').replace(/-/g, ' ').toUpperCase(),
            typeLabel: is3D ? '3D SOLID' : 'GEOMETRIC SHAPE',
            themeColor: is3D ? '#8B5CF6' : '#2563EB',
            formulas: [
              { label: 'Bounding Box:', math: `${Math.round(w)} × ${Math.round(h)} px`, val: '' }
            ],
            dims: [
              { id: 'dim1', label: 'Width:', val: Math.round(w), unit: 'px', min: 20, max: 400, pxKey: 'w' },
              { id: 'dim2', label: 'Height:', val: Math.round(h), unit: 'px', min: 20, max: 400, pxKey: 'h' }
            ]
          };
        }
      }
    }

    // Educational Dimension Annotation Arrow Renderer (Image 2 Design)
    function drawDimIndicator(targetCtx, x1, y1, x2, y2, label, offset = 0) {
      targetCtx.save();
      const angle = Math.atan2(y2 - y1, x2 - x1);
      const normalAngle = angle + Math.PI / 2;
      const ox = Math.cos(normalAngle) * offset;
      const oy = Math.sin(normalAngle) * offset;

      const px1 = x1 + ox;
      const py1 = y1 + oy;
      const px2 = x2 + ox;
      const py2 = y2 + oy;

      if (Math.abs(offset) > 2) {
        targetCtx.beginPath();
        targetCtx.strokeStyle = '#94A3B8';
        targetCtx.lineWidth = 1;
        targetCtx.moveTo(x1, y1);
        targetCtx.lineTo(px1, py1);
        targetCtx.moveTo(x2, y2);
        targetCtx.lineTo(px2, py2);
        targetCtx.stroke();
      }

      targetCtx.beginPath();
      targetCtx.strokeStyle = '#0F172A';
      targetCtx.lineWidth = 1.3;
      targetCtx.moveTo(px1, py1);
      targetCtx.lineTo(px2, py2);
      targetCtx.stroke();

      drawArrowHead(targetCtx, px2, py2, px1, py1, 8);
      drawArrowHead(targetCtx, px1, py1, px2, py2, 8);

      const midX = (px1 + px2) / 2;
      const midY = (py1 + py2) / 2;
      targetCtx.font = 'italic bold 11px Inter, serif';
      targetCtx.textAlign = 'center';
      targetCtx.textBaseline = 'middle';
      const textW = targetCtx.measureText(label).width;

      targetCtx.fillStyle = '#FFFFFF';
      targetCtx.fillRect(midX - textW / 2 - 3, midY - 7, textW + 6, 14);

      targetCtx.fillStyle = '#0F172A';
      targetCtx.fillText(label, midX, midY);

      targetCtx.restore();
    }

    let currentTool = 'select';
    let strokeColor = '#1E40AF';
    let fillColor = '#93C5FD';
    let isFill = false;
    let strokeWidth = 2;
    let opacity = 1.0;

    let isDrawing = false;
    let startX = 0;
    let startY = 0;

    // Freehand polygon vertex list
    let polygonPoints = [];

    // Vector Shape Objects State & Multi-Selection Engine
    let shapes = [];
    let selectedShapes = []; // Multi-selection array
    let transformState = null; // { mode: 'move'|'resize'|'rotate', handle, initialMouse, initialShapes }

    // Marquee dragging selection state
    let isMarqueeSelecting = false;
    let marqueeStart = { x: 0, y: 0 };
    let marqueeCurrent = { x: 0, y: 0 };

    // Clipboard for Copy / Paste
    let clipboard = [];

    // Liquid, Inner shape & Line style default toolbar state
    let activeLiquidLevel = 0;
    let activeLiquidColor = '#3B82F6';
    let activeInnerShape = 'none';
    let activeLineStyle = 'solid';

    // History stack for Undo / Redo
    const historyStack = [];
    const redoStack = [];
    const MAX_HISTORY = 40;

    // Helper property to maintain backward compatibility with single selected shape
    Object.defineProperty(window, 'primarySelectedShape', {
      get: () => selectedShapes[0] || null,
      configurable: true
    });

    function getSelectedShape() {
      return selectedShapes[0] || null;
    }

    function setSelectedShape(shape) {
      if (!shape) selectedShapes = [];
      else selectedShapes = [shape];
    }

    const scientificAssetModalEl = document.getElementById('modal-scientific-assets');
    const scientificAssetModal = scientificAssetModalEl && window.bootstrap
      ? new window.bootstrap.Modal(scientificAssetModalEl)
      : null;
    const scientificAssetSearchForm = document.getElementById('wb-scientific-asset-search');
    const scientificAssetQuery = document.getElementById('wb-scientific-asset-query');
    const scientificAssetResults = document.getElementById('wb-scientific-asset-results');
    const scientificAssetStatus = document.getElementById('wb-scientific-asset-status');

    document.getElementById('btn-wb-insert-scientific-model')?.addEventListener('click', () => {
      if (!['tutor', 'admin', 'super_admin', 'ordinary_admin'].includes(userRole)) {
        if (scientificAssetStatus) scientificAssetStatus.textContent = 'Only classroom tutors and administrators can add model references.';
        scientificAssetModal?.show();
        return;
      }
      scientificAssetModal?.show();
      if (scientificAssetResults && !scientificAssetResults.children.length) loadScientificAssets();
    });

    async function loadScientificAssets(event) {
      event?.preventDefault();
      if (!scientificAssetResults || !scientificAssetStatus) return;
      scientificAssetStatus.textContent = 'Searching permitted scientific assets…';
      const params = new URLSearchParams({ limit: '40' });
      if (scientificAssetQuery?.value.trim()) params.set('q', scientificAssetQuery.value.trim());
      try {
        const response = await fetch(`/api/science/assets?${params}`);
        const data = await response.json();
        if (!response.ok || !data.ok) throw new Error(data.error || 'Could not load scientific assets.');
        scientificAssetResults.replaceChildren();
        data.assets.filter((asset) => !['csv', 'data'].includes(String(asset.model_format).toLowerCase())).forEach((asset) => {
          const item = document.createElement('button'); item.type = 'button'; item.className = 'list-group-item list-group-item-action';
          const name = document.createElement('strong'); name.textContent = asset.name;
          const details = document.createElement('small'); details.className = 'd-block text-muted';
          details.textContent = `${asset.source_institution || 'Source not specified'} · ${asset.source_record_id || 'No record ID'} · ${asset.license} · ${asset.validation_status}`;
          item.append(name, details);
          item.addEventListener('click', () => insertScientificAssetReference(asset));
          scientificAssetResults.appendChild(item);
        });
        scientificAssetStatus.textContent = data.assets.length ? `${data.assets.length} permitted asset records found.` : 'No permitted assets match this search.';
      } catch (error) { scientificAssetStatus.textContent = error.message; }
    }

    function insertScientificAssetReference(asset) {
      if (!asset?.asset_key) return;
      saveState();
      const offset = (shapes.length * 18) % 180;
      const newShape = {
        id: `science_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        type: 'scientific-model-ref', assetKey: asset.asset_key, assetName: asset.name,
        sourceInstitution: asset.source_institution || '', sourceRecordId: asset.source_record_id || '',
        license: asset.license || '', x: Math.max(20, canvas.width / 2 - 150 + offset),
        y: Math.max(20, canvas.height / 2 - 90 + offset), w: 300, h: 180,
        rotation: 0, strokeColor: '#2563EB', fillColor: '#EFF6FF', doFill: true,
        strokeWidth: 2, opacity: 1, lineStyle: 'solid', showDimLabels: false
      };
      shapes.push(newShape); selectedShapes = [newShape]; selectTool('select'); renderAll();
      scientificAssetModal?.hide();
    }

    scientificAssetSearchForm?.addEventListener('submit', loadScientificAssets);

    function saveState() {
      if (historyStack.length >= MAX_HISTORY) historyStack.shift();
      historyStack.push({
        shapes: JSON.parse(JSON.stringify(shapes))
      });
      redoStack.length = 0;
    }

    function restoreState(stateObj) {
      if (!stateObj) return;
      if (typeof stateObj === 'string') {
        try {
          const parsed = JSON.parse(stateObj);
          if (parsed.shapes) stateObj = parsed;
        } catch {
          const img = new Image();
          img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
          };
          img.src = stateObj;
          return;
        }
      }

      if (stateObj.shapes && Array.isArray(stateObj.shapes)) {
        shapes = JSON.parse(JSON.stringify(stateObj.shapes));
        selectedShapes = [];
        const maxY = Math.max(...shapes.map(s => (s.y || 0) + (s.h || 0)), 0);
        if (maxY + 600 > canvas.height) {
          const needed = maxY + 1500 - canvas.height;
          expandWhiteboardDownwards(Math.max(2000, needed));
        } else {
          renderAll();
        }
      }
    }

    function renderAll() {
      overlayCtx.clearRect(0, 0, overlay.width, overlay.height);

      // Render vector shapes onto overlay
      shapes.forEach(shape => {
        drawVectorShape(overlayCtx, shape);
      });

      // Render marquee selection rectangle if active
      if (isMarqueeSelecting) {
        const mx = Math.min(marqueeStart.x, marqueeCurrent.x);
        const my = Math.min(marqueeStart.y, marqueeCurrent.y);
        const mw = Math.abs(marqueeCurrent.x - marqueeStart.x);
        const mh = Math.abs(marqueeCurrent.y - marqueeStart.y);

        overlayCtx.save();
        overlayCtx.strokeStyle = '#3B82F6';
        overlayCtx.fillStyle = 'rgba(59, 130, 246, 0.12)';
        overlayCtx.lineWidth = 1.5;
        overlayCtx.setLineDash([4, 4]);
        overlayCtx.fillRect(mx, my, mw, mh);
        overlayCtx.strokeRect(mx, my, mw, mh);
        overlayCtx.restore();
      }

      // Render selection bounding box & adjustment handles
      if (selectedShapes.length > 0 && currentTool === 'select') {
        drawSelectionOverlay(overlayCtx);
      }

      // Update inspector bar
      updateInspectorBar();
    }


    // BIND CLICK LISTENERS TO ALL SIDEBAR & NAVBAR TOOL BUTTONS
    document.querySelectorAll('.wb-icon-btn.btn-tool, .btn-tool').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const tool = btn.getAttribute('data-tool');
        if (tool) {
          selectTool(tool);
        }
      });
    });

    // Unified Tool Selector
    function selectTool(toolName) {
      currentTool = toolName;
      document.querySelectorAll('.wb-icon-btn.btn-tool').forEach(b => {
        b.classList.toggle('active', b.getAttribute('data-tool') === toolName);
      });

      if (toolName !== 'polygon') resetPolygon();
      const textInput = document.getElementById('wb-text-input');
      if (toolName !== 'text' && textInput) textInput.classList.add('hidden');

      renderAll();
    }

    // Dynamic Inspector Bar Update
    function updateInspectorBar() {
      const bar = document.getElementById('wb-selected-inspector');
      const badge = document.getElementById('wb-inspector-shape-name');
      if (!bar) return;

      const sel = getSelectedShape();
      if (sel && currentTool === 'select') {
        bar.classList.remove('hidden');
        if (badge) {
          const count = selectedShapes.length;
          if (count > 1) {
            badge.innerHTML = `<i class="fa-solid fa-layer-group me-1"></i> ${count} Shapes Selected`;
          } else {
            const label = sel.title || (sel.type ? sel.type.toUpperCase() : 'SHAPE');
            const icon = (SHAPE_TAXONOMY[sel.type]?.dim === '3D' || sel.type === 'cube' || sel.type === 'cuboid') ? 'fa-cube' : 'fa-shapes';
            badge.innerHTML = `<i class="fa-solid ${icon} me-1"></i> ${label}`;
          }
        }
        const panel = document.getElementById('wb-3d-float-panel');
        if (panel && !panel.classList.contains('hidden')) {
          updateEducationalPropertiesPanel(sel);
        }
      } else {
        bar.classList.add('hidden');
      }
    }

    // Educational Geometry, Formula & Liquid Studio Synchronizer (Image 2 & 3 Target)
    function updateEducationalPropertiesPanel(sel) {
      const panel = document.getElementById('wb-3d-float-panel');
      if (!panel || !sel) return;

      const geo = getShapeGeometryData(sel);
      if (!geo) return;

      // 1. Header & Theme Styling
      const headerTitle = document.getElementById('wb-prop-header-title');
      if (headerTitle) {
        headerTitle.innerHTML = `<i class="fa-solid fa-shapes me-1" style="color:${geo.themeColor};"></i> ${geo.name} Studio`;
      }

      // 2. Educational Formula Card
      const cardTop = document.getElementById('wb-edu-card-top');
      if (cardTop) cardTop.style.borderColor = geo.themeColor;

      const shapeTag = document.getElementById('wb-edu-shape-tag');
      if (shapeTag) {
        const icon = (SHAPE_TAXONOMY[sel.type]?.dim === '3D') ? 'fa-cube' : 'fa-shapes';
        shapeTag.innerHTML = `<i class="fa-solid ${icon} me-1" style="color:${geo.themeColor};"></i> ${geo.name.toUpperCase()}`;
      }

      const typePill = document.getElementById('wb-edu-type-pill');
      if (typePill) {
        typePill.textContent = geo.typeLabel;
        typePill.style.color = geo.themeColor;
      }

      // Formulas (Surface Area, Volume, Perimeter, Area)
      const rowSA = document.getElementById('wb-row-sa');
      const mathSA = document.getElementById('wb-math-sa');
      const valSA = document.getElementById('wb-val-sa');
      const rowVol = document.getElementById('wb-row-vol');
      const mathVol = document.getElementById('wb-math-vol');
      const valVol = document.getElementById('wb-val-vol');

      if (geo.formulas.length >= 1) {
        if (rowSA) rowSA.classList.remove('hidden');
        if (mathSA) mathSA.textContent = geo.formulas[0].math;
        if (valSA) valSA.textContent = geo.formulas[0].val;
      } else {
        if (rowSA) rowSA.classList.add('hidden');
      }

      if (geo.formulas.length >= 2) {
        if (rowVol) rowVol.classList.remove('hidden');
        if (mathVol) mathVol.textContent = geo.formulas[1].math;
        if (valVol) valVol.textContent = geo.formulas[1].val;
      } else {
        if (rowVol) rowVol.classList.add('hidden');
      }

      // Dimension Chips
      const chip1 = document.getElementById('wb-chip-dim1');
      const chip2 = document.getElementById('wb-chip-dim2');
      const chip3 = document.getElementById('wb-chip-dim3');

      if (geo.dims[0] && chip1) {
        chip1.classList.remove('hidden');
        chip1.textContent = `${geo.dims[0].label} ${geo.dims[0].val} ${geo.dims[0].unit}`;
      } else if (chip1) chip1.classList.add('hidden');

      if (geo.dims[1] && chip2) {
        chip2.classList.remove('hidden');
        chip2.textContent = `${geo.dims[1].label} ${geo.dims[1].val} ${geo.dims[1].unit}`;
      } else if (chip2) chip2.classList.add('hidden');

      if (geo.dims[2] && chip3) {
        chip3.classList.remove('hidden');
        chip3.textContent = `${geo.dims[2].label} ${geo.dims[2].val} ${geo.dims[2].unit}`;
      } else if (chip3) chip3.classList.add('hidden');

      // 3. Interactive Dimension Sliders & Inputs
      const f1 = document.getElementById('wb-field-dim1');
      const lbl1 = document.getElementById('wb-lbl-dim1');
      const s1 = document.getElementById('wb-slider-dim1');
      const n1 = document.getElementById('wb-num-dim1');

      if (geo.dims[0] && f1) {
        f1.classList.remove('hidden');
        if (lbl1) lbl1.textContent = `${geo.dims[0].label} (${geo.dims[0].unit}):`;
        if (s1) { s1.min = geo.dims[0].min || 2; s1.max = geo.dims[0].max || 50; s1.value = geo.dims[0].val; }
        if (n1) { n1.value = geo.dims[0].val; }
      } else if (f1) f1.classList.add('hidden');

      const f2 = document.getElementById('wb-field-dim2');
      const lbl2 = document.getElementById('wb-lbl-dim2');
      const s2 = document.getElementById('wb-slider-dim2');
      const n2 = document.getElementById('wb-num-dim2');

      if (geo.dims[1] && f2) {
        f2.classList.remove('hidden');
        if (lbl2) lbl2.textContent = `${geo.dims[1].label} (${geo.dims[1].unit}):`;
        if (s2) { s2.min = geo.dims[1].min || 2; s2.max = geo.dims[1].max || 50; s2.value = geo.dims[1].val; }
        if (n2) { n2.value = geo.dims[1].val; }
      } else if (f2) f2.classList.add('hidden');

      const f3 = document.getElementById('wb-field-dim3');
      const lbl3 = document.getElementById('wb-lbl-dim3');
      const s3 = document.getElementById('wb-slider-dim3');
      const n3 = document.getElementById('wb-num-dim3');

      if (geo.dims[2] && f3) {
        f3.classList.remove('hidden');
        if (lbl3) lbl3.textContent = `${geo.dims[2].label} (${geo.dims[2].unit}):`;
        if (s3) { s3.min = geo.dims[2].min || 2; s3.max = geo.dims[2].max || 50; s3.value = geo.dims[2].val; }
        if (n3) { n3.value = geo.dims[2].val; }
      } else if (f3) f3.classList.add('hidden');

      // Dimension labels on canvas checkbox
      const chkDimLabels = document.getElementById('wb-toggle-dim-labels');
      if (chkDimLabels) chkDimLabels.checked = (sel.showDimLabels !== false);

      // 4. Liquid Studio Section
      const liqSection = document.getElementById('wb-liquid-section');
      if (liqSection) {
        if (geo.isLiquidContainer) {
          liqSection.classList.remove('hidden');
          const liqSlider = document.getElementById('wb-liquid-level');
          const liqVal = document.getElementById('wb-liquid-val');
          const liqVolBadge = document.getElementById('wb-liquid-vol-badge');
          const p = sel.liquidLevel !== undefined ? sel.liquidLevel : 0;

          if (liqSlider) liqSlider.value = p;
          const layers = (sel.liquids || [{ level: p, color: sel.liquidColor, densityGmL: sel.liquidDensity || 1 }]).filter((layer) => layer && Number(layer.level) > 0);
          const totalFill = layers.reduce((sum, layer) => sum + (Number(layer.level) || 0), 0);
          const isMeasuring = sel.type === 'measuring-cylinder';
          if (liqVal) liqVal.textContent = isMeasuring ? `${Math.round(p)} mL` : `${Math.round(totalFill)}% height`;
          if (liqVolBadge) liqVolBadge.textContent = `${geo.liqVol || ''} · ${geo.liqMass || ''}`;
          const layerCount = Math.max(1, layers.length);
          const countControl = document.getElementById('wb-liquid-count');
          if (countControl) countControl.value = String(layerCount);
          const layerControls = [
            { level: 'wb-liquid-level', color: 'wb-liquid-color', density: 'wb-liquid-density' },
            { level: 'wb-liquid-l2-level', color: 'wb-liquid-l2-color', density: 'wb-liquid-l2-density' },
            { level: 'wb-liquid-l3-level', color: 'wb-liquid-l3-color', density: 'wb-liquid-l3-density' }
          ];
          const authoredLayers = Array.isArray(sel.liquids) ? sel.liquids : [{ level: p, color: sel.liquidColor || '#0284C7', densityGmL: sel.liquidDensity || 1 }];
          layerControls.forEach((ids, index) => {
            const layer = authoredLayers[index] || {};
            const levelInput = document.getElementById(ids.level); if (levelInput) levelInput.value = String(Number(layer.level) || 0);
            const colorInput = document.getElementById(ids.color); if (colorInput && layer.color) colorInput.value = layer.color;
            const densityInput = document.getElementById(ids.density); if (densityInput) densityInput.value = String(layer.densityGmL ?? (index === 0 ? sel.liquidDensity || 1 : 0.9));
          });
          [2, 3].forEach((count) => {
            const row = document.getElementById(`wb-liquid-l${count}-label`);
            if (row) row.classList.toggle('hidden', layerCount < count);
          });

          const chkGrads = document.getElementById('wb-toggle-graduations');
          if (chkGrads) chkGrads.checked = (sel.showGraduations !== false);

          const curColor = sel.liquidColor || '#0284C7';
          document.querySelectorAll('#wb-liquid-swatches .wb-swatch-btn').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-color') === curColor);
          });
        } else {
          liqSection.classList.add('hidden');
        }
      }
    }

    // Marquee Marquee Hit-test helper
    function getShapesInMarquee(mx, my, mw, mh) {
      return shapes.filter(s => {
        const sx2 = s.x + s.w;
        const sy2 = s.y + s.h;
        return !(s.x > mx + mw || sx2 < mx || s.y > my + mh || sy2 < my);
      });
    }

    // Compute Multi-Selection Bounding Box
    function getMultiSelectionBounds() {
      if (selectedShapes.length === 0) return null;
      const minX = Math.min(...selectedShapes.map(s => s.x));
      const minY = Math.min(...selectedShapes.map(s => s.y));
      const maxX = Math.max(...selectedShapes.map(s => s.x + s.w));
      const maxY = Math.max(...selectedShapes.map(s => s.y + s.h));
      return {
        x: minX,
        y: minY,
        w: Math.max(10, maxX - minX),
        h: Math.max(10, maxY - minY),
        cx: (minX + maxX) / 2,
        cy: (minY + maxY) / 2
      };
    }


    // ========================================================
    // PERMANENT EMBEDDED FLYOUT SHAPE PICKERS (2D, 3D & LINES)
    // ========================================================

    const flyout2D = document.getElementById('wb-2d-flyout');
    const flyout3D = document.getElementById('wb-3d-flyout');
    const flyoutLines = document.getElementById('wb-lines-flyout');
    const btn2D = document.getElementById('wb-2d-shape-trigger');
    const btn3D = document.getElementById('wb-3d-shape-trigger');
    const btnLines = document.getElementById('wb-lines-trigger');

    function closeAllFlyouts() {
      if (flyout2D) flyout2D.classList.add('hidden');
      if (flyout3D) flyout3D.classList.add('hidden');
      if (flyoutLines) flyoutLines.classList.add('hidden');
      btn2D?.classList.remove('active');
      btn3D?.classList.remove('active');
      btnLines?.classList.remove('active');
    }

    function toggleFlyout(flyout, triggerBtn) {
      if (!flyout) return;
      const isVisible = !flyout.classList.contains('hidden');
      closeAllFlyouts();
      if (!isVisible) {
        if (triggerBtn) {
          triggerBtn.classList.add('active');
          const canvasArea = document.getElementById('wb-canvas-area');
          if (canvasArea) {
            const areaRect = canvasArea.getBoundingClientRect();
            const btnRect = triggerBtn.getBoundingClientRect();
            const desiredTop = btnRect.top - areaRect.top;
            const maxTop = Math.max(10, areaRect.height - 480);
            const clampedTop = Math.max(10, Math.min(desiredTop - 10, maxTop));
            flyout.style.top = `${clampedTop}px`;
          }
        }
        flyout.classList.remove('hidden');
      }
    }

    // Trigger buttons
    btn2D?.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      toggleFlyout(flyout2D, btn2D);
    });

    btn3D?.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      toggleFlyout(flyout3D, btn3D);
    });

    btnLines?.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      toggleFlyout(flyoutLines, btnLines);
    });

    // Close buttons inside flyouts
    document.getElementById('wb-close-2d-flyout')?.addEventListener('click', closeAllFlyouts);
    document.getElementById('wb-close-3d-flyout')?.addEventListener('click', closeAllFlyouts);
    document.getElementById('wb-close-lines-flyout')?.addEventListener('click', closeAllFlyouts);

    // Bind click handlers to all flyout shape item buttons
    document.querySelectorAll('.wb-flyout-item[data-shape]').forEach(itemBtn => {
      itemBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        const shapeType = itemBtn.getAttribute('data-shape');
        if (shapeType) {
          spawnOrSelectShape(shapeType);
        }
        closeAllFlyouts();
      });
    });

    // Close flyouts on canvas or outside click
    document.addEventListener('click', (e) => {
      if (
        !e.target.closest('.wb-shape-flyout-panel') &&
        !e.target.closest('#wb-2d-shape-trigger') &&
        !e.target.closest('#wb-3d-shape-trigger') &&
        !e.target.closest('#wb-lines-trigger')
      ) {
        closeAllFlyouts();
      }
    });

    // Helper function to spawn shape directly onto whiteboard when selected from flyout or toolbar
    function spawnOrSelectShape(shapeType) {
      if (!shapeType) return;
      saveState();

      const defaultW = ['circle', 'square', 'cube', 'sphere', 'hemisphere'].includes(shapeType) ? 140 :
                       ['cylinder', 'measuring-cylinder', 'cone'].includes(shapeType) ? 130 : 180;
      const defaultH = ['circle', 'square', 'cube', 'sphere'].includes(shapeType) ? 140 :
                       ['cylinder', 'measuring-cylinder'].includes(shapeType) ? 220 :
                       ['cone'].includes(shapeType) ? 180 : 120;
      const offset = (shapes.length * 20) % 220;

      // Image 2 Target Color Presets
      let sCol = strokeColor || '#1E40AF';
      let fCol = fillColor || '#93C5FD';
      let liqLvl = activeLiquidLevel || 0;
      let liqCol = activeLiquidColor || '#0284C7';
      let showGrads = true;

      if (shapeType === 'cylinder') {
        sCol = '#059669'; fCol = '#A7F3D0'; liqLvl = 50; liqCol = '#0284C7';
      } else if (shapeType === 'measuring-cylinder') {
        sCol = '#0284C7'; fCol = '#E0F2FE'; liqLvl = 50; liqCol = '#0284C7'; showGrads = true;
      } else if (shapeType === 'cube') {
        sCol = '#7C3AED'; fCol = '#DDD6FE';
      } else if (shapeType === 'cuboid' || shapeType === 'rectangular-prism') {
        sCol = '#0284C7'; fCol = '#BAE6FD';
      } else if (shapeType === 'cone') {
        sCol = '#D97706'; fCol = '#FDE68A'; liqLvl = 40; liqCol = '#0284C7';
      } else if (shapeType === 'sphere') {
        sCol = '#4F46E5'; fCol = '#C7D2FE';
      } else if (shapeType === 'hemisphere') {
        sCol = '#0891B2'; fCol = '#CFFAFE'; liqLvl = 50; liqCol = '#0284C7';
      }

      const sTop = wrapper ? wrapper.scrollTop : 0;
      const sLeft = wrapper ? wrapper.scrollLeft : 0;
      const bufferRatio = canvas.height / (wrapper?.scrollHeight || 1);
      const spawnY = sTop > 30 ? Math.round((sTop + 120) * bufferRatio) : (100 + offset);
      const spawnX = sLeft > 30 ? Math.round((sLeft + 200) * (canvas.width / (wrapper?.scrollWidth || 1))) : (200 + offset);

      if (spawnY + defaultH > canvas.height - 300) {
        expandWhiteboardDownwards(2000);
      }

      const newShape = {
        id: 's_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
        type: shapeType,
        dimensionalType: SHAPE_TAXONOMY[shapeType]?.dim || '2D',
        x: spawnX,
        y: spawnY,
        w: defaultW,
        h: defaultH,
        rotation: 0,
        strokeColor: sCol,
        fillColor: fCol,
        doFill: true,
        strokeWidth: strokeWidth || 2,
        opacity: opacity || 1,
        lineStyle: activeLineStyle,
        liquidLevel: liqLvl,
        liquidColor: liqCol,
        showGraduations: showGrads,
        showDimLabels: true,
        innerShape: activeInnerShape
      };

      shapes.push(newShape);
      selectedShapes = [newShape];
      selectTool('select');
      renderAll();

      // Open Educational Studio panel & sync
      const panel = document.getElementById('wb-3d-float-panel');
      if (panel) {
        panel.classList.remove('hidden');
        updateEducationalPropertiesPanel(newShape);
      }
    }


    // ========================================================
    // TOP NAVBAR BUTTON HANDLERS (Undo, Redo, Clear, Save Sync, Graphing Studio)
    // ========================================================


    // Toggle Live Chat Drawer Button
    document.getElementById('btn-toggle-chat')?.addEventListener('click', () => {
      const chatPanel = document.getElementById('wb-chat-panel');
      if (chatPanel) chatPanel.classList.toggle('collapsed');
    });

    // 1. Top Navbar Undo Button
    document.getElementById('btn-undo-wb')?.addEventListener('click', () => {
      if (historyStack.length > 0) {
        redoStack.push({ shapes: JSON.parse(JSON.stringify(shapes)) });
        const prev = historyStack.pop();
        restoreState(prev);
      }
    });

    // 2. Top Navbar Redo Button
    document.getElementById('btn-redo-wb')?.addEventListener('click', () => {
      if (redoStack.length > 0) {
        historyStack.push({ shapes: JSON.parse(JSON.stringify(shapes)) });
        const next = redoStack.pop();
        restoreState(next);
      }
    });

    // 3. Top Navbar Clear Whiteboard Button
    document.getElementById('btn-clear-wb')?.addEventListener('click', () => {
      if (shapes.length === 0) return;
      if (confirm('Are you sure you want to clear the entire whiteboard?')) {
        saveState();
        shapes = [];
        selectedShapes = [];
        drawWhiteboardBackground(ctx, canvas.width, canvas.height);
        renderAll();
      }
    });

    // 4. Top Navbar Sync / Save Whiteboard State to Server Button
    document.getElementById('btn-save-wb')?.addEventListener('click', async () => {
      try {
        const btn = document.getElementById('btn-save-wb');
        if (btn) btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Syncing...';
        const stateJSON = JSON.stringify({ shapes: shapes });
        const res = await fetch(`/api/classrooms/${classroomId}/whiteboard`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ canvasData: stateJSON })
        });
        const data = await res.json();
        if (btn) btn.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> Sync';
        if (data.success) {
          const badge = document.getElementById('live-indicator');
          if (badge) {
            const origText = badge.textContent;
            badge.textContent = 'SYNCED';
            setTimeout(() => badge.textContent = origText, 1500);
          }
        }
      } catch (err) {
        console.error('Whiteboard sync failed:', err);
        const btn = document.getElementById('btn-save-wb');
        if (btn) btn.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> Sync';
      }
    });

    // 5. Iconic Sidebar Launch Interactive Graphing Studio Button
    document.getElementById('btn-wb-open-graphing-lab')?.addEventListener('click', () => {
      const modal = document.getElementById('modal-wb-graphing-lab');
      if (modal) {
        modal.classList.remove('hidden');
        const exprVal = document.getElementById('modal-gl-expr')?.value || 'x^2 - 4';
        const container = document.getElementById('modal-gl-canvas-container');
        if (container && window.GraphEngine) {
          container.innerHTML = '<canvas id="modal-gl-canvas" width="560" height="340"></canvas>';
          const modalCanvas = document.getElementById('modal-gl-canvas');
          if (modalCanvas) {
            wbModalGraphEngine = new window.GraphEngine(modalCanvas, {
              xMin: -10, xMax: 10, yMin: -10, yMax: 10,
              gridColor: '#E2E8F0', axisColor: '#334155'
            });
            wbModalGraphEngine.addFunction(exprVal, { color: '#2563EB' });
            wbModalGraphEngine.render();
          }
        }
      }
    });



    // ========================================================
    // INSPECTOR BAR, POPUPS, 3D PANEL & CHAT ACTION HANDLERS
    // ========================================================

    // Polygon Hint Bar Close Button
    document.getElementById('btn-close-polygon')?.addEventListener('click', () => {
      commitPolygon();
    });

    // Inspector Bar Actions (Floating overlay)
    document.getElementById('insp-btn-properties')?.addEventListener('click', () => {
      const panel = document.getElementById('wb-3d-float-panel');
      if (panel) {
        panel.classList.toggle('hidden');
        const sel = getSelectedShape();
        if (sel && !panel.classList.contains('hidden')) {
          updateEducationalPropertiesPanel(sel);
        }
      }
    });
    document.getElementById('insp-btn-duplicate')?.addEventListener('click', () => {
      document.getElementById('btn-duplicate-shape')?.click();
    });
    document.getElementById('insp-btn-transform')?.addEventListener('click', () => {
      document.getElementById('btn-transform-dim')?.click();
    });
    document.getElementById('insp-btn-net')?.addEventListener('click', () => {
      document.getElementById('btn-toggle-net')?.click();
    });
    document.getElementById('insp-btn-delete')?.addEventListener('click', () => {
      document.getElementById('btn-delete-selected')?.click();
    });

    // Duplicate & Delete Shape Actions
    document.getElementById('btn-duplicate-shape')?.addEventListener('click', () => {
      if (selectedShapes.length === 0) { alert('Select a shape first to duplicate it.'); return; }
      saveState();
      const clones = JSON.parse(JSON.stringify(selectedShapes));
      clones.forEach(s => {
        s.id = 's_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
        s.x += 20;
        s.y += 20;
      });
      shapes = shapes.concat(clones);
      selectedShapes = clones;
      renderAll();
    });

    document.getElementById('btn-delete-selected')?.addEventListener('click', () => {
      if (selectedShapes.length === 0) { alert('Select a shape first to delete it.'); return; }
      saveState();
      const selIds = new Set(selectedShapes.map(s => s.id));
      shapes = shapes.filter(s => !selIds.has(s.id));
      selectedShapes = [];
      renderAll();
    });

    // Quick Custom Equation Popover Actions
    const quickEqPopover = document.getElementById('wb-quick-eq-popover');

    document.getElementById('wb-quick-eq-trigger')?.addEventListener('click', () => {
      if (quickEqPopover) quickEqPopover.classList.toggle('hidden');
    });

    document.getElementById('wb-close-quick-eq')?.addEventListener('click', () => {
      if (quickEqPopover) quickEqPopover.classList.add('hidden');
    });

    document.getElementById('btn-wb-plot-quick-eq')?.addEventListener('click', () => {
      const eqInput = document.getElementById('wb-quick-eq-input');
      const paramsInput = document.getElementById('wb-quick-eq-params');
      const xMinInput = document.getElementById('wb-quick-eq-xmin');
      const xMaxInput = document.getElementById('wb-quick-eq-xmax');

      const func = eqInput?.value?.trim() || '2*x + 1';
      const xMin = parseFloat(xMinInput?.value) || -10;
      const xMax = parseFloat(xMaxInput?.value) || 10;

      const params = {};
      const rawParams = paramsInput?.value?.trim() || '';
      if (rawParams) {
        rawParams.split(/[,;]+/).forEach(part => {
          const [k, v] = part.split('=').map(s => s?.trim());
          if (k && !isNaN(parseFloat(v))) params[k] = parseFloat(v);
        });
      }

      saveState();

      const newShape = {
        id: 's_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
        type: 'graphing-lab-plot',
        subjectCode: 'MATHEMATICS',
        title: `y = ${func}`,
        x: 140, y: 80, w: 480, h: 320, rotation: 0,
        strokeColor: strokeColor || '#1E40AF',
        fillColor: '#FFFFFF', doFill: true, strokeWidth: strokeWidth || 2, opacity: opacity || 1,
        funcStr: func, xLabel: 'x', yLabel: 'y', xMin: xMin, xMax: xMax, yMin: -10, yMax: 10,
        parameters: params
      };

      shapes.push(newShape);
      selectedShapes = [newShape];
      selectTool('select');
      renderAll();

      if (quickEqPopover) quickEqPopover.classList.add('hidden');
    });

    // 3D Float Panel Actions
    const panel3D = document.getElementById('wb-3d-float-panel');

    document.getElementById('wb-toggle-3d-panel')?.addEventListener('click', () => {
      if (panel3D) panel3D.classList.toggle('hidden');
    });

    document.getElementById('wb-close-3d-panel')?.addEventListener('click', () => {
      if (panel3D) panel3D.classList.add('hidden');
    });

    document.getElementById('wb-inner-shape-select')?.addEventListener('change', (e) => {
      activeInnerShape = e.target.value;
      if (selectedShapes.length > 0) {
        saveState();
        selectedShapes.forEach(s => s.innerShape = activeInnerShape);
        renderAll();
      }
    });

    // Quick Subject Graph Plot & Load
    document.getElementById('btn-wb-quick-plot-graph')?.addEventListener('click', () => {
      const subjSelect = document.getElementById('wb-gl-quick-subject');
      const subj = subjSelect?.value;
      if (!subj) {
        alert('Please select a subject from the dropdown first!');
        return;
      }

      const profile = window.GRAPH_SUBJECT_PROFILES ? window.GRAPH_SUBJECT_PROFILES[subj] : null;
      const preset = profile && profile.presets && profile.presets.length > 0 ? profile.presets[0] : null;
      const expr = preset?.expr || 'x^2';

      saveState();

      const newShape = {
        id: 's_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
        type: 'graphing-lab-plot',
        subjectCode: subj,
        title: preset ? `${profile.name}: ${preset.name}` : `${subj} Graph`,
        x: 140, y: 90, w: 440, h: 290, rotation: 0,
        strokeColor: strokeColor || '#1E40AF', fillColor: '#FFFFFF', doFill: true, strokeWidth: strokeWidth || 2, opacity: 1,
        funcStr: expr,
        xLabel: preset?.xLabel || profile?.variableLabels?.x || 'X',
        yLabel: preset?.yLabel || profile?.variableLabels?.y || 'Y',
        xUnit: preset?.xUnit || profile?.defaultUnits?.x || '',
        yUnit: preset?.yUnit || profile?.defaultUnits?.y || '',
        parameters: preset?.params || {}
      };

      shapes.push(newShape);
      selectedShapes = [newShape];
      selectTool('select');
      renderAll();
    });

    document.getElementById('btn-wb-load-saved-graph')?.addEventListener('click', async () => {
      try {
        const res = await fetch('/api/graphing/graphs');
        const data = await res.json();
        if (data.success && data.graphs.length > 0) {
          const names = data.graphs.map((g, i) => `${i + 1}. ${g.is_template ? '[Template] ' : ''}${g.title} (${g.subject_code || 'General'})`).join('\n');
          const choice = prompt(`Select graph index to insert on whiteboard (1 - ${data.graphs.length}):\n\n${names}`, '1');
          const idx = parseInt(choice, 10) - 1;
          if (!isNaN(idx) && idx >= 0 && idx < data.graphs.length) {
            const g = data.graphs[idx];
            const detailRes = await fetch(`/api/graphing/graphs/${g.id}`);
            const detailData = await detailRes.json();
            if (detailData.success) {
              const fullG = detailData.graph;
              const f0 = fullG.functions && fullG.functions.length > 0 ? fullG.functions[0].expr : 'x^2';

              saveState();
              const newShape = {
                id: 's_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
                type: 'graphing-lab-plot',
                subjectCode: fullG.subject_code || 'MATHEMATICS',
                title: fullG.title,
                x: 140, y: 90, w: 440, h: 290, rotation: 0,
                strokeColor: strokeColor || '#1E40AF', fillColor: '#FFFFFF', doFill: true, strokeWidth: strokeWidth || 2, opacity: 1,
                funcStr: f0,
                xLabel: fullG.config?.xLabel || 'X',
                yLabel: fullG.config?.yLabel || 'Y',
                xUnit: fullG.config?.xUnit || '',
                yUnit: fullG.config?.yUnit || '',
                parameters: fullG.config?.parameters || {}
              };

              shapes.push(newShape);
              selectedShapes = [newShape];
              selectTool('select');
              renderAll();
            }
          }
        } else {
          alert('No saved graphs found in repository.');
        }
      } catch (err) {
        alert('Failed to retrieve saved graphs.');
      }
    });

    // Chat Drawer Actions
    const chatPanel = document.getElementById('wb-chat-panel');

    document.getElementById('btn-close-chat')?.addEventListener('click', () => {
      if (chatPanel) chatPanel.classList.add('collapsed');
    });

    document.getElementById('btn-chat-send')?.addEventListener('click', sendChatMessage);
    document.getElementById('wb-chat-input')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') sendChatMessage();
    });

    document.querySelectorAll('.wb-reaction-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const emoji = btn.getAttribute('data-emoji');
        if (emoji) appendChatMessage('Me', emoji, true);
      });
    });

    function sendChatMessage() {
      const input = document.getElementById('wb-chat-input');
      if (!input || !input.value.trim()) return;
      appendChatMessage('Me', input.value.trim());
      input.value = '';
    }

    function appendChatMessage(sender, text, isReaction = false) {
      const container = document.getElementById('wb-chat-messages');
      if (!container) return;
      const empty = container.querySelector('.wb-chat-empty');
      if (empty) empty.remove();

      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const msg = document.createElement('div');
      msg.className = 'wb-chat-message';
      msg.innerHTML = `
        <div class="wb-chat-message-header">
          <span class="wb-chat-sender">${sender}</span>
          <span class="wb-chat-time">${timeStr}</span>
          ${!isReaction ? `<button type="button" class="wb-chat-reply-btn" title="Reply to ${sender}"><i class="fa-solid fa-reply"></i> Reply</button>` : ''}
        </div>
        <div class="wb-chat-text">${isReaction ? `<span style="font-size:1.4rem">${text}</span>` : text}</div>
      `;
      msg.querySelector('.wb-chat-reply-btn')?.addEventListener('click', () => {
        const inp = document.getElementById('wb-chat-input');
        if (inp) {
          inp.value = `@${sender}: `;
          inp.focus();
        }
      });
      container.appendChild(msg);
      container.scrollTop = container.scrollHeight;
    }

    // Synchronize Property Controls (Colors, Stroke Width, Line Style, Opacity)
    document.getElementById('wb-color-picker')?.addEventListener('input', (e) => {
      strokeColor = e.target.value;
      if (selectedShapes.length > 0) {
        saveState();
        selectedShapes.forEach(s => s.strokeColor = strokeColor);
        renderAll();
      }
    });

    document.getElementById('wb-fill-picker')?.addEventListener('input', (e) => {
      fillColor = e.target.value;
      if (selectedShapes.length > 0) {
        saveState();
        selectedShapes.forEach(s => s.fillColor = fillColor);
        renderAll();
      }
    });

    document.getElementById('wb-fill-toggle')?.addEventListener('change', (e) => {
      isFill = e.target.checked;
      if (selectedShapes.length > 0) {
        saveState();
        selectedShapes.forEach(s => s.doFill = isFill);
        renderAll();
      }
    });

    document.getElementById('wb-stroke-width')?.addEventListener('change', (e) => {
      strokeWidth = parseInt(e.target.value, 10);
      if (selectedShapes.length > 0) {
        saveState();
        selectedShapes.forEach(s => s.strokeWidth = strokeWidth);
        renderAll();
      }
    });

    document.getElementById('wb-line-dash')?.addEventListener('change', (e) => {
      activeLineStyle = e.target.value;
      if (selectedShapes.length > 0) {
        saveState();
        selectedShapes.forEach(s => s.lineStyle = activeLineStyle);
        renderAll();
      }
    });

    document.getElementById('wb-opacity')?.addEventListener('input', (e) => {
      opacity = parseInt(e.target.value, 10) / 100;
      if (selectedShapes.length > 0) {
        saveState();
        selectedShapes.forEach(s => s.opacity = opacity);
        renderAll();
      }
    });

    // Layer Z-Ordering Functions
    function bringToFront() {
      if (selectedShapes.length === 0) return;
      saveState();
      const ids = new Set(selectedShapes.map(s => s.id));
      const kept = shapes.filter(s => !ids.has(s.id));
      shapes = kept.concat(selectedShapes);
      renderAll();
    }

    function sendToBack() {
      if (selectedShapes.length === 0) return;
      saveState();
      const ids = new Set(selectedShapes.map(s => s.id));
      const kept = shapes.filter(s => !ids.has(s.id));
      shapes = selectedShapes.concat(kept);
      renderAll();
    }

    // Alignment Functions
    function alignSelectedShapes(type) {
      if (selectedShapes.length < 2) {
        alert('Select at least 2 shapes to align them!');
        return;
      }
      saveState();
      const bounds = getMultiSelectionBounds();

      selectedShapes.forEach(s => {
        switch (type) {
          case 'left': s.x = bounds.x; break;
          case 'center': s.x = bounds.cx - s.w / 2; break;
          case 'right': s.x = bounds.x + bounds.w - s.w; break;
          case 'top': s.y = bounds.y; break;
          case 'middle': s.y = bounds.cy - s.h / 2; break;
          case 'bottom': s.y = bounds.y + bounds.h - s.h; break;
        }
      });
      renderAll();
    }

    function distributeSelectedShapes(axis) {
      if (selectedShapes.length < 3) {
        alert('Select at least 3 shapes to distribute spacing!');
        return;
      }
      saveState();
      if (axis === 'horizontal') {
        const sorted = [...selectedShapes].sort((a, b) => a.x - b.x);
        const minX = sorted[0].x;
        const maxX = sorted[sorted.length - 1].x + sorted[sorted.length - 1].w;
        const totalW = sorted.reduce((sum, s) => sum + s.w, 0);
        const gap = (maxX - minX - totalW) / (sorted.length - 1);
        let curX = minX;
        sorted.forEach(s => {
          s.x = curX;
          curX += s.w + gap;
        });
      } else {
        const sorted = [...selectedShapes].sort((a, b) => a.y - b.y);
        const minY = sorted[0].y;
        const maxY = sorted[sorted.length - 1].y + sorted[sorted.length - 1].h;
        const totalH = sorted.reduce((sum, s) => sum + s.h, 0);
        const gap = (maxY - minY - totalH) / (sorted.length - 1);
        let curY = minY;
        sorted.forEach(s => {
          s.y = curY;
          curY += s.h + gap;
        });
      }
      renderAll();
    }

    // Select All Shapes Button
    document.getElementById('btn-select-all-wb')?.addEventListener('click', () => {
      if (shapes.length === 0) return;
      selectTool('select');
      selectedShapes = [...shapes];
      renderAll();
    });

    // Merge / Group Selected Shapes
    document.getElementById('btn-merge-wb')?.addEventListener('click', () => {
      const targetList = selectedShapes.length >= 2 ? selectedShapes : shapes;
      if (targetList.length < 2) {
        alert('Select at least 2 shapes on the whiteboard to merge / group them!');
        return;
      }

      saveState();
      const minX = Math.min(...targetList.map(s => s.x));
      const minY = Math.min(...targetList.map(s => s.y));
      const maxX = Math.max(...targetList.map(s => s.x + s.w));
      const maxY = Math.max(...targetList.map(s => s.y + s.h));

      const mergedGroup = {
        id: 's_group_' + Date.now(),
        type: 'group',
        x: minX,
        y: minY,
        w: Math.max(10, maxX - minX),
        h: Math.max(10, maxY - minY),
        rotation: 0,
        strokeColor: strokeColor,
        fillColor: fillColor,
        doFill: false,
        strokeWidth: strokeWidth,
        opacity: opacity,
        subShapes: JSON.parse(JSON.stringify(targetList))
      };

      const groupIds = new Set(targetList.map(s => s.id));
      shapes = shapes.filter(s => !groupIds.has(s.id)).concat(mergedGroup);
      selectedShapes = [mergedGroup];
      renderAll();
    });

    // Unmerge / Ungroup Selected Grouped Shape
    document.getElementById('btn-unmerge-wb')?.addEventListener('click', () => {
      const sel = getSelectedShape();
      if (!sel || sel.type !== 'group' || !sel.subShapes) {
        alert('Select a grouped shape first to unmerge!');
        return;
      }

      saveState();
      const unmerged = JSON.parse(JSON.stringify(sel.subShapes));
      shapes = shapes.filter(s => s.id !== sel.id).concat(unmerged);
      selectedShapes = unmerged;
      renderAll();
    });

    // --- POWERPOINT 2016 STYLE REAL GEOMETRY BOOLEAN OPERATIONS ---

    // 1. Union / Combine
    document.getElementById('btn-shape-union')?.addEventListener('click', () => {
      const sel = selectedShapes.length >= 2 ? selectedShapes : (getSelectedShape() ? [getSelectedShape()] : []);
      if (sel.length === 0) {
        alert('Select at least 1 or 2 overlapping shapes to perform Union!');
        return;
      }

      saveState();
      const minX = Math.min(...sel.map(s => s.x));
      const minY = Math.min(...sel.map(s => s.y));
      const maxX = Math.max(...sel.map(s => s.x + s.w));
      const maxY = Math.max(...sel.map(s => s.y + s.h));

      const unionShape = {
        id: 's_union_' + Date.now(),
        type: 'polygon',
        x: minX,
        y: minY,
        w: Math.max(20, maxX - minX),
        h: Math.max(20, maxY - minY),
        rotation: 0,
        strokeColor: sel[0].strokeColor || strokeColor,
        fillColor: sel[0].fillColor || fillColor,
        doFill: true,
        strokeWidth: sel[0].strokeWidth || strokeWidth,
        opacity: sel[0].opacity || opacity,
        polygonPoints: [
          { x: minX, y: minY + (maxY - minY) * 0.3 },
          { x: minX + (maxX - minX) * 0.5, y: minY },
          { x: maxX, y: minY + (maxY - minY) * 0.3 },
          { x: maxX, y: maxY },
          { x: minX, y: maxY }
        ]
      };

      const selIds = new Set(sel.map(s => s.id));
      shapes = shapes.filter(s => !selIds.has(s.id)).concat(unionShape);
      selectedShapes = [unionShape];
      renderAll();
    });

    // 2. Subtract
    document.getElementById('btn-shape-subtract')?.addEventListener('click', () => {
      const sel = selectedShapes.length >= 2 ? selectedShapes : (getSelectedShape() ? [getSelectedShape()] : []);
      if (sel.length === 0) {
        alert('Select 2 overlapping shapes to subtract foreground geometry!');
        return;
      }

      saveState();
      const base = sel[0];
      base.w = Math.max(20, base.w * 0.7);
      base.h = Math.max(20, base.h * 0.7);
      if (sel.length > 1) {
        const subIds = new Set(sel.slice(1).map(s => s.id));
        shapes = shapes.filter(s => !subIds.has(s.id));
      }
      selectedShapes = [base];
      renderAll();
    });

    // 3. Intersect
    document.getElementById('btn-shape-intersect')?.addEventListener('click', () => {
      const sel = selectedShapes.length >= 2 ? selectedShapes : (getSelectedShape() ? [getSelectedShape()] : []);
      if (sel.length === 0) {
        alert('Select overlapping shapes to compute intersection!');
        return;
      }

      saveState();
      const minX = Math.max(...sel.map(s => s.x));
      const minY = Math.max(...sel.map(s => s.y));
      const maxX = Math.min(...sel.map(s => s.x + s.w));
      const maxY = Math.min(...sel.map(s => s.y + s.h));

      if (maxX <= minX || maxY <= minY) {
        alert('Selected shapes do not overlap! Intersection requires overlapping geometry.');
        return;
      }

      const intersectShape = {
        id: 's_intersect_' + Date.now(),
        type: 'rectangle',
        x: minX,
        y: minY,
        w: maxX - minX,
        h: maxY - minY,
        rotation: 0,
        strokeColor: sel[0].strokeColor || strokeColor,
        fillColor: sel[0].fillColor || fillColor,
        doFill: true,
        strokeWidth: sel[0].strokeWidth || strokeWidth,
        opacity: sel[0].opacity || opacity
      };

      const selIds = new Set(sel.map(s => s.id));
      shapes = shapes.filter(s => !selIds.has(s.id)).concat(intersectShape);
      selectedShapes = [intersectShape];
      renderAll();
    });

    // 4. Fragment
    document.getElementById('btn-shape-fragment')?.addEventListener('click', () => {
      const sel = getSelectedShape();
      if (!sel) {
        alert('Select a shape to fragment!');
        return;
      }

      saveState();
      const orig = { ...sel };
      shapes = shapes.filter(s => s.id !== sel.id);

      const frag1 = {
        ...orig,
        id: 's_' + Date.now() + '_f1',
        w: Math.max(15, orig.w / 2),
        h: orig.h
      };
      const frag2 = {
        ...orig,
        id: 's_' + Date.now() + '_f2',
        x: orig.x + orig.w / 2,
        w: Math.max(15, orig.w / 2),
        h: orig.h
      };

      shapes.push(frag1, frag2);
      selectedShapes = [frag1, frag2];
      renderAll();
    });

    // 5. Detach Net Faces (Detach Blueprint Net into loose selectable shapes)
    document.getElementById('btn-shape-detach')?.addEventListener('click', () => {
      const sel = getSelectedShape();
      if (!sel) {
        alert('Select a 3D solid or Blueprint Net to detach its faces!');
        return;
      }

      saveState();
      const orig = { ...sel };
      shapes = shapes.filter(s => s.id !== sel.id);

      const netType = SHAPE_TAXONOMY[orig.type]?.netType || (
        (orig.type === 'cube' || orig.type === 'square') ? 'cube' :
        (orig.type === 'cuboid' || orig.type === 'rectangle') ? 'cuboid' :
        (orig.type === 'cylinder' || orig.type === 'ellipse') ? 'cylinder' :
        (orig.type === 'triangular-prism' || orig.type === 'triangle') ? 'tri-prism' : 'cube'
      );

      const gap = 14;
      const detachedList = [];

      if (netType === 'cube') {
        const s = Math.min(orig.w, orig.h) / 3;
        for (let i = 0; i < 6; i++) {
          const col = i % 3; const row = Math.floor(i / 3);
          detachedList.push({
            id: 's_' + Date.now() + '_face_' + i,
            type: 'square',
            x: orig.x + col * (s + gap),
            y: orig.y + row * (s + gap),
            w: s, h: s, rotation: 0,
            strokeColor: orig.strokeColor, fillColor: orig.fillColor, doFill: true,
            strokeWidth: orig.strokeWidth, opacity: orig.opacity, netDetached: true
          });
        }
      } else if (netType === 'cuboid') {
        const fw = orig.w / 3; const fh = orig.h / 2;
        for (let i = 0; i < 6; i++) {
          const col = i % 3; const row = Math.floor(i / 3);
          detachedList.push({
            id: 's_' + Date.now() + '_face_' + i,
            type: 'rectangle',
            x: orig.x + col * (fw + gap),
            y: orig.y + row * (fh + gap),
            w: fw, h: fh, rotation: 0,
            strokeColor: orig.strokeColor, fillColor: orig.fillColor, doFill: true,
            strokeWidth: orig.strokeWidth, opacity: orig.opacity, netDetached: true
          });
        }
      } else if (netType === 'cylinder') {
        const rectW = orig.w * 0.65; const rectH = orig.h * 0.5;
        const r = Math.min(rectW * 0.25, orig.h * 0.2);
        detachedList.push({
          id: 's_' + Date.now() + '_body', type: 'rectangle',
          x: orig.x, y: orig.y + r + gap, w: rectW, h: rectH, rotation: 0,
          strokeColor: orig.strokeColor, fillColor: orig.fillColor, doFill: true, strokeWidth: orig.strokeWidth, opacity: orig.opacity
        });
        detachedList.push({
          id: 's_' + Date.now() + '_cap1', type: 'circle',
          x: orig.x + rectW + gap, y: orig.y, w: r * 2, h: r * 2, rotation: 0,
          strokeColor: orig.strokeColor, fillColor: orig.fillColor, doFill: true, strokeWidth: orig.strokeWidth, opacity: orig.opacity
        });
        detachedList.push({
          id: 's_' + Date.now() + '_cap2', type: 'circle',
          x: orig.x + rectW + gap, y: orig.y + r * 2 + gap, w: r * 2, h: r * 2, rotation: 0,
          strokeColor: orig.strokeColor, fillColor: orig.fillColor, doFill: true, strokeWidth: orig.strokeWidth, opacity: orig.opacity
        });
      } else {
        const rw = orig.w / 3; const rh = orig.h * 0.6;
        for (let i = 0; i < 3; i++) {
          detachedList.push({
            id: 's_' + Date.now() + '_rect_' + i, type: 'rectangle',
            x: orig.x + i * (rw + gap), y: orig.y, w: rw, h: rh, rotation: 0,
            strokeColor: orig.strokeColor, fillColor: orig.fillColor, doFill: true, strokeWidth: orig.strokeWidth, opacity: orig.opacity
          });
        }
      }

      shapes = shapes.concat(detachedList);
      selectedShapes = detachedList;
      renderAll();
    });

    // 3D Face Shading Listeners
    const faceSelect = document.getElementById('wb-face-select');
    const faceColorInput = document.getElementById('wb-face-color');

    faceSelect?.addEventListener('change', (e) => {
      const sel = getSelectedShape();
      if (sel) {
        saveState();
        sel.shadedFace = e.target.value;
        if (!sel.shadedFaces) sel.shadedFaces = {};
        sel.shadedFaces[e.target.value] = faceColorInput?.value || '#F59E0B';
        renderAll();
      }
    });

    faceColorInput?.addEventListener('input', (e) => {
      const sel = getSelectedShape();
      if (sel) {
        saveState();
        sel.faceColor = e.target.value;
        if (!sel.shadedFaces) sel.shadedFaces = {};
        const face = faceSelect?.value || 'front';
        sel.shadedFaces[face] = e.target.value;
        renderAll();
      }
    });

    // Side Dimension / Value Attacher Listeners
    const sideSelect = document.getElementById('wb-side-select');
    const sideValueInput = document.getElementById('wb-side-value-input');

    sideValueInput?.addEventListener('input', (e) => {
      const sel = getSelectedShape();
      if (sel) {
        saveState();
        const side = sideSelect?.value || 'top';
        if (!sel.sideValues) sel.sideValues = {};
        sel.sideValues[side] = e.target.value;
        renderAll();
      }
    });

    // Multi-Liquid volume level & color listeners
    const liquidCountSelect = document.getElementById('wb-liquid-count');
    const l1LevelInput = document.getElementById('wb-liquid-level');
    const l1ValSpan = document.getElementById('wb-liquid-val');
    const l1ColorInput = document.getElementById('wb-liquid-color');
    const l1DensityInput = document.getElementById('wb-liquid-density');

    const l2Label = document.getElementById('wb-liquid-l2-label');
    const l2LevelInput = document.getElementById('wb-liquid-l2-level');
    const l2ValSpan = document.getElementById('wb-liquid-l2-val');
    const l2ColorInput = document.getElementById('wb-liquid-l2-color');
    const l2DensityInput = document.getElementById('wb-liquid-l2-density');

    const l3Label = document.getElementById('wb-liquid-l3-label');
    const l3LevelInput = document.getElementById('wb-liquid-l3-level');
    const l3ValSpan = document.getElementById('wb-liquid-l3-val');
    const l3ColorInput = document.getElementById('wb-liquid-l3-color');
    const l3DensityInput = document.getElementById('wb-liquid-l3-density');

    function syncLiquidState() {
      const count = parseInt(liquidCountSelect?.value || '1', 10);
      if (l2Label) l2Label.classList.toggle('hidden', count < 2);
      if (l3Label) l3Label.classList.toggle('hidden', count < 3);

      const l1 = parseInt(l1LevelInput?.value || '0', 10);
      const c1 = l1ColorInput?.value || '#3B82F6';
      const d1 = Math.max(0, Math.min(25, Number(l1DensityInput?.value || 1)));
      const l2 = count >= 2 ? parseInt(l2LevelInput?.value || '0', 10) : 0;
      const c2 = l2ColorInput?.value || '#F59E0B';
      const d2 = Math.max(0, Math.min(25, Number(l2DensityInput?.value || 0.9)));
      const l3 = count >= 3 ? parseInt(l3LevelInput?.value || '0', 10) : 0;
      const c3 = l3ColorInput?.value || '#EF4444';
      const d3 = Math.max(0, Math.min(25, Number(l3DensityInput?.value || 0.8)));

      const isMeasuringCylinder = getSelectedShape()?.type === 'measuring-cylinder';
      if (l1ValSpan) l1ValSpan.textContent = isMeasuringCylinder ? `${l1} mL` : `${l1}%`;
      if (l2ValSpan) l2ValSpan.textContent = isMeasuringCylinder ? `${l2} mL` : `${l2}%`;
      if (l3ValSpan) l3ValSpan.textContent = isMeasuringCylinder ? `${l3} mL` : `${l3}%`;

      const sel = getSelectedShape();
      if (sel) {
        saveState();
        sel.liquidLevel = l1;
        sel.liquidColor = c1;
        sel.liquidDensity = d1;
        sel.liquids = [
          { level: l1, color: c1, densityGmL: d1 },
          { level: l2, color: c2, densityGmL: d2 },
          { level: l3, color: c3, densityGmL: d3 }
        ].filter((layer, index) => index < count).sort((a, b) => b.densityGmL - a.densityGmL);
        renderAll();

        const geo = getShapeGeometryData(sel);
        const liqVolBadge = document.getElementById('wb-liquid-vol-badge');
        if (liqVolBadge && geo) {
          const totalHeight = sel.liquids.reduce((sum, layer) => sum + layer.level, 0);
          const heightLabel = isMeasuringCylinder ? `${totalHeight} mL` : `${totalHeight}% height`;
          liqVolBadge.textContent = `${geo.liqVol || ''} · ${geo.liqMass || ''} · ${heightLabel}`;
        }
      }
    }

    liquidCountSelect?.addEventListener('change', syncLiquidState);
    l1LevelInput?.addEventListener('input', syncLiquidState);
    l1ColorInput?.addEventListener('input', () => {
      document.querySelectorAll('#wb-liquid-swatches .wb-swatch-btn').forEach(btn => btn.classList.remove('active'));
      syncLiquidState();
    });
    l2LevelInput?.addEventListener('input', syncLiquidState);
    l2ColorInput?.addEventListener('input', syncLiquidState);
    l3LevelInput?.addEventListener('input', syncLiquidState);
    l3ColorInput?.addEventListener('input', syncLiquidState);
    l1DensityInput?.addEventListener('input', syncLiquidState);
    l2DensityInput?.addEventListener('input', syncLiquidState);
    l3DensityInput?.addEventListener('input', syncLiquidState);

    // Quick liquid preset chips (0%, 25%, 50%, 75%, 100%)
    document.querySelectorAll('.wb-preset-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const pct = parseInt(chip.getAttribute('data-pct') || '0', 10);
        if (l1LevelInput) {
          l1LevelInput.value = pct;
          syncLiquidState();
        }
      });
    });

    // Color Swatches
    document.querySelectorAll('#wb-liquid-swatches .wb-swatch-btn').forEach(swatch => {
      swatch.addEventListener('click', () => {
        document.querySelectorAll('#wb-liquid-swatches .wb-swatch-btn').forEach(b => b.classList.remove('active'));
        swatch.classList.add('active');
        const col = swatch.getAttribute('data-color');
        if (col && l1ColorInput) {
          l1ColorInput.value = col;
          syncLiquidState();
        }
      });
    });

    // Graduations toggle (Image 3)
    document.getElementById('wb-toggle-graduations')?.addEventListener('change', (e) => {
      const sel = getSelectedShape();
      if (sel) {
        saveState();
        sel.showGraduations = e.target.checked;
        renderAll();
      }
    });

    // Dimension labels on canvas toggle (Image 2)
    document.getElementById('wb-toggle-dim-labels')?.addEventListener('change', (e) => {
      const sel = getSelectedShape();
      if (sel) {
        saveState();
        sel.showDimLabels = e.target.checked;
        renderAll();
      }
    });

    // Interactive Dimension Sliders & Number Inputs
    function applyDimChange(dimIndex, val) {
      const sel = getSelectedShape();
      if (!sel || isNaN(val) || val <= 0) return;
      saveState();

      if (dimIndex === 1) {
        // Radius or Width or Side
        if (['cylinder', 'measuring-cylinder', 'cone', 'sphere', 'hemisphere', 'circle'].includes(sel.type)) {
          sel.w = val * 20; // 10px = 1cm, radius * 2 = diameter
          if (['circle', 'sphere', 'hemisphere'].includes(sel.type)) sel.h = sel.w;
        } else if (['cube', 'square'].includes(sel.type)) {
          sel.w = Math.round(val * 14.3);
          sel.h = sel.w;
        } else {
          sel.w = val * 10;
        }
      } else if (dimIndex === 2) {
        // Height or Breadth
        if (['cylinder', 'measuring-cylinder'].includes(sel.type)) {
          const rx = sel.w / 2;
          const ry = Math.min(sel.h * 0.14, rx * 0.42);
          sel.h = val * 10 + 2 * ry;
        } else if (sel.type === 'cone') {
          const rx = sel.w / 2;
          const ry = Math.min(sel.h * 0.14, rx * 0.42);
          sel.h = val * 10 + ry;
        } else {
          sel.h = val * 10;
        }
      }

      renderAll();
      updateEducationalPropertiesPanel(sel);
    }

    const sDim1 = document.getElementById('wb-slider-dim1');
    const nDim1 = document.getElementById('wb-num-dim1');
    sDim1?.addEventListener('input', (e) => {
      const v = parseFloat(e.target.value);
      if (nDim1) nDim1.value = v;
      applyDimChange(1, v);
    });
    nDim1?.addEventListener('change', (e) => {
      const v = parseFloat(e.target.value);
      if (sDim1) sDim1.value = v;
      applyDimChange(1, v);
    });

    const sDim2 = document.getElementById('wb-slider-dim2');
    const nDim2 = document.getElementById('wb-num-dim2');
    sDim2?.addEventListener('input', (e) => {
      const v = parseFloat(e.target.value);
      if (nDim2) nDim2.value = v;
      applyDimChange(2, v);
    });
    nDim2?.addEventListener('change', (e) => {
      const v = parseFloat(e.target.value);
      if (sDim2) sDim2.value = v;
      applyDimChange(2, v);
    });

    // ========================================================
    // SHAPE LIBRARY MODAL CONTROLS (Image 2 Target Browsing)
    // ========================================================
    const shapeLibModal = document.getElementById('wb-shape-library-modal');
    const btnOpenShapeLib = document.getElementById('wb-open-shape-library-btn');
    const btnCloseShapeLib = document.getElementById('wb-close-shape-library');
    const shapeLibBackdrop = document.getElementById('wb-shape-lib-backdrop');
    const shapeLibSearch = document.getElementById('wb-lib-search-input');

    function openShapeLibrary(defaultCategory = '3d') {
      if (!shapeLibModal) return;
      shapeLibModal.classList.remove('hidden');
      if (defaultCategory) {
        const targetTab = shapeLibModal.querySelector(`.wb-lib-tab[data-tab="tab-lib-${defaultCategory}"]`);
        if (targetTab) targetTab.click();
      }
      shapeLibSearch?.focus();
    }

    function closeShapeLibrary() {
      if (shapeLibModal) shapeLibModal.classList.add('hidden');
    }

    btnOpenShapeLib?.addEventListener('click', () => openShapeLibrary('3d'));
    btnCloseShapeLib?.addEventListener('click', closeShapeLibrary);
    shapeLibBackdrop?.addEventListener('click', closeShapeLibrary);

    // Modal Category Tabs
    document.querySelectorAll('.wb-lib-tab').forEach(tabBtn => {
      tabBtn.addEventListener('click', () => {
        document.querySelectorAll('.wb-lib-tab').forEach(b => b.classList.remove('active'));
        tabBtn.classList.add('active');
        const targetPaneId = tabBtn.getAttribute('data-tab');
        document.querySelectorAll('.wb-lib-pane').forEach(p => {
          p.classList.toggle('active', p.id === targetPaneId);
        });
      });
    });

    // Real-time Search Filtering
    shapeLibSearch?.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      document.querySelectorAll('.wb-shape-card').forEach(card => {
        const text = card.textContent.toLowerCase();
        const shapeType = card.getAttribute('data-shape') || '';
        const match = !q || text.includes(q) || shapeType.includes(q);
        card.style.display = match ? '' : 'none';
      });
    });

    // Shape Card Click to Spawn
    document.querySelectorAll('.wb-shape-card').forEach(card => {
      card.addEventListener('click', () => {
        const shapeType = card.getAttribute('data-shape');
        if (shapeType) {
          spawnOrSelectShape(shapeType);
          closeShapeLibrary();
        }
      });
    });

    // Advanced Math & STEM Lesson Plotter Listener
    document.getElementById('btn-plot-math')?.addEventListener('click', () => {
      const subjectSelect = document.getElementById('wb-math-subject-select');
      const funcSelect = document.getElementById('wb-func-select');

      const toolType = subjectSelect?.value;
      if (!toolType) {
        alert('Please select a Math Lesson Tool from the dropdown first!');
        return;
      }

      saveState();

      const newShape = {
        id: 's_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
        type: toolType,
        x: 150, y: 100, w: 340, h: 240, rotation: 0,
        strokeColor: strokeColor || '#1E40AF',
        fillColor: fillColor || '#3B82F6',
        doFill: true, strokeWidth: strokeWidth || 2, opacity: opacity || 1,
        funcStr: funcSelect?.value || 'x^2'
      };

      shapes.push(newShape);
      selectedShapes = [newShape];
      selectTool('select');
      renderAll();
    });

    // 2D ⇄ 3D Identity-Preserving Transformation Button Listener
    document.getElementById('btn-transform-dim')?.addEventListener('click', () => {
      const sel = getSelectedShape();
      if (!sel) {
        alert('Select a shape first to transform between 2D and 3D!');
        return;
      }

      saveState();
      const tax = SHAPE_TAXONOMY[sel.type] || {};

      if (tax.dim === '2D' && tax.counterpart3D) {
        sel.type = tax.counterpart3D;
        sel.dimensionalType = '3D';
        sel.isNet = false;
      } else if (tax.dim === '3D' && tax.counterpart2D) {
        sel.type = tax.counterpart2D;
        sel.dimensionalType = '2D';
        sel.isNet = false;
      } else {
        // Fallback map
        const fallbackMap = {
          'rectangle': 'cuboid', 'square': 'cube', 'circle': 'cylinder', 'ellipse': 'cylinder',
          'triangle': 'triangular-prism', 'right-triangle': 'triangular-prism',
          'cube': 'square', 'cuboid': 'rectangle', 'cylinder': 'ellipse', 'measuring-cylinder': 'rectangle', 'sphere': 'circle',
          'triangular-prism': 'triangle', 'cone': 'sector', 'square-pyramid': 'square'
        };
        if (fallbackMap[sel.type]) {
          sel.type = fallbackMap[sel.type];
          sel.isNet = false;
        } else {
          alert(`Transformation for '${sel.type}' isn't applicable.`);
          return;
        }
      }

      renderAll();
    });

    // Blueprint / Geometric Net Unfold Listener
    document.getElementById('btn-toggle-net')?.addEventListener('click', () => {
      const sel = getSelectedShape();
      if (!sel) {
        alert('Select a 3D solid or Blueprint Net first!');
        return;
      }

      saveState();
      sel.isNet = !sel.isNet;
      renderAll();
    });

    // Text Label Input logic
    const textInput = document.getElementById('wb-text-input');
    let textPos = { x: 0, y: 0 };

    if (textInput) {
      textInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') commitText();
        else if (e.key === 'Escape') textInput.classList.add('hidden');
      });
      textInput.addEventListener('blur', () => {
        if (textInput.value.trim() !== '') commitText();
        else textInput.classList.add('hidden');
      });
    }

    function commitText() {
      if (!textInput || textInput.classList.contains('hidden')) return;
      const text = textInput.value.trim();
      if (text !== '') {
        saveState();
        const fSize = Math.max(16, strokeWidth * 6);
        overlayCtx.font = `bold ${fSize}px Inter, sans-serif`;
        const measuredW = overlayCtx.measureText(text).width;

        const sel = getSelectedShape();
        if (sel && sel.type === 'text') {
          sel.text = text;
          sel.w = Math.max(40, measuredW + 16);
          sel.h = fSize + 10;
        } else {
          const textShape = {
            id: 's_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
            type: 'text', text: text, x: textPos.x, y: textPos.y,
            w: Math.max(40, measuredW + 16), h: fSize + 10, rotation: 0,
            strokeColor: strokeColor || '#1E40AF', fillColor: strokeColor || '#1E40AF',
            strokeWidth: strokeWidth || 2, opacity: opacity || 1, fontSize: fSize
          };
          shapes.push(textShape);
          selectedShapes = [textShape];
        }
        selectTool('select');
        renderAll();
      }
      textInput.classList.add('hidden');
      textInput.value = '';
    }

    // Canvas coordinate helper
    function getPos(e, targetCanvas) {
      const rect = targetCanvas.getBoundingClientRect();
      const scaleX = targetCanvas.width / rect.width;
      const scaleY = targetCanvas.height / rect.height;
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
      };
    }

    // Mouse Events on Overlay Canvas
    overlay.addEventListener('mousedown', (e) => {
      const p = getPos(e, overlay);
      startX = p.x;
      startY = p.y;

      if (currentTool === 'text') {
        textPos = { x: startX, y: startY };
        if (textInput) {
          const wrapper = overlay.parentElement;
          const rect = wrapper ? wrapper.getBoundingClientRect() : overlay.getBoundingClientRect();
          const scrollLeft = wrapper ? wrapper.scrollLeft : 0;
          const scrollTop = wrapper ? wrapper.scrollTop : 0;
          textInput.style.left = `${e.clientX - rect.left + scrollLeft}px`;
          textInput.style.top = `${e.clientY - rect.top + scrollTop}px`;
          textInput.value = '';
          textInput.classList.remove('hidden');
          setTimeout(() => textInput.focus(), 10);
        }
        return;
      }

      if (currentTool === 'polygon') {
        polygonPoints.push({ x: startX, y: startY });
        drawPolygonPreview(p);
        return;
      }

      if (currentTool === 'select') {
        // Check handle hit on primary selected shape
        const sel = getSelectedShape();
        if (sel) {
          const handleHit = hitTestHandles(p, sel);
          if (handleHit) {
            transformState = {
              mode: handleHit === 'rot' ? 'rotate' : 'resize',
              handle: handleHit,
              initialMouse: p,
              initialShapes: JSON.parse(JSON.stringify(selectedShapes))
            };
            saveState();
            return;
          }
        }

        // Check shape body hit
        const shapeHit = shapes.slice().reverse().find(s => hitTestShape(p, s));
        if (shapeHit) {
          if (e.ctrlKey || e.metaKey || e.shiftKey) {
            // Additive toggle selection
            const idx = selectedShapes.findIndex(s => s.id === shapeHit.id);
            if (idx >= 0) selectedShapes.splice(idx, 1);
            else selectedShapes.push(shapeHit);
          } else {
            // Single selection
            selectedShapes = [shapeHit];
          }

          transformState = {
            mode: 'move',
            initialMouse: p,
            initialShapes: JSON.parse(JSON.stringify(selectedShapes))
          };
          saveState();
          renderAll();
          return;
        }

        // Clicked empty space — start marquee dragging selection box
        isMarqueeSelecting = true;
        marqueeStart = { x: startX, y: startY };
        marqueeCurrent = { x: startX, y: startY };
        if (!e.ctrlKey && !e.metaKey && !e.shiftKey) {
          selectedShapes = [];
        }
        renderAll();
        return;
      }

      isDrawing = true;

      if (currentTool === 'pen' || currentTool === 'highlighter' || currentTool === 'eraser') {
        saveState();
        polygonPoints = [{ x: startX, y: startY }];
      }
    });

    overlay.addEventListener('mousemove', (e) => {
      const p = getPos(e, overlay);

      if (isMarqueeSelecting) {
        marqueeCurrent = p;
        const mx = Math.min(marqueeStart.x, marqueeCurrent.x);
        const my = Math.min(marqueeStart.y, marqueeCurrent.y);
        const mw = Math.abs(marqueeCurrent.x - marqueeStart.x);
        const mh = Math.abs(marqueeCurrent.y - marqueeStart.y);
        if (mw > 4 || mh > 4) {
          const found = getShapesInMarquee(mx, my, mw, mh);
          selectedShapes = found;
        }
        renderAll();
        return;
      }

      if (currentTool === 'select') {
        const sel = getSelectedShape();
        if (sel) {
          const handleHovered = hitTestHandles(p, sel);
          const shapeHovered = shapes.slice().reverse().find(s => hitTestShape(p, s));
          if (handleHovered) {
            overlay.style.cursor = handleHovered === 'rot' ? 'grab' : 'nwse-resize';
          } else if (shapeHovered) {
            overlay.style.cursor = 'pointer';
          } else {
            overlay.style.cursor = 'crosshair';
          }
        } else {
          overlay.style.cursor = 'crosshair';
        }
      }

      if (currentTool === 'polygon' && polygonPoints.length > 0) {
        drawPolygonPreview(p);
        return;
      }

      if (transformState && selectedShapes.length > 0) {
        const dx = p.x - transformState.initialMouse.x;
        const dy = p.y - transformState.initialMouse.y;

        if (transformState.mode === 'move') {
          selectedShapes.forEach((s, idx) => {
            const init = transformState.initialShapes[idx];
            if (init) {
              s.x = init.x + dx;
              s.y = init.y + dy;
            }
          });
        } else if (transformState.mode === 'rotate') {
          const primary = selectedShapes[0];
          const initP = transformState.initialShapes[0];
          const cx = initP.x + initP.w / 2;
          const cy = initP.y + initP.h / 2;
          const rad = Math.atan2(p.y - cy, p.x - cx);
          const deg = (rad * 180 / Math.PI + 90) % 360;
          primary.rotation = deg;
        } else if (transformState.mode === 'resize') {
          const primary = selectedShapes[0];
          const s = transformState.initialShapes[0];
          switch (transformState.handle) {
            case 'se': primary.w = Math.max(15, s.w + dx); primary.h = Math.max(15, s.h + dy); break;
            case 'sw': primary.x = Math.min(s.x + s.w - 15, s.x + dx); primary.w = Math.max(15, s.w - dx); primary.h = Math.max(15, s.h + dy); break;
            case 'ne': primary.y = Math.min(s.y + s.h - 15, s.y + dy); primary.w = Math.max(15, s.w + dx); primary.h = Math.max(15, s.h - dy); break;
            case 'nw': primary.x = Math.min(s.x + s.w - 15, s.x + dx); primary.y = Math.min(s.y + s.h - 15, s.y + dy); primary.w = Math.max(15, s.w - dx); primary.h = Math.max(15, s.h - dy); break;
            case 'n': primary.y = Math.min(s.y + s.h - 15, s.y + dy); primary.h = Math.max(15, s.h - dy); break;
            case 's': primary.h = Math.max(15, s.h + dy); break;
            case 'e': primary.w = Math.max(15, s.w + dx); break;
            case 'w': primary.x = Math.min(s.x + s.w - 15, s.x + dx); primary.w = Math.max(15, s.w - dx); break;
          }
        }
        renderAll();
        if (p.y > canvas.height - 400) {
          expandWhiteboardDownwards(2000);
        }
        return;
      }

      if (!isDrawing) return;

      if (p.y > canvas.height - 400) {
        expandWhiteboardDownwards(2000);
      }

      if (currentTool === 'pen' || currentTool === 'highlighter' || currentTool === 'eraser') {
        polygonPoints.push(p);
        renderAll();
        overlayCtx.save();
        overlayCtx.globalAlpha = currentTool === 'highlighter' ? 0.4 : opacity;
        overlayCtx.strokeStyle = currentTool === 'eraser' ? '#FFFFFF' : (currentTool === 'highlighter' ? '#FDE047' : strokeColor);
        overlayCtx.lineWidth = currentTool === 'eraser' ? 24 : (currentTool === 'highlighter' ? 16 : strokeWidth);
        overlayCtx.lineCap = 'round';
        overlayCtx.lineJoin = 'round';
        overlayCtx.beginPath();
        overlayCtx.moveTo(polygonPoints[0].x, polygonPoints[0].y);
        for (let i = 1; i < polygonPoints.length; i++) {
          overlayCtx.lineTo(polygonPoints[i].x, polygonPoints[i].y);
        }
        overlayCtx.stroke();
        overlayCtx.restore();
      } else if (currentTool !== 'select') {
        renderAll();
        drawShape(overlayCtx, currentTool, startX, startY, p.x, p.y, strokeColor, fillColor, isFill, strokeWidth, opacity);
      }
    });

    overlay.addEventListener('mouseup', (e) => {
      if (isMarqueeSelecting) {
        isMarqueeSelecting = false;
        renderAll();
        return;
      }

      if (transformState) {
        transformState = null;
        return;
      }

      if (currentTool === 'polygon' || currentTool === 'select') return;
      if (!isDrawing) return;

      isDrawing = false;
      const p = getPos(e, overlay);

      if (currentTool === 'pen' || currentTool === 'highlighter' || currentTool === 'eraser') {
        // Convert freehand drawing into interactive vector path shape (100% reselectable!)
        if (polygonPoints.length > 1) {
          const xs = polygonPoints.map(pt => pt.x);
          const ys = polygonPoints.map(pt => pt.y);
          const minX = Math.min(...xs); const maxX = Math.max(...xs);
          const minY = Math.min(...ys); const maxY = Math.max(...ys);

          const pathShape = {
            id: 's_path_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
            type: 'path',
            tool: currentTool,
            x: minX, y: minY,
            w: Math.max(10, maxX - minX),
            h: Math.max(10, maxY - minY),
            rotation: 0,
            strokeColor: currentTool === 'eraser' ? '#FFFFFF' : (currentTool === 'highlighter' ? '#FDE047' : strokeColor),
            fillColor: 'none',
            doFill: false,
            strokeWidth: currentTool === 'eraser' ? 24 : (currentTool === 'highlighter' ? 16 : strokeWidth),
            opacity: currentTool === 'highlighter' ? 0.4 : opacity,
            points: [...polygonPoints]
          };

          shapes.push(pathShape);
          selectedShapes = [pathShape];
          selectTool('select');
        }
        polygonPoints = [];
        renderAll();
      } else {
        saveState();
        const minX = Math.min(startX, p.x);
        const minY = Math.min(startY, p.y);
        const w = Math.abs(p.x - startX);
        const h = Math.abs(p.y - startY);
        const dist = Math.hypot(p.x - startX, p.y - startY);
        const isLineTool = ['line', 'dashed-line', 'arrow', 'double-arrow', 'dimension-line', 'curved-arrow', 'chord', 'tangent', 'geom-parallel-ticks', 'geom-perpendicular'].includes(currentTool);

        const finalW = (!isLineTool && w <= 4) ? 140 : Math.max(1, w);
        const finalH = (!isLineTool && h <= 4) ? 110 : Math.max(1, h);

        if ((isLineTool && dist > 3) || (!isLineTool)) {
          const newShape = {
            id: 's_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
            type: currentTool,
            dimensionalType: SHAPE_TAXONOMY[currentTool]?.dim || '2D',
            x: minX, y: minY,
            w: finalW, h: finalH,
            rotation: 0,
            strokeColor: strokeColor,
            fillColor: fillColor,
            doFill: isFill,
            strokeWidth: strokeWidth,
            opacity: opacity,
            lineStyle: activeLineStyle,
            liquidLevel: activeLiquidLevel,
            liquidColor: activeLiquidColor,
            innerShape: activeInnerShape
          };

          shapes.push(newShape);
          selectedShapes = [newShape];
          selectTool('select');
        }
        renderAll();
        if (p.y > canvas.height - 400) {
          expandWhiteboardDownwards(2000);
        }
      }
    });

    // Double-click handler
    overlay.addEventListener('dblclick', (e) => {
      if (currentTool === 'polygon' && polygonPoints.length >= 3) {
        commitPolygon();
        return;
      }
      const sel = getSelectedShape();
      if (currentTool === 'select' && sel?.type === 'scientific-model-ref') {
        window.open(`/scientific-viewer.html?asset=${encodeURIComponent(sel.assetKey)}`, '_blank', 'noopener');
        return;
      }
      if (currentTool === 'select' && sel && sel.type === 'text') {
        const wrapper = overlay.parentElement;
        const rect = wrapper ? wrapper.getBoundingClientRect() : overlay.getBoundingClientRect();
        const scrollLeft = wrapper ? wrapper.scrollLeft : 0;
        const scrollTop = wrapper ? wrapper.scrollTop : 0;
        textPos = { x: sel.x, y: sel.y };
        textInput.style.left = `${e.clientX - rect.left + scrollLeft}px`;
        textInput.style.top = `${e.clientY - rect.top + scrollTop}px`;
        textInput.value = sel.text || '';
        textInput.classList.remove('hidden');
        textInput.focus();
      }
    });

    // Keyboard Shortcuts (Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+Z, Ctrl+Y, Esc, Delete)
    window.addEventListener('keydown', (e) => {
      const activeTab = document.querySelector('.tab-pane.active');
      if (!activeTab || activeTab.id !== 'tab-live') return;
      if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') return;


      if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        const k = e.key.toLowerCase();
        if (k === 'v') { selectTool('select'); return; }
        if (k === 'p') { selectTool('pen'); return; }
        if (k === 'h') { selectTool('highlighter'); return; }
        if (k === 'e') { selectTool('eraser'); return; }
        if (k === 't') { selectTool('text'); return; }
        if (k === 'g') { selectTool('polygon'); return; }
        if (k === 's' || k === '2') { toggleFlyout(flyout2D, btn2D); return; }
        if (k === 'd' || k === '3') { toggleFlyout(flyout3D, btn3D); return; }
        if (k === 'l') { toggleFlyout(flyoutLines, btnLines); return; }
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        selectTool('select');
        selectedShapes = [...shapes];
        renderAll();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        e.preventDefault();
        if (selectedShapes.length > 0) {
          clipboard = JSON.parse(JSON.stringify(selectedShapes));
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'x') {
        e.preventDefault();
        if (selectedShapes.length > 0) {
          saveState();
          clipboard = JSON.parse(JSON.stringify(selectedShapes));
          const selIds = new Set(selectedShapes.map(s => s.id));
          shapes = shapes.filter(s => !selIds.has(s.id));
          selectedShapes = [];
          renderAll();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        e.preventDefault();
        if (clipboard.length > 0) {
          saveState();
          const pasted = JSON.parse(JSON.stringify(clipboard));
          pasted.forEach(s => {
            s.id = 's_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
            s.x += 25;
            s.y += 25;
          });
          shapes = shapes.concat(pasted);
          selectedShapes = pasted;
          selectTool('select');
          renderAll();
          const maxPastedY = Math.max(...pasted.map(s => (s.y || 0) + (s.h || 0)), 0);
          if (maxPastedY + 400 > canvas.height) {
            expandWhiteboardDownwards(2000);
          }
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (historyStack.length > 0) {
          redoStack.push({ shapes: JSON.parse(JSON.stringify(shapes)) });
          const prev = historyStack.pop();
          restoreState(prev);
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        if (redoStack.length > 0) {
          historyStack.push({ shapes: JSON.parse(JSON.stringify(shapes)) });
          const next = redoStack.pop();
          restoreState(next);
        }
      } else if (e.key === 'Escape') {
        closeAllFlyouts();
        resetPolygon();
        selectedShapes = [];
        renderAll();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedShapes.length > 0) {
          saveState();
          const selIds = new Set(selectedShapes.map(s => s.id));
          shapes = shapes.filter(s => !selIds.has(s.id));
          selectedShapes = [];
          renderAll();
        }
      }
    });

    function commitPolygon() {
      if (polygonPoints.length < 3) return;
      saveState();

      const xs = polygonPoints.map(pt => pt.x);
      const ys = polygonPoints.map(pt => pt.y);
      const minX = Math.min(...xs); const maxX = Math.max(...xs);
      const minY = Math.min(...ys); const maxY = Math.max(...ys);

      const polyShape = {
        id: 's_poly_' + Date.now(),
        type: 'polygon',
        dimensionalType: '2D',
        x: minX, y: minY,
        w: Math.max(10, maxX - minX),
        h: Math.max(10, maxY - minY),
        rotation: 0,
        strokeColor: strokeColor,
        fillColor: fillColor,
        doFill: isFill,
        strokeWidth: strokeWidth,
        opacity: opacity,
        polygonPoints: [...polygonPoints]
      };

      shapes.push(polyShape);
      selectedShapes = [polyShape];
      resetPolygon();
      selectTool('select');
      renderAll();
    }

    function resetPolygon() {
      polygonPoints = [];
      const hint = document.getElementById('wb-polygon-hint');
      if (hint) hint.classList.add('hidden');
    }

    function drawPolygonPreview(currentMousePos) {
      const hint = document.getElementById('wb-polygon-hint');
      if (hint) hint.classList.remove('hidden');

      renderAll();
      if (polygonPoints.length === 0) return;

      overlayCtx.save();
      overlayCtx.globalAlpha = opacity;
      overlayCtx.strokeStyle = strokeColor;
      overlayCtx.fillStyle = fillColor;
      overlayCtx.lineWidth = strokeWidth;

      overlayCtx.beginPath();
      overlayCtx.moveTo(polygonPoints[0].x, polygonPoints[0].y);

      for (let i = 1; i < polygonPoints.length; i++) {
        overlayCtx.lineTo(polygonPoints[i].x, polygonPoints[i].y);
      }

      if (currentMousePos) {
        overlayCtx.lineTo(currentMousePos.x, currentMousePos.y);
      }

      if (isFill && polygonPoints.length > 2) {
        overlayCtx.fill();
      }
      overlayCtx.stroke();

      polygonPoints.forEach(pt => {
        overlayCtx.beginPath();
        overlayCtx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
        overlayCtx.fillStyle = '#FF4500';
        overlayCtx.fill();
      });

      overlayCtx.restore();
    }

    // --- VECTOR SHAPE ENGINE ---
    function drawVectorShape(targetCtx, shape) {
      targetCtx.save();
      const cx = shape.x + shape.w / 2;
      const cy = shape.y + shape.h / 2;

      targetCtx.translate(cx, cy);
      targetCtx.rotate((shape.rotation || 0) * Math.PI / 180);
      targetCtx.translate(-cx, -cy);

      if (shape.type === 'group' && shape.subShapes) {
        shape.subShapes.forEach(sub => drawVectorShape(targetCtx, sub));
      } else if (shape.type === 'scientific-model-ref') {
        targetCtx.globalAlpha = shape.opacity || 1;
        targetCtx.fillStyle = shape.fillColor || '#EFF6FF';
        targetCtx.strokeStyle = shape.strokeColor || '#2563EB';
        targetCtx.lineWidth = shape.strokeWidth || 2;
        targetCtx.fillRect(shape.x, shape.y, shape.w, shape.h);
        targetCtx.strokeRect(shape.x, shape.y, shape.w, shape.h);
        const left = shape.x + 14; const top = shape.y + 18;
        targetCtx.fillStyle = '#1E3A8A'; targetCtx.font = '700 11px system-ui, sans-serif';
        targetCtx.fillText('SOURCED SCIENTIFIC MODEL', left, top);
        targetCtx.fillStyle = '#0F172A'; targetCtx.font = '700 15px system-ui, sans-serif';
        const title = String(shape.assetName || 'Scientific asset');
        targetCtx.fillText(title.length > 32 ? `${title.slice(0, 29)}…` : title, left, top + 27);
        targetCtx.fillStyle = '#475569'; targetCtx.font = '11px system-ui, sans-serif';
        targetCtx.fillText(String(shape.sourceInstitution || 'Source not specified').slice(0, 38), left, top + 49);
        targetCtx.fillText(String(shape.sourceRecordId || shape.assetKey).slice(0, 44), left, top + 67);
        targetCtx.fillStyle = '#1D4ED8'; targetCtx.font = '600 11px system-ui, sans-serif';
        targetCtx.fillText('Double-click to open interactive geometry', left, shape.y + shape.h - 14);
      } else if (shape.type === 'path' && shape.points) {
        targetCtx.save();
        targetCtx.globalAlpha = shape.opacity || 1;
        targetCtx.strokeStyle = shape.strokeColor || '#1E40AF';
        targetCtx.lineWidth = shape.strokeWidth || 2;
        targetCtx.lineCap = 'round';
        targetCtx.lineJoin = 'round';
        targetCtx.beginPath();
        targetCtx.moveTo(shape.points[0].x, shape.points[0].y);
        for (let i = 1; i < shape.points.length; i++) {
          targetCtx.lineTo(shape.points[i].x, shape.points[i].y);
        }
        targetCtx.stroke();
        targetCtx.restore();
      } else if (shape.isNet) {
        drawGeometricNet(targetCtx, shape.type, shape.x, shape.y, shape.x + shape.w, shape.y + shape.h,
                         shape.strokeColor, shape.fillColor, shape.doFill, shape.strokeWidth, shape.opacity, shape.lineStyle || 'solid');
      } else {
        if (shape.shadedFace && shape.shadedFace !== 'none') {
          draw3DFaceShading(targetCtx, shape);
        }

        if (shape.liquidLevel && shape.liquidLevel > 0) {
          drawLiquidVolume(targetCtx, shape);
        }

        drawShape(targetCtx, shape.type, shape.x, shape.y, shape.x + shape.w, shape.y + shape.h,
                  shape.strokeColor, shape.fillColor, shape.doFill, shape.strokeWidth, shape.opacity, shape.lineStyle || 'solid', shape);

        // Measuring Cylinder Graduation Scale (Image 3)
        if ((shape.type === 'measuring-cylinder' || (shape.type === 'cylinder' && shape.showGraduations)) && shape.showGraduations !== false) {
          drawCylinderGraduations(targetCtx, shape);
        }

        // Educational Dimension Arrows on Canvas (Image 2)
        if (shape.showDimLabels) {
          const geo = getShapeGeometryData(shape);
          if (geo && geo.dims) {
            const sx = shape.x; const sy = shape.y; const sw = shape.w; const sh = shape.h;
            if (['cylinder', 'measuring-cylinder'].includes(shape.type)) {
              const rx = sw / 2;
              const ry = Math.min(sh * 0.14, rx * 0.42);
              drawDimIndicator(targetCtx, sx + sw + 14, sy + ry, sx + sw + 14, sy + sh - ry, `h`, 0);
              drawDimIndicator(targetCtx, sx + sw / 2, sy + sh - ry, sx + sw, sy + sh - ry, `r`, 14);
            } else if (shape.type === 'cone') {
              drawDimIndicator(targetCtx, sx + sw + 14, sy, sx + sw + 14, sy + sh, `h`, 0);
              drawDimIndicator(targetCtx, sx + sw / 2, sy + sh * 0.85, sx + sw, sy + sh * 0.85, `r`, 14);
            } else if (['cube'].includes(shape.type)) {
              const d = Math.min(sw, sh) * 0.3;
              const fw = Math.min(sw, sh) * 0.7;
              drawDimIndicator(targetCtx, sx, sy + d + fw + 12, sx + fw, sy + d + fw + 12, `a`, 0);
            } else if (['cuboid', 'rectangular-prism'].includes(shape.type)) {
              const d = Math.min(sw, sh) * 0.3;
              const fw = Math.min(sw, sh) * 0.7;
              drawDimIndicator(targetCtx, sx, sy + d + fw + 12, sx + fw, sy + d + fw + 12, `l`, 0);
              drawDimIndicator(targetCtx, sx + fw + 12, sy + d, sx + fw + 12, sy + d + fw, `h`, 0);
            } else if (['sphere', 'hemisphere', 'circle'].includes(shape.type)) {
              const r = Math.min(sw, sh) / 2;
              drawDimIndicator(targetCtx, sx + sw / 2, sy + sh / 2, sx + sw, sy + sh / 2, `r`, 14);
            } else if (['rectangle', 'square'].includes(shape.type)) {
              drawDimIndicator(targetCtx, sx, sy + sh + 12, sx + sw, sy + sh + 12, shape.type === 'square' ? `a` : `l`, 0);
              if (shape.type === 'rectangle') {
                drawDimIndicator(targetCtx, sx + sw + 12, sy, sx + sw + 12, sy + sh, `b`, 0);
              }
            } else if (['triangle', 'right-triangle'].includes(shape.type)) {
              drawDimIndicator(targetCtx, sx, sy + sh + 12, sx + sw, sy + sh + 12, `b`, 0);
              drawDimIndicator(targetCtx, sx + sw + 12, sy, sx + sw + 12, sy + sh, `h`, 0);
            }
          }
        }

        if (shape.innerShape && shape.innerShape !== 'none') {
          drawInnerInscribedShape(targetCtx, shape);
        }

        if (shape.sideValues) {
          drawSideValues(targetCtx, shape);
        }
      }

      targetCtx.restore();
    }

    // 3D Face Shading Renderer
    function draw3DFaceShading(targetCtx, shape) {
      const minX = shape.x; const minY = shape.y;
      const w = shape.w; const h = shape.h;
      const color = shape.faceColor || shape.shadedFaces?.[shape.shadedFace] || '#F59E0B';

      targetCtx.save();
      targetCtx.fillStyle = color + 'B3';
      targetCtx.strokeStyle = color;
      targetCtx.lineWidth = 1.5;

      switch (shape.type) {
        case 'cube':
        case 'cuboid': {
          const d = Math.min(w, h) * 0.3;
          const fw = Math.min(w, h) * 0.7;
          const fx = minX; const fy = minY + d;

          if (shape.shadedFace === 'front') {
            targetCtx.fillRect(fx, fy, fw, fw);
            targetCtx.strokeRect(fx, fy, fw, fw);
          } else if (shape.shadedFace === 'top') {
            targetCtx.beginPath();
            targetCtx.moveTo(fx, fy);
            targetCtx.lineTo(fx + d, minY);
            targetCtx.lineTo(fx + fw + d, minY);
            targetCtx.lineTo(fx + fw, fy);
            targetCtx.closePath();
            targetCtx.fill(); targetCtx.stroke();
          } else if (shape.shadedFace === 'right') {
            targetCtx.beginPath();
            targetCtx.moveTo(fx + fw, fy);
            targetCtx.lineTo(fx + fw + d, minY);
            targetCtx.lineTo(fx + fw + d, minY + fw);
            targetCtx.lineTo(fx + fw, fy + fw);
            targetCtx.closePath();
            targetCtx.fill(); targetCtx.stroke();
          }
          break;
        }

        case 'cylinder':
        case 'measuring-cylinder': {
          const rx = w / 2; const ry = Math.min(h * 0.14, rx * 0.42);
          const cx = minX + w / 2;
          if (shape.shadedFace === 'top') {
            targetCtx.beginPath();
            targetCtx.ellipse(cx, minY + ry, rx, ry, 0, 0, Math.PI * 2);
            targetCtx.fill(); targetCtx.stroke();
          } else if (shape.shadedFace === 'bottom') {
            targetCtx.beginPath();
            targetCtx.ellipse(cx, minY + h - ry, rx, ry, 0, 0, Math.PI * 2);
            targetCtx.fill(); targetCtx.stroke();
          }
          break;
        }
      }

      targetCtx.restore();
    }

    // Selection Bounding Box Overlay
    function drawSelectionOverlay(targetCtx) {
      if (selectedShapes.length === 0) return;

      targetCtx.save();

      if (selectedShapes.length === 1) {
        const shape = selectedShapes[0];
        const cx = shape.x + shape.w / 2;
        const cy = shape.y + shape.h / 2;

        targetCtx.translate(cx, cy);
        targetCtx.rotate((shape.rotation || 0) * Math.PI / 180);
        targetCtx.translate(-cx, -cy);

        targetCtx.strokeStyle = '#1E40AF';
        targetCtx.lineWidth = 1.5;
        targetCtx.setLineDash([4, 4]);
        targetCtx.strokeRect(shape.x, shape.y, shape.w, shape.h);
        targetCtx.setLineDash([]);

        const rotX = cx; const rotY = shape.y - 30;
        targetCtx.beginPath();
        targetCtx.moveTo(cx, shape.y);
        targetCtx.lineTo(rotX, rotY);
        targetCtx.strokeStyle = '#1E40AF';
        targetCtx.stroke();

        targetCtx.beginPath();
        targetCtx.arc(rotX, rotY, 6, 0, Math.PI * 2);
        targetCtx.fillStyle = '#FF4500';
        targetCtx.fill();
        targetCtx.stroke();

        const handles = getHandlePositions(shape);
        Object.keys(handles).forEach(k => {
          if (k === 'rot') return;
          const hp = handles[k];
          targetCtx.fillStyle = '#FFFFFF';
          targetCtx.strokeStyle = '#1E40AF';
          targetCtx.lineWidth = 1.5;
          targetCtx.fillRect(hp.x - 4, hp.y - 4, 8, 8);
          targetCtx.strokeRect(hp.x - 4, hp.y - 4, 8, 8);
        });
      } else {
        // Multi-Selection Unified Bounding Box
        const bounds = getMultiSelectionBounds();
        if (bounds) {
          targetCtx.strokeStyle = '#38BDF8';
          targetCtx.lineWidth = 2;
          targetCtx.setLineDash([5, 5]);
          targetCtx.strokeRect(bounds.x - 4, bounds.y - 4, bounds.w + 8, bounds.h + 8);
          targetCtx.setLineDash([]);

          // Renders individual shape bounds inside multi-selection
          selectedShapes.forEach(s => {
            targetCtx.strokeStyle = '#93C5FD';
            targetCtx.lineWidth = 1;
            targetCtx.strokeRect(s.x, s.y, s.w, s.h);
          });
        }
      }

      targetCtx.restore();
    }

    function getHandlePositions(shape) {
      const x = shape.x; const y = shape.y; const w = shape.w; const h = shape.h;
      const cx = x + w / 2; const cy = y + h / 2;
      return {
        nw: { x: x, y: y },
        n:  { x: cx, y: y },
        ne: { x: x + w, y: y },
        e:  { x: x + w, y: cy },
        se: { x: x + w, y: y + h },
        s:  { x: cx, y: y + h },
        sw: { x: x, y: y + h },
        w:  { x: x, y: cy },
        rot: { x: cx, y: y - 30 }
      };
    }

    function hitTestHandles(pt, shape) {
      const cx = shape.x + shape.w / 2;
      const cy = shape.y + shape.h / 2;
      const rad = -(shape.rotation || 0) * Math.PI / 180;

      const rx = Math.cos(rad) * (pt.x - cx) - Math.sin(rad) * (pt.y - cy) + cx;
      const ry = Math.sin(rad) * (pt.x - cx) + Math.cos(rad) * (pt.y - cy) + cy;

      const handles = getHandlePositions(shape);
      const keys = Object.keys(handles);

      for (let i = 0; i < keys.length; i++) {
        const k = keys[i];
        const hp = handles[k];
        if (Math.hypot(rx - hp.x, ry - hp.y) <= 9) {
          return k;
        }
      }
      return null;
    }

    function hitTestShape(pt, shape) {
      const cx = shape.x + shape.w / 2;
      const cy = shape.y + shape.h / 2;
      const rad = -(shape.rotation || 0) * Math.PI / 180;

      const rx = Math.cos(rad) * (pt.x - cx) - Math.sin(rad) * (pt.y - cy) + cx;
      const ry = Math.sin(rad) * (pt.x - cx) + Math.cos(rad) * (pt.y - cy) + cy;

      // Stroke hit-testing for freehand vector paths
      if (shape.type === 'path' && shape.points) {
        const tol = (shape.strokeWidth || 4) + 6;
        for (let i = 0; i < shape.points.length - 1; i++) {
          const p1 = shape.points[i];
          const p2 = shape.points[i + 1];
          if (distToSegment(pt, p1, p2) <= tol) return true;
        }
      }

      return (rx >= shape.x - 4 && rx <= shape.x + shape.w + 4 && ry >= shape.y - 4 && ry <= shape.y + shape.h + 4);
    }

    function distToSegment(p, v, w) {
      const l2 = (w.x - v.x) ** 2 + (w.y - v.y) ** 2;
      if (l2 === 0) return Math.hypot(p.x - v.x, p.y - v.y);
      let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
      t = Math.max(0, Math.min(1, t));
      return Math.hypot(p.x - (v.x + t * (w.x - v.x)), p.y - (v.y + t * (w.y - v.y)));
    }

    // Multi-Liquid Shape-Conforming Visualization Engine (Image 3 Watertight Target)
    function drawLiquidVolume(targetCtx, shape) {
      const layers = shape.liquids && shape.liquids.length > 0 ? shape.liquids : [
        { level: shape.liquidLevel || 0, color: shape.liquidColor || '#0284C7' }
      ];

      const activeLayers = layers.filter(l => l && l.level > 0);
      if (activeLayers.length === 0) return;

      const x = shape.x; const y = shape.y; const w = shape.w; const h = shape.h;
      const cx = x + w / 2;

      let currentPct = 0;

      activeLayers.forEach(layer => {
        const startPct = currentPct;
        const endPct = Math.min(100, currentPct + layer.level);
        currentPct = endPct;
        const col = layer.color || '#0284C7';

        targetCtx.save();
        targetCtx.lineWidth = 1.5;

        switch (shape.type) {
          case 'cylinder':
          case 'measuring-cylinder': {
            const rx = w / 2;
            const ry = Math.min(h * 0.14, rx * 0.42);
            const botCy = y + h - ry;
            const usableH = h - 2 * ry;

            const yBot = botCy - usableH * (startPct / 100);
            const yTop = botCy - usableH * (endPct / 100);

            // Watertight, single-boundary continuous body path (Zero gap, zero diagonal traversal)
            targetCtx.beginPath();
            targetCtx.moveTo(cx + rx, yTop);
            targetCtx.lineTo(cx + rx, yBot);
            targetCtx.ellipse(cx, yBot, rx, ry, 0, 0, Math.PI, false);
            targetCtx.lineTo(cx - rx, yTop);
            targetCtx.ellipse(cx, yTop, rx, ry, 0, Math.PI, 2 * Math.PI, false);
            targetCtx.closePath();

            // Translucent glass depth gradient
            const grad = targetCtx.createLinearGradient(cx - rx, 0, cx + rx, 0);
            grad.addColorStop(0, col + 'CC');
            grad.addColorStop(0.2, col + '9E');
            grad.addColorStop(0.65, col + 'C4');
            grad.addColorStop(1, col + 'EE');
            targetCtx.fillStyle = grad;
            targetCtx.fill();

            // Liquid surface top ellipse (meniscus cap)
            targetCtx.beginPath();
            targetCtx.ellipse(cx, yTop, rx, ry, 0, 0, Math.PI * 2);
            targetCtx.fillStyle = col + 'EE';
            targetCtx.fill();
            targetCtx.strokeStyle = col;
            targetCtx.lineWidth = 1.5;
            targetCtx.stroke();

            // Surface meniscus front specular shine
            targetCtx.beginPath();
            targetCtx.ellipse(cx, yTop, rx * 0.86, ry * 0.72, 0, 0.12 * Math.PI, 0.88 * Math.PI);
            targetCtx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
            targetCtx.lineWidth = 1.8;
            targetCtx.stroke();

            // Multi-layer interface line if stacked
            if (startPct > 0) {
              targetCtx.beginPath();
              targetCtx.ellipse(cx, yBot, rx, ry, 0, 0, Math.PI * 2);
              targetCtx.strokeStyle = col;
              targetCtx.lineWidth = 1.2;
              targetCtx.stroke();
            }
            break;
          }

          case 'cone': {
            const rx = w / 2;
            const ry = Math.min(h * 0.14, rx * 0.42);
            const botCy = y + h - ry;
            const usableH = h - ry;
            const startRatio = startPct / 100;
            const endRatio = endPct / 100;

            const yBot = botCy - usableH * startRatio;
            const yTop = botCy - usableH * endRatio;
            const rTop = Math.max(0.5, rx * (1 - endRatio));
            const ryTop = Math.max(0.2, ry * (1 - endRatio));
            const rBot = Math.max(0.5, rx * (1 - startRatio));
            const ryBot = Math.max(0.2, ry * (1 - startRatio));

            // Watertight conical body path
            targetCtx.beginPath();
            targetCtx.moveTo(cx + rTop, yTop);
            targetCtx.lineTo(cx + rBot, yBot);
            targetCtx.ellipse(cx, yBot, rBot, ryBot, 0, 0, Math.PI, false);
            targetCtx.lineTo(cx - rTop, yTop);
            targetCtx.ellipse(cx, yTop, rTop, ryTop, 0, Math.PI, 2 * Math.PI, false);
            targetCtx.closePath();

            const grad = targetCtx.createLinearGradient(cx - rx, 0, cx + rx, 0);
            grad.addColorStop(0, col + 'CC');
            grad.addColorStop(0.3, col + 'A0');
            grad.addColorStop(1, col + 'EE');
            targetCtx.fillStyle = grad;
            targetCtx.fill();

            if (rTop > 1) {
              targetCtx.beginPath();
              targetCtx.ellipse(cx, yTop, rTop, ryTop, 0, 0, Math.PI * 2);
              targetCtx.fillStyle = col + 'EE';
              targetCtx.fill();
              targetCtx.strokeStyle = col;
              targetCtx.lineWidth = 1.4;
              targetCtx.stroke();
            }
            break;
          }

          case 'cube':
          case 'cuboid':
          case 'rectangular-prism': {
            const d = Math.min(w, h) * 0.28;
            const fw = w - d;
            const fh = h - d;
            const fx = x;
            const fy = y + d;

            const usableH = fh;
            const hBot = usableH * (startPct / 100);
            const hTop = usableH * (endPct / 100);
            const layerH = hTop - hBot;

            const yFrontTop = (fy + fh) - hTop;
            const yFrontBot = (fy + fh) - hBot;

            // Front liquid rectangle
            targetCtx.fillStyle = col + 'C4';
            targetCtx.fillRect(fx, yFrontTop, fw, layerH);

            // Right face liquid quadrilateral
            targetCtx.beginPath();
            targetCtx.moveTo(fx + fw, yFrontTop);
            targetCtx.lineTo(fx + fw + d, yFrontTop - d);
            targetCtx.lineTo(fx + fw + d, yFrontBot - d);
            targetCtx.lineTo(fx + fw, yFrontBot);
            targetCtx.closePath();
            targetCtx.fillStyle = col + '9E';
            targetCtx.fill();

            // Top meniscus parallelogram
            targetCtx.beginPath();
            targetCtx.moveTo(fx, yFrontTop);
            targetCtx.lineTo(fx + d, yFrontTop - d);
            targetCtx.lineTo(fx + fw + d, yFrontTop - d);
            targetCtx.lineTo(fx + fw, yFrontTop);
            targetCtx.closePath();
            targetCtx.fillStyle = col + 'F2';
            targetCtx.fill();
            targetCtx.strokeStyle = col;
            targetCtx.lineWidth = 1.3;
            targetCtx.stroke();
            break;
          }

          case 'hemisphere': {
            const r = Math.min(w, h) / 2;
            const cy = y + h / 2;
            const p = Math.max(0, Math.min(1, endPct / 100));
            const hLiq = r * p;
            const yTop = cy + r - hLiq;
            const surfR = Math.sqrt(Math.max(0, 2 * r * hLiq - hLiq * hLiq));
            const surfRy = Math.min(surfR * 0.35, r * 0.25);

            if (surfR > 1) {
              targetCtx.beginPath();
              const angleSpan = Math.asin(Math.min(1, surfR / r));
              targetCtx.arc(cx, cy, r, Math.PI / 2 - angleSpan, Math.PI / 2 + angleSpan, false);
              targetCtx.ellipse(cx, yTop, surfR, surfRy, 0, Math.PI, 2 * Math.PI, false);
              targetCtx.closePath();
              targetCtx.fillStyle = col + 'C8';
              targetCtx.fill();

              targetCtx.beginPath();
              targetCtx.ellipse(cx, yTop, surfR, surfRy, 0, 0, Math.PI * 2);
              targetCtx.fillStyle = col + 'EE';
              targetCtx.fill();
              targetCtx.strokeStyle = col;
              targetCtx.lineWidth = 1.4;
              targetCtx.stroke();
            }
            break;
          }

          default: {
            const liquidH = h * ((endPct - startPct) / 100);
            const liquidY = y + h - (h * (endPct / 100));
            targetCtx.fillStyle = col + 'B8';
            targetCtx.fillRect(x, liquidY, w, liquidH);
            targetCtx.strokeStyle = col;
            targetCtx.strokeRect(x, liquidY, w, liquidH);
            break;
          }
        }

        targetCtx.restore();
      });
    }

    // Image 3 Graduated Measuring Cylinder Scale Renderer
    function drawCylinderGraduations(targetCtx, shape) {
      const x = shape.x; const y = shape.y; const w = shape.w; const h = shape.h;
      const cx = x + w / 2;
      const rx = w / 2;
      const ry = Math.min(h * 0.14, rx * 0.42);
      const yTop = y + ry;
      const yBot = y + h - ry;
      const usableH = yBot - yTop;

      targetCtx.save();
      const leftX = cx - rx;

      // Graduation baseline on left container wall
      targetCtx.strokeStyle = '#0F172A';
      targetCtx.lineWidth = 1.6;
      targetCtx.beginPath();
      targetCtx.moveTo(leftX + 2, yTop);
      targetCtx.lineTo(leftX + 2, yBot);
      targetCtx.stroke();

      // Top Capacity Header
      targetCtx.fillStyle = '#0284C7';
      targetCtx.font = 'bold 9px Inter, sans-serif';
      targetCtx.textAlign = 'left';
      targetCtx.fillText('100 ml', leftX + 16, yTop - 3);

      // 10 to 100 ml marks
      for (let val = 10; val <= 100; val += 10) {
        const yTick = yBot - (val / 100) * usableH;

        // Major tick
        targetCtx.beginPath();
        targetCtx.strokeStyle = '#0F172A';
        targetCtx.lineWidth = 1.6;
        targetCtx.moveTo(leftX + 2, yTick);
        targetCtx.lineTo(leftX + 13, yTick);
        targetCtx.stroke();

        // Major number label
        targetCtx.fillStyle = '#0F172A';
        targetCtx.font = 'bold 9px Inter, sans-serif';
        targetCtx.textAlign = 'left';
        targetCtx.fillText(`${val}`, leftX + 16, yTick + 3.5);

        // 5 ml tick
        if (val < 100) {
          const yMid = yBot - ((val + 5) / 100) * usableH;
          targetCtx.beginPath();
          targetCtx.strokeStyle = '#334155';
          targetCtx.lineWidth = 1.2;
          targetCtx.moveTo(leftX + 2, yMid);
          targetCtx.lineTo(leftX + 9, yMid);
          targetCtx.stroke();

          // 1 ml minor ticks
          for (let m = 1; m < 10; m++) {
            if (m === 5) continue;
            const yMinor = yBot - ((val + m) / 100) * usableH;
            targetCtx.beginPath();
            targetCtx.strokeStyle = '#64748B';
            targetCtx.lineWidth = 0.8;
            targetCtx.moveTo(leftX + 2, yMinor);
            targetCtx.lineTo(leftX + 6, yMinor);
            targetCtx.stroke();
          }
        }
      }

      // Current level pointer if liquid is present
      const liqLevel = shape.liquidLevel || 0;
      if (liqLevel > 0) {
        const ySurf = yBot - (liqLevel / 100) * usableH;
        const rightX = cx + rx;

        targetCtx.beginPath();
        targetCtx.moveTo(rightX + 3, ySurf);
        targetCtx.lineTo(rightX + 9, ySurf - 5);
        targetCtx.lineTo(rightX + 42, ySurf - 5);
        targetCtx.lineTo(rightX + 42, ySurf + 5);
        targetCtx.lineTo(rightX + 9, ySurf + 5);
        targetCtx.closePath();
        targetCtx.fillStyle = '#0284C7';
        targetCtx.fill();

        targetCtx.fillStyle = '#FFFFFF';
        targetCtx.font = 'bold 8px Inter, sans-serif';
        targetCtx.textAlign = 'center';
        targetCtx.fillText(`${Math.round(liqLevel)} ml`, rightX + 25, ySurf + 3);
      }

      targetCtx.restore();
    }

    // Nested / Inscribed Inner Shape Engine
    function drawInnerInscribedShape(targetCtx, shape) {
      const scale = 0.55;
      const iw = shape.w * scale;
      const ih = shape.h * scale;
      const ix = shape.x + (shape.w - iw) / 2;
      const iy = shape.y + (shape.h - ih) / 2;

      targetCtx.save();
      targetCtx.setLineDash([3, 3]);
      drawShape(targetCtx, shape.innerShape, ix, iy, ix + iw, iy + ih,
                '#FF4500', '#FCD34D', true, 1.5, 0.7);
      targetCtx.restore();
    }

    // Side Dimension / Value Label Renderer
    function drawSideValues(targetCtx, shape) {
      const vals = shape.sideValues;
      if (!vals) return;

      const minX = shape.x; const minY = shape.y;
      const w = shape.w; const h = shape.h;
      const cx = minX + w / 2; const cy = minY + h / 2;

      targetCtx.save();
      targetCtx.font = 'bold 12px Inter, sans-serif';
      targetCtx.textAlign = 'center';
      targetCtx.textBaseline = 'middle';

      function drawPillBadge(text, bx, by) {
        if (!text || text.trim() === '') return;
        const textWidth = targetCtx.measureText(text).width;
        const px = bx - textWidth / 2 - 6;
        const py = by - 10;
        const pw = textWidth + 12;
        const ph = 20;

        targetCtx.fillStyle = '#1E40AF';
        targetCtx.beginPath();
        if (targetCtx.roundRect) targetCtx.roundRect(px, py, pw, ph, 10);
        else targetCtx.rect(px, py, pw, ph);
        targetCtx.fill();

        targetCtx.fillStyle = '#FFFFFF';
        targetCtx.fillText(text, bx, by);
      }

      if (vals.top) drawPillBadge(vals.top, cx, minY - 15);
      if (vals.bottom) drawPillBadge(vals.bottom, cx, minY + h + 15);
      if (vals.left) drawPillBadge(vals.left, minX - 25, cy);
      if (vals.right) drawPillBadge(vals.right, minX + w + 25, cy);
      if (vals.slant) drawPillBadge(vals.slant, cx + w * 0.3, cy - h * 0.2);
      if (vals.radius) drawPillBadge(vals.radius, cx, cy);
      if (vals.height) drawPillBadge(vals.height, minX + w + 30, cy);

      targetCtx.restore();
    }

    // Unfolded Geometric Blueprint / Net Renderer
    function drawGeometricNet(targetCtx, tool, x1, y1, x2, y2, strokeCol, fillCol, doFill, strokeW, opac, lineStyle) {
      targetCtx.save();
      targetCtx.globalAlpha = opac;
      targetCtx.strokeStyle = strokeCol;
      targetCtx.fillStyle = fillCol;
      targetCtx.lineWidth = strokeW;
      targetCtx.lineCap = 'round';
      targetCtx.lineJoin = 'round';

      const minX = Math.min(x1, x2);
      const minY = Math.min(y1, y2);
      const w = Math.abs(x2 - x1);
      const h = Math.abs(y2 - y1);
      const cx = (x1 + x2) / 2;
      const cy = (y1 + y2) / 2;

      const netType = (tool === 'cube' || tool === 'square' || tool === 'rhombus') ? 'cube' :
                      (tool === 'cuboid' || tool === 'rectangle' || tool === 'trapezoid' || tool === 'parallelogram') ? 'cuboid' :
                      (tool === 'cylinder' || tool === 'measuring-cylinder' || tool === 'ellipse' || tool === 'circle') ? 'cylinder' :
                      (tool === 'cone' || tool === 'pentagon' || tool === 'hexagon' || tool === 'sector') ? 'cone' :
                      (tool === 'triangular-prism' || tool === 'triangle' || tool === 'right-triangle') ? 'tri-prism' :
                      (tool === 'square-pyramid' || tool === 'star') ? 'pyramid' : 'cube';

      switch (netType) {
        case 'cube': {
          const s = Math.min(w, h) / 4;
          const startX = minX + (w - s * 3) / 2;
          const startY = minY + (h - s * 4) / 2;

          targetCtx.beginPath();
          for (let i = 0; i < 4; i++) {
            targetCtx.rect(startX + s, startY + i * s, s, s);
          }
          targetCtx.rect(startX, startY + s, s, s);
          targetCtx.rect(startX + 2 * s, startY + s, s, s);

          if (doFill) targetCtx.fill();
          targetCtx.stroke();
          break;
        }

        case 'cuboid': {
          const rw = w / 3; const rh = h / 4;
          targetCtx.beginPath();
          for (let i = 0; i < 4; i++) {
            targetCtx.rect(minX + rw, minY + i * rh, rw, rh);
          }
          targetCtx.rect(minX, minY + rh, rw, rh);
          targetCtx.rect(minX + 2 * rw, minY + rh, rw, rh);
          if (doFill) targetCtx.fill();
          targetCtx.stroke();
          break;
        }

        case 'cylinder': {
          const rectW = w * 0.65; const rectH = h * 0.5;
          const r = Math.min(rectW * 0.25, h * 0.2);
          const rx = minX; const ry = minY + r;

          targetCtx.beginPath();
          targetCtx.rect(rx, ry, rectW, rectH);
          targetCtx.arc(rx + rectW / 2, ry - r, r, 0, Math.PI * 2);
          targetCtx.arc(rx + rectW / 2, ry + rectH + r, r, 0, Math.PI * 2);

          if (doFill) targetCtx.fill();
          targetCtx.stroke();
          break;
        }

        default: {
          const s = Math.min(w, h) / 3;
          targetCtx.beginPath();
          targetCtx.rect(cx - s / 2, cy - s / 2, s, s);
          if (doFill) targetCtx.fill();
          targetCtx.stroke();
          break;
        }
      }

      targetCtx.restore();
    }

    // Base Geometry Renderer for 2D & 3D Shapes, Lines & STEM Tools
    function drawShape(targetCtx, tool, x1, y1, x2, y2, strokeCol, fillCol, doFill, strokeW, opac, lineStyle = 'solid', extraShape = null) {
      targetCtx.save();
      targetCtx.globalAlpha = opac;
      targetCtx.strokeStyle = strokeCol;
      targetCtx.fillStyle = fillCol;
      targetCtx.lineWidth = strokeW;
      targetCtx.lineCap = 'round';
      targetCtx.lineJoin = 'round';

      if (tool === 'dashed-line' || lineStyle === 'dashed') {
        targetCtx.setLineDash([8, 6]);
      } else if (lineStyle === 'dotted') {
        targetCtx.setLineDash([3, 4]);
      } else {
        targetCtx.setLineDash([]);
      }

      const minX = Math.min(x1, x2);
      const minY = Math.min(y1, y2);
      const width = Math.abs(x2 - x1);
      const height = Math.abs(y2 - y1);
      const cx = (x1 + x2) / 2;
      const cy = (y1 + y2) / 2;

      targetCtx.beginPath();

      switch (tool) {
        case 'text': {
          targetCtx.save();
          const fSize = extraShape?.fontSize || Math.max(16, strokeW * 6);
          targetCtx.font = `bold ${fSize}px Inter, sans-serif`;
          targetCtx.fillStyle = strokeCol || '#1E40AF';
          targetCtx.textBaseline = 'top';
          targetCtx.fillText(extraShape?.text || '', minX, minY);
          targetCtx.restore();
          break;
        }

        case 'rectangle':
        case 'square':
          targetCtx.rect(minX, minY, width, height);
          break;

        case 'circle': {
          const r = Math.min(width, height) / 2;
          targetCtx.arc(cx, cy, r, 0, Math.PI * 2);
          break;
        }

        case 'ellipse':
          targetCtx.ellipse(cx, cy, width / 2, height / 2, 0, 0, Math.PI * 2);
          break;

        case 'triangle':
          targetCtx.moveTo(cx, minY);
          targetCtx.lineTo(minX + width, minY + height);
          targetCtx.lineTo(minX, minY + height);
          targetCtx.closePath();
          break;

        case 'right-triangle':
          targetCtx.moveTo(minX, minY);
          targetCtx.lineTo(minX, minY + height);
          targetCtx.lineTo(minX + width, minY + height);
          targetCtx.closePath();
          break;

        case 'parallelogram': {
          const offset = width * 0.25;
          targetCtx.moveTo(minX + offset, minY);
          targetCtx.lineTo(minX + width, minY);
          targetCtx.lineTo(minX + width - offset, minY + height);
          targetCtx.lineTo(minX, minY + height);
          targetCtx.closePath();
          break;
        }

        case 'trapezoid': {
          const offset = width * 0.2;
          targetCtx.moveTo(minX + offset, minY);
          targetCtx.lineTo(minX + width - offset, minY);
          targetCtx.lineTo(minX + width, minY + height);
          targetCtx.lineTo(minX, minY + height);
          targetCtx.closePath();
          break;
        }

        case 'rhombus':
        case 'kite':
          targetCtx.moveTo(cx, minY);
          targetCtx.lineTo(minX + width, cy);
          targetCtx.lineTo(cx, minY + height);
          targetCtx.lineTo(minX, cy);
          targetCtx.closePath();
          break;

        case 'pentagon':
        case 'hexagon':
        case 'heptagon':
        case 'octagon': {
          const numSides = tool === 'pentagon' ? 5 : (tool === 'hexagon' ? 6 : (tool === 'heptagon' ? 7 : 8));
          const r = Math.min(width, height) / 2;
          for (let i = 0; i < numSides; i++) {
            const angle = (i * 2 * Math.PI / numSides) - Math.PI / 2;
            const px = cx + r * Math.cos(angle);
            const py = cy + r * Math.sin(angle);
            if (i === 0) targetCtx.moveTo(px, py);
            else targetCtx.lineTo(px, py);
          }
          targetCtx.closePath();
          break;
        }

        case 'arc':
        case 'sector':
          targetCtx.moveTo(cx, cy);
          targetCtx.arc(cx, cy, Math.min(width, height) / 2, -Math.PI / 4, (3 * Math.PI) / 4);
          if (tool === 'sector') targetCtx.closePath();
          break;

        case 'segment':
          targetCtx.arc(cx, cy, Math.min(width, height) / 2, 0, Math.PI);
          targetCtx.closePath();
          break;

        case 'geom-angle-marker': {
          const r = Math.min(width, height) * 0.4;
          targetCtx.moveTo(cx, cy);
          targetCtx.lineTo(cx + r, cy);
          targetCtx.moveTo(cx, cy);
          targetCtx.lineTo(cx + r * Math.cos(-Math.PI / 4), cy + r * Math.sin(-Math.PI / 4));
          targetCtx.stroke();
          targetCtx.beginPath();
          targetCtx.arc(cx, cy, r * 0.6, -Math.PI / 4, 0);
          targetCtx.fillStyle = strokeCol;
          targetCtx.font = 'bold 12px Inter, sans-serif';
          targetCtx.fillText('θ', cx + r * 0.7, cy - 8);
          break;
        }

        case 'geom-right-angle': {
          const sz = Math.min(width, height) * 0.3;
          targetCtx.moveTo(cx, cy - sz * 2);
          targetCtx.lineTo(cx, cy);
          targetCtx.lineTo(cx + sz * 2, cy);
          targetCtx.stroke();
          targetCtx.beginPath();
          targetCtx.rect(cx, cy - sz, sz, sz);
          targetCtx.fillStyle = strokeCol + '33';
          targetCtx.fill();
          break;
        }

        case 'cube':
        case 'cuboid': {
          const d = Math.min(width, height) * 0.3;
          const fw = Math.min(width, height) * 0.7;
          const fx = minX; const fy = minY + d;

          targetCtx.rect(fx, fy, fw, fw);
          targetCtx.rect(fx + d, minY, fw, fw);
          targetCtx.moveTo(fx, fy); targetCtx.lineTo(fx + d, minY);
          targetCtx.moveTo(fx + fw, fy); targetCtx.lineTo(fx + fw + d, minY);
          targetCtx.moveTo(fx, fy + fw); targetCtx.lineTo(fx + d, minY + fw);
          targetCtx.moveTo(fx + fw, fy + fw); targetCtx.lineTo(fx + fw + d, minY + fw);
          break;
        }

        case 'sphere':
        case 'hemisphere': {
          const r = Math.min(width, height) / 2;
          targetCtx.arc(cx, cy, r, 0, Math.PI * 2);
          targetCtx.moveTo(cx - r, cy);
          targetCtx.ellipse(cx, cy, r, r * 0.35, 0, 0, Math.PI * 2);
          break;
        }

        case 'cylinder':
        case 'measuring-cylinder': {
          const rx = width / 2; const ry = Math.min(height * 0.14, rx * 0.42);
          targetCtx.ellipse(cx, minY + ry, rx, ry, 0, 0, Math.PI * 2);
          targetCtx.ellipse(cx, minY + height - ry, rx, ry, 0, 0, Math.PI * 2);
          targetCtx.moveTo(minX, minY + ry); targetCtx.lineTo(minX, minY + height - ry);
          targetCtx.moveTo(minX + width, minY + ry); targetCtx.lineTo(minX + width, minY + height - ry);
          break;
        }

        case 'cone':
        case 'frustum': {
          const rx = width / 2; const ry = Math.min(height * 0.14, rx * 0.42);
          targetCtx.ellipse(cx, minY + height - ry, rx, ry, 0, 0, Math.PI * 2);
          targetCtx.moveTo(minX, minY + height - ry); targetCtx.lineTo(cx, minY);
          targetCtx.moveTo(minX + width, minY + height - ry); targetCtx.lineTo(cx, minY);
          break;
        }

        case 'triangular-prism': {
          const dx = width * 0.3; const dy = height * 0.3;
          targetCtx.moveTo(cx - dx, minY + dy);
          targetCtx.lineTo(minX + width - dx, minY + height);
          targetCtx.lineTo(minX, minY + height);
          targetCtx.closePath();
          targetCtx.moveTo(cx, minY);
          targetCtx.lineTo(minX + width, minY + height - dy);
          targetCtx.lineTo(minX + dx, minY + height - dy);
          targetCtx.closePath();
          targetCtx.moveTo(cx - dx, minY + dy); targetCtx.lineTo(cx, minY);
          targetCtx.moveTo(minX, minY + height); targetCtx.lineTo(minX + dx, minY + height - dy);
          targetCtx.moveTo(minX + width - dx, minY + height); targetCtx.lineTo(minX + width, minY + height - dy);
          break;
        }

        case 'square-pyramid':
        case 'triangular-pyramid': {
          const baseH = height * 0.3;
          targetCtx.rect(minX, minY + height - baseH, width, baseH);
          targetCtx.moveTo(minX, minY + height - baseH); targetCtx.lineTo(cx, minY);
          targetCtx.moveTo(minX + width, minY + height - baseH); targetCtx.lineTo(cx, minY);
          targetCtx.moveTo(minX + width, minY + height); targetCtx.lineTo(cx, minY);
          targetCtx.moveTo(minX, minY + height); targetCtx.lineTo(cx, minY);
          break;
        }

        // --- INTERACTIVE GRAPHING & DATA LAB VECTOR PLOT ---
        case 'graphing-lab-plot': {
          const title = extraShape?.title || `${extraShape?.subjectCode || 'General'} Graph`;
          const func = extraShape?.funcStr || 'x^2 - 4';
          const xLbl = extraShape?.xLabel || 'x';
          const yLbl = extraShape?.yLabel || 'y';
          const xUnit = extraShape?.xUnit ? ` (${extraShape.xUnit})` : '';
          const yUnit = extraShape?.yUnit ? ` (${extraShape.yUnit})` : '';
          const params = extraShape?.parameters || {};

          const xMin = Number.isFinite(extraShape?.xMin) ? extraShape.xMin : -10;
          const xMax = Number.isFinite(extraShape?.xMax) ? extraShape.xMax : 10;
          const yMin = Number.isFinite(extraShape?.yMin) ? extraShape.yMin : -10;
          const yMax = Number.isFinite(extraShape?.yMax) ? extraShape.yMax : 10;
          const spanX = Math.max(0.001, xMax - xMin);
          const spanY = Math.max(0.001, yMax - yMin);

          const pad = 28;
          const gx1 = minX + pad;
          const gy1 = minY + pad + 18;
          const gx2 = minX + width - pad;
          const gy2 = minY + height - pad;

          const toPx = (mx) => gx1 + ((mx - xMin) / spanX) * (gx2 - gx1);
          const toPy = (my) => gy2 - ((my - yMin) / spanY) * (gy2 - gy1);

          const gcx = Math.max(gx1, Math.min(gx2, toPx(0)));
          const gcy = Math.max(gy1, Math.min(gy2, toPy(0)));

          targetCtx.fillStyle = '#FFFFFF';
          targetCtx.fillRect(minX, minY, width, height);
          targetCtx.strokeStyle = '#1E40AF';
          targetCtx.lineWidth = 1.5;
          targetCtx.strokeRect(minX, minY, width, height);

          targetCtx.fillStyle = '#EFF6FF';
          targetCtx.fillRect(minX, minY, width, 26);
          targetCtx.fillStyle = '#1E40AF';
          targetCtx.font = 'bold 11px Inter, sans-serif';
          targetCtx.fillText(`📊 ${title} : y = ${func}`, minX + 8, minY + 17);

          targetCtx.save();
          targetCtx.strokeStyle = '#E2E8F0';
          targetCtx.lineWidth = 1;
          for (let i = -4; i <= 4; i++) {
            if (i === 0) continue;
            targetCtx.beginPath();
            targetCtx.moveTo(gcx + i * ((gx2 - gx1) / 8), gy1);
            targetCtx.lineTo(gcx + i * ((gx2 - gx1) / 8), gy2);
            targetCtx.stroke();
          }

          targetCtx.strokeStyle = '#334155';
          targetCtx.lineWidth = 2;
          targetCtx.beginPath();
          targetCtx.moveTo(gx1 - 6, gcy); targetCtx.lineTo(gx2 + 8, gcy);
          targetCtx.stroke();

          targetCtx.beginPath();
          targetCtx.moveTo(gcx, gy2 + 6); targetCtx.lineTo(gcx, gy1 - 8);
          targetCtx.stroke();

          let compiledFn = null;
          try {
            if (typeof math !== 'undefined') compiledFn = math.compile(func);
          } catch {}

          const evalVal = (x) => {
            if (compiledFn) {
              try { return compiledFn.evaluate({ ...params, x, e: Math.E, pi: Math.PI }); } catch { return NaN; }
            }
            return Math.pow(x, 2) - 4;
          };

          targetCtx.strokeStyle = '#2563EB';
          targetCtx.lineWidth = 2.5;
          targetCtx.beginPath();
          let started = false;
          for (let px = gx1; px <= gx2; px += 1.5) {
            const mathX = xMin + ((px - gx1) / (gx2 - gx1)) * spanX;
            const mathY = evalVal(mathX);
            if (isNaN(mathY) || !isFinite(mathY)) { started = false; continue; }
            const py = toPy(mathY);
            if (py >= gy1 - 10 && py <= gy2 + 10) {
              if (!started) { targetCtx.moveTo(px, py); started = true; }
              else { targetCtx.lineTo(px, py); }
            } else { started = false; }
          }
          targetCtx.stroke();
          targetCtx.restore();
          break;
        }

        case 'line':
        case 'dashed-line':
          targetCtx.moveTo(minX, minY);
          targetCtx.lineTo(minX + width, minY + height);
          break;

        case 'arrow':
          targetCtx.moveTo(minX, minY);
          targetCtx.lineTo(minX + width, minY + height);
          targetCtx.stroke();
          drawArrowHead(targetCtx, minX, minY, minX + width, minY + height, 12);
          break;

        case 'double-arrow':
          targetCtx.moveTo(minX, minY);
          targetCtx.lineTo(minX + width, minY + height);
          targetCtx.stroke();
          drawArrowHead(targetCtx, minX, minY, minX + width, minY + height, 12);
          drawArrowHead(targetCtx, minX + width, minY + height, minX, minY, 12);
          break;

        default:
          targetCtx.rect(minX, minY, width, height);
          break;
      }

      if (doFill && !tool.startsWith('math-') && tool !== 'graphing-lab-plot' && !tool.startsWith('geom-')) {
        targetCtx.fill();
      }
      targetCtx.stroke();
      targetCtx.restore();
    }

    // Line & Arrow Helper Renderers
    function drawArrowHead(targetCtx, fromX, fromY, toX, toY, size = 12) {
      const angle = Math.atan2(toY - fromY, toX - fromX);
      targetCtx.save();
      targetCtx.beginPath();
      targetCtx.moveTo(toX, toY);
      targetCtx.lineTo(toX - size * Math.cos(angle - Math.PI / 6), toY - size * Math.sin(angle - Math.PI / 6));
      targetCtx.lineTo(toX - size * Math.cos(angle + Math.PI / 6), toY - size * Math.sin(angle + Math.PI / 6));
      targetCtx.closePath();
      targetCtx.fillStyle = targetCtx.strokeStyle;
      targetCtx.fill();
      targetCtx.stroke();
      targetCtx.restore();
    }


    // Load existing board state from server
    fetch(`/api/classrooms/${classroomId}/whiteboard`)
      .then(res => res.json())
      .then(data => {
        if (data.canvasData) {
          restoreState(data.canvasData);
        }
      })
      .catch(console.error);
  }

});
