// routes/emergencyHotlineRoutes.js
const express = require('express');
const router = express.Router();
const { getHotlines } = require('../controllers/emergencyHotlineController');
// const { validateHotlineFields } = require('../middlewares/hotlineValidation'); // for future POST/PUT

router.get('/', getHotlines);

module.exports = router;
