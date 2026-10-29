'use strict';

/**
 * Migration Script: LMS & Classroom Ecosystem Database Expansion
 * 
 * Adds all required entities for:
 * - Tutors & User roles ('super_admin', 'ordinary_admin', 'tutor')
 * - Academic Terms, Classes & Subjects
 * - Classrooms & Student Enrollments
 * - CBT Exam integration with Classrooms (classroom_id, subject_id, schedule)
 * - Lessons & Learning Materials & Lesson Completion tracking
 * - Assignments & Submissions (with grading & feedback)
 * - Quizzes, Quiz Questions, Quiz Attempts & Responses
 * - Attendance Register (Present, Absent, Late, Excused)
 * - Discussions & Discussion Comments (Threaded)
 * - Announcements & Centralized Notifications
 * - Academic Calendar Events
 * - Live Classrooms & Collaborative Whiteboard State
 * 
 * Usage: node scripts/migrateLmsAndClassroom.js
 */

const mysql = require('mysql2/promise');

async function migrate() {
  const host = process.env.DB_HOST || '127.0.0.1';
  const port = parseInt(process.env.DB_PORT || '3306', 10);
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD === undefined ? '' : String(process.env.DB_PASSWORD);
  const database = process.env.DB_NAME || 'cbt_db';

  console.log('Connecting to MySQL for LMS & Classroom migration...');
  
  let connection;
  try {
    connection = await mysql.createConnection({
      host,
      port,
      user,
      password,
      database
    });

    console.log('Connected to MySQL database:', database);
    console.log('Beginning schema migration...\n');

    // 1. Update admin_users role ENUM to include 'tutor'
    console.log('1. Updating admin_users role ENUM & profile fields...');
    try {
      await connection.execute(`
        ALTER TABLE admin_users 
        MODIFY COLUMN role ENUM('super_admin', 'ordinary_admin', 'tutor') NOT NULL DEFAULT 'ordinary_admin'
      `);
      console.log('  ✓ Updated admin_users role ENUM to include \'tutor\'');
    } catch (e) {
      console.log('  - Notice on role ENUM:', e.message);
    }

    // Check / Add full_name and email to admin_users
    const adminCols = [
      { name: 'full_name', sql: 'ALTER TABLE admin_users ADD COLUMN full_name VARCHAR(200) NULL AFTER username' },
      { name: 'email', sql: 'ALTER TABLE admin_users ADD COLUMN email VARCHAR(255) NULL AFTER full_name' }
    ];
    for (const col of adminCols) {
      const [exists] = await connection.execute(`
        SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'admin_users' AND COLUMN_NAME = ?
      `, [database, col.name]);
      if (exists.length === 0) {
        await connection.execute(col.sql);
        console.log(`  ✓ Added column to admin_users: ${col.name}`);
      }
    }

    // 2. Tutors profile table
    console.log('2. Creating tutors profile table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS tutors (
        id INT AUTO_INCREMENT PRIMARY KEY,
        admin_user_id INT NOT NULL UNIQUE,
        specialization VARCHAR(255) NULL,
        phone VARCHAR(32) NULL,
        bio TEXT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_tutor_admin FOREIGN KEY (admin_user_id) REFERENCES admin_users (id) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB;
    `);
    console.log('  ✓ Table ready: tutors');

    // 3. Academic Terms table
    console.log('3. Creating academic_terms table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS academic_terms (
        id INT AUTO_INCREMENT PRIMARY KEY,
        academic_year VARCHAR(32) NOT NULL,
        term_name VARCHAR(64) NOT NULL,
        start_date DATE NULL,
        end_date DATE NULL,
        is_current BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_terms_year (academic_year),
        INDEX idx_terms_current (is_current)
      ) ENGINE=InnoDB;
    `);
    console.log('  ✓ Table ready: academic_terms');

    // 4. Classes table (grade level / program)
    console.log('4. Creating classes table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS classes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(128) NOT NULL,
        code VARCHAR(32) NOT NULL UNIQUE,
        description TEXT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_classes_code (code)
      ) ENGINE=InnoDB;
    `);
    console.log('  ✓ Table ready: classes');

    // 5. Subjects table
    console.log('5. Creating subjects table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS subjects (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(128) NOT NULL,
        code VARCHAR(32) NOT NULL UNIQUE,
        description TEXT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_subjects_code (code)
      ) ENGINE=InnoDB;
    `);
    console.log('  ✓ Table ready: subjects');

    // 6. Classrooms table
    console.log('6. Creating classrooms table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS classrooms (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        class_code VARCHAR(32) NOT NULL UNIQUE,
        class_id INT NULL,
        subject_id INT NULL,
        term_id INT NULL,
        tutor_id INT NULL,
        description TEXT NULL,
        is_archived BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_classroom_class FOREIGN KEY (class_id) REFERENCES classes (id) ON DELETE SET NULL ON UPDATE CASCADE,
        CONSTRAINT fk_classroom_subject FOREIGN KEY (subject_id) REFERENCES subjects (id) ON DELETE SET NULL ON UPDATE CASCADE,
        CONSTRAINT fk_classroom_term FOREIGN KEY (term_id) REFERENCES academic_terms (id) ON DELETE SET NULL ON UPDATE CASCADE,
        CONSTRAINT fk_classroom_tutor FOREIGN KEY (tutor_id) REFERENCES admin_users (id) ON DELETE SET NULL ON UPDATE CASCADE,
        INDEX idx_classroom_tutor (tutor_id),
        INDEX idx_classroom_archived (is_archived)
      ) ENGINE=InnoDB;
    `);
    console.log('  ✓ Table ready: classrooms');

    // 7. Classroom Enrollments
    console.log('7. Creating classroom_enrollments table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS classroom_enrollments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        classroom_id INT NOT NULL,
        registration_number VARCHAR(32) NOT NULL,
        status ENUM('active', 'suspended', 'completed') DEFAULT 'active',
        enrolled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_enroll_classroom FOREIGN KEY (classroom_id) REFERENCES classrooms (id) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT fk_enroll_student FOREIGN KEY (registration_number) REFERENCES students (registration_number) ON DELETE CASCADE ON UPDATE CASCADE,
        UNIQUE KEY uniq_class_student (classroom_id, registration_number),
        INDEX idx_enroll_reg (registration_number),
        INDEX idx_enroll_class (classroom_id)
      ) ENGINE=InnoDB;
    `);
    console.log('  ✓ Table ready: classroom_enrollments');

    // 8. Update exams table with Classroom and Subject links
    console.log('8. Enhancing exams table for Classroom CBT integration...');
    const examCols = [
      { name: 'classroom_id', sql: 'ALTER TABLE exams ADD COLUMN classroom_id INT NULL AFTER duration' },
      { name: 'subject_id', sql: 'ALTER TABLE exams ADD COLUMN subject_id INT NULL AFTER classroom_id' },
      { name: 'start_time', sql: 'ALTER TABLE exams ADD COLUMN start_time DATETIME NULL AFTER subject_id' },
      { name: 'end_time', sql: 'ALTER TABLE exams ADD COLUMN end_time DATETIME NULL AFTER start_time' },
      { name: 'is_randomized', sql: 'ALTER TABLE exams ADD COLUMN is_randomized BOOLEAN DEFAULT TRUE AFTER end_time' },
      { name: 'shuffle_options', sql: 'ALTER TABLE exams ADD COLUMN shuffle_options BOOLEAN DEFAULT FALSE AFTER is_randomized' },
      { name: 'instructions', sql: 'ALTER TABLE exams ADD COLUMN instructions TEXT NULL AFTER shuffle_options' }
    ];

    for (const col of examCols) {
      const [exists] = await connection.execute(`
        SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'exams' AND COLUMN_NAME = ?
      `, [database, col.name]);
      if (exists.length === 0) {
        await connection.execute(col.sql);
        console.log(`  ✓ Added column to exams: ${col.name}`);
      }
    }

    // Add FKs for exams if not exists
    try {
      const [fkClassExists] = await connection.execute(`
        SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'exams' AND CONSTRAINT_NAME = 'fk_exams_classroom'
      `, [database]);
      if (fkClassExists.length === 0) {
        await connection.execute(`
          ALTER TABLE exams 
          ADD CONSTRAINT fk_exams_classroom 
          FOREIGN KEY (classroom_id) REFERENCES classrooms (id) 
          ON DELETE SET NULL ON UPDATE CASCADE
        `);
        console.log('  ✓ Added foreign key: fk_exams_classroom');
      }
    } catch (e) {
      console.log('  - Notice on fk_exams_classroom:', e.message);
    }

    // 9. Lessons table
    console.log('9. Creating lessons table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS lessons (
        id INT AUTO_INCREMENT PRIMARY KEY,
        classroom_id INT NOT NULL,
        subject_id INT NULL,
        topic VARCHAR(255) NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT NULL,
        learning_objectives TEXT NULL,
        content LONGTEXT NULL,
        lesson_date DATETIME NULL,
        duration_minutes INT DEFAULT 45,
        order_num INT DEFAULT 0,
        is_published BOOLEAN DEFAULT TRUE,
        created_by INT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_lessons_classroom FOREIGN KEY (classroom_id) REFERENCES classrooms (id) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT fk_lessons_subject FOREIGN KEY (subject_id) REFERENCES subjects (id) ON DELETE SET NULL ON UPDATE CASCADE,
        CONSTRAINT fk_lessons_creator FOREIGN KEY (created_by) REFERENCES admin_users (id) ON DELETE SET NULL ON UPDATE CASCADE,
        INDEX idx_lessons_classroom (classroom_id),
        INDEX idx_lessons_date (lesson_date)
      ) ENGINE=InnoDB;
    `);
    console.log('  ✓ Table ready: lessons');

    // 10. Lesson Materials table
    console.log('10. Creating lesson_materials table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS lesson_materials (
        id INT AUTO_INCREMENT PRIMARY KEY,
        lesson_id INT NULL,
        classroom_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        file_name VARCHAR(255) NULL,
        file_path VARCHAR(500) NULL,
        file_type VARCHAR(64) NULL,
        file_size BIGINT NULL,
        external_url VARCHAR(1000) NULL,
        is_downloadable BOOLEAN DEFAULT TRUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_mat_lesson FOREIGN KEY (lesson_id) REFERENCES lessons (id) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT fk_mat_classroom FOREIGN KEY (classroom_id) REFERENCES classrooms (id) ON DELETE CASCADE ON UPDATE CASCADE,
        INDEX idx_mat_classroom (classroom_id),
        INDEX idx_mat_lesson (lesson_id)
      ) ENGINE=InnoDB;
    `);
    console.log('  ✓ Table ready: lesson_materials');

    // 11. Lesson Completions (Progress Tracking)
    console.log('11. Creating lesson_completions table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS lesson_completions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        lesson_id INT NOT NULL,
        registration_number VARCHAR(32) NOT NULL,
        status ENUM('Not Started', 'In Progress', 'Completed') DEFAULT 'Completed',
        completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_comp_lesson FOREIGN KEY (lesson_id) REFERENCES lessons (id) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT fk_comp_student FOREIGN KEY (registration_number) REFERENCES students (registration_number) ON DELETE CASCADE ON UPDATE CASCADE,
        UNIQUE KEY uniq_student_lesson (lesson_id, registration_number),
        INDEX idx_comp_student (registration_number)
      ) ENGINE=InnoDB;
    `);
    console.log('  ✓ Table ready: lesson_completions');

    // 12. Assignments table
    console.log('12. Creating assignments table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS assignments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        classroom_id INT NOT NULL,
        subject_id INT NULL,
        title VARCHAR(255) NOT NULL,
        instructions TEXT NOT NULL,
        max_marks INT NOT NULL DEFAULT 100,
        available_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        deadline DATETIME NOT NULL,
        allow_late_submission BOOLEAN DEFAULT FALSE,
        attachment_path VARCHAR(500) NULL,
        created_by INT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_assign_classroom FOREIGN KEY (classroom_id) REFERENCES classrooms (id) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT fk_assign_subject FOREIGN KEY (subject_id) REFERENCES subjects (id) ON DELETE SET NULL ON UPDATE CASCADE,
        CONSTRAINT fk_assign_creator FOREIGN KEY (created_by) REFERENCES admin_users (id) ON DELETE SET NULL ON UPDATE CASCADE,
        INDEX idx_assign_classroom (classroom_id),
        INDEX idx_assign_deadline (deadline)
      ) ENGINE=InnoDB;
    `);
    console.log('  ✓ Table ready: assignments');

    // 13. Assignment Submissions
    console.log('13. Creating assignment_submissions table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS assignment_submissions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        assignment_id INT NOT NULL,
        registration_number VARCHAR(32) NOT NULL,
        submission_text TEXT NULL,
        file_path VARCHAR(500) NULL,
        file_name VARCHAR(255) NULL,
        submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        is_late BOOLEAN DEFAULT FALSE,
        score DECIMAL(5,2) NULL,
        graded_by INT NULL,
        graded_at DATETIME NULL,
        feedback TEXT NULL,
        status ENUM('submitted', 'graded', 'returned') DEFAULT 'submitted',
        CONSTRAINT fk_sub_assign FOREIGN KEY (assignment_id) REFERENCES assignments (id) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT fk_sub_student FOREIGN KEY (registration_number) REFERENCES students (registration_number) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT fk_sub_grader FOREIGN KEY (graded_by) REFERENCES admin_users (id) ON DELETE SET NULL ON UPDATE CASCADE,
        UNIQUE KEY uniq_assign_student (assignment_id, registration_number),
        INDEX idx_sub_student (registration_number),
        INDEX idx_sub_status (status)
      ) ENGINE=InnoDB;
    `);
    console.log('  ✓ Table ready: assignment_submissions');

    // 14. Quizzes table
    console.log('14. Creating quizzes table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS quizzes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        classroom_id INT NOT NULL,
        subject_id INT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT NULL,
        duration_minutes INT NOT NULL DEFAULT 15,
        max_score INT NOT NULL DEFAULT 100,
        pass_score INT NOT NULL DEFAULT 50,
        start_date DATETIME NULL,
        end_date DATETIME NULL,
        is_published BOOLEAN DEFAULT TRUE,
        created_by INT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_quiz_classroom FOREIGN KEY (classroom_id) REFERENCES classrooms (id) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT fk_quiz_subject FOREIGN KEY (subject_id) REFERENCES subjects (id) ON DELETE SET NULL ON UPDATE CASCADE,
        CONSTRAINT fk_quiz_creator FOREIGN KEY (created_by) REFERENCES admin_users (id) ON DELETE SET NULL ON UPDATE CASCADE,
        INDEX idx_quiz_classroom (classroom_id)
      ) ENGINE=InnoDB;
    `);
    console.log('  ✓ Table ready: quizzes');

    // 15. Quiz Questions
    console.log('15. Creating quiz_questions table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS quiz_questions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        quiz_id INT NOT NULL,
        question_text TEXT NOT NULL,
        option_a TEXT NOT NULL,
        option_b TEXT NOT NULL,
        option_c TEXT NOT NULL,
        option_d TEXT NOT NULL,
        correct_answer ENUM('A', 'B', 'C', 'D') NOT NULL,
        points INT DEFAULT 1,
        explanation TEXT NULL,
        CONSTRAINT fk_quiz_q_quiz FOREIGN KEY (quiz_id) REFERENCES quizzes (id) ON DELETE CASCADE ON UPDATE CASCADE,
        INDEX idx_quiz_q_quiz (quiz_id)
      ) ENGINE=InnoDB;
    `);
    console.log('  ✓ Table ready: quiz_questions');

    // 16. Quiz Attempts
    console.log('16. Creating quiz_attempts table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS quiz_attempts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        quiz_id INT NOT NULL,
        registration_number VARCHAR(32) NOT NULL,
        score DECIMAL(5,2) NULL,
        total_points INT NULL,
        percentage DECIMAL(5,2) NULL,
        start_time DATETIME NOT NULL,
        end_time DATETIME NULL,
        status ENUM('InProgress', 'Submitted') DEFAULT 'InProgress',
        CONSTRAINT fk_quiz_att_quiz FOREIGN KEY (quiz_id) REFERENCES quizzes (id) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT fk_quiz_att_student FOREIGN KEY (registration_number) REFERENCES students (registration_number) ON DELETE CASCADE ON UPDATE CASCADE,
        UNIQUE KEY uniq_quiz_student (quiz_id, registration_number),
        INDEX idx_quiz_att_student (registration_number)
      ) ENGINE=InnoDB;
    `);
    console.log('  ✓ Table ready: quiz_attempts');

    // 17. Quiz Responses
    console.log('17. Creating quiz_responses table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS quiz_responses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        quiz_attempt_id INT NOT NULL,
        question_id INT NOT NULL,
        selected_option ENUM('A', 'B', 'C', 'D') NULL,
        is_correct BOOLEAN DEFAULT FALSE,
        CONSTRAINT fk_quiz_res_att FOREIGN KEY (quiz_attempt_id) REFERENCES quiz_attempts (id) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT fk_quiz_res_q FOREIGN KEY (question_id) REFERENCES quiz_questions (id) ON DELETE CASCADE ON UPDATE CASCADE,
        UNIQUE KEY uniq_attempt_question (quiz_attempt_id, question_id)
      ) ENGINE=InnoDB;
    `);
    console.log('  ✓ Table ready: quiz_responses');

    // 18. Attendance table
    console.log('18. Creating attendance table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS attendance (
        id INT AUTO_INCREMENT PRIMARY KEY,
        classroom_id INT NOT NULL,
        lesson_id INT NULL,
        registration_number VARCHAR(32) NOT NULL,
        date DATE NOT NULL,
        status ENUM('Present', 'Absent', 'Late', 'Excused') NOT NULL DEFAULT 'Present',
        remarks VARCHAR(255) NULL,
        marked_by INT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_att_classroom FOREIGN KEY (classroom_id) REFERENCES classrooms (id) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT fk_att_lesson FOREIGN KEY (lesson_id) REFERENCES lessons (id) ON DELETE SET NULL ON UPDATE CASCADE,
        CONSTRAINT fk_att_student FOREIGN KEY (registration_number) REFERENCES students (registration_number) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT fk_att_marker FOREIGN KEY (marked_by) REFERENCES admin_users (id) ON DELETE SET NULL ON UPDATE CASCADE,
        UNIQUE KEY uniq_att_record (classroom_id, lesson_id, registration_number, date),
        INDEX idx_att_student (registration_number),
        INDEX idx_att_date (date)
      ) ENGINE=InnoDB;
    `);
    console.log('  ✓ Table ready: attendance');

    // 19. Discussions table
    console.log('19. Creating discussions table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS discussions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        classroom_id INT NOT NULL,
        lesson_id INT NULL,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        author_type ENUM('tutor', 'student', 'admin') NOT NULL,
        author_id VARCHAR(64) NOT NULL,
        author_name VARCHAR(200) NOT NULL,
        is_pinned BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_disc_classroom FOREIGN KEY (classroom_id) REFERENCES classrooms (id) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT fk_disc_lesson FOREIGN KEY (lesson_id) REFERENCES lessons (id) ON DELETE SET NULL ON UPDATE CASCADE,
        INDEX idx_disc_classroom (classroom_id)
      ) ENGINE=InnoDB;
    `);
    console.log('  ✓ Table ready: discussions');

    // 20. Discussion Comments
    console.log('20. Creating discussion_comments table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS discussion_comments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        discussion_id INT NOT NULL,
        parent_comment_id INT NULL,
        author_type ENUM('tutor', 'student', 'admin') NOT NULL,
        author_id VARCHAR(64) NOT NULL,
        author_name VARCHAR(200) NOT NULL,
        content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_comm_disc FOREIGN KEY (discussion_id) REFERENCES discussions (id) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT fk_comm_parent FOREIGN KEY (parent_comment_id) REFERENCES discussion_comments (id) ON DELETE CASCADE ON UPDATE CASCADE,
        INDEX idx_comm_disc (discussion_id)
      ) ENGINE=InnoDB;
    `);
    console.log('  ✓ Table ready: discussion_comments');

    // 21. Announcements table
    console.log('21. Creating announcements table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS announcements (
        id INT AUTO_INCREMENT PRIMARY KEY,
        classroom_id INT NULL,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        type ENUM('general', 'assignment', 'exam', 'lesson', 'emergency') DEFAULT 'general',
        priority ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal',
        published_by INT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_ann_classroom FOREIGN KEY (classroom_id) REFERENCES classrooms (id) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT fk_ann_publisher FOREIGN KEY (published_by) REFERENCES admin_users (id) ON DELETE SET NULL ON UPDATE CASCADE,
        INDEX idx_ann_classroom (classroom_id),
        INDEX idx_ann_priority (priority)
      ) ENGINE=InnoDB;
    `);
    console.log('  ✓ Table ready: announcements');

    // 22. Notifications table
    console.log('22. Creating notifications table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        recipient_type ENUM('student', 'tutor', 'admin') NOT NULL,
        recipient_id VARCHAR(64) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(64) NOT NULL DEFAULT 'info',
        link VARCHAR(255) NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_notif_recipient (recipient_type, recipient_id, is_read),
        INDEX idx_notif_created (created_at)
      ) ENGINE=InnoDB;
    `);
    console.log('  ✓ Table ready: notifications');

    // 23. Calendar Events
    console.log('23. Creating calendar_events table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS calendar_events (
        id INT AUTO_INCREMENT PRIMARY KEY,
        classroom_id INT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT NULL,
        event_type ENUM('lesson', 'assignment_deadline', 'quiz', 'cbt_exam', 'live_class', 'academic_event') NOT NULL,
        start_time DATETIME NOT NULL,
        end_time DATETIME NULL,
        reference_id INT NULL,
        created_by INT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_cal_classroom FOREIGN KEY (classroom_id) REFERENCES classrooms (id) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT fk_cal_creator FOREIGN KEY (created_by) REFERENCES admin_users (id) ON DELETE SET NULL ON UPDATE CASCADE,
        INDEX idx_cal_classroom (classroom_id),
        INDEX idx_cal_start (start_time)
      ) ENGINE=InnoDB;
    `);
    console.log('  ✓ Table ready: calendar_events');

    // 24. Live Sessions
    console.log('24. Creating live_sessions table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS live_sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        classroom_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        tutor_id INT NOT NULL,
        session_code VARCHAR(64) NOT NULL UNIQUE,
        status ENUM('scheduled', 'live', 'ended') DEFAULT 'scheduled',
        started_at DATETIME NULL,
        ended_at DATETIME NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_live_classroom FOREIGN KEY (classroom_id) REFERENCES classrooms (id) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT fk_live_tutor FOREIGN KEY (tutor_id) REFERENCES admin_users (id) ON DELETE CASCADE ON UPDATE CASCADE,
        INDEX idx_live_classroom (classroom_id),
        INDEX idx_live_code (session_code)
      ) ENGINE=InnoDB;
    `);
    console.log('  ✓ Table ready: live_sessions');

    // 25. Collaborative Whiteboard States
    console.log('25. Creating whiteboard_states table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS whiteboard_states (
        id INT AUTO_INCREMENT PRIMARY KEY,
        classroom_id INT NOT NULL UNIQUE,
        canvas_data LONGTEXT NULL,
        last_updated_by INT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_wb_classroom FOREIGN KEY (classroom_id) REFERENCES classrooms (id) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT fk_wb_updater FOREIGN KEY (last_updated_by) REFERENCES admin_users (id) ON DELETE SET NULL ON UPDATE CASCADE
      ) ENGINE=InnoDB;
    `);
    console.log('  ✓ Table ready: whiteboard_states');

    // 26. Insert default initial Academic Term, Class, and Subject if table empty
    console.log('26. Seeding initial academic core data...');
    const [terms] = await connection.execute('SELECT COUNT(*) as count FROM academic_terms');
    if (terms[0].count === 0) {
      await connection.execute(`
        INSERT INTO academic_terms (academic_year, term_name, start_date, end_date, is_current)
        VALUES ('2025/2026', 'First Term', CURDATE(), DATE_ADD(CURDATE(), INTERVAL 90 DAY), TRUE)
      `);
      console.log('  ✓ Seeded default academic term (2025/2026 First Term)');
    }

    const [classes] = await connection.execute('SELECT COUNT(*) as count FROM classes');
    if (classes[0].count === 0) {
      await connection.execute(`
        INSERT INTO classes (name, code, description)
        VALUES 
          ('Grade 10 - Alpha', 'GR10-A', 'Senior Secondary Grade 10 Alpha'),
          ('Grade 11 - Beta', 'GR11-B', 'Senior Secondary Grade 11 Beta'),
          ('Computer Science Yr 1', 'CS-Y1', 'Faculty of Information Technology')
      `);
      console.log('  ✓ Seeded default classes');
    }

    const [subjects] = await connection.execute('SELECT COUNT(*) as count FROM subjects');
    if (subjects[0].count === 0) {
      await connection.execute(`
        INSERT INTO subjects (name, code, description)
        VALUES 
          ('Mathematics', 'MTH101', 'Core Pure and Applied Mathematics'),
          ('Computer Science', 'CSC101', 'Computer Hardware, Programming and CBT Systems'),
          ('English Language', 'ENG101', 'Academic English and Comprehension')
      `);
      console.log('  ✓ Seeded default subjects');
    }

    console.log('\n==================================================');
    console.log('✓ LMS & CLASSROOM SCHEMA MIGRATION COMPLETED!');
    console.log('==================================================');

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

migrate();
