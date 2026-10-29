'use strict';

const express = require('express');
const geographyController = require('../controllers/geographyController');
const { requireLogin } = require('../middleware/authMiddleware');

const router = express.Router({ mergeParams: true });

// Curriculum topics list & detail
router.get('/topics', requireLogin, geographyController.getCurriculumTopics);
router.get('/topics/:code', requireLogin, geographyController.getTopicByCode);

// Saved Map Projects
router.get('/maps', requireLogin, geographyController.listSavedMaps);
router.post('/maps', requireLogin, geographyController.saveMap);
router.delete('/maps/:id', requireLogin, geographyController.deleteSavedMap);

// Fieldwork Entries
router.get('/fieldwork', requireLogin, geographyController.listFieldworkEntries);
router.post('/fieldwork', requireLogin, geographyController.saveFieldworkEntry);

// Auto-grading for coordinate & map questions
router.post('/grade-coordinate', requireLogin, geographyController.gradeGeoCoordinateQuestion);

module.exports = router;
