'use strict';

const express = require('express');
const graphingController = require('../controllers/graphingController');
const { requireLogin } = require('../middleware/authMiddleware');

const router = express.Router({ mergeParams: true });

// Subject Profiles Registry metadata (Public for authenticated users)
router.get('/profiles', requireLogin, graphingController.getSubjectProfiles);
router.get('/profiles/:subjectCode', requireLogin, graphingController.getSubjectProfile);

// Saved Graphs CRUD
router.get('/graphs', requireLogin, graphingController.listSavedGraphs);
router.get('/graphs/:id', requireLogin, graphingController.getSavedGraph);
router.post('/graphs', requireLogin, graphingController.saveGraph);
router.delete('/graphs/:id', requireLogin, graphingController.deleteSavedGraph);

// Graph Evaluation & Grading
router.post('/grade', requireLogin, graphingController.gradeGraphAnswer);

// Data Export (CSV)
router.post('/export/csv', requireLogin, graphingController.exportGraphCsv);

module.exports = router;
