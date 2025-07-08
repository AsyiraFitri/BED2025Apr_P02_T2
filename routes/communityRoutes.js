const express = require('express');
const router = express.Router();
const controller = require('../models/community');
const validateGroup = require('../middlewares/validateCommunity');

// Routes
router.get('/', controller.getAllGroups);
router.post('/', validateGroup, controller.createGroup);
router.get('/:id', controller.getGroupById);

module.exports = router;

