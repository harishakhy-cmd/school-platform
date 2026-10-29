function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  const errno = err.errno;
  const code = err.code;

  console.error('[CBT]', code || errno || 'ERROR', err.message);

  if (
    code === 'ECONNREFUSED' ||
    code === 'ETIMEDOUT' ||
    code === 'PROTOCOL_CONNECTION_LOST'
  ) {
    return res.status(503).json({
      error:
        'Cannot connect to MySQL. Start the MySQL service, then ensure DB_HOST and DB_PORT are correct. Import schema.sql to create database cbt_db.',
      code: 'DB_UNREACHABLE'
    });
  }

  if (code === 'ER_ACCESS_DENIED_ERROR' || errno === 1045) {
    return res.status(503).json({
      error:
        'MySQL access denied. Set DB_USER and DB_PASSWORD (and DB_HOST) to a user that can use database cbt_db.',
      code: 'DB_AUTH_FAILED'
    });
  }

  if (code === 'ER_BAD_DB_ERROR' || errno === 1049) {
    return res.status(503).json({
      error:
        'Database cbt_db does not exist or DB_NAME is wrong. Run: mysql -u root -p < schema.sql',
      code: 'DB_MISSING'
    });
  }

  if (code === 'ER_NO_SUCH_TABLE' || errno === 1146) {
    return res.status(503).json({
      error: 'Tables are missing. Import schema.sql into your MySQL server.',
      code: 'DB_SCHEMA_MISSING'
    });
  }

  return res.status(500).json({
    error: 'Internal server error',
    code: 'INTERNAL'
  });
}

module.exports = { errorHandler };
