'use strict';

const express = require('express');
const controller = require('../controllers/chemistryLabController');
const { requireLogin } = require('../middleware/authMiddleware');

const router = express.Router();
router.use(requireLogin);
router.get('/runs', controller.list);
router.get('/runs/:id', controller.get);
router.post('/runs', controller.save);

module.exports = router;
