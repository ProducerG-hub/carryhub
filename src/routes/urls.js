const authController = require('../controllers/authController');
const categoryController = require('../controllers/categoryController');
const productsController = require('../controllers/productsController');
const authMiddleware = require('../middleware/auth');
const urlController = require('../controllers/urlController');
const express = require('express');
const router = express.Router();

//general routes
router.get('/', urlController.getHome);
router.get('/login', urlController.getLogin);
router.get('/register', urlController.getRegister);
router.get('/profile', authMiddleware.isAuthenticated, urlController.getProfile);

// Authentication routes
router.post('/api/auth/register', authController.Register);
router.post('/api/auth/login', authController.Login);
router.post('/api/auth/logout', authController.Logout);
router.get('/api/auth/profile', authMiddleware.isAuthenticated, authController.userProfile);

//category routes
router.get('/api/categories', categoryController.getCategories);
router.get('/api/categories/:id', categoryController.getCategoryById);
router.post('/api/add-categories', authMiddleware.isAuthenticated, categoryController.addCategory);
router.put('/api/update-categories/:id', authMiddleware.isAuthenticated, categoryController.updateCategory);
router.delete('/api/delete-categories/:id', authMiddleware.isAuthenticated, categoryController.deleteCategory);   
router.put('/api/restore-categories/:id', authMiddleware.isAuthenticated, categoryController.restoreCategory);

// product routes
router.get('/products', productsController.getProducts);
router.get('/products/:id', productsController.getProductById);
router.get('/api/products/category/:categoryId', productsController.getProductsByCategoryId);
router.post('/api/add-products', authMiddleware.isAuthenticated, productsController.addProduct);
router.put('/api/update-products/:id', authMiddleware.isAuthenticated, productsController.updateProduct);
router.delete('/api/delete-products/:id', authMiddleware.isAuthenticated, productsController.deleteProduct);
router.put('/api/restore-products/:id', authMiddleware.isAuthenticated, productsController.restoreProduct);
module.exports = router;