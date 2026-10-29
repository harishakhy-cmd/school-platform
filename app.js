require('dotenv').config();

const http = require('http');
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const { MysqlSessionStore } = require('./utils/mysqlSessionStore');

const authRoutes = require('./routes/authRoutes');
const examRoutes = require('./routes/examRoutes');
const adminRoutes = require('./routes/adminRoutes');
const classroomRoutes = require('./routes/classroomRoutes');
const { errorHandler } = require('./middleware/errorHandler');
const { getSessionSecurityConfig } = require('./utils/sessionSecurity');

const sessionSecurity = getSessionSecurityConfig();
if (sessionSecurity.isProduction) {
  const isVercelDeployment = process.env.VERCEL === '1'
    || process.env.APP_DEPLOYMENT_TARGET === 'vercel';
  const missingDatabaseConfig = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME']
    .filter((name) => !process.env[name]);
  if (isVercelDeployment && !process.env.BLOB_READ_WRITE_TOKEN) {
    missingDatabaseConfig.push('BLOB_READ_WRITE_TOKEN');
  }
  if (missingDatabaseConfig.length > 0) {
    throw new Error(`Set required production configuration: ${missingDatabaseConfig.join(', ')}.`);
  }
}

const pool = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

app.set('trust proxy', process.env.TRUST_PROXY === 'true' ? 1 : false);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Enforce standard UTF-8 charset on responses
app.use((req, res, next) => {
  res.charset = 'utf-8';
  next();
});

// ── Global Error & Rejection Safeguards ───────────────────────────────────────
process.on('unhandledRejection', (reason, promise) => {
  console.warn('[Process] Unhandled Rejection at:', promise, 'reason:', reason);
});

const sessionStore = new MysqlSessionStore(pool);

// Extract session middleware into a named variable so it can be shared with Socket.io
const sessionMiddleware = session({
  secret: sessionSecurity.secret,
  resave: false,
  saveUninitialized: false,
  store: sessionStore,
  cookie: {
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: 'lax',
    secure: sessionSecurity.secureCookie
  }
});

app.use(sessionMiddleware);

const lmsRoutes = require('./routes/lmsRoutes');
const globalLmsRoutes = require('./routes/globalLmsRoutes');
const graphingRoutes = require('./routes/graphingRoutes');
const geographyRoutes = require('./routes/geographyRoutes');
const physicsRoutes = require('./routes/physicsRoutes');
const biologyRoutes = require('./routes/biologyRoutes');
const csRoutes = require('./routes/csRoutes');
const chemistryRoutes = require('./routes/chemistryRoutes');
const chemistryLabRoutes = require('./routes/chemistryLabRoutes');
const scientificAssetRoutes = require('./routes/scientificAssetRoutes');

app.use(express.static(path.join(__dirname, 'public')));

