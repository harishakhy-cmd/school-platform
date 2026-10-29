'use strict';

const express = require('express');
const chemistryController = require('../controllers/chemistryController');
const { requireLogin } = require('../middleware/authMiddleware');

const router = express.Router({ mergeParams: true });

// Curriculum topics
router.get('/topics',         requireLogin, chemistryController.getCurriculumTopics);
router.get('/topics/:code',   requireLogin, chemistryController.getTopicByCode);

// Substance & element data
router.get('/substances/catalog', requireLogin, chemistryController.getSubstanceCatalog);
router.get('/elements',           requireLogin, chemistryController.getElements);

// Calculation engines
router.post('/balance-equation',   requireLogin, chemistryController.balanceEquation);
router.post('/stoichiometry',      requireLogin, chemistryController.stoichiometryCalc);
router.post('/titration-calc',     requireLogin, chemistryController.titrationCalc);
router.post('/ph-calculate',       requireLogin, chemistryController.phCalculate);
router.post('/mole-calc',          requireLogin, chemistryController.moleCalc);
router.post('/gas-law-calc',       requireLogin, chemistryController.gasLawCalc);
router.post('/gas-law',            requireLogin, chemistryController.gasLawCalc);

// Experiment CRUD
router.get('/experiments',        requireLogin, chemistryController.listExperiments);
router.post('/experiments',       requireLogin, chemistryController.saveExperiment);
router.get('/experiments/:id',    requireLogin, chemistryController.getExperimentById);
router.delete('/experiments/:id', requireLogin, chemistryController.deleteExperiment);

// Grading engines
router.post('/grade-equation',       requireLogin, chemistryController.gradeEquation);
router.post('/grade-stoichiometry',  requireLogin, chemistryController.gradeStoichiometry);
router.post('/grade-identification', requireLogin, chemistryController.gradeIdentification);

module.exports = router;
