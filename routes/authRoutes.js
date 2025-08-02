const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Registration route
router.post('/register', authController.registerUser);

// Login route
router.post('/login', authController.loginUser);

// Forgot password route
router.post('/forgot-password', authController.forgotPassword);

// Reset password route
router.post('/reset-password/:token', authController.resetPassword);

// Logout route
router.post('/logout', authController.logoutUser); 
//test
router.post('/test-mailgun', authController.testMailgun);
router.get('/debug-env',authController.debugEnvironment);
router.post('/test-manual-key', authController.testWithManualKey);
router.get('/curl-test', authController.generateCurlTest);

module.exports = router;