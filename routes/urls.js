const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');
const express = require('express');
const router = express.Router();

router.post('/api/auth/register', authController.Register);
router.post('/api/auth/login', authController.Login);
router.post('/api/auth/logout', authController.Logout);
router.get('/api/auth/profile', authMiddleware.isAuthenticated, authController.userProfile);

module.exports = router;