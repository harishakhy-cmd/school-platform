'use strict';

require('dotenv').config();

function getAdminTestCredentials(env = process.env) {
  const username = env.ADMIN_USERNAME;
  const password = env.ADMIN_PASSWORD;
  if (!username || !password) {
    throw new Error(
      'Set ADMIN_USERNAME and ADMIN_PASSWORD to run database-backed admin tests.'
    );
  }
  return { username, password };
}

module.exports = getAdminTestCredentials;
