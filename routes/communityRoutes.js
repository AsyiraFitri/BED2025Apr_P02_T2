const express = require('express');
const router = express.Router();
const controller = require('../controllers/communityController');
const validateGroup = require('../middlewares/validateCommunity');
const { verifyToken, verifyAdmin } = require('../middlewares/authorizeUser');

// Make sure all handlers are functions
console.log('Controller methods:', Object.keys(controller));
console.log('validateGroup type:', typeof validateGroup);

// Routes
router.get('/', controller.getAllGroups);
router.post('/', verifyAdmin, validateGroup, controller.createGroup); // Only admins can create groups
router.get('/:id', controller.getGroupById);
router.post('/join', verifyToken, controller.joinGroup);
module.exports = router;