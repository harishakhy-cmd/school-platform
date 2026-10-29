'use strict';

const session = require('express-session');

const CLEANUP_INTERVAL_MS = 15 * 60 * 1000;

function expirationSeconds(sessionData, defaultExpirationMs, now = Date.now()) {
  const cookie = sessionData && sessionData.cookie;
  const expiration = cookie && (cookie.expires || cookie._expires);
  if (!expiration) return Math.ceil((now + defaultExpirationMs) / 1000);

  const expirationMs = expiration instanceof Date
    ? expiration.getTime()
    : typeof expiration === 'number'
      ? expiration
      : Date.parse(expiration);
  if (!Number.isFinite(expirationMs)) {
    throw new TypeError('Session cookie expiration must be a valid date.');
  }
  return Math.ceil(expirationMs / 1000);
}

class MysqlSessionStore extends session.Store {
  constructor(pool, options = {}) {
    super();
    this.pool = pool;
    this.defaultExpirationMs = options.expiration || 24 * 60 * 60 * 1000;
    this.lastCleanupAt = 0;
  }

  get(sessionId, callback) {
    this.pool.execute(
      'SELECT data FROM sessions WHERE session_id = ? AND expires > ? LIMIT 1',
      [sessionId, Math.floor(Date.now() / 1000)]
    ).then(([rows]) => {
      if (!rows.length) return callback(null, null);
      try {
        callback(null, typeof rows[0].data === 'string' ? JSON.parse(rows[0].data) : rows[0].data);
      } catch (error) {
        callback(error);
      }
    }).catch(callback);
  }

  set(sessionId, sessionData, callback) {
    this.cleanupExpiredSessions();
    let serialized;
    let expires;
    try {
      serialized = JSON.stringify(sessionData);
      expires = expirationSeconds(sessionData, this.defaultExpirationMs);
    } catch (error) {
      return callback(error);
    }

    this.pool.execute(
      `INSERT INTO sessions (session_id, expires, data)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE expires = VALUES(expires), data = VALUES(data)`,
      [sessionId, expires, serialized]
    ).then(() => callback(null)).catch(callback);
  }

  touch(sessionId, sessionData, callback) {
    let expires;
    try {
      expires = expirationSeconds(sessionData, this.defaultExpirationMs);
    } catch (error) {
      return callback(error);
    }
    this.pool.execute(
      'UPDATE sessions SET expires = ? WHERE session_id = ?',
      [expires, sessionId]
    ).then(() => callback(null)).catch(callback);
  }

  destroy(sessionId, callback) {
    this.pool.execute('DELETE FROM sessions WHERE session_id = ?', [sessionId])
      .then(() => callback(null)).catch(callback);
  }

  cleanupExpiredSessions() {
    const now = Date.now();
    if (now - this.lastCleanupAt < CLEANUP_INTERVAL_MS) return;
    this.lastCleanupAt = now;
    this.pool.execute('DELETE FROM sessions WHERE expires <= ?', [Math.floor(now / 1000)])
      .catch((error) => {
        console.warn('[SessionStore] Expired-session cleanup failed:', error.message);
      });
  }
}

module.exports = { MysqlSessionStore, expirationSeconds };
