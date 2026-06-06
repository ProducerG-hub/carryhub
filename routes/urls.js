const authController = require('../controllers/authController');
const categoryController = require('../controllers/categoryController');
const authMiddleware = require('../middleware/auth');
const express = require('express');
const router = express.Router();

// Authentication routes
router.post('/api/auth/register', authController.Register);
router.post('/api/auth/login', authController.Login);
router.post('/api/auth/logout', authController.Logout);
router.get('/api/auth/profile', authMiddleware.isAuthenticated, authController.userProfile);

//category routes
router.get('/api/categories', categoryController.getCategories);
router.get('/api/categories/:id', categoryController.getCategoryById);
router.post('/api/add-categories', authMiddleware.isAuthenticated, categoryController.addCategory);

module.exports = router;