const express = require('express');
const authController = require('../controllers/authController');
const { profilePhotoUpload } = require('../middleware/profilePhotoUpload');

const router = express.Router();

router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.get('/me', authController.me);
router.put('/profile/photo', profilePhotoUpload, authController.uploadProfilePhoto);

module.exports = router;
