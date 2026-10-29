'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { expirationSeconds, MysqlSessionStore } = require('../utils/mysqlSessionStore');

test('session expiration uses cookie expiry or the configured default', () => {
  const now = 1_800_000_000_000;
  assert.equal(expirationSeconds({}, 60_000, now), (now + 60_000) / 1000);
  assert.equal(expirationSeconds({ cookie: { expires: new Date(now + 30_000) } }, 60_000, now),
    (now + 30_000) / 1000);
  assert.throws(() => expirationSeconds({ cookie: { expires: 'invalid' } }, 60_000, now),
    /valid date/);
});

test('session store reads serialized sessions, writes, touches, and destroys records', async () => {
  const calls = [];
  const pool = {
    async execute(sql, params) {
      calls.push({ sql, params });
      if (sql.startsWith('SELECT')) {
        return [[{ data: JSON.stringify({ registrationNumber: 'STO1-001A' }) }]];
      }
      return [{ affectedRows: 1 }];
    }
  };
  const store = new MysqlSessionStore(pool, { expiration: 60_000 });
  const callStore = (method, ...args) => new Promise((resolve, reject) => {
    store[method](...args, (error, value) => (error ? reject(error) : resolve(value)));
  });

  assert.deepEqual(await callStore('get', 'session-1'), { registrationNumber: 'STO1-001A' });
  await callStore('set', 'session-1', { cookie: {}, student: true });
  await callStore('touch', 'session-1', { cookie: {} });
  await callStore('destroy', 'session-1');

  assert.equal(calls.filter(({ sql }) => sql.includes('INSERT INTO sessions')).length, 1);
  assert.equal(calls.filter(({ sql }) => sql.startsWith('UPDATE sessions')).length, 1);
  assert.equal(calls.filter(({ sql }) => sql.startsWith('DELETE FROM sessions WHERE session_id')).length, 1);
  const insert = calls.find(({ sql }) => sql.includes('INSERT INTO sessions'));
  assert.deepEqual(JSON.parse(insert.params[2]), { cookie: {}, student: true });
});
