const pool = require('../config/database');

async function checkAdmins() {
  try {
    const [rows] = await pool.execute('SELECT id, username, role, status, admin_code, created_at FROM admin_users');
    console.log('\n=== Admin Users in Database ===\n');
    console.log('ID\tUsername\tRole\t\tStatus\t\tAdmin Code');
    console.log('---\t--------\t----\t\t------\t\t----------');
    rows.forEach(row => {
      console.log(`${row.id}\t${row.username}\t\t${row.role}\t${row.status}\t\t${row.admin_code || 'N/A'}`);
    });
    console.log('\n');
    
    if (rows.length === 0) {
      console.log('No admin users found in database!');
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

checkAdmins();