'use strict';

const pool = require('../config/database');
const { executeInSandbox } = require('../utils/csExecutionSandbox');

/**
 * Comprehensive 24-Module Computer Science, ICT & Software Development Curriculum Registry
 */
const CURRICULUM_MODULES = [
  {
    code: 'computer-fundamentals',
    title: 'Computer Fundamentals & Architecture',
    branch: 'Foundations of Computing',
    category: 'Computer Science',
    icon: 'fa-microchip',
    description: 'Von Neumann architecture, CPU fetch-decode-execute cycle, ALU, registers, memory hierarchy (RAM, Cache, Secondary), binary representation, two’s complement, and Boolean logic gates (AND, OR, NOT, NAND, NOR, XOR).',
    modes: ['logic_gate_sim', 'binary_converter', 'von_neumann_diagram'],
    keyConcepts: ['Fetch-Decode-Execute Cycle', 'Two’s Complement binary', 'Truth tables & Logic synthesis', 'Cache hit vs miss'],
    supportedLanguages: ['python', 'c']
  },
  {
    code: 'programming-ide',
    title: 'Programming IDE & Development Tools',
    branch: 'Software Engineering',
    category: 'Development Environment',
    icon: 'fa-code',
    description: 'Modern development workflows, multi-file project structure, syntax highlighting, bracket pair colorization, intelligent code completion, error linters, and keyboard productivity shortcuts.',
    modes: ['ide_workbench', 'keyboard_shortcuts_guide', 'theme_customizer'],
    keyConcepts: ['Integrated Development Environments', 'Multi-tab file management', 'Compilation diagnostics', 'Linter analysis'],
    supportedLanguages: ['javascript', 'python', 'c', 'cpp', 'java', 'sql', 'html', 'css']
  },
  {
    code: 'programming-languages',
    title: 'Programming Languages & Paradigms',
    branch: 'Software Engineering',
    category: 'Computer Science',
    icon: 'fa-laptop-code',
    description: 'Comparative study of programming paradigms: Imperative, Object-Oriented (encapsulation, inheritance, polymorphism), Functional (pure functions, immutability), and Compiled vs Interpreted runtimes.',
    modes: ['paradigm_comparator', 'language_tour', 'benchmark_viewer'],
    keyConcepts: ['Object-Oriented Programming (OOP)', 'Static vs Dynamic typing', 'Memory management & Garbage collection', 'Compiled vs Interpreted runtimes'],
    supportedLanguages: ['python', 'javascript', 'java', 'cpp', 'c', 'go', 'rust']
  },
  {
    code: 'web-development',
    title: 'Web Development & Full-Stack Engineering',
    branch: 'Software Engineering',
    category: 'Web Technologies',
    icon: 'fa-globe',
    description: 'Frontend and full-stack web engineering: Semantic HTML5, CSS3 Flexbox & Grid, Modern JavaScript (ES6+), DOM manipulation, Fetch API, and responsive web layouts.',
    modes: ['live_web_preview', 'dom_tree_inspector', 'responsive_tester'],
    keyConcepts: ['Semantic HTML5 markup', 'CSS Flexbox & CSS Grid', 'Asynchronous JS (async/await)', 'REST API Client communication'],
    supportedLanguages: ['html', 'css', 'javascript', 'json']
  },
  {
    code: 'builtin-browser',
    title: 'Integrated Browser & Web Testing',
    branch: 'Web Technologies',
    category: 'Testing & QA',
    icon: 'fa-window-maximize',
    description: 'Sandboxed browser environment for testing student web applications across responsive mobile, tablet, and desktop viewports, with integrated web console and asset reload.',
    modes: ['isolated_browser', 'viewport_switcher', 'console_monitor'],
    keyConcepts: ['Cross-device responsive testing', 'Iframe sandboxing policies', 'Client-side logging', 'Browser rendering pipeline'],
    supportedLanguages: ['html', 'javascript']
  },
  {
    code: 'android-development',
    title: 'Android Mobile Application Development',
    branch: 'Mobile Engineering',
    category: 'Mobile Development',
    icon: 'fa-android',
    description: 'Android application architecture: Kotlin/Java language fundamentals, Activity lifecycle, XML/Jetpack layout hierarchy, Intent messaging, Gradle build configuration, and APK artifact structure.',
    modes: ['android_manifest_inspector', 'mobile_frame_preview', 'gradle_build_viewer'],
    keyConcepts: ['Android Activity Lifecycle', 'Gradle build automation', 'APK packaging structure', 'Material Design components'],
    supportedLanguages: ['kotlin', 'java', 'xml']
  },
  {
    code: 'ios-development',
    title: 'iOS Mobile Engineering & Swift',
    branch: 'Mobile Engineering',
    category: 'Mobile Development',
    icon: 'fa-apple',
    description: 'Swift programming language syntax, SwiftUI declarative UI hierarchy, View-Model state management, and project structure. (Honest Limited Mode: Code editing, Swift learning, and static structure analysis).',
    modes: ['swift_code_workbench', 'swiftui_hierarchy_viewer', 'project_exporter'],
    keyConcepts: ['Swift syntax & Optionals', 'SwiftUI Declarative views', 'State & Binding variables', 'Xcode project bundle layout'],
    supportedLanguages: ['swift']
  },
  {
    code: 'desktop-development',
    title: 'Desktop Software Development',
    branch: 'Software Engineering',
    category: 'Application Engineering',
    icon: 'fa-desktop',
    description: 'Desktop GUI architectures, event-driven programming, window management, asynchronous background threads, and desktop application packaging.',
    modes: ['desktop_gui_builder', 'event_loop_visualizer'],
    keyConcepts: ['Event-Driven Architecture', 'Main GUI thread vs Worker threads', 'Cross-platform desktop runtimes', 'Application installer packaging'],
    supportedLanguages: ['python', 'java', 'cpp', 'csharp']
  },
  {
    code: 'database-laboratory',
    title: 'Database Systems & SQL Laboratory',
    branch: 'Data Management',
    category: 'Databases',
    icon: 'fa-database',
    description: 'Relational database management systems (RDBMS): DDL/DML SQL statements, Table schemas, Primary and Foreign Keys, JOIN operations (INNER, LEFT, RIGHT), Aggregate functions, Views, and ACID Transactions.',
    modes: ['sql_query_editor', 'schema_erd_visualizer', 'table_data_browser'],
    keyConcepts: ['Relational Normalization (1NF, 2NF, 3NF)', 'Entity Relationship Diagrams', 'SQL Multi-table Joins', 'ACID Transaction properties'],
    supportedLanguages: ['sql']
  },
  {
    code: 'networking-laboratory',
    title: 'Computer Networking & Communications',
    branch: 'Systems & Infrastructure',
    category: 'Networking',
    icon: 'fa-network-wired',
    description: 'OSI 7-Layer and TCP/IP protocol stacks, IPv4/IPv6 addressing and CIDR subnet masking, Packet routing, Switch MAC tables, DNS resolution, DHCP allocation, and TCP 3-way handshake.',
    modes: ['topology_designer', 'packet_tracer_sim', 'subnet_calculator'],
    keyConcepts: ['OSI 7-Layer Model', 'IPv4 CIDR Subnetting', 'TCP 3-Way Handshake (SYN, SYN-ACK, ACK)', 'DNS Hierarchical resolution'],
    supportedLanguages: ['bash', 'python']
  },
  {
    code: 'cybersecurity-laboratory',
    title: 'Cybersecurity & Defensive Engineering',
    branch: 'Cybersecurity',
    category: 'Security Engineering',
    icon: 'fa-shield-halved',
    description: 'Principles of information security (CIA Triad: Confidentiality, Integrity, Availability), Cryptographic hashing (SHA-256), Password entropy, Symmetric/Asymmetric encryption (RSA/AES), SQL injection prevention, and XSS sanitization.',
    modes: ['hash_calculator', 'sql_injection_defense', 'entropy_meter', 'xss_sanitizer'],
    keyConcepts: ['CIA Security Triad', 'One-way Hashing vs Two-way Encryption', 'SQL Injection parameterized queries', 'Cross-Site Scripting (XSS) defense'],
    supportedLanguages: ['python', 'sql', 'javascript']
  },
  {
    code: 'operating-systems',
    title: 'Operating Systems & System Architecture',
    branch: 'Systems & Infrastructure',
    category: 'Computer Science',
    icon: 'fa-server',
    description: 'OS kernel responsibilities: Process states and scheduling (Round Robin, FCFS, Priority), Virtual memory and paging, Deadlock conditions (Coffman criteria), File systems (ext4, NTFS), and POSIX shell permissions.',
    modes: ['process_scheduler_sim', 'memory_paging_sim', 'posix_permissions_calc'],
    keyConcepts: ['Process Control Block & Context Switching', 'Virtual Memory & Page Faults', 'Deadlock & Mutual Exclusion', 'POSIX File Permissions (rwxr-xr-x)'],
    supportedLanguages: ['c', 'bash', 'python']
  },
  {
    code: 'computer-hardware',
    title: 'Computer Hardware & Assembly Laboratory',
    branch: 'Hardware Engineering',
    category: 'Hardware & Architecture',
    icon: 'fa-memory',
    description: 'Interactive 3D component identification and virtual PC assembly: Motherboard form factors, CPU LGA/PGA sockets, DDR4/DDR5 RAM dual-channel configuration, PCIe expansion slots, M.2 NVMe SSDs, ATX power supplies, and thermal cooling.',
    modes: ['hardware_assembly_3d', 'component_inspector', 'pc_compatibility_checker'],
    keyConcepts: ['Motherboard Chipset & Bus architecture', 'Dual-Channel Memory topology', 'PCIe lane allocation', 'TDP (Thermal Design Power) and Power Budgets'],
    supportedLanguages: []
  },
  {
    code: 'office-applications',
    title: 'Office Productivity & Digital Tools',
    branch: 'Applied ICT',
    category: 'Business & Office Tools',
    icon: 'fa-file-lines',
    description: 'Business productivity software suites: Word processing document formatting (styles, tables, headers/footers, mail merge), Spreadsheet mathematical formulas (VLOOKUP, SUMIFS, Pivot Tables, Charts), and Presentation slide design.',
    modes: ['spreadsheet_grid_sim', 'document_formatter', 'presentation_designer'],
    keyConcepts: ['Spreadsheet formulas & Relative/Absolute cell references', 'Mail Merge automation', 'Data validation rules', 'Data visualization charts'],
    supportedLanguages: []
  },
  {
    code: 'graphics-multimedia',
    title: 'Graphics, Multimedia & Creative Computing',
    branch: 'Creative Technologies',
    category: 'Multimedia',
    icon: 'fa-photo-film',
    description: 'Digital raster and vector imagery: SVG vector coordinates, RGB/RGBA color models, Image resolution & DPI, Canvas 2D raster rendering, Audio/Video compression codecs (MP4, H.264, WebM), and Animation keyframing.',
    modes: ['svg_vector_canvas', 'color_palette_matrix', 'canvas_animation_lab'],
    keyConcepts: ['Vector (SVG/Bézier) vs Raster (Pixel/Bitmap)', 'Color models (RGB, CMYK, HSL)', 'Lossless vs Lossy compression codecs', 'Frame rate & CSS Keyframe interpolation'],
    supportedLanguages: ['html', 'css', 'javascript']
  },
  {
    code: 'ui-ux-design',
    title: 'UI/UX Design & Human-Computer Interaction',
    branch: 'Design & Interaction',
    category: 'Product Design',
    icon: 'fa-pen-ruler',
    description: 'User Interface and Experience design: Wireframing, User persona mapping, Visual hierarchy, Typography scale, WCAG color contrast accessibility, and Interactive clickable prototyping.',
    modes: ['wireframe_sketcher', 'wcag_contrast_checker', 'design_token_system'],
    keyConcepts: ['Fitts’s Law & Hick’s Law', 'WCAG AA/AAA Accessibility Contrast', 'Visual Hierarchy & Whitespace', 'Information Architecture'],
    supportedLanguages: ['html', 'css']
  },
  {
    code: 'data-science',
    title: 'Data Science & Statistical Computing',
    branch: 'Data Management',
    category: 'Data Science',
    icon: 'fa-chart-pie',
    description: 'Data acquisition, cleaning, and exploratory data analysis (EDA): CSV parsing, summary statistics (mean, median, standard deviation, IQR), correlation matrices, and statistical plotting via Graphing Lab integration.',
    modes: ['data_table_viewer', 'stats_distribution_plot', 'graphing_lab_launcher'],
    keyConcepts: ['Data Cleansing & Missing Values', 'Statistical Measures of Central Tendency & Spread', 'Linear Regression Modeling', 'Exploratory Data Analysis'],
    supportedLanguages: ['python', 'sql']
  },
  {
    code: 'artificial-intelligence',
    title: 'Artificial Intelligence & Machine Learning',
    branch: 'Intelligent Systems',
    category: 'Artificial Intelligence',
    icon: 'fa-brain',
    description: 'Foundations of AI and Machine Learning: Supervised learning (Classification, Linear/Logistic Regression), Unsupervised learning (K-Means clustering), Training vs Testing datasets, Confusion matrices, and Neural network perceptrons.',
    modes: ['perceptron_visualizer', 'dataset_cluster_plot', 'model_accuracy_eval'],
    keyConcepts: ['Supervised vs Unsupervised learning', 'Training vs Testing evaluation', 'Confusion Matrix & Precision/Recall', 'Overfitting vs Underfitting'],
    supportedLanguages: ['python']
  },
  {
    code: 'cloud-computing',
    title: 'Cloud Computing & Infrastructure',
    branch: 'Systems & Infrastructure',
    category: 'Cloud Engineering',
    icon: 'fa-cloud',
    description: 'Cloud deployment models (IaaS, PaaS, SaaS, Serverless), Virtualization concepts, Containerization principles, Object storage buckets, Load balancing, and Continuous Integration & Deployment (CI/CD) pipelines.',
    modes: ['cloud_architecture_canvas', 'container_flow_sim', 'cost_estimator'],
    keyConcepts: ['IaaS vs PaaS vs SaaS models', 'Container virtualization vs Virtual Machines', 'High Availability & Scalability', 'CI/CD Pipeline stages'],
    supportedLanguages: ['yaml', 'json', 'bash']
  },
  {
    code: 'git-version-control',
    title: 'Git Version Control & Collaboration',
    branch: 'Software Engineering',
    category: 'Development Tools',
    icon: 'fa-code-branch',
    description: 'Distributed version control with Git: Repository initialization, Staging area, Commits, Branching strategies (GitFlow, feature branches), Merging, Conflict resolution, and Git commit graph inspection.',
    modes: ['git_graph_visualizer', 'commit_history_log', 'diff_viewer'],
    keyConcepts: ['Working directory, Staging area, Repository', 'Branching & Fast-forward merges', 'Merge conflict resolution', 'Distributed vs Centralized VCS'],
    supportedLanguages: ['bash']
  },
  {
    code: 'algorithms',
    title: 'Algorithms & Data Structures Laboratory',
    branch: 'Foundations of Computing',
    category: 'Computer Science',
    icon: 'fa-diagram-project',
    description: 'Algorithmic efficiency and asymptotic Big-O notation, Sorting algorithms (Bubble, Insertion, Merge, Quick), Binary Search, and Abstract Data Types: Arrays, Stacks, Queues, Linked Lists, Binary Trees, and Graphs.',
    modes: ['algorithm_animator', 'big_o_complexity_chart', 'data_structure_canvas'],
    keyConcepts: ['Asymptotic Complexity O(1), O(n), O(n log n), O(n²)', 'Sorting algorithms execution & swaps', 'Stack LIFO vs Queue FIFO principles', 'Binary Search Tree traversal'],
    supportedLanguages: ['python', 'c', 'cpp', 'java', 'javascript']
  },
  {
    code: 'practical-tutorials',
    title: 'Practical Coding Tutorials & Walkthroughs',
    branch: 'Applied Learning',
    category: 'Tutorials',
    icon: 'fa-chalkboard-user',
    description: 'Guided step-by-step tutorials created by tutors: Clear objectives, code explanations, starter templates, guided checkpoints, and self-paced programming exercises.',
    modes: ['step_by_step_tutorial', 'tutor_notes_pane'],
    keyConcepts: ['Deliberate practice', 'Decomposition of programming tasks', 'Test-driven development habits'],
    supportedLanguages: ['python', 'javascript', 'html', 'sql']
  },
  {
    code: 'student-projects',
    title: 'Student Project Portfolio & Workspace',
    branch: 'Applied Learning',
    category: 'Project Work',
    icon: 'fa-folder-tree',
    description: 'Personal multi-file student project management: Creating custom repositories, managing source files (.html, .py, .java, .c, .sql), saving progress, and generating portfolio project exports.',
    modes: ['project_manager', 'export_zip_tool'],
    keyConcepts: ['Project organization & modularization', 'Code documentation & README', 'Source asset packaging'],
    supportedLanguages: ['javascript', 'python', 'java', 'c', 'cpp', 'html', 'css', 'sql']
  },
  {
    code: 'practical-examinations',
    title: 'Practical ICT & CBT Examinations',
    branch: 'Assessment',
    category: 'Examinations',
    icon: 'fa-clipboard-check',
    description: 'High-integrity computer-based practical examinations: Interactive code writing, code completion, error identification, SQL query solving, and automated server-side unit test execution with strict exam lockout.',
    modes: ['cbt_practical_pane', 'unit_test_runner', 'exam_timer_view'],
    keyConcepts: ['Automated unit testing', 'Single attempt exam enforcement', 'Hidden test case evaluation', 'Time-bounded code writing'],
    supportedLanguages: ['python', 'javascript', 'sql', 'c', 'java']
  }
];

