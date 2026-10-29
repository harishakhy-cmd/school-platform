'use strict';

/**
 * Option A+ : use a project-local MySQL data directory under ./mysql-data
 * and start mysqld if nothing is already listening on DB_PORT (default 3306).
 * Requires MySQL Server binaries (e.g. winget install Oracle.MySQL).
 *
 * Env: DB_HOST (default 127.0.0.1), DB_PORT (default 3306), DB_PASSWORD, MYSQLD_PATH
 */

const { spawn, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const net = require('net');
const mysql = require('mysql2/promise');

const root = path.join(__dirname, '..');
const dataDir = path.join(root, 'mysql-data');

function findMysqld() {
  const extra = process.env.MYSQLD_PATH;
  const candidates = [
    extra,
    'C:\\Program Files\\MySQL\\MySQL Server 8.4\\bin\\mysqld.exe',
    'C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysqld.exe',
    'C:\\xampp\\mysql\\bin\\mysqld.exe'
  ].filter(Boolean);
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function portOpen(port, host) {
  return new Promise((resolve) => {
    const s = net.createConnection({ port, host }, () => {
      s.end();
      resolve(true);
    });
    s.on('error', () => resolve(false));
    s.setTimeout(1000, () => {
      try {
        s.destroy();
      } catch {
        /* ignore */
      }
      resolve(false);
    });
  });
}

async function waitForPort(host, port, maxAttempts = 80) {
  for (let i = 0; i < maxAttempts; i += 1) {
    if (await portOpen(port, host)) return true;
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}

async function mysqlReady(host, port, password) {
  try {
    const c = await mysql.createConnection({
      host,
      port,
      user: process.env.DB_USER || 'root',
      password: password === undefined ? '' : String(password),
      connectTimeout: 2500
    });
    await c.ping();
    await c.end();
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const host = process.env.DB_HOST || '127.0.0.1';
  const port = parseInt(process.env.DB_PORT || '3306', 10);
  const pwd = process.env.DB_PASSWORD === undefined ? '' : String(process.env.DB_PASSWORD);

  const mysqld = findMysqld();
  if (!mysqld) {
    console.error(
      'Could not find mysqld.exe. Install MySQL Server (e.g. winget install Oracle.MySQL) or set MYSQLD_PATH.'
    );
    process.exit(1);
  }

  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const mysqlDbDir = path.join(dataDir, 'mysql');
  if (!fs.existsSync(mysqlDbDir)) {
    console.log('First run: initializing MySQL data directory at mysql-data/ ...');
    const init = spawnSync(mysqld, ['--initialize-insecure', `--datadir=${dataDir}`], {
      stdio: 'inherit',
      cwd: root,
      shell: false
    });
    if (init.status !== 0) {
      process.exit(init.status || 1);
    }
  }

  let canConnect = await mysqlReady(host, port, pwd);
  const portBusy = await portOpen(port, host);

  if (!canConnect && portBusy) {
    console.error(
      `Port ${port} is open but login failed. If you use another MySQL on this port, set DB_USER and DB_PASSWORD.\n` +
        'Otherwise stop that server so this project can start its own mysqld on the same port.'
    );
    process.exit(1);
  }

  if (!canConnect && !portBusy) {
    console.log(`Starting mysqld (${mysqld}) on ${host}:${port} ...`);
    const child = spawn(
      mysqld,
      [`--datadir=${dataDir}`, `--port=${port}`, `--bind-address=${host}`],
      {
        cwd: root,
        stdio: 'ignore',
        detached: true,
        shell: false
      }
    );
    child.unref();

    const opened = await waitForPort(host, port);
    if (!opened) {
      console.error('MySQL did not open the port in time. Check mysql-data/*.err for errors.');
      process.exit(1);
    }

    for (let i = 0; i < 60; i += 1) {
      canConnect = await mysqlReady(host, port, pwd);
      if (canConnect) break;
      await new Promise((r) => setTimeout(r, 400));
    }
  }

  if (!canConnect) {
    console.error(`Could not connect to MySQL at ${host}:${port}`);
    process.exit(1);
  }

  console.log('Applying schema (if needed)...');
  const initDb = spawnSync(process.execPath, [path.join(root, 'scripts', 'initDatabase.js')], {
    stdio: 'inherit',
    cwd: root,
    env: { ...process.env, DB_HOST: host, DB_PORT: String(port) }
  });
  if (initDb.status !== 0) {
    process.exit(initDb.status || 1);
  }

  const chemistryMigration = spawnSync(process.execPath, [path.join(root, 'scripts', 'migrateVirtualChemistryLab.js')], {
    stdio: 'inherit',
    cwd: root,
    env: { ...process.env, DB_HOST: host, DB_PORT: String(port) }
  });
  if (chemistryMigration.status !== 0) {
    process.exit(chemistryMigration.status || 1);
  }

  const profilePhotoMigration = spawnSync(process.execPath, [path.join(root, 'scripts', 'migrateProfilePhotos.js')], {
    stdio: 'inherit',
    cwd: root,
    env: { ...process.env, DB_HOST: host, DB_PORT: String(port) }
  });
  if (profilePhotoMigration.status !== 0) {
    process.exit(profilePhotoMigration.status || 1);
  }

  console.log('\nCBT: http://localhost:3000  (student: STO1-001A | admin: /admin-login.html)\n');
  const app = spawnSync(process.execPath, [path.join(root, 'app.js')], {
    stdio: 'inherit',
    cwd: root,
    env: { ...process.env, DB_HOST: host, DB_PORT: String(port) }
  });
  process.exit(app.status ?? 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
