const express = require('express');
const router = express.Router();
const authController = require('../controllers/tempAuthController');

// Registration route
router.post('/register', authController.register);

// Login route
router.post('/login', authController.login);

// Forgot password route
router.post('/forgot-password', authController.forgotPassword);

// Reset password route
router.post('/reset-password/:token', authController.resetPassword);

module.exports = router;

// const express = require('express');
// const router = express.Router();
// const {
//   registerUser,
//   loginUser,
//   forgotPassword,
//   resetPassword,
// } = require("../controllers/authController");


// router.post("/register", registerUser);
// router.post("/login", loginUser);
// router.post("/forgot-password", forgotPassword);
// router.post("/reset-password/:token", resetPassword);

// module.exports = router;