'use strict';

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

function env(name, fallback) {
  const v = process.env[name];
  return v === undefined || v === '' ? fallback : v;
}

async function main() {
  const host = env('DB_HOST', '127.0.0.1');
  const port = parseInt(env('DB_PORT', '3306'), 10);
  const user = env('DB_USER', 'root');
  const password =
    process.env.DB_PASSWORD === undefined ? '' : String(process.env.DB_PASSWORD);
  const dbName = env('DB_NAME', 'cbt_db');

  const schemaPath = path.join(__dirname, '..', 'schema.sql');
  if (!fs.existsSync(schemaPath)) {
    console.error('Missing schema.sql at', schemaPath);
    process.exit(1);
  }

  let sql = fs.readFileSync(schemaPath, 'utf8');
  if (dbName !== 'cbt_db') {
    sql = sql.split('cbt_db').join(dbName);
  }

  console.log(`Connecting to MySQL at ${host}:${port} as ${user} (no database selected yet)...`);

  const conn = await mysql.createConnection({
    host,
    port: Number.isNaN(port) ? 3306 : port,
    user,
    password,
    multipleStatements: true
  });

  try {
    await conn.query(sql);
    await ensureDefaultAdmin(conn);
    console.log('');
    console.log(`Database "${dbName}" is ready (schema + seed data applied).`);
    console.log('Next: npm start');
    console.log('Student test login: STO1-001A');
    console.log('Admin login URL: /admin-login.html');
  } finally {
    await conn.end();
  }
}

async function ensureDefaultAdmin(conn) {
  const bcrypt = require('bcrypt');
  const [rows] = await conn.execute('SELECT id FROM admin_users LIMIT 1');
  if (rows.length > 0) {
    return;
  }
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;
  if (!username || !password) {
    throw new Error(
      'ADMIN_USERNAME and ADMIN_PASSWORD must be set before creating the initial admin account.'
    );
  }
  const hash = await bcrypt.hash(password, 10);
  await conn.execute('INSERT INTO admin_users (username, password_hash) VALUES (?, ?)', [username, hash]);
  console.log(`Created initial admin account "${username}".`);
}

main().catch((err) => {
  console.error('');
  console.error('init-db failed.');
  console.error(err.code || 'ERROR', err.message);
  if (err.code === 'ECONNREFUSED') {
    console.error('→ Start MySQL (Windows: Services → MySQL, or XAMPP MySQL).');
  }
  if (err.code === 'ER_ACCESS_DENIED_ERROR' || err.errno === 1045) {
    console.error('→ Set DB_USER / DB_PASSWORD to a valid MySQL user (e.g. root).');
  }
  process.exit(1);
});