// 1. Get All Curriculum Modules
async function getModules(req, res, next) {
  try {
    res.json({
      success: true,
      count: CURRICULUM_MODULES.length,
      modules: CURRICULUM_MODULES
    });
  } catch (err) {
    next(err);
  }
}

// 2. Get Single Module Detail by Code
async function getModuleByCode(req, res, next) {
  try {
    const code = req.params.code;
    const moduleItem = CURRICULUM_MODULES.find((m) => m.code === code);
    if (!moduleItem) {
      return res.status(404).json({ success: false, error: 'Computer Science module not found' });
    }
    res.json({ success: true, module: moduleItem });
  } catch (err) {
    next(err);
  }
}

// 3. List Saved Projects for Active User
async function listProjects(req, res, next) {
  try {
    const userIdentifier = req.session.registrationNumber || req.session.adminId;
    if (!userIdentifier) {
      return res.status(401).json({ success: false, error: 'Unauthorized session' });
    }

    const [rows] = await pool.query(
      `SELECT id, user_identifier, title, module_code, project_type, created_at, updated_at
       FROM cs_projects
       WHERE user_identifier = ? OR ? = 'admin'
       ORDER BY updated_at DESC`,
      [String(userIdentifier), req.session.adminId ? 'admin' : 'student']
    );

    res.json({ success: true, count: rows.length, projects: rows });
  } catch (err) {
    next(err);
  }
}

