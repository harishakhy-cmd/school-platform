'use strict';

const express = require('express');
const physicsController = require('../controllers/physicsController');
const { requireLogin } = require('../middleware/authMiddleware');

const router = express.Router({ mergeParams: true });

// Curriculum topics list & detail
router.get('/topics', requireLogin, physicsController.getCurriculumTopics);
router.get('/topics/:code', requireLogin, physicsController.getTopicByCode);

// Saved Experiments CRUD
router.get('/experiments', requireLogin, physicsController.listExperiments);
router.post('/experiments', requireLogin, physicsController.saveExperiment);
router.get('/experiments/:id', requireLogin, physicsController.getExperimentById);
router.delete('/experiments/:id', requireLogin, physicsController.deleteExperiment);

// Measurement Auto-Grading (Vernier Caliper, Micrometer, Stopwatch, Ohm's Law)
router.post('/grade-measurement', requireLogin, physicsController.gradeMeasurementQuestion);

module.exports = router;
