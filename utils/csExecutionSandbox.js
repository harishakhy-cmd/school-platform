'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn, execSync } = require('child_process');
const crypto = require('crypto');

const BASE_TEMP_DIR = path.join(__dirname, '..', 'temp_exec');
const COMPILE_TIMEOUT_MS = 15000; // 15s compile budget for native toolchains
const EXEC_TIMEOUT_MS = 10000; // 10s runtime budget for student programs
const MAX_OUTPUT_BYTES = 64 * 1024; // 64 KB stdout/stderr max buffer

// Ensure base temp directory exists
if (!fs.existsSync(BASE_TEMP_DIR)) {
  try {
    fs.mkdirSync(BASE_TEMP_DIR, { recursive: true });
  } catch (err) {
    console.error('Failed to create BASE_TEMP_DIR:', err);
  }
}

/**
 * Strips all sensitive host environment variables.
 * Never leaks DB passwords, session secrets, or server config to student processes.
 */
function getSanitizedEnv(tempDir) {
  return {
    PATH: process.env.PATH || '',
    SYSTEMROOT: process.env.SYSTEMROOT || 'C:\\Windows',
    TEMP: tempDir,
    TMP: tempDir,
    USERPROFILE: tempDir,
    HOMEDRIVE: process.env.HOMEDRIVE || 'C:',
    HOMEPATH: tempDir,
    NODE_ENV: 'sandbox',
    PYTHONUNBUFFERED: '1',
    PYTHONUTF8: '1',
    PYTHONIOENCODING: 'utf-8',
    LANG: 'en_US.UTF-8',
    LC_ALL: 'en_US.UTF-8'
  };
}

/**
 * Validates file names to prevent directory traversal outside sandbox
 */
function sanitizeFilename(filename) {
  if (!filename || typeof filename !== 'string') return 'script.txt';
  const clean = path.basename(filename).replace(/[^a-zA-Z0-9._-]/g, '_');
  return clean || 'script.txt';
}

/**
 * Kills a process and its entire sub-process tree on Windows
 */
function killProcessTree(pid) {
  if (!pid) return;
  try {
    if (process.platform === 'win32') {
      execSync(`taskkill /F /T /PID ${pid}`, { stdio: 'ignore' });
    } else {
      process.kill(-pid, 'SIGKILL');
    }
  } catch (_) {
    // Process may have already exited
  }
}

/**
 * Executes a command with timeout, output capping, and process-tree termination
 */
function runCommand(command, args, cwd, env, timeoutMs = EXEC_TIMEOUT_MS, input = '') {
  return new Promise((resolve) => {
    const startTime = performance.now();
    let stdoutBuffer = '';
    let stderrBuffer = '';
    let timedOut = false;
    let killed = false;

    let child;
    try {
      child = spawn(command, args, {
        cwd,
        env,
        windowsHide: true,
        stdio: ['pipe', 'pipe', 'pipe']
      });
    } catch (err) {
      return resolve({
        stdout: '',
        stderr: `Failed to spawn process (${command}): ${err.message}`,
        exitCode: 1,
        executionTimeMs: 0,
        timedOut: false
      });
    }

    const timer = setTimeout(() => {
      timedOut = true;
      killed = true;
      killProcessTree(child.pid);
    }, timeoutMs);

    if (child.stdin) {
      try {
        if (input) child.stdin.write(input);
        child.stdin.end();
      } catch (_) {}
    }

    child.stdout.on('data', (chunk) => {
      if (stdoutBuffer.length < MAX_OUTPUT_BYTES) {
        stdoutBuffer += chunk.toString('utf8');
        if (stdoutBuffer.length >= MAX_OUTPUT_BYTES) {
          stdoutBuffer += '\n[Output truncated: Exceeded 64KB limit]';
        }
      }
    });

    child.stderr.on('data', (chunk) => {
      if (stderrBuffer.length < MAX_OUTPUT_BYTES) {
        stderrBuffer += chunk.toString('utf8');
        if (stderrBuffer.length >= MAX_OUTPUT_BYTES) {
          stderrBuffer += '\n[Error output truncated: Exceeded 64KB limit]';
        }
      }
    });

    child.on('close', (code) => {
      clearTimeout(timer);
      const executionTimeMs = Math.round(performance.now() - startTime);

      if (timedOut) {
        stderrBuffer += `\n[Execution Terminated: Process exceeded maximum time limit of ${timeoutMs / 1000} seconds]`;
      }

      resolve({
        stdout: stdoutBuffer,
        stderr: stderrBuffer,
        exitCode: timedOut ? 124 : (code === null ? 1 : code),
        executionTimeMs,
        timedOut
      });
    });

    child.on('error', (err) => {
      clearTimeout(timer);
      resolve({
        stdout: stdoutBuffer,
        stderr: `Process error: ${err.message}`,
        exitCode: 1,
        executionTimeMs: Math.round(performance.now() - startTime),
        timedOut: false
      });
    });
  });
}

