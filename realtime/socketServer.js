'use strict';

/**
 * realtime/socketServer.js
 *
 * Initialises Socket.io on the shared HTTP server.
 * Handles:
 *   - Authentication (session sharing)
 *   - Room management per classroom
 *   - Whiteboard sync (wb:*)
 *   - Live chat (chat:*)
 *   - Presence & hand-raise (presence:*, hand:*)
 *   - Class control (class:end, class:wb_permission, class:mute_all)
 */

const { Server } = require('socket.io');
const pool = require('../config/database');

let io;

// ─── helpers ──────────────────────────────────────────────────────────────────

function roomKey(classroomId) {
  return `classroom:${classroomId}`;
}

async function isEnrolledOrStaff(session, classroomId) {
  if (!session) return false;

  // Admin / tutor has blanket access
  if (session.adminId) return true;

  // Student must be enrolled
  if (session.registrationNumber) {
    const [rows] = await pool.query(
      `SELECT id FROM classroom_enrollments
       WHERE classroom_id = ? AND registration_number = ? AND status = 'active'
       LIMIT 1`,
      [classroomId, session.registrationNumber]
    );
    return rows.length > 0;
  }
  return false;
}

function isTutorOrAdmin(session) {
  return !!(session && session.adminId);
}

function getParticipantInfo(session) {
  if (session.registrationNumber) {
    return {
      id: session.registrationNumber,
      name: session.studentName || session.registrationNumber,
      role: 'student',
    };
  }
  if (session.adminId) {
    return {
      id: `tutor-${session.adminId}`,
      name: session.adminName || 'Tutor',
      role: session.adminRole === 'tutor' ? 'tutor' : 'admin',
    };
  }
  return null;
}

