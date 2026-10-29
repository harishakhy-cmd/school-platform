'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { executeInSandbox } = require('../utils/csExecutionSandbox');

test('SQL runner executes filters and joins against the seeded in-memory database', async () => {
  const result = await executeInSandbox({
    language: 'sql',
    files: [{
      name: 'query.sql',
      content: `SELECT s.full_name, c.title AS course, e.grade
FROM students AS s
JOIN enrollments AS e ON e.student_id = s.id
JOIN courses AS c ON c.course_id = e.course_id
WHERE s.status = 'Active'
ORDER BY s.full_name
LIMIT 2;`
    }]
  });

  assert.equal(result.success, true, result.stderr);
  const output = JSON.parse(result.stdout);
  assert.deepEqual(output.columns, ['full_name', 'course', 'grade']);
  assert.deepEqual(output.rows, [
    ['Alice Johnson', 'Data Structures', 'A'],
    ['Alice Johnson', 'Operating Systems', 'B+']
  ]);
});

test('SQL runner supports isolated DDL and DML without carrying state between runs', async () => {
  const firstRun = await executeInSandbox({
    language: 'sql',
    files: [{
      name: 'query.sql',
      content: 'CREATE TABLE scratch (value INTEGER); INSERT INTO scratch VALUES (4), (6); SELECT SUM(value) AS total FROM scratch;'
    }]
  });
  assert.equal(firstRun.success, true, firstRun.stderr);
  assert.deepEqual(JSON.parse(firstRun.stdout).rows, [[10]]);

  const secondRun = await executeInSandbox({
    language: 'sql',
    files: [{ name: 'query.sql', content: 'SELECT * FROM scratch;' }]
  });
  assert.equal(secondRun.success, false);
  assert.match(secondRun.stderr, /no such table/i);
});

test('SQL runner blocks filesystem attachment and parses SQL errors as failures', async () => {
  const blocked = await executeInSandbox({
    language: 'sql',
    files: [{ name: 'query.sql', content: "ATTACH DATABASE 'outside.db' AS external;" }]
  });
  assert.equal(blocked.success, false);
  assert.match(blocked.stderr, /does not permit external database or file operations/i);

  const invalid = await executeInSandbox({
    language: 'sql',
    files: [{ name: 'query.sql', content: 'SELECT missing_column FROM students;' }]
  });
  assert.equal(invalid.success, false);
  assert.match(invalid.stderr, /no such column/i);
});
