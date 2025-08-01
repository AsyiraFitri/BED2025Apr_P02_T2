const express = require('express');
const router = express.Router();
const hotlineController = require('../controllers/emergencyHotlineController');

router.get('/', hotlineController.getHotlines);

module.exports = router;
