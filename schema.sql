-- CBT Database Schema
-- Run: mysql -u root -p < schema.sql
-- Or import via MySQL Workbench
-- Or from project folder (Node): npm run init-db

CREATE DATABASE IF NOT EXISTS cbt_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE cbt_db;

CREATE TABLE IF NOT EXISTS sessions (
  session_id VARCHAR(128) COLLATE utf8mb4_bin NOT NULL,
  expires INT UNSIGNED NOT NULL,
  data MEDIUMTEXT COLLATE utf8mb4_bin,
  PRIMARY KEY (session_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS students (
  registration_number VARCHAR(32) PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  profile_photo_url VARCHAR(512) NULL,
  admin_id INT NULL COMMENT 'Admin responsible for this student',
  INDEX idx_students_name (name),
  CONSTRAINT fk_students_admin FOREIGN KEY (admin_id) REFERENCES admin_users (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS exams (
  exam_id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  duration INT NOT NULL COMMENT 'Duration in minutes',
  INDEX idx_exams_title (title)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS questions (
  question_id INT AUTO_INCREMENT PRIMARY KEY,
  exam_id INT NOT NULL,
  question_text TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_answer ENUM('A', 'B', 'C', 'D') NOT NULL,
  CONSTRAINT fk_questions_exam FOREIGN KEY (exam_id) REFERENCES exams (exam_id) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_questions_exam_id (exam_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS admin_users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(64) NOT NULL UNIQUE,
  avatar_url VARCHAR(512) NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS exam_attempts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  registration_number VARCHAR(32) NOT NULL,
  exam_id INT NOT NULL,
  start_time DATETIME NOT NULL,
  end_time DATETIME NULL,
  status ENUM('InProgress', 'Submitted') NOT NULL DEFAULT 'InProgress',
  session_token CHAR(36) NOT NULL,
  question_order JSON NULL COMMENT 'Randomized question_id order for this attempt',
  score INT NULL COMMENT 'Total correct after submit',
  CONSTRAINT fk_attempts_student FOREIGN KEY (registration_number) REFERENCES students (registration_number) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_attempts_exam FOREIGN KEY (exam_id) REFERENCES exams (exam_id) ON DELETE CASCADE ON UPDATE CASCADE,
  UNIQUE KEY uniq_student_exam (registration_number, exam_id),
  INDEX idx_attempts_reg (registration_number),
  INDEX idx_attempts_exam (exam_id),
  INDEX idx_attempts_status (status)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS responses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  registration_number VARCHAR(32) NOT NULL,
  question_id INT NOT NULL,
  selected_option ENUM('A', 'B', 'C', 'D') NULL,
  CONSTRAINT fk_responses_student FOREIGN KEY (registration_number) REFERENCES students (registration_number) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_responses_question FOREIGN KEY (question_id) REFERENCES questions (question_id) ON DELETE CASCADE ON UPDATE CASCADE,
  UNIQUE KEY uniq_reg_question (registration_number, question_id),
  INDEX idx_responses_reg (registration_number),
  INDEX idx_responses_question (question_id)
) ENGINE=InnoDB;

-- Optional local seed (safe to re-run)
INSERT INTO students (registration_number, name) VALUES
  ('STO1-001A', 'Ada Lovelace'),
  ('STO1-002B', 'Alan Turing')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO exams (title, duration)
SELECT 'Sample Mathematics Quiz', 30
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM exams WHERE title = 'Sample Mathematics Quiz');

SET @seed_exam_id = (SELECT exam_id FROM exams WHERE title = 'Sample Mathematics Quiz' LIMIT 1);

INSERT INTO questions (exam_id, question_text, option_a, option_b, option_c, option_d, correct_answer)
SELECT @seed_exam_id, 'What is 2 + 2?', '3', '4', '5', '6', 'B'
FROM DUAL
WHERE NOT EXISTS (
  SELECT 1 FROM questions q WHERE q.exam_id = @seed_exam_id AND q.question_text = 'What is 2 + 2?'
);

CREATE TABLE IF NOT EXISTS chemistry_lab_runs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  owner_role ENUM('student','tutor','admin') NOT NULL,
  owner_identifier VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  experiment_key VARCHAR(64) NOT NULL,
  version INT UNSIGNED NOT NULL,
  status ENUM('in_progress','submitted') NOT NULL DEFAULT 'in_progress',
  state_json JSON NOT NULL,
  notebook_json JSON NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_chemistry_run_owner (owner_role, owner_identifier, updated_at),
  INDEX idx_chemistry_run_experiment (experiment_key, version)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO questions (exam_id, question_text, option_a, option_b, option_c, option_d, correct_answer)
SELECT @seed_exam_id, 'What is the square root of 16?', '2', '4', '8', '16', 'B'
FROM DUAL
WHERE NOT EXISTS (
  SELECT 1 FROM questions q WHERE q.exam_id = @seed_exam_id AND q.question_text LIKE '%square root of 16%'
);

INSERT INTO questions (exam_id, question_text, option_a, option_b, option_c, option_d, correct_answer)
SELECT @seed_exam_id, 'Solve: 10 - 7 = ?', '2', '3', '4', '5', 'B'
FROM DUAL
WHERE NOT EXISTS (
  SELECT 1 FROM questions q WHERE q.exam_id = @seed_exam_id AND q.question_text LIKE 'Solve: 10 - 7%'
);

-- Widen option columns on databases created before TEXT options
ALTER TABLE questions
  MODIFY COLUMN option_a TEXT NOT NULL,
  MODIFY COLUMN option_b TEXT NOT NULL,
  MODIFY COLUMN option_c TEXT NOT NULL,
  MODIFY COLUMN option_d TEXT NOT NULL;