/**
 * Main Sandboxed Execution Engine
 * @param {Object} options
 * @param {string} options.language - python, javascript, c, cpp, java, sql, html
 * @param {Array} options.files - Array of { name, content }
 * @param {string} [options.stdin] - Standard input string
 * @param {string} [options.mainFile] - Entry point filename
 */
async function executeInSandbox({ language, files = [], stdin = '', mainFile = null }) {
  const runId = crypto.randomUUID();
  const tempDir = path.join(BASE_TEMP_DIR, runId);

  try {
    fs.mkdirSync(tempDir, { recursive: true });
    const cleanEnv = getSanitizedEnv(tempDir);

    // Write all project files to ephemeral scratch directory
    for (const file of files) {
      const cleanName = sanitizeFilename(file.name);
      const filePath = path.join(tempDir, cleanName);
      fs.writeFileSync(filePath, file.content || '', 'utf8');
    }

    const lang = (language || 'python').toLowerCase();

    // 1. PYTHON EXECUTION
    if (lang === 'python' || lang === 'py') {
      const entryName = mainFile ? sanitizeFilename(mainFile) : 'main.py';
      const result = await runCommand('python', [entryName], tempDir, cleanEnv, EXEC_TIMEOUT_MS, stdin);
      return {
        success: result.exitCode === 0 && !result.timedOut,
        ...result,
        language: 'python',
        runtime: 'Python 3.12.12 (Isolated Worker)'
      };
    }

    // 2. JAVASCRIPT / NODE.JS EXECUTION
    if (lang === 'javascript' || lang === 'js' || lang === 'node') {
      const entryName = mainFile ? sanitizeFilename(mainFile) : 'main.js';
      const result = await runCommand('node', [entryName], tempDir, cleanEnv, EXEC_TIMEOUT_MS, stdin);
      return {
        success: result.exitCode === 0 && !result.timedOut,
        ...result,
        language: 'javascript',
        runtime: 'Node.js v24.14.0 (Isolated Worker)'
      };
    }

    // 3. C (GCC) COMPILATION & EXECUTION
    if (lang === 'c') {
      const srcName = mainFile ? sanitizeFilename(mainFile) : 'main.c';
      const exeName = 'program.exe';

      const compileResult = await runCommand('gcc', ['-O2', srcName, '-o', exeName], tempDir, cleanEnv, COMPILE_TIMEOUT_MS);
      if (compileResult.exitCode !== 0) {
        return {
          success: false,
          stdout: '',
          stderr: `Compilation Error:\n${compileResult.stderr}`,
          exitCode: compileResult.exitCode,
          executionTimeMs: compileResult.executionTimeMs,
          timedOut: compileResult.timedOut,
          language: 'c',
          runtime: 'GCC 15.2.0 (MSYS2 x86_64)'
        };
      }

      const execResult = await runCommand(path.join(tempDir, exeName), [], tempDir, cleanEnv, EXEC_TIMEOUT_MS, stdin);
      return {
        success: execResult.exitCode === 0 && !execResult.timedOut,
        stdout: execResult.stdout,
        stderr: execResult.stderr,
        exitCode: execResult.exitCode,
        executionTimeMs: compileResult.executionTimeMs + execResult.executionTimeMs,
        timedOut: execResult.timedOut,
        language: 'c',
        runtime: 'GCC 15.2.0 (MSYS2 x86_64)'
      };
    }

    // 4. C++ (G++) COMPILATION & EXECUTION
    if (lang === 'cpp' || lang === 'c++') {
      const srcName = mainFile ? sanitizeFilename(mainFile) : 'main.cpp';
      const exeName = 'program.exe';

      const compileResult = await runCommand('g++', ['-O2', srcName, '-o', exeName], tempDir, cleanEnv, COMPILE_TIMEOUT_MS);
      if (compileResult.exitCode !== 0) {
        return {
          success: false,
          stdout: '',
          stderr: `Compilation Error:\n${compileResult.stderr}`,
          exitCode: compileResult.exitCode,
          executionTimeMs: compileResult.executionTimeMs,
          timedOut: compileResult.timedOut,
          language: 'cpp',
          runtime: 'G++ 15.2.0 (MSYS2 x86_64)'
        };
      }

      const execResult = await runCommand(path.join(tempDir, exeName), [], tempDir, cleanEnv, EXEC_TIMEOUT_MS, stdin);
      return {
        success: execResult.exitCode === 0 && !execResult.timedOut,
        stdout: execResult.stdout,
        stderr: execResult.stderr,
        exitCode: execResult.exitCode,
        executionTimeMs: compileResult.executionTimeMs + execResult.executionTimeMs,
        timedOut: execResult.timedOut,
        language: 'cpp',
        runtime: 'G++ 15.2.0 (MSYS2 x86_64)'
      };
    }

    // 5. JAVA (OPENJDK 21) COMPILATION & EXECUTION
    if (lang === 'java') {
      const srcName = mainFile ? sanitizeFilename(mainFile) : 'Main.java';
      const className = path.basename(srcName, '.java');

      const compileResult = await runCommand('javac', [srcName], tempDir, cleanEnv, COMPILE_TIMEOUT_MS);
      if (compileResult.exitCode !== 0) {
        return {
          success: false,
          stdout: '',
          stderr: `Java Compilation Error:\n${compileResult.stderr}`,
          exitCode: compileResult.exitCode,
          executionTimeMs: compileResult.executionTimeMs,
          timedOut: compileResult.timedOut,
          language: 'java',
          runtime: 'OpenJDK 21 LTS (build 21.0.12.1)'
        };
      }

      const execResult = await runCommand('java', ['-cp', tempDir, className], tempDir, cleanEnv, EXEC_TIMEOUT_MS, stdin);
      return {
        success: execResult.exitCode === 0 && !execResult.timedOut,
        stdout: execResult.stdout,
        stderr: execResult.stderr,
        exitCode: execResult.exitCode,
        executionTimeMs: compileResult.executionTimeMs + execResult.executionTimeMs,
        timedOut: execResult.timedOut,
        language: 'java',
        runtime: 'OpenJDK 21 LTS (build 21.0.12.1)'
      };
    }

    // 6. SQL RELATIONAL SIMULATOR
    if (lang === 'sql') {
      const runnerName = 'sql_runner.py';
      const runner = `import json
import re
import sqlite3
import sys

def report_sql_error(error_type, error, traceback):
    if issubclass(error_type, sqlite3.Error):
        print('SQL error: ' + str(error), file=sys.stderr)
    else:
        sys.__excepthook__(error_type, error, traceback)

sys.excepthook = report_sql_error
connection = sqlite3.connect(':memory:')
connection.executescript("""
CREATE TABLE students (
  id INTEGER PRIMARY KEY,
  registration_number TEXT NOT NULL,
  full_name TEXT NOT NULL,
  department TEXT NOT NULL,
  status TEXT NOT NULL
);
CREATE TABLE courses (
  course_id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  credit_units INTEGER NOT NULL
);
CREATE TABLE enrollments (
  student_id INTEGER NOT NULL REFERENCES students(id),
  course_id INTEGER NOT NULL REFERENCES courses(course_id),
  grade TEXT NOT NULL
);
INSERT INTO students VALUES
  (1, '2026/ICT/001', 'Alice Johnson', 'Computer Science', 'Active'),
  (2, '2026/ICT/002', 'Brian Okello', 'Software Engineering', 'Active'),
  (3, '2026/ICT/003', 'Catherine Nambi', 'Information Systems', 'Active'),
  (4, '2026/ICT/004', 'David Kasule', 'Cybersecurity', 'Active'),
  (5, '2026/ICT/005', 'Emma Sserwadda', 'Data Science', 'Probation');
INSERT INTO courses VALUES
  (1, 'Data Structures', 4),
  (2, 'Operating Systems', 4),
  (3, 'Web Development', 3);
INSERT INTO enrollments VALUES
  (1, 1, 'A'), (1, 2, 'B+'), (2, 1, 'A-'),
  (3, 3, 'B'), (4, 2, 'A'), (5, 3, 'B+');
""")

denied = {
    sqlite3.SQLITE_ATTACH,
    sqlite3.SQLITE_DETACH,
    sqlite3.SQLITE_PRAGMA
}
def authorize(action, first, second, database, trigger):
    if action in denied:
        return sqlite3.SQLITE_DENY
    if action == sqlite3.SQLITE_FUNCTION and (second or first or '').lower() in {
        'load_extension', 'readfile', 'writefile'
    }:
        return sqlite3.SQLITE_DENY
    return sqlite3.SQLITE_OK

connection.set_authorizer(authorize)
def execute_statement(statement):
    if re.match(r'\\s*(ATTACH|DETACH|PRAGMA|VACUUM)\\b', statement, re.IGNORECASE):
        raise ValueError('This educational database does not permit external database or file operations.')
    return connection.execute(statement)

query = sys.stdin.read()
if len(query) > 20000:
    raise ValueError('SQL input exceeds the 20,000 character limit.')

buffer = ''
last_columns = []
last_rows = []
last_message = 'Statement completed. No result set was returned.'
for character in query:
    buffer += character
    if character == ';' and sqlite3.complete_statement(buffer):
        statement = buffer.strip()
        buffer = ''
        if statement:
            cursor = execute_statement(statement)
            if cursor.description:
                last_columns = [column[0] for column in cursor.description]
                last_rows = cursor.fetchmany(500)
                last_message = 'Query completed.'
            else:
                last_columns, last_rows = [], []
                last_message = 'Statement completed. Rows affected: ' + str(cursor.rowcount)

if buffer.strip():
    statement = buffer.strip()
    if not sqlite3.complete_statement(statement + ';'):
        raise ValueError('Incomplete SQL statement. Check parentheses and quotes.')
    cursor = execute_statement(statement)
    if cursor.description:
        last_columns = [column[0] for column in cursor.description]
        last_rows = cursor.fetchmany(500)
        last_message = 'Query completed.'
    else:
        last_columns, last_rows = [], []
        last_message = 'Statement completed. Rows affected: ' + str(cursor.rowcount)

print(json.dumps({
    'columns': last_columns,
    'rows': last_rows,
    'rowCount': len(last_rows),
    'message': last_message
}))
`;
      fs.writeFileSync(path.join(tempDir, runnerName), runner, 'utf8');
      const result = await runCommand('python', [runnerName], tempDir, cleanEnv, EXEC_TIMEOUT_MS, files.find((file) => file.name && file.name.toLowerCase().endsWith('.sql'))?.content || '');
      return {
        success: result.exitCode === 0 && !result.timedOut,
        ...result,
        language: 'sql',
        runtime: 'SQLite in-memory educational database'
      };
    }

    // 7. WEB (HTML/CSS)
    if (lang === 'html' || lang === 'css') {
      return {
        success: true,
        stdout: 'Web assets compiled for Sandboxed Iframe Browser Viewport.',
        stderr: '',
        exitCode: 0,
        executionTimeMs: 2,
        timedOut: false,
        language: 'html',
        runtime: 'Live Browser Viewport'
      };
    }

    return {
      success: false,
      stdout: '',
      stderr: `Language "${language}" is not directly supported by the server runner. Use Client Wasm mode.`,
      exitCode: 1,
      executionTimeMs: 0,
      timedOut: false,
      language
    };
  } finally {
    // Ephemeral scratch cleanup: guarantee deletion of student temporary directory
    try {
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    } catch (cleanupErr) {
      console.warn(`[Sandbox Cleanup Warning] Could not remove tempDir ${tempDir}:`, cleanupErr.message);
    }
  }
}

module.exports = {
  executeInSandbox,
  sanitizeFilename,
  EXEC_TIMEOUT_MS,
  COMPILE_TIMEOUT_MS
};
