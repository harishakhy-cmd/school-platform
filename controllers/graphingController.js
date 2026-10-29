'use strict';

const pool = require('../config/database');
const { SUBJECT_PROFILES, getProfile, listProfiles } = require('../config/subjectProfiles');

/**
 * Controller for Interactive Graphing & Data Visualization Lab
 */

// 1. Get all subject profiles
exports.getSubjectProfiles = async (req, res, next) => {
  try {
    const profiles = listProfiles();
    res.json({ success: true, profiles });
  } catch (err) {
    next(err);
  }
};

// 2. Get specific subject profile
exports.getSubjectProfile = async (req, res, next) => {
  try {
    const { subjectCode } = req.params;
    const profile = getProfile(subjectCode);
    res.json({ success: true, profile });
  } catch (err) {
    next(err);
  }
};

// 3. List Saved Graphs & Templates
exports.listSavedGraphs = async (req, res, next) => {
  try {
    const { classroomId, subjectCode, isTemplate, myGraphsOnly } = req.query;
    const role = req.session.adminId ? (req.session.role || 'tutor') : 'student';
    const userId = req.session.adminId ? String(req.session.adminId) : req.session.registrationNumber;

    let query = `
      SELECT g.id, g.title, g.description, g.classroom_id, g.subject_id, g.subject_code, 
             g.topic, g.graph_type, g.is_template, g.created_by_role, g.created_by_id, 
             g.created_at, g.updated_at,
             c.name AS classroom_name, s.name AS subject_name
      FROM saved_graphs g
      LEFT JOIN classrooms c ON g.classroom_id = c.id
      LEFT JOIN subjects s ON g.subject_id = s.id
      WHERE 1=1
    `;
    const params = [];

    if (isTemplate === 'true' || isTemplate === '1') {
      query += ` AND g.is_template = TRUE`;
    } else if (myGraphsOnly === 'true' || myGraphsOnly === '1') {
      query += ` AND g.created_by_role = ? AND g.created_by_id = ?`;
      params.push(role, userId);
    } else {
      // Return user's own graphs + classroom graphs + templates
      if (role === 'admin' || role === 'super_admin') {
        // Admins can see all
      } else {
        query += ` AND (g.is_template = TRUE OR (g.created_by_role = ? AND g.created_by_id = ?)`;
        params.push(role, userId);
        if (classroomId) {
          query += ` OR g.classroom_id = ?`;
          params.push(classroomId);
        }
        query += `)`;
      }
    }

    if (classroomId && isTemplate !== 'true') {
      query += ` AND (g.classroom_id = ? OR g.classroom_id IS NULL)`;
      params.push(classroomId);
    }

    if (subjectCode) {
      query += ` AND (g.subject_code = ? OR g.subject_code IS NULL)`;
      params.push(subjectCode.toUpperCase());
    }

    query += ` ORDER BY g.is_template DESC, g.updated_at DESC`;

    const [rows] = await pool.query(query, params);
    res.json({ success: true, graphs: rows });
  } catch (err) {
    next(err);
  }
};

// 4. Get single saved graph by ID
exports.getSavedGraph = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(`
      SELECT g.*, c.name AS classroom_name, s.name AS subject_name
      FROM saved_graphs g
      LEFT JOIN classrooms c ON g.classroom_id = c.id
      LEFT JOIN subjects s ON g.subject_id = s.id
      WHERE g.id = ?
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Graph not found' });
    }

    const graph = rows[0];

    // Safely parse JSON properties if returned as string
    if (typeof graph.config === 'string') graph.config = JSON.parse(graph.config || '{}');
    if (typeof graph.data_points === 'string') graph.data_points = JSON.parse(graph.data_points || '[]');
    if (typeof graph.functions === 'string') graph.functions = JSON.parse(graph.functions || '[]');
    if (typeof graph.analysis_tools === 'string') graph.analysis_tools = JSON.parse(graph.analysis_tools || '[]');

    res.json({ success: true, graph });
  } catch (err) {
    next(err);
  }
};

// 5. Save or Update Graph
exports.saveGraph = async (req, res, next) => {
  try {
    const {
      id,
      title,
      description,
      classroomId,
      subjectId,
      subjectCode,
      topic,
      graphType,
      config,
      dataPoints,
      functions,
      analysisTools,
      isTemplate
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Graph title is required.' });
    }

    const role = req.session.adminId ? (req.session.role || 'tutor') : 'student';
    const userId = req.session.adminId ? String(req.session.adminId) : req.session.registrationNumber;

    const configStr = typeof config === 'object' ? JSON.stringify(config) : (config || '{}');
    const dataPointsStr = typeof dataPoints === 'object' ? JSON.stringify(dataPoints) : (dataPoints || '[]');
    const functionsStr = typeof functions === 'object' ? JSON.stringify(functions) : (functions || '[]');
    const analysisToolsStr = typeof analysisTools === 'object' ? JSON.stringify(analysisTools) : (analysisTools || '[]');
    const isTemplateVal = (role === 'admin' || role === 'tutor') && isTemplate ? 1 : 0;

    if (id) {
      // Check ownership
      const [existing] = await pool.query('SELECT created_by_role, created_by_id FROM saved_graphs WHERE id = ?', [id]);
      if (existing.length === 0) {
        return res.status(404).json({ success: false, message: 'Graph not found to update.' });
      }

      if (role !== 'admin' && (existing[0].created_by_role !== role || String(existing[0].created_by_id) !== String(userId))) {
        return res.status(403).json({ success: false, message: 'Unauthorized to modify this graph.' });
      }

      await pool.query(`
        UPDATE saved_graphs SET
          title = ?,
          description = ?,
          classroom_id = ?,
          subject_id = ?,
          subject_code = ?,
          topic = ?,
          graph_type = ?,
          config = ?,
          data_points = ?,
          functions = ?,
          analysis_tools = ?,
          is_template = ?,
          updated_at = NOW()
        WHERE id = ?
      `, [
        title.trim(),
        description || null,
        classroomId || null,
        subjectId || null,
        subjectCode ? subjectCode.toUpperCase() : 'CUSTOM',
        topic || null,
        graphType || 'cartesian_function',
        configStr,
        dataPointsStr,
        functionsStr,
        analysisToolsStr,
        isTemplateVal,
        id
      ]);

      return res.json({ success: true, message: 'Graph updated successfully.', graphId: id });
    }

    // Insert new graph
    const [result] = await pool.query(`
      INSERT INTO saved_graphs 
        (title, description, classroom_id, subject_id, subject_code, topic, graph_type, config, data_points, functions, analysis_tools, is_template, created_by_role, created_by_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      title.trim(),
      description || null,
      classroomId || null,
      subjectId || null,
      subjectCode ? subjectCode.toUpperCase() : 'CUSTOM',
      topic || null,
      graphType || 'cartesian_function',
      configStr,
      dataPointsStr,
      functionsStr,
      analysisToolsStr,
      isTemplateVal,
      role,
      userId
    ]);

    res.json({ success: true, message: 'Graph saved successfully.', graphId: result.insertId });
  } catch (err) {
    next(err);
  }
};

