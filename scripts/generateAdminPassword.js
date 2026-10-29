'use strict';

/**
 * Password Hash Generator for CBT Admin Accounts
 * 
 * This script generates bcrypt password hashes for creating admin accounts.
 * 
 * Usage: 
 *   node scripts/generateAdminPassword.js your-password
 *   node scripts/generateAdminPassword.js                    (prompts for password)
 */

const bcrypt = require('bcrypt');

async function generateHash(password) {
  const saltRounds = 10;
  
  if (!password) {
    console.error('Error: Password is required.');
    console.log('Usage: node scripts/generateAdminPassword.js <your-password>');
    process.exit(1);
  }

  if (password.length < 6) {
    console.error('Warning: Password is short. Consider using at least 8 characters.');
  }

  try {
    const hash = await bcrypt.hash(password, saltRounds);
    
    console.log('');
    console.log('=== Password Hash Generated ===');
    console.log('');
    console.log('Password:', password);
    console.log('Hash:', hash);
    console.log('');
    console.log('=== SQL to Create Admin ===');
    console.log('');
    console.log('INSERT INTO admin_users (username, password_hash)');
    console.log("VALUES ('your-username', '" + hash + "');");
    console.log('');
    console.log('=== Usage Instructions ===');
    console.log('');
    console.log('1. Copy the SQL statement above');
    console.log('2. Replace "your-username" with the desired admin username');
    console.log('3. Run the SQL in your MySQL database:');
    console.log('   mysql -u root -p cbt_db < admin-insert.sql');
    console.log('');
    console.log('Or use MySQL Workbench/phpMyAdmin to execute the SQL.');
    console.log('');
  } catch (error) {
    console.error('Error generating hash:', error.message);
    process.exit(1);
  }
}

// Get password from command line argument
const password = process.argv[2];

if (!password) {
  // If no argument, show usage
  console.log('');
  console.log('Password Hash Generator for CBT Admin Accounts');
  console.log('==============================================');
  console.log('');
  console.log('Usage: node scripts/generateAdminPassword.js <your-password>');
  console.log('');
  console.log('Example:');
  console.log('  node scripts/generateAdminPassword.js MySecurePass123');
  console.log('');
  console.log('This will generate a bcrypt hash that you can use to create');
  console.log('an admin account in the database.');
  console.log('');
  
  // For security, we don't prompt for password in this simple version
  // Just show usage and exit
  process.exit(0);
}

generateHash(password);