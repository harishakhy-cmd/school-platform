'use strict';

/**
 * Migration Script: Add admin_id column to students table
 * 
 * This script adds the admin_id foreign key column to the students table
 * for existing CBT installations that need multi-admin support.
 * 
 * Usage: node scripts/migrateAddAdminToStudents.js
 */

const mysql = require('mysql2/promise');

async function migrate() {
  const host = process.env.DB_HOST || '127.0.0.1';
  const port = parseInt(process.env.DB_PORT || '3306', 10);
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD === undefined ? '' : String(process.env.DB_PASSWORD);
  const database = process.env.DB_NAME || 'cbt_db';

  console.log('Connecting to MySQL...');
  
  let connection;
  try {
    connection = await mysql.createConnection({
      host,
      port,
      user,
      password,
      database
    });

    console.log('Connected to MySQL.');

    // Check if column already exists
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? 
        AND TABLE_NAME = 'students' 
        AND COLUMN_NAME = 'admin_id'
    `, [database]);

    if (columns.length > 0) {
      console.log('Column admin_id already exists in students table. Migration not needed.');
      await connection.end();
      return;
    }

    console.log('Adding admin_id column to students table...');

    // Add the admin_id column
    await connection.execute(`
      ALTER TABLE students 
      ADD COLUMN admin_id INT NULL COMMENT 'Admin responsible for this student' 
      AFTER name
    `);

    console.log('Column admin_id added successfully.');

    // Check if foreign key already exists
    const [constraints] = await connection.execute(`
      SELECT CONSTRAINT_NAME 
      FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
      WHERE TABLE_SCHEMA = ? 
        AND TABLE_NAME = 'students' 
        AND CONSTRAINT_NAME = 'fk_students_admin'
    `, [database]);

    if (constraints.length === 0) {
      console.log('Adding foreign key constraint...');
      
      await connection.execute(`
        ALTER TABLE students 
        ADD CONSTRAINT fk_students_admin 
        FOREIGN KEY (admin_id) REFERENCES admin_users (id) 
        ON DELETE SET NULL 
        ON UPDATE CASCADE
      `);

      console.log('Foreign key constraint added successfully.');
    } else {
      console.log('Foreign key constraint already exists.');
    }

    // Add index for better query performance
    const [indexes] = await connection.execute(`
      SELECT INDEX_NAME 
      FROM INFORMATION_SCHEMA.STATISTICS 
      WHERE TABLE_SCHEMA = ? 
        AND TABLE_NAME = 'students' 
        AND INDEX_NAME = 'idx_students_admin_id'
    `, [database]);

    if (indexes.length === 0) {
      console.log('Adding index on admin_id...');
      
      await connection.execute(`
        CREATE INDEX idx_students_admin_id ON students (admin_id)
      `);

      console.log('Index added successfully.');
    } else {
      console.log('Index on admin_id already exists.');
    }

    console.log('');
    console.log('Migration completed successfully!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Create admin accounts in the admin_users table');
    console.log('2. Assign students to admins using the admin dashboard');
    console.log('3. Restart the CBT server');

  } catch (error) {
    console.error('Migration failed:', error.message);
    if (error.code) {
      console.error('Error code:', error.code);
    }
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run migration
migrate();