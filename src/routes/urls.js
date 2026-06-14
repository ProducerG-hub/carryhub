const authController = require('../controllers/authController');
const categoryController = require('../controllers/categoryController');
const productsController = require('../controllers/productsController');
const authMiddleware = require('../middleware/auth');
const urlController = require('../controllers/urlController');
const cartController = require('../controllers/cartController');
const checkoutController = require('../controllers/checkoutController');
const express = require('express');
const router = express.Router();

//general routes
router.get('/', urlController.getHome);
router.get('/login', urlController.getLogin);
router.get('/register', urlController.getRegister);
router.get('/profile', authMiddleware.isAuthenticated, authController.userProfile);
router.get('/cart', authMiddleware.requireLoginRedirect, cartController.getCart);

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

// cart routes
router.post('/api/cart/add', authMiddleware.requireLoginRedirect, cartController.addToCart);
router.post('/api/cart/add/:productId', authMiddleware.requireLoginRedirect, cartController.addToCart);
router.post('/api/cart/items/:cartItemId/adjust', authMiddleware.requireLoginRedirect, cartController.adjustCartItemQuantity);
router.post('/api/cart/items/:cartItemId/remove', authMiddleware.requireLoginRedirect, cartController.removeCartItem);
router.get('/api/cart', authMiddleware.isAuthenticated, cartController.getCartApi);
router.get('/checkout', authMiddleware.requireLoginRedirect, checkoutController.getCheckoutPage);
router.post('/checkout', authMiddleware.requireLoginRedirect, checkoutController.placeOrder);

router.get('/orders', authMiddleware.requireLoginRedirect, checkoutController.getOrders);
router.get(
    '/orders/:orderId',
    authMiddleware.isAuthenticated,
    checkoutController.getOrderDetails
);
router.get('/order-success/:orderId/', authMiddleware.requireLoginRedirect, urlController.orderSuccess);
module.exports = router;