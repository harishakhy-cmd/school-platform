(function () {
  'use strict';

  const classroomId = new URLSearchParams(window.location.search).get('id');
  let socket = null;
  let joined = false;
  let statusNode;

  function setStatus(message, connected) {
    if (!statusNode) {
      statusNode = document.createElement('div');
      statusNode.className = 'lab-live-status';
      statusNode.setAttribute('role', 'status');
      statusNode.setAttribute('aria-live', 'polite');
      document.body.appendChild(statusNode);
    }
    statusNode.textContent = message;
    statusNode.dataset.connected = connected ? 'true' : 'false';
  }

  function showNote(payload) {
    const note = document.createElement('aside');
    note.className = 'lab-live-note';
    note.setAttribute('role', 'status');
    note.setAttribute('aria-live', 'polite');
    const heading = document.createElement('strong');
    heading.textContent = `Live lab note from ${payload.senderName || 'your tutor'}`;
    const content = document.createElement('p');
    content.textContent = payload.note || '';
    const close = document.createElement('button');
    close.type = 'button';
    close.textContent = 'Dismiss';
    close.addEventListener('click', () => note.remove());
    note.append(heading, content, close);
    document.body.appendChild(note);
  }

  if (!classroomId) {
    setStatus('Open this lab from a classroom to join its live session.', false);
  } else if (typeof window.io !== 'function') {
    setStatus('Live classroom connection is unavailable in this browser.', false);
  } else {
    socket = window.io({ transports: ['websocket', 'polling'] });
    socket.on('connect', () => {
      joined = false;
      socket.emit('wb:join', { classroomId });
      setStatus('Connecting to classroom…', false);
    });
    socket.on('wb:joined', () => {
      joined = true;
      setStatus('Connected to classroom live notes.', true);
    });
    socket.on('lab:note', showNote);
    socket.on('connect_error', () => setStatus('Could not connect to classroom live notes.', false));
    socket.on('error', (error) => {
      if (error && error.code === 'FORBIDDEN') setStatus('You are not enrolled in this classroom.', false);
    });
  }

  window.CBTLabLive = {
    isConnected: () => joined,
    broadcast(note) {
      return new Promise((resolve) => {
        if (!socket || !joined || !socket.connected) {
          resolve({ ok: false, error: 'Join this lab from an active classroom first.' });
          return;
        }
        const timeout = window.setTimeout(() => resolve({ ok: false, error: 'The classroom did not confirm delivery.' }), 5000);
        socket.emit('lab:note:broadcast', { note }, (result) => {
          window.clearTimeout(timeout);
          resolve(result || { ok: false, error: 'No delivery confirmation received.' });
        });
      });
    }
  };
})();
