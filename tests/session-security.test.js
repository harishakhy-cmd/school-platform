'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { getSessionSecurityConfig } = require('../utils/sessionSecurity');

test('production requires a unique session secret and enables secure cookies', () => {
  const config = getSessionSecurityConfig({
    NODE_ENV: 'production',
    SESSION_SECRET: 'a'.repeat(48)
  });

  assert.equal(config.secret, 'a'.repeat(48));
  assert.equal(config.isProduction, true);
  assert.equal(config.secureCookie, true);
  assert.equal(config.usesDevelopmentSecret, false);
});

test('production rejects missing, short, and sample session secrets', () => {
  for (const secret of ['', 'short', 'change-this-to-a-long-random-secret']) {
    assert.throws(
      () => getSessionSecurityConfig({ NODE_ENV: 'production', SESSION_SECRET: secret }),
      /SESSION_SECRET/
    );
  }
});

test('development generates a process-local secret when none is configured', () => {
  const first = getSessionSecurityConfig({ NODE_ENV: 'development' });
  const second = getSessionSecurityConfig({ NODE_ENV: 'development' });

  assert.equal(first.secret.length, 96);
  assert.notEqual(first.secret, second.secret);
  assert.equal(first.secureCookie, false);
  assert.equal(first.usesDevelopmentSecret, true);
});
