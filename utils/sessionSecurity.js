'use strict';

const crypto = require('crypto');

const unsafeSessionSecrets = new Set([
  'change-this-to-a-long-random-secret',
  'cbt-dev-secret-change-in-production'
]);

function getSessionSecurityConfig(env = process.env) {
  const isProduction = env.NODE_ENV === 'production';
  const suppliedSecret = typeof env.SESSION_SECRET === 'string' ? env.SESSION_SECRET.trim() : '';
  const configuredSecret = unsafeSessionSecrets.has(suppliedSecret) ? '' : suppliedSecret;
  const secret = configuredSecret || (isProduction ? '' : crypto.randomBytes(48).toString('hex'));

  if (!secret || (isProduction && (secret.length < 32 || unsafeSessionSecrets.has(secret)))) {
    throw new Error('Set SESSION_SECRET to a unique value of at least 32 characters before starting in production.');
  }

  return {
    secret,
    isProduction,
    usesDevelopmentSecret: !configuredSecret,
    secureCookie: isProduction || env.COOKIE_SECURE === 'true'
  };
}

module.exports = { getSessionSecurityConfig };
