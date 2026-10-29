'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const getAdminTestCredentials = require('../scripts/adminTestCredentials');

test('requires explicit admin credentials', () => {
  assert.throws(
    () => getAdminTestCredentials({}),
    /ADMIN_USERNAME and ADMIN_PASSWORD/
  );
});

test('returns the configured admin credentials', () => {
  assert.deepEqual(
    getAdminTestCredentials({
      ADMIN_USERNAME: 'configured-admin',
      ADMIN_PASSWORD: 'configured-password'
    }),
    {
      username: 'configured-admin',
      password: 'configured-password'
    }
  );
});
