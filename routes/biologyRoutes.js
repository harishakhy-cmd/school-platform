'use strict';

const express = require('express');
const biologyController = require('../controllers/biologyController');
const { requireLogin } = require('../middleware/authMiddleware');

const router = express.Router({ mergeParams: true });

// Curriculum topics list & detail
router.get('/topics', requireLogin, biologyController.getCurriculumTopics);
router.get('/topics/:code', requireLogin, biologyController.getTopicByCode);

// Saved Biology Experiments CRUD
router.get('/experiments', requireLogin, biologyController.listExperiments);
router.post('/experiments', requireLogin, biologyController.saveExperiment);
router.get('/experiments/:id', requireLogin, biologyController.getExperimentById);
router.delete('/experiments/:id', requireLogin, biologyController.deleteExperiment);

// Biological Auto-Grading & Computational Simulation Engines
router.post('/grade-genetics', requireLogin, biologyController.gradeGeneticsCross);
router.post('/grade-dihybrid', requireLogin, biologyController.gradeDihybridCross);
router.post('/grade-microscopy', requireLogin, biologyController.gradeMicroscopyCalculation);
router.post('/simulate-enzyme', requireLogin, biologyController.simulateEnzymeKinetics);
router.post('/simulate-lotka-volterra', requireLogin, biologyController.simulateLotkaVolterra);
router.post('/evaluate-antibiotic', requireLogin, biologyController.evaluateAntibioticAssay);
router.get('/specimens/catalog', requireLogin, biologyController.getSpecimenLibrary);

module.exports = router;
