'use strict';

/**
 * Migration Script: Interactive Graphing & Data Visualization Lab
 * 
 * Expands the database to support:
 * 1. saved_graphs (Personal & Classroom Teaching Graph repository)
 * 2. graph_templates (Cross-subject predefined scientific and mathematical templates)
 * 3. CBT & Quiz question graph extensions (question_type = 'GRAPH_INTERACTIVE')
 * 4. Assignment graph attachments and submissions
 */

const mysql = require('mysql2/promise');

async function migrate() {
  const host = process.env.DB_HOST || '127.0.0.1';
  const port = parseInt(process.env.DB_PORT || '3306', 10);
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD === undefined ? '' : String(process.env.DB_PASSWORD);
  const database = process.env.DB_NAME || 'cbt_db';

  console.log('Connecting to MySQL for Graphing Lab migration...');

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
    console.log('Beginning Graphing Lab schema migration...\n');

    // 1. Create saved_graphs table
    console.log('1. Creating saved_graphs table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS saved_graphs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT NULL,
        classroom_id INT NULL,
        subject_id INT NULL,
        subject_code VARCHAR(64) NULL,
        topic VARCHAR(255) NULL,
        graph_type VARCHAR(64) NOT NULL DEFAULT 'cartesian_function',
        config JSON NOT NULL,
        data_points JSON NULL,
        functions JSON NULL,
        analysis_tools JSON NULL,
        is_template BOOLEAN DEFAULT FALSE,
        created_by_role ENUM('student', 'tutor', 'admin') NOT NULL,
        created_by_id VARCHAR(64) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_saved_graph_class FOREIGN KEY (classroom_id) REFERENCES classrooms (id) ON DELETE SET NULL ON UPDATE CASCADE,
        CONSTRAINT fk_saved_graph_subj FOREIGN KEY (subject_id) REFERENCES subjects (id) ON DELETE SET NULL ON UPDATE CASCADE,
        INDEX idx_graph_user (created_by_role, created_by_id),
        INDEX idx_graph_subject (subject_code),
        INDEX idx_graph_classroom (classroom_id),
        INDEX idx_graph_template (is_template)
      ) ENGINE=InnoDB;
    `);
    console.log('  ✓ Table ready: saved_graphs');

    // 2. Extend assignments table for graph-based assignments
    console.log('2. Enhancing assignments and submissions for Graphing Lab...');
    const assignCols = [
      { name: 'graph_config', sql: 'ALTER TABLE assignments ADD COLUMN graph_config JSON NULL AFTER attachment_path' },
      { name: 'requires_graph', sql: 'ALTER TABLE assignments ADD COLUMN requires_graph BOOLEAN DEFAULT FALSE AFTER graph_config' }
    ];
    for (const col of assignCols) {
      const [exists] = await connection.execute(`
        SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'assignments' AND COLUMN_NAME = ?
      `, [database, col.name]);
      if (exists.length === 0) {
        await connection.execute(col.sql);
        console.log(`  ✓ Added column to assignments: ${col.name}`);
      }
    }

    // Extend assignment_submissions with graph_submission
    const [subGraphCol] = await connection.execute(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'assignment_submissions' AND COLUMN_NAME = 'graph_submission'
    `, [database]);
    if (subGraphCol.length === 0) {
      await connection.execute(`
        ALTER TABLE assignment_submissions ADD COLUMN graph_submission JSON NULL AFTER submission_text
      `);
      console.log('  ✓ Added column to assignment_submissions: graph_submission');
    }

    // 3. Extend quiz_questions and quiz_responses
    console.log('3. Enhancing quiz_questions & quiz_responses for Graphing Lab...');
    const quizQCols = [
      { name: 'question_type', sql: 'ALTER TABLE quiz_questions ADD COLUMN question_type VARCHAR(32) DEFAULT "MCQ" AFTER question_text' },
      { name: 'graph_config', sql: 'ALTER TABLE quiz_questions ADD COLUMN graph_config JSON NULL AFTER explanation' },
      { name: 'graph_target', sql: 'ALTER TABLE quiz_questions ADD COLUMN graph_target JSON NULL AFTER graph_config' }
    ];
    for (const col of quizQCols) {
      const [exists] = await connection.execute(`
        SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'quiz_questions' AND COLUMN_NAME = ?
      `, [database, col.name]);
      if (exists.length === 0) {
        await connection.execute(col.sql);
        console.log(`  ✓ Added column to quiz_questions: ${col.name}`);
      }
    }

    const [quizRespGraph] = await connection.execute(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'quiz_responses' AND COLUMN_NAME = 'graph_answer'
    `, [database]);
    if (quizRespGraph.length === 0) {
      await connection.execute(`
        ALTER TABLE quiz_responses ADD COLUMN graph_answer JSON NULL AFTER selected_option
      `);
      console.log('  ✓ Added column to quiz_responses: graph_answer');
    }

    // 4. Extend CBT questions and responses
    console.log('4. Enhancing CBT questions & responses for GRAPH_INTERACTIVE question types...');
    const cbtQCols = [
      { name: 'question_type', sql: 'ALTER TABLE questions ADD COLUMN question_type VARCHAR(32) DEFAULT "MCQ" AFTER question_text' },
      { name: 'graph_config', sql: 'ALTER TABLE questions ADD COLUMN graph_config JSON NULL AFTER correct_answer' },
      { name: 'graph_target', sql: 'ALTER TABLE questions ADD COLUMN graph_target JSON NULL AFTER graph_config' }
    ];
    for (const col of cbtQCols) {
      const [exists] = await connection.execute(`
        SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'questions' AND COLUMN_NAME = ?
      `, [database, col.name]);
      if (exists.length === 0) {
        await connection.execute(col.sql);
        console.log(`  ✓ Added column to questions: ${col.name}`);
      }
    }

    const [cbtRespGraph] = await connection.execute(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'responses' AND COLUMN_NAME = 'graph_answer'
    `, [database]);
    if (cbtRespGraph.length === 0) {
      await connection.execute(`
        ALTER TABLE responses ADD COLUMN graph_answer JSON NULL AFTER selected_option
      `);
      console.log('  ✓ Added column to responses: graph_answer');
    }

    // 5. Seed Cross-Subject Graph Templates
    console.log('5. Seeding initial cross-subject graph templates...');
    const [existingTemplates] = await connection.execute('SELECT COUNT(*) as count FROM saved_graphs WHERE is_template = TRUE');
    if (existingTemplates[0].count === 0) {
      const defaultTemplates = [
        // MATHEMATICS
        {
          title: 'Quadratic Parabola Explorer: y = ax² + bx + c',
          description: 'Investigate how leading coefficient a, linear term b, and vertical intercept c alter vertex, roots, and symmetry.',
          subject_code: 'MATHEMATICS',
          topic: 'Quadratic Functions & Curves',
          graph_type: 'cartesian_function',
          config: JSON.stringify({
            xLabel: 'x',
            yLabel: 'y = f(x)',
            xMin: -10,
            xMax: 10,
            yMin: -15,
            yMax: 25,
            grid: true,
            theme: 'default',
            parameters: { a: 1, b: -2, c: -3 }
          }),
          functions: JSON.stringify([
            { id: 'f1', expr: 'a * x^2 + b * x + c', label: 'f(x) = ax² + bx + c', color: '#2563EB', visible: true, width: 2.5 }
          ]),
          data_points: JSON.stringify([]),
          analysis_tools: JSON.stringify(['roots', 'vertex', 'tangent', 'integral', 'table']),
          is_template: true,
          created_by_role: 'admin',
          created_by_id: 'SYSTEM'
        },
        {
          title: 'Trigonometric Sine Wave & Harmonic Motion',
          description: 'Analyze amplitude, frequency, period, and phase shift in y = A*sin(B*x + C) + D.',
          subject_code: 'MATHEMATICS',
          topic: 'Trigonometry & Waves',
          graph_type: 'cartesian_function',
          config: JSON.stringify({
            xLabel: 'Angle x (rad)',
            yLabel: 'Displacement y',
            xMin: -7,
            xMax: 7,
            yMin: -4,
            yMax: 4,
            grid: true,
            theme: 'default',
            trigMode: 'radians',
            parameters: { A: 2, B: 1, C: 0, D: 0 }
          }),
          functions: JSON.stringify([
            { id: 'f1', expr: 'A * sin(B * x + C) + D', label: 'y = A·sin(Bx + C) + D', color: '#7C3AED', visible: true, width: 2.5 }
          ]),
          data_points: JSON.stringify([]),
          analysis_tools: JSON.stringify(['extrema', 'roots', 'tangent', 'periodicity', 'table']),
          is_template: true,
          created_by_role: 'admin',
          created_by_id: 'SYSTEM'
        },
        // PHYSICS
        {
          title: 'Physics: Distance-Time & Velocity-Time Motion',
          description: 'Experimental laboratory data for a moving cart with constant acceleration.',
          subject_code: 'PHYSICS',
          topic: 'Kinematics & Motion',
          graph_type: 'scientific_data',
          config: JSON.stringify({
            xLabel: 'Time',
            xUnit: 's',
            yLabel: 'Distance',
            yUnit: 'm',
            xMin: 0,
            xMax: 10,
            yMin: 0,
            yMax: 50,
            grid: true,
            trendline: 'quadratic',
            showBestFit: true
          }),
          functions: JSON.stringify([
            { id: 'theory', expr: '0.5 * 0.98 * x^2', label: 'Theoretical s = ½at²', color: '#DC2626', visible: true, width: 2 }
          ]),
          data_points: JSON.stringify([
            { label: 'Trial 1', color: '#2563EB', points: [{x:0, y:0}, {x:1, y:0.5}, {x:2, y:2.1}, {x:3, y:4.4}, {x:4, y:7.9}, {x:5, y:12.3}, {x:6, y:17.8}, {x:7, y:24.2}, {x:8, y:31.5}] }
          ]),
          analysis_tools: JSON.stringify(['slope', 'best_fit', 'tangent', 'distance', 'stats']),
          is_template: true,
          created_by_role: 'admin',
          created_by_id: 'SYSTEM'
        },
        {
          title: 'Physics: Ohm\'s Law Current vs Voltage (I-V Curve)',
          description: 'Experimental V-I graph determining resistance from gradient (R = V/I).',
          subject_code: 'PHYSICS',
          topic: 'Current Electricity',
          graph_type: 'scientific_data',
          config: JSON.stringify({
            xLabel: 'Voltage (V)',
            xUnit: 'V',
            yLabel: 'Current (I)',
            yUnit: 'A',
            xMin: 0,
            xMax: 12,
            yMin: 0,
            yMax: 2.5,
            grid: true,
            trendline: 'linear',
            showBestFit: true
          }),
          functions: JSON.stringify([]),
          data_points: JSON.stringify([
            { label: 'Resistor 5Ω', color: '#059669', points: [{x:0, y:0}, {x:2, y:0.41}, {x:4, y:0.79}, {x:6, y:1.22}, {x:8, y:1.58}, {x:10, y:2.02}] }
          ]),
          analysis_tools: JSON.stringify(['slope', 'best_fit', 'stats']),
          is_template: true,
          created_by_role: 'admin',
          created_by_id: 'SYSTEM'
        },
        // CHEMISTRY
        {
          title: 'Chemistry: Acid-Base Titration Curve (pH vs Titrant Volume)',
          description: 'Strong Acid (HCl) titrated with Strong Base (NaOH) showing equivalence point at pH 7.0.',
          subject_code: 'CHEMISTRY',
          topic: 'Acids, Bases & Titration',
          graph_type: 'scientific_data',
          config: JSON.stringify({
            xLabel: 'Volume of 0.1M NaOH added',
            xUnit: 'mL',
            yLabel: 'pH',
            yUnit: 'pH units',
            xMin: 0,
            xMax: 50,
            yMin: 0,
            yMax: 14,
            grid: true,
            theme: 'default'
          }),
          functions: JSON.stringify([]),
          data_points: JSON.stringify([
            { label: 'Titration Data', color: '#D97706', points: [
              {x:0, y:1.0}, {x:5, y:1.2}, {x:10, y:1.4}, {x:15, y:1.6}, {x:20, y:1.9}, 
              {x:22, y:2.3}, {x:24, y:2.9}, {x:25, y:7.0}, {x:26, y:11.1}, {x:28, y:11.7}, 
              {x:30, y:12.1}, {x:40, y:12.6}, {x:50, y:12.8}
            ]}
          ]),
          analysis_tools: JSON.stringify(['equivalence_point', 'tangent', 'stats']),
          is_template: true,
          created_by_role: 'admin',
          created_by_id: 'SYSTEM'
        },
        // BIOLOGY
        {
          title: 'Biology: Enzyme Catalytic Rate vs Temperature',
          description: 'Enzyme activity showing exponential increase, optimum temperature at 37°C, and thermal denaturation.',
          subject_code: 'BIOLOGY',
          topic: 'Enzymes & Biochemistry',
          graph_type: 'scientific_data',
          config: JSON.stringify({
            xLabel: 'Temperature',
            xUnit: '°C',
            yLabel: 'Reaction Rate (Vmax)',
            yUnit: 'μmol/min',
            xMin: 0,
            xMax: 70,
            yMin: 0,
            yMax: 100,
            grid: true
          }),
          functions: JSON.stringify([]),
          data_points: JSON.stringify([
            { label: 'Catalase Enzyme Activity', color: '#DC2626', points: [
              {x:10, y:15}, {x:20, y:32}, {x:30, y:65}, {x:37, y:96}, {x:40, y:92}, {x:45, y:55}, {x:50, y:18}, {x:60, y:0}
            ]}
          ]),
          analysis_tools: JSON.stringify(['optimum_point', 'stats', 'interpolation']),
          is_template: true,
          created_by_role: 'admin',
          created_by_id: 'SYSTEM'
        },
        // ECONOMICS
        {
          title: 'Economics: Supply and Demand Market Equilibrium',
          description: 'Market Demand D(P) and Supply S(P) curves intersecting at equilibrium price and quantity.',
          subject_code: 'ECONOMICS',
          topic: 'Microeconomics: Price Determination',
          graph_type: 'cartesian_function',
          config: JSON.stringify({
            xLabel: 'Quantity (Q)',
            yLabel: 'Price (P) in $',
            xMin: 0,
            xMax: 100,
            yMin: 0,
            yMax: 100,
            grid: true,
            parameters: { a: 90, b: 0.8, c: 10, d: 0.8 }
          }),
          functions: JSON.stringify([
            { id: 'demand', expr: '90 - 0.8 * x', label: 'Demand Curve D: P = 90 - 0.8Q', color: '#2563EB', visible: true, width: 2.5 },
            { id: 'supply', expr: '10 + 0.8 * x', label: 'Supply Curve S: P = 10 + 0.8Q', color: '#059669', visible: true, width: 2.5 }
          ]),
          data_points: JSON.stringify([]),
          analysis_tools: JSON.stringify(['intersections', 'consumer_surplus', 'table']),
          is_template: true,
          created_by_role: 'admin',
          created_by_id: 'SYSTEM'
        },
        // GEOGRAPHY
        {
          title: 'Geography: Climograph (Monthly Rainfall & Temperature)',
          description: 'Combined precipitation bar chart and temperature line curve for tropical savanna climate.',
          subject_code: 'GEOGRAPHY',
          topic: 'Climatology & Weather',
          graph_type: 'bar_line_combo',
          config: JSON.stringify({
            xLabel: 'Month',
            categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            yLabel: 'Rainfall (mm)',
            y2Label: 'Temperature (°C)',
            grid: true
          }),
          functions: JSON.stringify([]),
          data_points: JSON.stringify([
            { label: 'Rainfall (mm)', type: 'bar', color: '#3B82F6', values: [15, 22, 65, 110, 160, 210, 260, 290, 220, 130, 45, 18] },
            { label: 'Temperature (°C)', type: 'line', color: '#EF4444', values: [26, 27, 29, 31, 30, 28, 26, 25, 26, 28, 27, 26] }
          ]),
          analysis_tools: JSON.stringify(['stats', 'annual_total', 'mean']),
          is_template: true,
          created_by_role: 'admin',
          created_by_id: 'SYSTEM'
        },
        // STATISTICS
        {
          title: 'Statistics: Exam Score Distribution & Histogram',
          description: 'Frequency histogram and cumulative frequency ogive with median and quartiles.',
          subject_code: 'STATISTICS',
          topic: 'Descriptive Statistics & Ogives',
          graph_type: 'histogram',
          config: JSON.stringify({
            xLabel: 'Score Range (Bins)',
            categories: ['0-20', '21-40', '41-60', '61-80', '81-100'],
            yLabel: 'Student Frequency',
            grid: true
          }),
          functions: JSON.stringify([]),
          data_points: JSON.stringify([
            { label: 'Score Frequencies', color: '#8B5CF6', values: [4, 12, 38, 29, 17] }
          ]),
          analysis_tools: JSON.stringify(['mean', 'median', 'mode', 'std_dev', 'quartiles']),
          is_template: true,
          created_by_role: 'admin',
          created_by_id: 'SYSTEM'
        },
        // AGRICULTURE
        {
          title: 'Agriculture: Crop Yield vs Nitrogen Fertilizer Dosage',
          description: 'Response curve demonstrating the law of diminishing returns in maize cultivation.',
          subject_code: 'AGRICULTURE',
          topic: 'Agronomy & Soil Science',
          graph_type: 'scientific_data',
          config: JSON.stringify({
            xLabel: 'Nitrogen Fertilizer (kg/ha)',
            xUnit: 'kg/ha',
            yLabel: 'Maize Grain Yield',
            yUnit: 'tonnes/ha',
            xMin: 0,
            xMax: 250,
            yMin: 0,
            yMax: 10,
            grid: true,
            trendline: 'quadratic',
            showBestFit: true
          }),
          functions: JSON.stringify([]),
          data_points: JSON.stringify([
            { label: 'Field Trial #4', color: '#16A34A', points: [
              {x:0, y:2.1}, {x:40, y:4.2}, {x:80, y:6.1}, {x:120, y:7.6}, {x:160, y:8.4}, {x:200, y:8.5}, {x:240, y:7.9}
            ]}
          ]),
          analysis_tools: JSON.stringify(['optimum_dosage', 'best_fit', 'stats']),
          is_template: true,
          created_by_role: 'admin',
          created_by_id: 'SYSTEM'
        }
      ];

      for (const tpl of defaultTemplates) {
        await connection.execute(`
          INSERT INTO saved_graphs 
          (title, description, subject_code, topic, graph_type, config, functions, data_points, analysis_tools, is_template, created_by_role, created_by_id)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          tpl.title,
          tpl.description,
          tpl.subject_code,
          tpl.topic,
          tpl.graph_type,
          tpl.config,
          tpl.functions,
          tpl.data_points,
          tpl.analysis_tools,
          tpl.is_template,
          tpl.created_by_role,
          tpl.created_by_id
        ]);
      }
      console.log(`  ✓ Seeded ${defaultTemplates.length} cross-subject academic graph templates!`);
    }

    console.log('\n==================================================');
    console.log('✓ GRAPHING LAB DATABASE MIGRATION COMPLETED!');
    console.log('==================================================');

  } catch (error) {
    console.error('Graphing Lab migration error:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

migrate();
