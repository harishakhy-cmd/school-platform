/**
 * live-classroom.js
 * Real-time live classroom client for CBT platform.
 *
 * Responsibilities:
 *  - Socket.io connection and whiteboard sync
 *  - LiveKit video/audio (when LIVEKIT configured) or local P2P fallback
 *  - Mic/camera toggle, screen share
 *  - Chat send/receive
 *  - Hand raise
 *  - Participants list
 *  - Toolbar button wiring
 *  - Class start/end controls
 */

/* global io, LivekitClient */

(function () {
  'use strict';

  // ─── State ─────────────────────────────────────────────────────────────────

  const LC = {
    socket: null,
    classroomId: null,
    participant: null, // { id, name, role }
    mode: 'local',     // 'livekit' | 'local'
    livekitRoom: null,
    localStream: null,
    screenStream: null,
    peers: {},          // peerId -> { pc, stream } for P2P fallback
    participants: {},   // id -> { name, role, muted, camOff, handRaised }
    micEnabled: false,
    camEnabled: false,
    screenSharing: false,
    chatOpen: false,
    participantsOpen: false,
    devicePopupOpen: false,
    handRaised: false,
    isLive: false,
    sessionTitle: '',
    sessionTimerStart: null,
    sessionTimerInterval: null,
    unreadChat: 0,
    myRole: null,       // 'student' | 'tutor' | 'admin'
  };

  // ─── DOM refs ───────────────────────────────────────────────────────────────

  let dom = {};

  function getDOM() {
    dom = {
      topbar: document.getElementById('live-topbar'),
      sessionBadge: document.getElementById('live-session-badge'),
      sessionTitle: document.getElementById('live-session-title'),
      sessionTimer: document.getElementById('live-session-timer'),
      videoGallery: document.getElementById('live-video-gallery'),
      screenView: document.getElementById('live-screen-view'),
      screenVideo: document.getElementById('live-screen-video'),
      screenLabel: document.getElementById('live-screen-label'),
      toolbar: document.getElementById('live-toolbar'),
      chatDrawer: document.getElementById('live-chat-drawer'),
      participantsDrawer: document.getElementById('live-participants-drawer'),
      participantsList: document.getElementById('live-participants-list'),
      participantsCount: document.getElementById('live-participants-count'),
      chatMessages: document.getElementById('live-chat-messages'),
      chatInput: document.getElementById('live-chat-input'),
      chatSend: document.getElementById('live-chat-send'),
      devicePopup: document.getElementById('live-device-popup'),
      connectionBanner: document.getElementById('live-connection-banner'),
      waitingScreen: document.getElementById('live-waiting-screen'),
      startBtn: document.getElementById('live-start-btn'),
      toastContainer: document.getElementById('lc-toast-container'),
      // toolbar buttons
      btnMic: document.getElementById('lc-btn-mic'),
      btnCam: document.getElementById('lc-btn-cam'),
      btnScreen: document.getElementById('lc-btn-screen'),
      btnChat: document.getElementById('lc-btn-chat'),
      btnParticipants: document.getElementById('lc-btn-participants'),
      btnHand: document.getElementById('lc-btn-hand'),
      btnFullscreen: document.getElementById('lc-btn-fullscreen'),
      btnDevices: document.getElementById('lc-btn-devices'),
      btnLeave: document.getElementById('lc-btn-leave'),
      btnEndClass: document.getElementById('lc-btn-end'),
      // mode switcher
      modeWhiteboard: document.getElementById('lc-mode-whiteboard'),
      modeVideo: document.getElementById('lc-mode-video'),
      modeScreen: document.getElementById('lc-mode-screen'),
      // device selects
      selectMic: document.getElementById('lc-select-mic'),
      selectCam: document.getElementById('lc-select-cam'),
      selectSpk: document.getElementById('lc-select-spk'),
    };
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────

  function toast(msg, type = '', duration = 3000) {
    if (!dom.toastContainer) return;
    const el = document.createElement('div');
    el.className = `lc-toast${type ? ' ' + type : ''}`;
    el.textContent = msg;
    dom.toastContainer.appendChild(el);
    setTimeout(() => el.remove(), duration);
  }

  function formatTimer(ms) {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    if (h > 0) return `${h}:${String(m % 60).padStart(2,'0')}:${String(s % 60).padStart(2,'0')}`;
    return `${String(m).padStart(2,'0')}:${String(s % 60).padStart(2,'0')}`;
  }

  function startTimer() {
    LC.sessionTimerStart = Date.now();
    if (LC.sessionTimerInterval) clearInterval(LC.sessionTimerInterval);
    LC.sessionTimerInterval = setInterval(() => {
      if (dom.sessionTimer) {
        dom.sessionTimer.textContent = formatTimer(Date.now() - LC.sessionTimerStart);
      }
    }, 1000);
  }

  function stopTimer() {
    if (LC.sessionTimerInterval) clearInterval(LC.sessionTimerInterval);
    LC.sessionTimerInterval = null;
    if (dom.sessionTimer) dom.sessionTimer.textContent = '00:00';
  }

  function getAvatarLetter(name) {
    return (name || '?').charAt(0).toUpperCase();
  }

  function formatTimestamp(ts) {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  // ─── UI state ──────────────────────────────────────────────────────────────

  function setLiveActive(active) {
    LC.isLive = active;
    if (dom.topbar) dom.topbar.classList.toggle('live-active', active);
    if (dom.toolbar) dom.toolbar.classList.toggle('live-active', active);
    if (dom.waitingScreen) dom.waitingScreen.style.display = active ? 'none' : 'flex';

    // Show start button only for tutors/admins when NOT live
    if (dom.startBtn) {
      const isTutor = LC.myRole === 'tutor' || LC.myRole === 'admin';
      dom.startBtn.style.display = (!active && isTutor) ? 'block' : 'none';
    }

    if (active && LC.sessionTimerStart == null) startTimer();
    if (!active) stopTimer();
  }

  function setViewMode(mode) {
    // mode: 'whiteboard' | 'video' | 'screen'
    const wbShell = document.getElementById('wb-fullscreen-shell');

    if (dom.videoGallery) dom.videoGallery.classList.remove('lc-visible');
    if (dom.screenView) dom.screenView.classList.remove('lc-visible');
    if (wbShell) wbShell.style.display = 'none';

    if (mode === 'whiteboard') {
      if (wbShell) wbShell.style.display = '';
    } else if (mode === 'video') {
      if (dom.videoGallery) dom.videoGallery.classList.add('lc-visible');
    } else if (mode === 'screen') {
      if (dom.screenView) dom.screenView.classList.add('lc-visible');
    }

    // Update mode buttons
    [dom.modeWhiteboard, dom.modeVideo, dom.modeScreen].forEach((btn, i) => {
      if (!btn) return;
      const modes = ['whiteboard', 'video', 'screen'];
      btn.classList.toggle('active', modes[i] === mode);
    });
  }

  // ─── Participants list ──────────────────────────────────────────────────────

  function renderParticipants() {
    if (!dom.participantsList) return;
    dom.participantsList.innerHTML = '';

    const items = Object.values(LC.participants);
    items.forEach(p => {
      const div = document.createElement('div');
      div.className = 'lc-participant-item';
      div.innerHTML = `
        <div class="lc-participant-avatar ${p.role === 'tutor' || p.role === 'admin' ? 'tutor' : ''}">
          ${getAvatarLetter(p.name)}
        </div>
        <div class="lc-participant-info">
          <div class="lc-participant-name">${escapeHtml(p.name)}</div>
          <div class="lc-participant-role">${p.role}</div>
        </div>
        <div class="lc-participant-icons">
          ${p.muted ? '<span class="muted" title="Muted">🎤</span>' : ''}
          ${p.camOff ? '<span title="Camera off">📷</span>' : ''}
          ${p.handRaised ? '<span class="hand" title="Hand raised">✋</span>' : ''}
        </div>`;
      dom.participantsList.appendChild(div);
    });

    const count = items.length;
    if (dom.participantsCount) {
      dom.participantsCount.textContent = `${count} participant${count !== 1 ? 's' : ''}`;
    }
  }

  function addOrUpdateParticipant(id, name, role) {
    if (!LC.participants[id]) {
      LC.participants[id] = { id, name, role, muted: false, camOff: false, handRaised: false };
    } else {
      LC.participants[id].name = name;
      LC.participants[id].role = role;
    }
    renderParticipants();
  }

  function removeParticipant(id) {
    delete LC.participants[id];
    renderParticipants();
  }

  // ─── Chat ───────────────────────────────────────────────────────────────────

  function escapeHtml(str) {
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function appendChatMessage({ senderId, senderName, senderRole, message, isReaction, timestamp }) {
    if (!dom.chatMessages) return;
    const isOwn = LC.participant && senderId === LC.participant.id;
    const div = document.createElement('div');
    div.className = `lc-chat-msg${isOwn ? ' own' : ''}${isReaction ? ' reaction' : ''}`;
    div.innerHTML = `
      <div class="lc-chat-meta">
        <span class="lc-chat-name ${senderRole}">${escapeHtml(senderName)}</span>
        <span class="lc-chat-time">${timestamp ? formatTimestamp(timestamp) : ''}</span>
      </div>
      <div class="lc-chat-text">${isReaction ? message : escapeHtml(message)}</div>`;
    dom.chatMessages.appendChild(div);
    dom.chatMessages.scrollTop = dom.chatMessages.scrollHeight;

    if (!LC.chatOpen) {
      LC.unreadChat++;
      if (dom.btnChat) {
        dom.btnChat.setAttribute('data-badge', LC.unreadChat);
        dom.btnChat.classList.add('active');
      }
    }
  }

  function sendChat(isReaction = false) {
    if (!dom.chatInput || !LC.socket) return;
    const msg = dom.chatInput.value.trim();
    if (!msg) return;
    LC.socket.emit('chat:message', { message: msg, isReaction });
    dom.chatInput.value = '';
  }

  // ─── Video tiles ────────────────────────────────────────────────────────────

  function createVideoTile(id, name, role) {
    if (!dom.videoGallery) return null;
    let tile = document.getElementById(`lc-tile-${CSS.escape(id)}`);
    if (tile) return tile;

    tile = document.createElement('div');
    tile.className = 'lc-video-tile';
    tile.id = `lc-tile-${id.replace(/[^a-z0-9]/gi, '_')}`;
    tile.innerHTML = `
      <div class="lc-tile-avatar" id="lc-avatar-${id.replace(/[^a-z0-9]/gi,'_')}">${getAvatarLetter(name)}</div>
      <video autoplay playsinline></video>
      <div class="lc-tile-icons">
        <div class="lc-tile-icon muted" id="lc-mic-icon-${id.replace(/[^a-z0-9]/gi,'_')}" style="display:none">🎤</div>
        <div class="lc-tile-icon" id="lc-cam-icon-${id.replace(/[^a-z0-9]/gi,'_')}" style="display:none">📷</div>
      </div>
      <div class="lc-tile-label">
        <span class="lc-role-badge ${role === 'tutor' || role === 'admin' ? 'tutor' : ''}">${role}</span>
        <span>${escapeHtml(name)}</span>
      </div>`;
    dom.videoGallery.appendChild(tile);
    return tile;
  }

  function setTileStream(id, stream) {
    const safeId = id.replace(/[^a-z0-9]/gi, '_');
    const tile = document.getElementById(`lc-tile-${safeId}`);
    if (!tile) return;
    const video = tile.querySelector('video');
    const avatar = document.getElementById(`lc-avatar-${safeId}`);
    if (video && stream) {
      video.srcObject = stream;
      if (avatar) avatar.classList.add('hidden');
    }
  }

  function removeTile(id) {
    const safeId = id.replace(/[^a-z0-9]/gi, '_');
    const tile = document.getElementById(`lc-tile-${safeId}`);
    if (tile) tile.remove();
  }

  // ─── Media (getUserMedia) ───────────────────────────────────────────────────

  async function requestMedia(video = false, audio = true) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio, video });
      return stream;
    } catch (err) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        toast('Permission denied: please allow microphone/camera access in your browser', 'error', 5000);
      } else if (err.name === 'NotFoundError') {
        toast('No microphone/camera found', 'error', 4000);
      } else {
        toast(`Media error: ${err.message}`, 'error', 4000);
      }
      return null;
    }
  }

  async function toggleMic() {
    if (!LC.micEnabled) {
      // Turn on
      if (!LC.localStream) {
        LC.localStream = await requestMedia(LC.camEnabled, true);
        if (!LC.localStream) return;
        // Attach to own tile
        const myId = LC.participant ? LC.participant.id : 'me';
        createVideoTile(myId, LC.participant ? LC.participant.name : 'Me', LC.myRole || 'student');
        setTileStream(myId, LC.localStream);
        // Publish to LiveKit if active
        if (LC.mode === 'livekit' && LC.livekitRoom) {
          await publishLocalTracks();
        }
      } else {
        // Re-enable existing audio track
        LC.localStream.getAudioTracks().forEach(t => { t.enabled = true; });
      }
      LC.micEnabled = true;
    } else {
      // Mute — disable track but keep stream alive
      if (LC.localStream) {
        LC.localStream.getAudioTracks().forEach(t => { t.enabled = false; });
      }
      LC.micEnabled = false;
    }

    updateMicBtn();
    // Notify LiveKit
    if (LC.mode === 'livekit' && LC.livekitRoom) {
      LC.livekitRoom.localParticipant.setMicrophoneEnabled(LC.micEnabled).catch(() => {});
    }
  }

  async function toggleCam() {
    if (!LC.camEnabled) {
      if (!LC.localStream) {
        LC.localStream = await requestMedia(true, LC.micEnabled);
        if (!LC.localStream) return;
        const myId = LC.participant ? LC.participant.id : 'me';
        createVideoTile(myId, LC.participant ? LC.participant.name : 'Me', LC.myRole || 'student');
        setTileStream(myId, LC.localStream);
        if (LC.mode === 'livekit' && LC.livekitRoom) {
          await publishLocalTracks();
        }
      } else {
        // Try to add video track
        try {
          const vs = await navigator.mediaDevices.getUserMedia({ video: true });
          vs.getVideoTracks().forEach(t => LC.localStream.addTrack(t));
          const myId = LC.participant ? LC.participant.id : 'me';
          setTileStream(myId, LC.localStream);
        } catch (e) {
          toast('Could not enable camera: ' + e.message, 'error');
          return;
        }
      }
      LC.camEnabled = true;
    } else {
      if (LC.localStream) {
        LC.localStream.getVideoTracks().forEach(t => { t.stop(); LC.localStream.removeTrack(t); });
      }
      LC.camEnabled = false;
    }

    updateCamBtn();
    if (LC.mode === 'livekit' && LC.livekitRoom) {
      LC.livekitRoom.localParticipant.setCameraEnabled(LC.camEnabled).catch(() => {});
    }
  }

  async function toggleScreen() {
    if (!LC.screenSharing) {
      try {
        LC.screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        LC.screenSharing = true;
        updateScreenBtn();
        setViewMode('screen');
        if (dom.screenVideo) {
          dom.screenVideo.srcObject = LC.screenStream;
        }
        if (dom.screenLabel) dom.screenLabel.textContent = `${LC.participant ? LC.participant.name : 'You'} is sharing screen`;

        // Broadcast via LiveKit
        if (LC.mode === 'livekit' && LC.livekitRoom) {
          await LC.livekitRoom.localParticipant.setScreenShareEnabled(true);
        }

        LC.screenStream.getVideoTracks()[0].onended = () => stopScreenShare();
      } catch (e) {
        if (e.name !== 'NotAllowedError') {
          toast('Screen share error: ' + e.message, 'error');
        }
        LC.screenSharing = false;
        updateScreenBtn();
      }
    } else {
      stopScreenShare();
    }
  }

  function stopScreenShare() {
    if (LC.screenStream) {
      LC.screenStream.getTracks().forEach(t => t.stop());
      LC.screenStream = null;
    }
    LC.screenSharing = false;
    updateScreenBtn();
    setViewMode('whiteboard');
    if (LC.mode === 'livekit' && LC.livekitRoom) {
      LC.livekitRoom.localParticipant.setScreenShareEnabled(false).catch(() => {});
    }
  }

  function updateMicBtn() {
    if (!dom.btnMic) return;
    const icon = dom.btnMic.querySelector('.lc-tb-icon');
    const label = dom.btnMic.querySelector('.lc-tb-label');
    if (LC.micEnabled) {
      if (icon) icon.textContent = '🎤';
      if (label) label.textContent = 'Mute';
      dom.btnMic.classList.remove('muted');
      dom.btnMic.setAttribute('data-tip', 'Mute mic');
    } else {
      if (icon) icon.textContent = '🔇';
      if (label) label.textContent = 'Unmute';
      dom.btnMic.classList.add('muted');
      dom.btnMic.setAttribute('data-tip', 'Unmute mic');
    }
  }

  function updateCamBtn() {
    if (!dom.btnCam) return;
    const icon = dom.btnCam.querySelector('.lc-tb-icon');
    const label = dom.btnCam.querySelector('.lc-tb-label');
    if (LC.camEnabled) {
      if (icon) icon.textContent = '📹';
      if (label) label.textContent = 'Stop Cam';
      dom.btnCam.classList.remove('muted');
      dom.btnCam.setAttribute('data-tip', 'Turn off camera');
    } else {
      if (icon) icon.textContent = '📷';
      if (label) label.textContent = 'Start Cam';
      dom.btnCam.classList.add('muted');
      dom.btnCam.setAttribute('data-tip', 'Turn on camera');
    }
  }

  function updateScreenBtn() {
    if (!dom.btnScreen) return;
    const icon = dom.btnScreen.querySelector('.lc-tb-icon');
    const label = dom.btnScreen.querySelector('.lc-tb-label');
    if (LC.screenSharing) {
      if (icon) icon.textContent = '🖥️';
      if (label) label.textContent = 'Stop Share';
      dom.btnScreen.classList.add('active');
      dom.btnScreen.setAttribute('data-tip', 'Stop sharing');
    } else {
      if (icon) icon.textContent = '🖥️';
      if (label) label.textContent = 'Share Screen';
      dom.btnScreen.classList.remove('active');
      dom.btnScreen.setAttribute('data-tip', 'Share your screen');
    }
  }

  // ─── LiveKit ────────────────────────────────────────────────────────────────

  async function connectLiveKit(token, url) {
    if (typeof LivekitClient === 'undefined') {
      toast('LiveKit client not loaded; using local mode', 'error');
      LC.mode = 'local';
      return;
    }

    const room = new LivekitClient.Room({
      adaptiveStream: true,
      dynacast: true,
    });

    LC.livekitRoom = room;

    room.on(LivekitClient.RoomEvent.ParticipantConnected, (participant) => {
      addOrUpdateParticipant(participant.identity, participant.name || participant.identity, 'student');
      toast(`${participant.name || participant.identity} joined`);
    });

    room.on(LivekitClient.RoomEvent.ParticipantDisconnected, (participant) => {
      removeParticipant(participant.identity);
      removeTile(participant.identity);
      toast(`${participant.name || participant.identity} left`);
    });

    room.on(LivekitClient.RoomEvent.TrackSubscribed, (track, publication, participant) => {
      const id = participant.identity;
      const name = participant.name || id;
      createVideoTile(id, name, 'student');

      if (track.kind === 'video' || track.kind === 'audio') {
        const mediaStream = new MediaStream([track.mediaStreamTrack]);
        setTileStream(id, mediaStream);
      }
    });

    room.on(LivekitClient.RoomEvent.TrackUnsubscribed, (track, publication, participant) => {
      // Avatar shows when video unsubscribed
    });

    room.on(LivekitClient.RoomEvent.Disconnected, (reason) => {
      toast('Disconnected from room: ' + reason, 'error');
    });

    room.on(LivekitClient.RoomEvent.Reconnecting, () => {
      if (dom.connectionBanner) dom.connectionBanner.classList.add('visible');
      toast('Reconnecting...', '');
    });

    room.on(LivekitClient.RoomEvent.Reconnected, () => {
      if (dom.connectionBanner) dom.connectionBanner.classList.remove('visible');
      toast('Reconnected!', 'success');
    });

    try {
      await room.connect(url, token);
      toast('Connected to live room!', 'success');

      // Add existing participants
      room.participants.forEach((p) => {
        addOrUpdateParticipant(p.identity, p.name || p.identity, 'student');
      });
    } catch (e) {
      toast('LiveKit connection failed: ' + e.message, 'error');
      LC.livekitRoom = null;
    }
  }

  async function publishLocalTracks() {
    if (!LC.livekitRoom || !LC.localStream) return;
    try {
      const tracks = LC.localStream.getTracks().map(t =>
        new LivekitClient.LocalTrack(t, t.kind === 'audio' ? LivekitClient.Track.Kind.Audio : LivekitClient.Track.Kind.Video)
      );
      for (const track of tracks) {
        await LC.livekitRoom.localParticipant.publishTrack(track);
      }
    } catch (e) {
      console.warn('[LiveKit] publishLocalTracks error:', e);
    }
  }

  // ─── Socket.io ──────────────────────────────────────────────────────────────

  function initSocket(classroomId) {
    if (!window.io) {
      console.warn('[LiveClassroom] Socket.io client not loaded');
      return;
    }

    const socket = window.io({ transports: ['websocket', 'polling'] });
    LC.socket = socket;

    socket.on('connect', () => {
      if (dom.connectionBanner) dom.connectionBanner.classList.remove('visible');
      // Join the classroom room
      socket.emit('wb:join', { classroomId });
    });

    socket.on('disconnect', () => {
      if (dom.connectionBanner) {
        dom.connectionBanner.textContent = 'Connection lost — reconnecting…';
        dom.connectionBanner.classList.add('visible');
      }
    });

    socket.on('reconnect', () => {
      if (dom.connectionBanner) dom.connectionBanner.classList.remove('visible');
      socket.emit('wb:join', { classroomId });
    });

    // ── Whiteboard sync ─────────────────────────────────────────────────────

    socket.on('wb:joined', ({ participant }) => {
      LC.participant = participant;
      addOrUpdateParticipant(participant.id, participant.name, participant.role);
    });

    socket.on('wb:state', ({ canvasData }) => {
      // Apply remote canvas state to local whiteboard
      if (canvasData && typeof restoreWhiteboardState === 'function') {
        try {
          restoreWhiteboardState(canvasData);
        } catch (e) {
          console.warn('[LiveClassroom] Could not restore whiteboard state:', e);
        }
      }
    });

    socket.on('wb:shapes_update', ({ shapes, senderId }) => {
      if (senderId === (LC.participant && LC.participant.id)) return;
      applyRemoteShapes(shapes);
    });

    socket.on('wb:shape_add', ({ shape, senderId }) => {
      if (senderId === (LC.participant && LC.participant.id)) return;
      applyRemoteShapeAdd(shape);
    });

    socket.on('wb:shape_delete', ({ shapeId, senderId }) => {
      if (senderId === (LC.participant && LC.participant.id)) return;
      applyRemoteShapeDelete(shapeId);
    });

    socket.on('wb:stroke', ({ points, style, senderId }) => {
      if (senderId === (LC.participant && LC.participant.id)) return;
      applyRemoteStroke(points, style);
    });

    socket.on('wb:clear', ({ senderId }) => {
      if (typeof clearWhiteboardRemote === 'function') clearWhiteboardRemote();
    });

    socket.on('wb:permission_change', ({ enabled }) => {
      setWhiteboardEditEnabled(enabled);
    });

    // ── Chat ────────────────────────────────────────────────────────────────

    socket.on('chat:history', ({ messages }) => {
      if (!dom.chatMessages) return;
      dom.chatMessages.innerHTML = '';
      messages.forEach(m => appendChatMessage({
        senderId: m.sender_id || '',
        senderName: m.sender_name,
        senderRole: m.sender_type,
        message: m.message,
        isReaction: !!m.is_reaction,
        timestamp: m.created_at,
      }));
    });

    socket.on('chat:message', (data) => {
      appendChatMessage(data);
    });

    // ── Presence ────────────────────────────────────────────────────────────

    socket.on('presence:joined', ({ id, name, role }) => {
      addOrUpdateParticipant(id, name, role);
      toast(`${name} joined`, '');
    });

    socket.on('presence:left', ({ id, name }) => {
      removeParticipant(id);
      removeTile(id);
      toast(`${name} left`, '');
    });

    // ── Hand raise ───────────────────────────────────────────────────────────

    socket.on('hand:raise', ({ id, name }) => {
      if (LC.participants[id]) LC.participants[id].handRaised = true;
      renderParticipants();
      // Show hand badge on tile if it exists
      const tile = document.getElementById(`lc-tile-${id.replace(/[^a-z0-9]/gi,'_')}`);
      if (tile) {
        let badge = tile.querySelector('.lc-hand-badge');
        if (!badge) {
          badge = document.createElement('div');
          badge.className = 'lc-hand-badge';
          badge.textContent = '✋';
          tile.appendChild(badge);
        }
      }
      toast(`${name} raised their hand ✋`);
    });

    socket.on('hand:lower', ({ id }) => {
      if (LC.participants[id]) LC.participants[id].handRaised = false;
      renderParticipants();
      const tile = document.getElementById(`lc-tile-${id.replace(/[^a-z0-9]/gi,'_')}`);
      if (tile) {
        const badge = tile.querySelector('.lc-hand-badge');
        if (badge) badge.remove();
      }
    });

    // ── Class control ────────────────────────────────────────────────────────

    socket.on('class:ended', ({ endedBy }) => {
      toast(`Class ended by ${endedBy}`, '', 6000);
      setLiveActive(false);
      releaseMedie();
    });

    socket.on('class:mute_all', ({ by }) => {
      if (LC.micEnabled) {
        if (LC.localStream) LC.localStream.getAudioTracks().forEach(t => { t.enabled = false; });
        LC.micEnabled = false;
        updateMicBtn();
        toast(`${by} muted everyone`);
      }
    });

    socket.on('error', ({ message }) => {
      toast(message, 'error');
    });
  }

  // ─── Whiteboard integration helpers ────────────────────────────────────────

  function applyRemoteShapes(shapes) {
    // Integrate with existing classroom.js whiteboard engine
    if (typeof window.shapes !== 'undefined' && typeof renderAll === 'function') {
      window.shapes = shapes;
      renderAll();
    }
  }

  function applyRemoteShapeAdd(shape) {
    if (typeof window.shapes !== 'undefined' && typeof renderAll === 'function') {
      const existing = window.shapes.findIndex(s => s.id === shape.id);
      if (existing === -1) window.shapes.push(shape);
      else window.shapes[existing] = shape;
      renderAll();
    }
  }

  function applyRemoteShapeDelete(shapeId) {
    if (typeof window.shapes !== 'undefined' && typeof renderAll === 'function') {
      window.shapes = window.shapes.filter(s => s.id !== shapeId);
      renderAll();
    }
  }

  function applyRemoteStroke(points, style) {
    // Draw a temporary stroke on overlay canvas
    const canvas = document.getElementById('whiteboard-overlay');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx || !points || points.length < 2) return;
    ctx.save();
    ctx.strokeStyle = style && style.color ? style.color : '#fff';
    ctx.lineWidth = style && style.width ? style.width : 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
    ctx.stroke();
    ctx.restore();
  }

  function restoreWhiteboardState(canvasData) {
    // Try to call existing restoreState function from classroom.js
    if (typeof window.restoreState === 'function') {
      window.restoreState(canvasData);
    } else if (canvasData) {
      try {
        const data = typeof canvasData === 'string' ? JSON.parse(canvasData) : canvasData;
        if (data.shapes && Array.isArray(data.shapes)) {
          window.shapes = data.shapes;
          if (typeof renderAll === 'function') renderAll();
        }
      } catch (e) { /* ignore */ }
    }
  }

  function clearWhiteboardRemote() {
    if (typeof window.shapes !== 'undefined') window.shapes = [];
    if (typeof renderAll === 'function') renderAll();
  }

  function setWhiteboardEditEnabled(enabled) {
    // Disable/enable drawing tools based on permission
    const toolbar = document.getElementById('wb-toolbar');
    if (toolbar) {
      toolbar.style.pointerEvents = enabled ? '' : 'none';
      toolbar.style.opacity = enabled ? '' : '0.4';
    }
    if (!enabled) {
      toast('Whiteboard editing disabled by tutor');
    } else {
      toast('Whiteboard editing enabled', 'success');
    }
  }

  // ─── Whiteboard event hooks ─────────────────────────────────────────────────
  // Called from classroom.js after each render/change to broadcast to peers

  window.lcBroadcastShapes = function (shapes) {
    if (LC.socket && LC.socket.connected) {
      LC.socket.emit('wb:shapes_update', { shapes });
    }
  };

  window.lcBroadcastShapeAdd = function (shape) {
    if (LC.socket && LC.socket.connected) {
      LC.socket.emit('wb:shape_add', { shape });
    }
  };

  window.lcBroadcastShapeDelete = function (shapeId) {
    if (LC.socket && LC.socket.connected) {
      LC.socket.emit('wb:shape_delete', { shapeId });
    }
  };

  window.lcBroadcastStroke = function (points, style) {
    if (LC.socket && LC.socket.connected) {
      LC.socket.emit('wb:stroke', { points, style });
    }
  };

  window.lcSaveWhiteboard = function (canvasData) {
    if (LC.socket && LC.socket.connected) {
      LC.socket.emit('wb:save', { canvasData });
    }
  };

  // ─── Device enumeration ────────────────────────────────────────────────────

  async function populateDevices() {
    if (!dom.selectMic && !dom.selectCam) return;
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const mics = devices.filter(d => d.kind === 'audioinput');
      const cams = devices.filter(d => d.kind === 'videoinput');
      const spks = devices.filter(d => d.kind === 'audiooutput');

      if (dom.selectMic) {
        dom.selectMic.innerHTML = mics.map(d =>
          `<option value="${d.deviceId}">${d.label || 'Microphone ' + (mics.indexOf(d)+1)}</option>`
        ).join('');
      }
      if (dom.selectCam) {
        dom.selectCam.innerHTML = cams.map(d =>
          `<option value="${d.deviceId}">${d.label || 'Camera ' + (cams.indexOf(d)+1)}</option>`
        ).join('');
      }
      if (dom.selectSpk) {
        dom.selectSpk.innerHTML = spks.map(d =>
          `<option value="${d.deviceId}">${d.label || 'Speaker ' + (spks.indexOf(d)+1)}</option>`
        ).join('');
      }
    } catch (e) {
      console.warn('[LiveClassroom] enumerateDevices:', e);
    }
  }

  // ─── Cleanup ───────────────────────────────────────────────────────────────

  function releaseMedie() {
    if (LC.localStream) { LC.localStream.getTracks().forEach(t => t.stop()); LC.localStream = null; }
    if (LC.screenStream) { LC.screenStream.getTracks().forEach(t => t.stop()); LC.screenStream = null; }
    if (LC.livekitRoom) { LC.livekitRoom.disconnect(); LC.livekitRoom = null; }
    LC.micEnabled = false;
    LC.camEnabled = false;
    LC.screenSharing = false;
    updateMicBtn();
    updateCamBtn();
    updateScreenBtn();
  }

  // ─── Fetch live token and connect ─────────────────────────────────────────

  async function joinLiveSession(classroomId) {
    try {
      const res = await fetch(`/api/classrooms/${classroomId}/live/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast(err.error || 'Could not get live token', 'error');
        return;
      }

      const data = await res.json();
      LC.mode = data.mode;
      LC.participant = { id: data.participantIdentity, name: data.participantName, role: data.role };
      LC.myRole = data.role;

      // Add self to participants
      addOrUpdateParticipant(LC.participant.id, LC.participant.name, LC.participant.role);

      // Connect Socket.io for whiteboard/chat sync
      if (!LC.socket) initSocket(classroomId);

      // Connect LiveKit if in livekit mode
      if (data.mode === 'livekit' && data.token && data.livekitUrl) {
        await connectLiveKit(data.token, data.livekitUrl);
      } else {
        LC.mode = 'local';
        // Local P2P could be added here; for now show video gallery in local mode
      }

      setLiveActive(true);
      if (data.sessionTitle) {
        LC.sessionTitle = data.sessionTitle;
        if (dom.sessionTitle) dom.sessionTitle.textContent = data.sessionTitle;
      }
      startTimer();
      setViewMode('whiteboard');
      toast('Joined live class!', 'success');
    } catch (e) {
      toast('Error joining live session: ' + e.message, 'error');
    }
  }

  // ─── Start class (tutor only) ───────────────────────────────────────────────

  async function startClass(classroomId) {
    try {
      const res = await fetch(`/api/classrooms/${classroomId}/live`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ title: `Live Class` }),
      });
      const data = await res.json();
      if (data.ok) {
        toast('Live class started!', 'success');
        await joinLiveSession(classroomId);
      } else {
        toast(data.error || 'Could not start class', 'error');
      }
    } catch (e) {
      toast('Error starting class: ' + e.message, 'error');
    }
  }

  // ─── End class (tutor only) ────────────────────────────────────────────────

  async function endClass(classroomId) {
    if (!confirm('End the class for everyone?')) return;

    // Notify all via socket
    if (LC.socket) LC.socket.emit('class:end');

    // Also call REST endpoint for persistence
    try {
      await fetch(`/api/classrooms/${classroomId}/live/end`, {
        method: 'PUT',
        credentials: 'include',
      });
    } catch (e) { /* ignore */ }

    setLiveActive(false);
    releaseMedie();
    toast('Class ended', '', 4000);
  }

  // ─── Check live status on page load ───────────────────────────────────────

  async function checkAndJoinIfLive(classroomId) {
    try {
      const res = await fetch(`/api/classrooms/${classroomId}/live`, { credentials: 'include' });
      const data = await res.json();
      if (data.ok && data.activeSession) {
        // Auto-join if there's an active session
        await joinLiveSession(classroomId);
        if (dom.sessionTitle && data.activeSession.title) {
          dom.sessionTitle.textContent = data.activeSession.title;
        }
      } else {
        setLiveActive(false);
      }
    } catch (e) {
      setLiveActive(false);
    }
  }

  // ─── Wire up toolbar buttons ───────────────────────────────────────────────

  function bindButtons(classroomId) {
    if (dom.btnMic) dom.btnMic.addEventListener('click', toggleMic);
    if (dom.btnCam) dom.btnCam.addEventListener('click', toggleCam);
    if (dom.btnScreen) dom.btnScreen.addEventListener('click', toggleScreen);

    if (dom.btnChat) dom.btnChat.addEventListener('click', () => {
      LC.chatOpen = !LC.chatOpen;
      if (dom.chatDrawer) dom.chatDrawer.classList.toggle('open', LC.chatOpen);
      if (LC.chatOpen) {
        LC.unreadChat = 0;
        dom.btnChat.removeAttribute('data-badge');
        dom.btnChat.classList.remove('active');
      }
      if (LC.participantsOpen) {
        LC.participantsOpen = false;
        if (dom.participantsDrawer) dom.participantsDrawer.classList.remove('open');
      }
    });

    if (dom.btnParticipants) dom.btnParticipants.addEventListener('click', () => {
      LC.participantsOpen = !LC.participantsOpen;
      if (dom.participantsDrawer) dom.participantsDrawer.classList.toggle('open', LC.participantsOpen);
      if (LC.chatOpen) {
        LC.chatOpen = false;
        if (dom.chatDrawer) dom.chatDrawer.classList.remove('open');
      }
    });

    if (dom.btnHand) dom.btnHand.addEventListener('click', () => {
      LC.handRaised = !LC.handRaised;
      dom.btnHand.classList.toggle('active', LC.handRaised);
      if (LC.socket) {
        LC.socket.emit(LC.handRaised ? 'hand:raise' : 'hand:lower');
      }
      toast(LC.handRaised ? 'Hand raised ✋' : 'Hand lowered');
    });

    if (dom.btnFullscreen) dom.btnFullscreen.addEventListener('click', () => {
      const target = document.getElementById('wb-fullscreen-shell') || document.documentElement;
      if (!document.fullscreenElement) {
        target.requestFullscreen && target.requestFullscreen();
      } else {
        document.exitFullscreen && document.exitFullscreen();
      }
    });

    if (dom.btnDevices) dom.btnDevices.addEventListener('click', async () => {
      LC.devicePopupOpen = !LC.devicePopupOpen;
      if (dom.devicePopup) dom.devicePopup.classList.toggle('open', LC.devicePopupOpen);
      if (LC.devicePopupOpen) await populateDevices();
    });

    const deviceClose = document.getElementById('live-device-popup-close');
    if (deviceClose) deviceClose.addEventListener('click', () => {
      LC.devicePopupOpen = false;
      if (dom.devicePopup) dom.devicePopup.classList.remove('open');
    });

    if (dom.btnLeave) dom.btnLeave.addEventListener('click', () => {
      if (!confirm('Leave the live class?')) return;
      releaseMedie();
      if (LC.socket) LC.socket.disconnect();
      setLiveActive(false);
      toast('You left the class');
    });

    if (dom.btnEndClass) dom.btnEndClass.addEventListener('click', () => endClass(classroomId));

    // Chat input
    if (dom.chatSend) dom.chatSend.addEventListener('click', () => sendChat(false));
    if (dom.chatInput) {
      dom.chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          sendChat(false);
        }
      });
    }

    // Reaction buttons
    document.querySelectorAll('.lc-reaction-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (!dom.chatInput) return;
        dom.chatInput.value = btn.textContent;
        sendChat(true);
      });
    });

    // Drawer close buttons
    document.querySelectorAll('.lc-drawer-close').forEach(btn => {
      btn.addEventListener('click', () => {
        if (dom.chatDrawer) { dom.chatDrawer.classList.remove('open'); LC.chatOpen = false; }
        if (dom.participantsDrawer) { dom.participantsDrawer.classList.remove('open'); LC.participantsOpen = false; }
      });
    });

    // Mode switcher
    if (dom.modeWhiteboard) dom.modeWhiteboard.addEventListener('click', () => setViewMode('whiteboard'));
    if (dom.modeVideo) dom.modeVideo.addEventListener('click', () => setViewMode('video'));
    if (dom.modeScreen) dom.modeScreen.addEventListener('click', () => {
      if (LC.screenSharing) setViewMode('screen');
    });

    // Start class button
    if (dom.startBtn) dom.startBtn.addEventListener('click', () => startClass(classroomId));
  }

  // ─── Init ──────────────────────────────────────────────────────────────────

  function init() {
    getDOM();

    // Get classroom ID from URL
    const params = new URLSearchParams(window.location.search);
    const classroomId = parseInt(params.get('id'), 10);
    if (!classroomId) return;

    LC.classroomId = classroomId;

    bindButtons(classroomId);
    updateMicBtn();
    updateCamBtn();
    updateScreenBtn();

    // Only initialise on the live tab
    const liveTab = document.getElementById('tab-live');
    if (!liveTab) {
      checkAndJoinIfLive(classroomId);
      return;
    }

    // Watch for tab activation
    const tabButton = document.querySelector('[data-tab="live"], [href="#tab-live"], #tab-btn-live');
    if (tabButton) {
      tabButton.addEventListener('click', () => {
        checkAndJoinIfLive(classroomId);
      });
    }

    // Also check immediately if already on live tab
    if (liveTab.classList.contains('active') || liveTab.style.display !== 'none') {
      checkAndJoinIfLive(classroomId);
    }

    // Handle page unload
    window.addEventListener('beforeunload', () => {
      releaseMedie();
    });
  }

  // Wait for DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
