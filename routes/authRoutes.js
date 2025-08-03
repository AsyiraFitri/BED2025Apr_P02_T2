const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const {
  verifyRegisterFields,
  verifyLoginFields,
  verifyForgotPasswordFields,
  verifyResetPasswordFields,
  verifyCaptcha
} = require('../middlewares/authorizeUser');

// Registration route
router.post('/register', verifyRegisterFields, authController.registerUser);

// Login route
router.post('/login', verifyCaptcha, verifyLoginFields, authController.loginUser);

// Forgot password route
router.post('/forgot-password', verifyForgotPasswordFields, authController.forgotPassword);

// Reset password route
router.post('/reset-password/:token', verifyResetPasswordFields, authController.resetPassword);

// Logout route
router.post('/logout', authController.logoutUser); 


module.exports = router;