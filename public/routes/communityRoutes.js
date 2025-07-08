const express = require('express');
const router = express.Router();
const controller = require('../controllers/community');
const validateGroup = require('../middlewares/validateCommunity');

// Routes
router.get('/', controller.getAllGroups);
router.post('/', validateGroup, controller.createGroup);

module.exports = router;

