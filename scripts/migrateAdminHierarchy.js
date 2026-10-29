'use strict';

/**
 * Migration Script: Add Admin Hierarchy System
 * 
 * This migration adds:
 * - Admin roles (super_admin, ordinary_admin)
 * - Admin status (pending, active, suspended)
 * - Admin codes (SPA1-001A for super admin, ODA01-001A for ordinary admin)
 * - Exam approval workflow
 * - Enhanced question support for rich text
 * 
 * Usage: node scripts/migrateAdminHierarchy.js
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
    console.log('');

    // 1. Add admin role and status columns
    console.log('Adding admin hierarchy columns to admin_users table...');
    
    const adminColumns = [
      {
        name: 'role',
        sql: "ALTER TABLE admin_users ADD COLUMN role ENUM('super_admin', 'ordinary_admin') NOT NULL DEFAULT 'ordinary_admin' AFTER password_hash"
      },
      {
        name: 'status',
        sql: "ALTER TABLE admin_users ADD COLUMN status ENUM('pending', 'active', 'suspended') NOT NULL DEFAULT 'pending' AFTER role"
      },
      {
        name: 'created_by',
        sql: 'ALTER TABLE admin_users ADD COLUMN created_by INT NULL AFTER status'
      },
      {
        name: 'admin_code',
        sql: 'ALTER TABLE admin_users ADD COLUMN admin_code VARCHAR(20) UNIQUE NULL AFTER created_by'
      }
    ];

    for (const col of adminColumns) {
      const [exists] = await connection.execute(`
        SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'admin_users' AND COLUMN_NAME = ?
      `, [database, col.name]);
      
      if (exists.length === 0) {
        await connection.execute(col.sql);
        console.log(`  ✓ Added column: ${col.name}`);
      } else {
        console.log(`  ✓ Column already exists: ${col.name}`);
      }
    }

    // Add foreign key for created_by
    const [fkExists] = await connection.execute(`
      SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'admin_users' AND CONSTRAINT_NAME = 'fk_admin_created_by'
    `, [database]);
    
    if (fkExists.length === 0) {
      await connection.execute(`
        ALTER TABLE admin_users 
        ADD CONSTRAINT fk_admin_created_by 
        FOREIGN KEY (created_by) REFERENCES admin_users (id) 
        ON DELETE SET NULL ON UPDATE CASCADE
      `);
      console.log('  ✓ Added foreign key: fk_admin_created_by');
    }

    console.log('');

    // 2. Add exam approval workflow columns
    console.log('Adding exam approval workflow columns...');
    
    const examColumns = [
      { name: 'created_by_admin_id', sql: 'ALTER TABLE exams ADD COLUMN created_by_admin_id INT NULL AFTER title' },
      { name: 'approval_status', sql: "ALTER TABLE exams ADD COLUMN approval_status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending' AFTER created_by_admin_id" },
      { name: 'approved_by', sql: 'ALTER TABLE exams ADD COLUMN approved_by INT NULL AFTER approval_status' },
      { name: 'approved_at', sql: 'ALTER TABLE exams ADD COLUMN approved_at DATETIME NULL AFTER approved_by' },
      { name: 'is_broadcasted', sql: 'ALTER TABLE exams ADD COLUMN is_broadcasted BOOLEAN NOT NULL DEFAULT FALSE AFTER approved_at' },
      { name: 'broadcasted_at', sql: 'ALTER TABLE exams ADD COLUMN broadcasted_at DATETIME NULL AFTER is_broadcasted' },
      { name: 'rejection_reason', sql: 'ALTER TABLE exams ADD COLUMN rejection_reason TEXT NULL AFTER broadcasted_at' }
    ];

    for (const col of examColumns) {
      const [exists] = await connection.execute(`
        SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'exams' AND COLUMN_NAME = ?
      `, [database, col.name]);
      
      if (exists.length === 0) {
        await connection.execute(col.sql);
        console.log(`  ✓ Added column: ${col.name}`);
      } else {
        console.log(`  ✓ Column already exists: ${col.name}`);
      }
    }

    // Add foreign keys for exams
    const examFks = [
      { name: 'fk_exams_created_by_admin', column: 'created_by_admin_id' },
      { name: 'fk_exams_approved_by', column: 'approved_by' }
    ];

    for (const fk of examFks) {
      const [fkCheck] = await connection.execute(`
        SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'exams' AND CONSTRAINT_NAME = ?
      `, [database, fk.name]);
      
      if (fkCheck.length === 0) {
        await connection.execute(`
          ALTER TABLE exams 
          ADD CONSTRAINT ${fk.name} 
          FOREIGN KEY (${fk.column}) REFERENCES admin_users (id) 
          ON DELETE SET NULL ON UPDATE CASCADE
        `);
        console.log(`  ✓ Added foreign key: ${fk.name}`);
      }
    }

    console.log('');

    // 3. Add enhanced question support
    console.log('Adding enhanced question support columns...');
    
    const questionColumns = [
      { name: 'question_type', sql: "ALTER TABLE questions ADD COLUMN question_type ENUM('text', 'math', 'science') NOT NULL DEFAULT 'text' AFTER exam_id" },
      { name: 'rich_text_content', sql: 'ALTER TABLE questions ADD COLUMN rich_text_content TEXT NULL AFTER question_text' },
      { name: 'supports_formatting', sql: 'ALTER TABLE questions ADD COLUMN supports_formatting BOOLEAN NOT NULL DEFAULT FALSE AFTER rich_text_content' }
    ];

    for (const col of questionColumns) {
      const [exists] = await connection.execute(`
        SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'questions' AND COLUMN_NAME = ?
      `, [database, col.name]);
      
      if (exists.length === 0) {
        await connection.execute(col.sql);
        console.log(`  ✓ Added column: ${col.name}`);
      } else {
        console.log(`  ✓ Column already exists: ${col.name}`);
      }
    }

    console.log('');

    // 4. Create admin activity log table
    console.log('Creating admin activity log table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS admin_activity_log (
        id INT AUTO_INCREMENT PRIMARY KEY,
        admin_id INT NOT NULL,
        action VARCHAR(100) NOT NULL,
        target_type VARCHAR(50) NULL COMMENT 'admin, exam, student, etc.',
        target_id INT NULL,
        details TEXT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_activity_admin (admin_id),
        INDEX idx_activity_action (action),
        INDEX idx_activity_created_at (created_at)
      ) ENGINE=InnoDB
    `);
    console.log('  ✓ Created admin_activity_log table');

    console.log('');

    // 5. Create default super admin if not exists
    console.log('Setting up default super admin...');
    const bcrypt = require('bcrypt');
    const defaultPassword = 'SuperAdmin@2024';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);
    
    const [existingSuper] = await connection.execute(`
      SELECT id FROM admin_users WHERE role = 'super_admin' LIMIT 1
    `);

    if (existingSuper.length === 0) {
      // Create default super admin
      await connection.execute(`
        INSERT INTO admin_users (username, password_hash, role, status, admin_code, created_at)
        VALUES (?, ?, 'super_admin', 'active', 'SPA1-001A', NOW())
      `, ['superadmin', hashedPassword]);
      console.log('  ✓ Created default super admin:');
      console.log('    Username: superadmin');
      console.log(`    Password: ${defaultPassword}`);
      console.log('    Admin Code: SPA1-001A');
    } else {
      console.log('  ✓ Super admin already exists');
    }

    console.log('');
    console.log('========================================');
    console.log('Migration completed successfully!');
    console.log('========================================');
    console.log('');
    console.log('Next steps:');
    console.log('1. Restart the CBT server');
    console.log('2. Login as super admin: superadmin / SuperAdmin@2024');
    console.log('3. Create ordinary admins from the super admin dashboard');
    console.log('4. Ordinary admins can create exams that require approval');
    console.log('');

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