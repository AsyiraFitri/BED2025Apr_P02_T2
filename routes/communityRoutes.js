const express = require('express');
const router = express.Router();
const controller = require('../controllers/communityController');
const validateGroup = require('../middlewares/validateCommunity');

// Make sure all handlers are functions
console.log('Controller methods:', Object.keys(controller));
console.log('validateGroup type:', typeof validateGroup);

// Routes
router.get('/', controller.getAllGroups);
router.post('/', validateGroup, controller.createGroup);
router.get('/:id', controller.getGroupById);

module.exports = router;