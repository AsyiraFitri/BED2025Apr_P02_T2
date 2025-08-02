const express = require('express');
const router = express.Router();
const hotlineController = require('../controllers/emergencyHotlineController');

// GET route for fetching all hotlines
router.get('/', hotlineController.getHotlines);

module.exports = router;