async function saveChatMessage({ classroomId, sessionId, senderType, senderId, senderName, message, isReaction }) {
  try {
    await pool.query(
      `INSERT INTO live_chat_messages
         (classroom_id, session_id, sender_type, sender_id, sender_name, message, is_reaction)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [classroomId, sessionId || null, senderType, senderId, senderName, message, isReaction ? 1 : 0]
    );
  } catch (e) {
    // Non-fatal: table might not exist yet (migration not run)
    console.warn('[Socket] saveChatMessage error:', e.message);
  }
}

async function getActiveSessionId(classroomId) {
  try {
    const [rows] = await pool.query(
      `SELECT id FROM live_sessions WHERE classroom_id = ? AND status = 'active' ORDER BY started_at DESC LIMIT 1`,
      [classroomId]
    );
    return rows.length > 0 ? rows[0].id : null;
  } catch (e) {
    return null;
  }
}

async function getRecentChat(classroomId, limit = 50) {
  try {
    const [rows] = await pool.query(
      `SELECT sender_name, sender_type, message, is_reaction, created_at
       FROM live_chat_messages
       WHERE classroom_id = ?
       ORDER BY created_at DESC LIMIT ?`,
      [classroomId, limit]
    );
    return rows.reverse();
  } catch (e) {
    return [];
  }
}

// ─── main init ────────────────────────────────────────────────────────────────

function initSocketServer(httpServer, sessionMiddleware) {
  io = new Server(httpServer, {
    cors: { origin: '*', credentials: true },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Share express-session with Socket.io
  io.engine.use(sessionMiddleware);

  io.on('connection', async (socket) => {
    const session = socket.request.session;

    if (!session || (!session.registrationNumber && !session.adminId)) {
      socket.emit('error', { code: 'UNAUTHENTICATED', message: 'Please log in first' });
      socket.disconnect(true);
      return;
    }

    const participant = getParticipantInfo(session);
    if (!participant) {
      socket.disconnect(true);
      return;
    }

    // Store participant info on socket for later use
    socket.participant = participant;
    socket.classroomId = null;

    // ── wb:join ────────────────────────────────────────────────────────────────
    socket.on('wb:join', async ({ classroomId }) => {
      if (!classroomId) return;

      const cid = parseInt(classroomId, 10);
      if (isNaN(cid)) return;

      const allowed = await isEnrolledOrStaff(session, cid);
      if (!allowed) {
        socket.emit('error', { code: 'FORBIDDEN', message: 'Not enrolled in this classroom' });
        return;
      }

      socket.classroomId = cid;
      const room = roomKey(cid);

      // Leave any previous room
      const prevRooms = [...socket.rooms].filter(r => r !== socket.id && r.startsWith('classroom:'));
      for (const r of prevRooms) socket.leave(r);

      socket.join(room);

      // Send current canvas state
      try {
        const [rows] = await pool.query(
          `SELECT canvas_data FROM whiteboard_states WHERE classroom_id = ? ORDER BY updated_at DESC LIMIT 1`,
          [cid]
        );
        const canvasData = rows.length > 0 ? rows[0].canvas_data : null;
        socket.emit('wb:state', { canvasData });
      } catch (e) {
        socket.emit('wb:state', { canvasData: null });
      }

      // Send recent chat history
      const history = await getRecentChat(cid);
      socket.emit('chat:history', { messages: history });

      // Announce presence
      socket.to(room).emit('presence:joined', {
        id: participant.id,
        name: participant.name,
        role: participant.role,
      });

      socket.emit('wb:joined', { classroomId: cid, participant });
    });

    // ── Whiteboard events (relay) ─────────────────────────────────────────────

    // Shapes update — broadcast to all others in the room
    socket.on('wb:shapes_update', (data) => {
      if (!socket.classroomId) return;
      socket.to(roomKey(socket.classroomId)).emit('wb:shapes_update', {
        shapes: data.shapes,
        senderId: participant.id,
      });
    });

    socket.on('wb:shape_add', (data) => {
      if (!socket.classroomId) return;
      socket.to(roomKey(socket.classroomId)).emit('wb:shape_add', {
        shape: data.shape,
        senderId: participant.id,
      });
    });

    socket.on('wb:shape_delete', (data) => {
      if (!socket.classroomId) return;
      socket.to(roomKey(socket.classroomId)).emit('wb:shape_delete', {
        shapeId: data.shapeId,
        senderId: participant.id,
      });
    });

    socket.on('wb:stroke', (data) => {
      if (!socket.classroomId) return;
      socket.to(roomKey(socket.classroomId)).emit('wb:stroke', {
        points: data.points,
        style: data.style,
        senderId: participant.id,
      });
    });

    // Clear — tutor/admin only
    socket.on('wb:clear', async () => {
      if (!socket.classroomId) return;
      if (!isTutorOrAdmin(session)) {
        socket.emit('error', { code: 'FORBIDDEN', message: 'Only tutors can clear the whiteboard' });
        return;
      }
      socket.to(roomKey(socket.classroomId)).emit('wb:clear', { senderId: participant.id });
    });

    // Save canvas — tutor/admin only
    socket.on('wb:save', async ({ canvasData }) => {
      if (!socket.classroomId) return;
      if (!isTutorOrAdmin(session)) {
        socket.emit('error', { code: 'FORBIDDEN', message: 'Only tutors can save the whiteboard' });
        return;
      }
      try {
        await pool.query(
          `INSERT INTO whiteboard_states (classroom_id, canvas_data)
           VALUES (?, ?)
           ON DUPLICATE KEY UPDATE canvas_data = VALUES(canvas_data), updated_at = NOW()`,
          [socket.classroomId, canvasData]
        );
        socket.emit('wb:saved', { ok: true });
      } catch (e) {
        socket.emit('wb:saved', { ok: false, error: e.message });
      }
    });

    // Permission change — tutor/admin only
    socket.on('wb:permission_change', async ({ enabled }) => {
      if (!socket.classroomId) return;
      if (!isTutorOrAdmin(session)) {
        socket.emit('error', { code: 'FORBIDDEN', message: 'Only tutors can change whiteboard permissions' });
        return;
      }
      // Persist to active session
      try {
        await pool.query(
          `UPDATE live_sessions SET whiteboard_edit_enabled = ? WHERE classroom_id = ? AND status = 'active'`,
          [enabled ? 1 : 0, socket.classroomId]
        );
      } catch (e) { /* ignore */ }

      io.to(roomKey(socket.classroomId)).emit('wb:permission_change', {
        enabled,
        senderId: participant.id,
      });
    });

    // ── Chat ──────────────────────────────────────────────────────────────────

    socket.on('chat:message', async ({ message, isReaction }) => {
      if (!socket.classroomId) return;
      if (!message || typeof message !== 'string') return;

      const text = message.trim().substring(0, 2000);
      if (!text) return;

      const sessionId = await getActiveSessionId(socket.classroomId);

      const senderType = participant.role === 'student' ? 'student' : (participant.role === 'tutor' ? 'tutor' : 'admin');
      await saveChatMessage({
        classroomId: socket.classroomId,
        sessionId,
        senderType,
        senderId: participant.id,
        senderName: participant.name,
        message: text,
        isReaction: !!isReaction,
      });

      io.to(roomKey(socket.classroomId)).emit('chat:message', {
        senderId: participant.id,
        senderName: participant.name,
        senderRole: participant.role,
        message: text,
        isReaction: !!isReaction,
        timestamp: new Date().toISOString(),
      });
    });

    // Tutor lab notes are delivered only to members of the joined classroom.
    socket.on('lab:note:broadcast', (payload, acknowledge) => {
      const reply = typeof acknowledge === 'function' ? acknowledge : () => {};
      if (!socket.classroomId) {
        reply({ ok: false, error: 'Join a classroom before broadcasting lab notes.' });
        return;
      }
      if (!isTutorOrAdmin(session)) {
        reply({ ok: false, error: 'Only classroom tutors and administrators can broadcast lab notes.' });
        return;
      }
      const note = payload && typeof payload.note === 'string' ? payload.note.trim().slice(0, 2000) : '';
      if (!note) {
        reply({ ok: false, error: 'Enter a note before broadcasting.' });
        return;
      }
      io.to(roomKey(socket.classroomId)).emit('lab:note', {
        note,
        senderName: participant.name,
        timestamp: new Date().toISOString()
      });
      reply({ ok: true });
    });

    // ── Hand raise ────────────────────────────────────────────────────────────

    socket.on('hand:raise', () => {
      if (!socket.classroomId) return;
      io.to(roomKey(socket.classroomId)).emit('hand:raise', {
        id: participant.id,
        name: participant.name,
      });
    });

    socket.on('hand:lower', () => {
      if (!socket.classroomId) return;
      io.to(roomKey(socket.classroomId)).emit('hand:lower', {
        id: participant.id,
      });
    });

    // ── Class control (tutor/admin only) ─────────────────────────────────────

    socket.on('class:end', async () => {
      if (!socket.classroomId) return;
      if (!isTutorOrAdmin(session)) {
        socket.emit('error', { code: 'FORBIDDEN', message: 'Only tutors can end the class' });
        return;
      }
      try {
        await pool.query(
          `UPDATE live_sessions SET status = 'ended', ended_at = NOW()
           WHERE classroom_id = ? AND status = 'active'`,
          [socket.classroomId]
        );
      } catch (e) { /* ignore */ }

      io.to(roomKey(socket.classroomId)).emit('class:ended', {
        endedBy: participant.name,
      });
    });

    socket.on('class:mute_all', () => {
      if (!socket.classroomId) return;
      if (!isTutorOrAdmin(session)) return;
      socket.to(roomKey(socket.classroomId)).emit('class:mute_all', {
        by: participant.name,
      });
    });

    // ── Disconnect ────────────────────────────────────────────────────────────

    socket.on('disconnect', () => {
      if (socket.classroomId) {
        socket.to(roomKey(socket.classroomId)).emit('presence:left', {
          id: participant.id,
          name: participant.name,
          role: participant.role,
        });
      }
    });
  });

  console.log('[Socket.io] Realtime server initialised');
  return io;
}

module.exports = { initSocketServer };