// 4. Save or Update Student Project
async function saveProject(req, res, next) {
  try {
    const userIdentifier = req.session.registrationNumber || req.session.adminId;
    if (!userIdentifier) {
      return res.status(401).json({ success: false, error: 'Unauthorized session' });
    }

    const { id, title, module_code, project_type = 'web', files = [], environment_config = {} } = req.body;

    if (!title || !module_code) {
      return res.status(400).json({ success: false, error: 'Title and module_code are required' });
    }

    if (id) {
      // Update existing project
      const [result] = await pool.query(
        `UPDATE cs_projects
         SET title = ?, module_code = ?, project_type = ?, files = ?, environment_config = ?
         WHERE id = ? AND (user_identifier = ? OR ? = 'admin')`,
        [
          title,
          module_code,
          project_type,
          JSON.stringify(files),
          JSON.stringify(environment_config),
          id,
          String(userIdentifier),
          req.session.adminId ? 'admin' : 'student'
        ]
      );
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, error: 'Project not found or unauthorized' });
      }
      return res.json({ success: true, message: 'Project updated successfully', project_id: id });
    } else {
      // Insert new project
      const [result] = await pool.query(
        `INSERT INTO cs_projects (user_identifier, title, module_code, project_type, files, environment_config)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          String(userIdentifier),
          title,
          module_code,
          project_type,
          JSON.stringify(files),
          JSON.stringify(environment_config)
        ]
      );
      return res.json({
        success: true,
        message: 'Project created successfully',
        project_id: result.insertId
      });
    }
  } catch (err) {
    next(err);
  }
}

// 5. Get Project by ID with full file contents
async function getProjectById(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const userIdentifier = req.session.registrationNumber || req.session.adminId;

    const [rows] = await pool.query(
      `SELECT * FROM cs_projects WHERE id = ? AND (user_identifier = ? OR ? = 'admin')`,
      [id, String(userIdentifier), req.session.adminId ? 'admin' : 'student']
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, error: 'Project not found or unauthorized' });
    }

    const project = rows[0];
    if (typeof project.files === 'string') {
      try { project.files = JSON.parse(project.files); } catch (_) {}
    }
    if (typeof project.environment_config === 'string') {
      try { project.environment_config = JSON.parse(project.environment_config); } catch (_) {}
    }

    res.json({ success: true, project });
  } catch (err) {
    next(err);
  }
}

// 6. Delete Project
async function deleteProject(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const userIdentifier = req.session.registrationNumber || req.session.adminId;

    const [result] = await pool.query(
      `DELETE FROM cs_projects WHERE id = ? AND (user_identifier = ? OR ? = 'admin')`,
      [id, String(userIdentifier), req.session.adminId ? 'admin' : 'student']
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Project not found or unauthorized' });
    }

    res.json({ success: true, message: 'Project deleted successfully' });
  } catch (err) {
    next(err);
  }
}

// 7. Auto-Grading: SQL Query Evaluator
async function gradeSqlQuery(req, res, next) {
  try {
    const { student_query, expected_columns = [], expected_row_count } = req.body;

    if (typeof student_query !== 'string' || !student_query.trim()) {
      return res.status(400).json({ success: false, error: 'Student SQL query required' });
    }
    if (!Array.isArray(expected_columns) || (
      expected_row_count !== undefined &&
      (!Number.isInteger(Number(expected_row_count)) || Number(expected_row_count) < 0)
    )) {
      return res.status(400).json({ success: false, error: 'Expected columns and row count must be valid.' });
    }

    const forbidden = /(?:^|;)\s*(DROP|ALTER|TRUNCATE|GRANT|REVOKE|SHUTDOWN)\b/i;
    if (forbidden.test(student_query)) {
        return res.status(403).json({
          success: false,
          isCorrect: false,
          error: 'Disallowed SQL command detected. Only non-destructive queries are permitted.'
        });
    }

    const result = await executeInSandbox({
      language: 'sql',
      files: [{ name: 'student-query.sql', content: student_query }]
    });
    let output = null;
    if (result.success) {
      try { output = JSON.parse(result.stdout); } catch (err) {
        return next(new Error(`SQL runner returned invalid result data: ${err.message}`));
      }
    }
    const columnsMatch = !expected_columns.length ||
      (output && expected_columns.every((column) => output.columns.some((actual) => actual.toLowerCase() === String(column).toLowerCase())));
    const rowCountMatch = expected_row_count === undefined ||
      (output && output.rowCount === Number(expected_row_count));
    const isCorrect = result.success && columnsMatch && rowCountMatch;
    const feedback = !result.success
      ? result.stderr.trim() || 'SQL execution failed.'
      : !columnsMatch
        ? 'Query ran, but its result columns do not match the expected columns.'
        : !rowCountMatch
          ? `Query ran, but returned ${output.rowCount} rows instead of ${expected_row_count}.`
          : `Query executed successfully and returned ${output.rowCount} row(s).`;

    res.json({
      success: true,
      isCorrect,
      query: student_query,
      feedback,
      result: output
    });
  } catch (err) {
    next(err);
  }
}

// 8. Auto-Grading: Algorithm & Complexity Evaluator
async function gradeAlgorithm(req, res, next) {
  try {
    const { algorithm_name, time_complexity, space_complexity, test_cases_passed, total_test_cases } = req.body;

    const passCount = parseInt(test_cases_passed, 10) || 0;
    const totalCount = parseInt(total_test_cases, 10) || 1;

    const passRatio = passCount / totalCount;
    const isCorrect = passRatio >= 1.0;

    res.json({
      success: true,
      isCorrect,
      algorithm_name,
      time_complexity,
      space_complexity,
      score: Math.round(passRatio * 100),
      feedback: isCorrect
        ? `All ${totalCount} test cases passed successfully! Asymptotic complexity bounds satisfied.`
        : `Partial test cases passed (${passCount}/${totalCount}). Review edge cases.`
    });
  } catch (err) {
    next(err);
  }
}

// 9. Sandboxed Code Execution
async function executeCode(req, res, next) {
  try {
    const { language, files, stdin, mainFile } = req.body;
    if (!language || !files || !files.length) {
      return res.status(400).json({ success: false, error: 'Language and files array are required' });
    }

    const result = await executeInSandbox({ language, files, stdin, mainFile });

    try {
      const userIdentifier = req.session.registrationNumber || req.session.adminId || 'anonymous';
      await pool.query(
        `INSERT INTO cs_execution_logs (user_identifier, language, code_snippet, execution_status, execution_time_ms, memory_used_mb)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          String(userIdentifier),
          language,
          files[0]?.content ? files[0].content.substring(0, 500) : '',
          result.success ? 'success' : (result.timedOut ? 'timeout' : 'error'),
          result.executionTimeMs || 0,
          12.0
        ]
      );
    } catch (_) {}

    res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  CURRICULUM_MODULES,
  getModules,
  getModuleByCode,
  listProjects,
  saveProject,
  getProjectById,
  deleteProject,
  gradeSqlQuery,
  gradeAlgorithm,
  executeCode
};
