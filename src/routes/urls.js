const authController = require('../controllers/authController');
const categoryController = require('../controllers/categoryController');
const productsController = require('../controllers/productsController');
const authMiddleware = require('../middleware/auth');
const urlController = require('../controllers/urlController');
const cartController = require('../controllers/cartController');
const checkoutController = require('../controllers/checkoutController');
const paypalController = require('../controllers/paypalController');
const capturePaypalController = require('../controllers/capture.paypal');
const adminController = require('../controllers/adminController');
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
router.get('/categories', categoryController.getCategories);
router.get('/api/categories/:id', categoryController.getCategoryById);
router.post('/api/add-categories', authMiddleware.isAuthenticated, categoryController.addCategory);
router.post('/api/update-categories/:id', authMiddleware.isAuthenticated, categoryController.updateCategory);
router.post('/api/delete-categories/:id', authMiddleware.isAuthenticated, categoryController.deleteCategory);
router.post('/api/restore-categories/:id', authMiddleware.isAuthenticated, categoryController.restoreCategory);

// product routes
router.get('/products', productsController.getProducts);
router.get('/products/:id', productsController.getProductById);
router.get('/api/products/category/:categoryId', productsController.getProductsByCategoryId);
router.post('/api/add-products', authMiddleware.isAuthenticated, productsController.addProduct);
router.post('/api/update-products/:id', authMiddleware.isAuthenticated, productsController.updateProduct);
router.post('/api/delete-products/:id', authMiddleware.isAuthenticated, productsController.deleteProduct);
router.post('/api/restore-products/:id', authMiddleware.isAuthenticated, productsController.restoreProduct);

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

//paypal routes
router.post('/api/paypal/create-order', authMiddleware.requireLoginRedirect, paypalController.createPaypalOrder);
router.post('/api/paypal/capture-order', authMiddleware.requireLoginRedirect, capturePaypalController.capturePaypalOrder);

//admin routes
router.get('/admin/dashboard', authMiddleware.isAdmin, adminController.dashboard);
router.get('/admin/products', authMiddleware.isAdmin, adminController.adminProducts);
router.get('/admin/categories', authMiddleware.isAdmin, adminController.adminCategories);
router.get('/admin/orders', authMiddleware.isAdmin, adminController.adminOrders);
router.get('/admin/orders/:orderId', authMiddleware.isAdmin, adminController.getOrderDetails);
router.post('/admin/orders/:orderId/status', authMiddleware.isAdmin, adminController.updateOrderStatus);
router.get('/admin/customers', authMiddleware.isAdmin, adminController.customersPage);
router.get('/admin/customers/:customerId', authMiddleware.isAdmin, adminController.getCustomerDetails);
module.exports = router;