// 6. Delete saved graph
exports.deleteSavedGraph = async (req, res, next) => {
  try {
    const { id } = req.params;
    const role = req.session.adminId ? (req.session.role || 'tutor') : 'student';
    const userId = req.session.adminId ? String(req.session.adminId) : req.session.registrationNumber;

    const [existing] = await pool.query('SELECT created_by_role, created_by_id FROM saved_graphs WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Graph not found.' });
    }

    if (role !== 'admin' && (existing[0].created_by_role !== role || String(existing[0].created_by_id) !== String(userId))) {
      return res.status(403).json({ success: false, message: 'Unauthorized to delete this graph.' });
    }

    await pool.query('DELETE FROM saved_graphs WHERE id = ?', [id]);
    res.json({ success: true, message: 'Graph deleted successfully.' });
  } catch (err) {
    next(err);
  }
};

// 7. Grade Interactive Graph Question Submission
exports.gradeGraphAnswer = async (req, res, next) => {
  try {
    const { targetConfig, studentAnswer } = req.body;

    if (!targetConfig || !studentAnswer) {
      return res.status(400).json({ success: false, message: 'Missing targetConfig or studentAnswer.' });
    }

    const {
      interactionType = 'select_point', // 'select_point', 'plot_line', 'calculate_slope', 'read_value', 'identify_intercept'
      targetPoint, // { x: 2, y: 4 }
      tolerance = 0.2, // error margin allowed
      targetSlope,
      targetValue,
      explanation = ''
    } = targetConfig;

    let isCorrect = false;
    let earnedRatio = 0.0;
    let feedback = '';

    switch (interactionType) {
      case 'select_point':
      case 'plot_coordinates': {
        if (studentAnswer.x !== undefined && studentAnswer.y !== undefined && targetPoint) {
          const dx = Math.abs(studentAnswer.x - targetPoint.x);
          const dy = Math.abs(studentAnswer.y - targetPoint.y);
          const dist = Math.hypot(dx, dy);

          if (dist <= tolerance) {
            isCorrect = true;
            earnedRatio = 1.0;
            feedback = `Correct! Identified point (${studentAnswer.x}, ${studentAnswer.y}) matches target point within tolerance.`;
          } else {
            feedback = `Incorrect point selected (${studentAnswer.x}, ${studentAnswer.y}). Target was (${targetPoint.x}, ${targetPoint.y}).`;
          }
        }
        break;
      }

      case 'calculate_slope':
      case 'read_value': {
        const studentVal = parseFloat(studentAnswer.value);
        const expectedVal = parseFloat(targetSlope !== undefined ? targetSlope : targetValue);

        if (!isNaN(studentVal) && !isNaN(expectedVal)) {
          const diff = Math.abs(studentVal - expectedVal);
          if (diff <= (tolerance * Math.max(1, Math.abs(expectedVal)))) {
            isCorrect = true;
            earnedRatio = 1.0;
            feedback = `Correct! Calculated value ${studentVal} is within acceptable precision.`;
          } else {
            feedback = `Calculated value ${studentVal} differs from expected value ${expectedVal}.`;
          }
        }
        break;
      }

      default: {
        isCorrect = false;
        earnedRatio = 0.0;
        feedback = 'Unknown graph interaction type.';
      }
    }

    res.json({
      success: true,
      isCorrect,
      earnedRatio,
      feedback: feedback + (explanation ? ` Explanation: ${explanation}` : '')
    });
  } catch (err) {
    next(err);
  }
};

// 8. Export Graph Dataset to CSV format
exports.exportGraphCsv = async (req, res, next) => {
  try {
    const { title = 'graph_data', headers = ['X', 'Y'], rows = [] } = req.body;

    let csvContent = headers.map(h => `"${String(h).replace(/"/g, '""')}"`).join(',') + '\r\n';

    rows.forEach(row => {
      if (Array.isArray(row)) {
        csvContent += row.map(v => `"${String(v !== undefined ? v : '').replace(/"/g, '""')}"`).join(',') + '\r\n';
      }
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${title.replace(/[^a-zA-Z0-9_-]/g, '_')}.csv"`);
    res.status(200).send(csvContent);
  } catch (err) {
    next(err);
  }
};
