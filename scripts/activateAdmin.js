const pool = require('../config/database');

async function activateAdmin() {
  try {
    await pool.execute('UPDATE admin_users SET status = ? WHERE username = ?', ['active', 'admin']);
    console.log('Admin account activated successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

activateAdmin();