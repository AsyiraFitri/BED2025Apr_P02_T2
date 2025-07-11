const express = require('express');
const router = express.Router();
const controller = require('../controllers/groupController');
const validateGroup = require('../middlewares/validateGroup');

// Routes
router.get('/checkMembership/:groupId/:userId', controller.checkMembership);
router.get('/memberCount/:groupId', controller.getMemberCount);
router.get('/memberList/:groupId', controller.getMemberList);
router.get('/channels/:groupId', controller.getChannels);
router.patch('/saveDesc', controller.saveDesc);
router.post('/createChannel', controller.createChannel);
router.delete('/deleteChannel', controller.deleteChannel);
router.delete('/deleteCommunity', controller.deleteCommunity);
router.post('/leaveGroup', controller.leaveGroup);
module.exports = router;