app.get('/healthz', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'ok' });
  } catch (error) {
    console.error('[Health] Database check failed:', error.code || error.message);
    res.status(503).json({ status: 'unavailable', database: 'unavailable' });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/classrooms', classroomRoutes);
app.use('/api/classrooms/:classroomId', lmsRoutes);
app.use('/api/graphing', graphingRoutes);
app.use('/api/geography', geographyRoutes);
app.use('/api/physics', physicsRoutes);
app.use('/api/biology', biologyRoutes);
app.use('/api/cs', csRoutes);
app.use('/api/chemistry', chemistryRoutes);
app.use('/api/chemistry-lab', chemistryLabRoutes);
app.use('/api/science/assets', scientificAssetRoutes);
app.use('/api', globalLmsRoutes);

const viewsDir = path.join(__dirname, 'views');

app.get('/', (req, res) => {
  if (req.session.registrationNumber) {
    return res.redirect('/portal.html');
  }
  if (req.session.adminId) {
    return res.redirect('/admin.html');
  }
  res.redirect('/login.html');
});

app.get('/login.html', (req, res) => {
  res.sendFile(path.join(viewsDir, 'login.html'));
});

app.get('/portal.html', (req, res) => {
  if (!req.session.registrationNumber && !req.session.adminId) {
    return res.redirect('/login.html');
  }
  res.sendFile(path.join(viewsDir, 'portal.html'));
});

app.get('/classroom.html', (req, res) => {
  if (!req.session.registrationNumber && !req.session.adminId) {
    return res.redirect('/login.html');
  }
  res.sendFile(path.join(viewsDir, 'classroom.html'));
});

app.get('/graphing-lab.html', (req, res) => {
  if (!req.session.registrationNumber && !req.session.adminId) {
    return res.redirect('/login.html');
  }
  res.sendFile(path.join(viewsDir, 'graphing-lab.html'));
});

app.get('/geography-lab.html', (req, res) => {
  if (!req.session.registrationNumber && !req.session.adminId) {
    return res.redirect('/login.html');
  }
  res.sendFile(path.join(viewsDir, 'geography-lab.html'));
});

app.get('/physics-lab.html', (req, res) => {
  if (!req.session.registrationNumber && !req.session.adminId) {
    return res.redirect('/login.html');
  }
  res.sendFile(path.join(viewsDir, 'physics-lab.html'));
});

app.get('/biology-lab.html', (req, res) => {
  if (!req.session.registrationNumber && !req.session.adminId) {
    return res.redirect('/login.html');
  }
  res.sendFile(path.join(viewsDir, 'biology-lab.html'));
});

app.get('/cs-lab.html', (req, res) => {
  if (!req.session.registrationNumber && !req.session.adminId) {
    return res.redirect('/login.html');
  }
  res.sendFile(path.join(viewsDir, 'cs-lab.html'));
});

app.get('/chemistry-lab.html', (req, res) => {
  if (!req.session.registrationNumber && !req.session.adminId) {
    return res.redirect('/login.html');
  }
  res.sendFile(path.join(viewsDir, 'chemistry-lab.html'));
});

app.get('/scientific-assets.html', (req, res) => {
  if (!req.session.registrationNumber && !req.session.adminId) {
    return res.redirect('/login.html');
  }
  res.sendFile(path.join(viewsDir, 'scientific-assets.html'));
});

app.get('/scientific-viewer.html', (req, res) => {
  if (!req.session.registrationNumber && !req.session.adminId) {
    return res.redirect('/login.html');
  }
  res.sendFile(path.join(viewsDir, 'scientific-viewer.html'));
});

app.get('/exam.html', (req, res) => {
  if (!req.session.registrationNumber) {
    return res.redirect('/login.html');
  }
  res.sendFile(path.join(viewsDir, 'exam.html'));
});

app.get('/result.html', (req, res) => {
  if (!req.session.registrationNumber) {
    return res.redirect('/login.html');
  }
  res.sendFile(path.join(viewsDir, 'result.html'));
});

app.get('/admin-login.html', (req, res) => {
  res.sendFile(path.join(viewsDir, 'admin-login.html'));
});

// Public — admin uses this before logging in (forgot password flow)
app.get('/admin-reset-password.html', (req, res) => {
  if (req.session.adminId) {
    return res.redirect('/admin.html'); // already logged in, no need to reset
  }
  res.sendFile(path.join(viewsDir, 'admin-reset-password.html'));
});

app.get('/admin.html', (req, res) => {
  if (!req.session.adminId) {
    return res.redirect('/admin-login.html');
  }
  res.sendFile(path.join(viewsDir, 'admin.html'));
});

app.use(errorHandler);

module.exports = app;

if (require.main === module) {
  const httpServer = http.createServer(app);

  try {
    const { initSocketServer } = require('./realtime/socketServer');
    initSocketServer(httpServer, sessionMiddleware);
  } catch (error) {
    console.warn('[Socket.io] Could not initialise realtime server:', error.message);
  }

  httpServer.listen(PORT, HOST, async () => {
    console.log(`CBT server running at http://localhost:${PORT}`);
    console.log(`CBT server also accessible at http://<your-local-ip>:${PORT}`);
    console.log('');
    console.log('To find your local IP address:');
    console.log('  Windows: ipconfig | findstr /i "IPv4"');
    console.log('  Mac/Linux: ifconfig | grep "inet "');
    console.log('');
    console.log('For internet access, configure port forwarding on your router:');
    console.log(`  External Port -> ${PORT} -> <your-computer-local-ip>`);
    try {
      await pool.query('SELECT 1');
      console.log('MySQL: OK (pool can reach the database)');
    } catch (error) {
      console.error('MySQL: NOT READY — API calls that use the DB will return 503 until this is fixed.');
      console.error(`        ${error.code || ''} ${error.message || error}`);
      console.error('Tip: Start your local MySQL service, then run: npm run init-db');
    }
  });

  httpServer.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use. Stop the other process or run: set PORT=3001 && npm start`);
    } else {
      console.error(error);
    }
    process.exit(1);
  });
}