'use strict';

/**
 * liveTokenController.js
 * POST /api/classrooms/:classroomId/live/token
 *
 * Returns a LiveKit JWT token (when LIVEKIT_API_KEY is set in .env)
 * or a fallback object for local WebRTC P2P mode.
 */

const liveSessionModel = require('../models/liveSessionModel');

async function getLiveToken(req, res, next) {
  try {
    const classroomId = req.classroom.id;

    // Verify an active live session exists
    const activeSession = await liveSessionModel.findActiveSession(classroomId);
    if (!activeSession) {
      return res.status(404).json({ ok: false, error: 'No active live session for this classroom' });
    }

    // Determine participant identity
    let participantIdentity;
    let participantName;
    let role = req.userClassroomRole; // 'admin' | 'tutor' | 'student'

    if (req.session.registrationNumber) {
      participantIdentity = req.session.registrationNumber;
      participantName = req.session.studentName || req.session.registrationNumber;
    } else if (req.session.adminId) {
      participantIdentity = `tutor-${req.session.adminId}`;
      participantName = req.session.adminName || `Tutor`;
    } else {
      return res.status(401).json({ ok: false, error: 'Not authenticated' });
    }

    const livekitUrl = process.env.LIVEKIT_URL || '';
    const apiKey = process.env.LIVEKIT_API_KEY || '';
    const apiSecret = process.env.LIVEKIT_API_SECRET || '';

    if (apiKey && apiSecret && livekitUrl) {
      // LiveKit mode — issue a signed JWT
      let AccessToken;
      try {
        const lkSdk = require('livekit-server-sdk');
        AccessToken = lkSdk.AccessToken;
      } catch (e) {
        return res.status(500).json({ ok: false, error: 'livekit-server-sdk not installed. Run: npm install livekit-server-sdk' });
      }

      const roomName = `classroom-${classroomId}-session-${activeSession.id}`;

      const at = new AccessToken(apiKey, apiSecret, {
        identity: participantIdentity,
        name: participantName,
        ttl: 4 * 60 * 60, // 4 hours
      });

      const canPublish = true; // all participants can publish by default
      const canSubscribe = true;

      at.addGrant({
        roomJoin: true,
        room: roomName,
        canPublish,
        canSubscribe,
        canPublishData: true,
      });

      const token = await at.toJwt();

      return res.json({
        ok: true,
        mode: 'livekit',
        token,
        livekitUrl,
        roomName,
        participantIdentity,
        participantName,
        role,
        sessionId: activeSession.id,
      });
    } else {
      // Local P2P fallback mode
      return res.json({
        ok: true,
        mode: 'local',
        token: null,
        livekitUrl: null,
        roomName: `classroom-${classroomId}`,
        participantIdentity,
        participantName,
        role,
        sessionId: activeSession.id,
      });
    }
  } catch (err) {
    next(err);
  }
}

module.exports = { getLiveToken };
