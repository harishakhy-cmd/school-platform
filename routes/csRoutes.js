'use strict';

const express = require('express');
const csController = require('../controllers/csController');
const { requireLogin } = require('../middleware/authMiddleware');

const router = express.Router({ mergeParams: true });

// Curriculum modules registry
router.get('/modules', requireLogin, csController.getModules);
router.get('/modules/:code', requireLogin, csController.getModuleByCode);

// Saved Student Projects CRUD
router.get('/projects', requireLogin, csController.listProjects);
router.post('/projects', requireLogin, csController.saveProject);
router.get('/projects/:id', requireLogin, csController.getProjectById);
router.delete('/projects/:id', requireLogin, csController.deleteProject);

// Auto-Grading & Verification Endpoints
router.post('/grade-sql', requireLogin, csController.gradeSqlQuery);
router.post('/grade-algorithm', requireLogin, csController.gradeAlgorithm);

// Sandboxed Code Execution Engine
router.post('/execute', requireLogin, csController.executeCode);

module.exports = router;
