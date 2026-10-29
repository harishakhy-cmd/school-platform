const mysql = require('mysql2/promise');

const port = process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306;

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number.isNaN(port) ? 3306 : port,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD === undefined ? '' : String(process.env.DB_PASSWORD),
  database: process.env.DB_NAME || 'cbt_db',
  charset: 'utf8mb4',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000
});

module.exports = pool;
