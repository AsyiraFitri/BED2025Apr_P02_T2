const express = require('express');
const router = express.Router();
const controller = require('../controllers/groupController');
const firebaseChatController = require('../controllers/firebaseChatController');
const { validateGroupOwnership, preventAdminLeaveGroup, validateGroupOwnershipForDelete, validateEvent, validateChannel } = require('../middlewares/validateGroup');
const { verifyToken } = require('../middlewares/authorizeUser');
require('dotenv').config();

// ============= GROUP MANAGEMENT ROUTES =============
// Route: PATCH /saveDesc - Update group description (owner only)
router.patch('/saveDesc', verifyToken, validateGroupOwnership, controller.saveDesc);

// Route: GET /user/:userId - Get user details by userId
router.get('/user/:userId', controller.getUserDetailsById);

// ============= MEMBER MANAGEMENT ROUTES =============
// Route: GET /checkMembership/:groupId - Check user membership
router.get('/checkMembership/:groupId', verifyToken, controller.checkMembership);

// Route: GET /memberCount/:groupId - Get member count
router.get('/memberCount/:groupId', controller.getMemberCount);

// Route: GET /memberList/:groupId - Get member list with roles
router.get('/memberList/:groupId', controller.getMemberList);

// ============= CHANNEL MANAGEMENT ROUTES =============
// Route: GET /channels/:groupId - Get all channels for a group
router.get('/channels/:groupId', controller.getChannels);

// Route: POST /channels/create - Create a new channel (owner only)
router.post('/channels/create', verifyToken, validateGroupOwnership, validateChannel, controller.createChannel);

// Route: DELETE /channels/delete - Delete a channel (owner only)
router.delete('/channels/delete', verifyToken, validateGroupOwnership, controller.deleteChannel);

// ============= EVENT MANAGEMENT ROUTES =============
// Route: GET /events/:groupId - Get all events for a group
router.get('/events/:groupId', controller.getEvents);

// Route: POST /events/create - Create a new event
router.post('/events/create', verifyToken, validateGroupOwnership, validateEvent, controller.createEvent);

// Route: PATCH /events/:eventId - Update an event (admin/owner only)
router.patch('/events/:eventId', verifyToken, validateGroupOwnership, validateEvent, controller.updateEvent);

// Route: DELETE /events/:eventId - Delete an event
router.delete('/events/:eventId', verifyToken, controller.deleteEvent);

// ============= FIREBASE CHAT ROUTES =============
// Route: GET /firebase/channels/:groupId/:channelName - Get messages from Firebase
router.get('/firebase/channels/:groupId/:channelName', firebaseChatController.getFirebaseMessages);

// Route: POST /firebase/channels/:groupId/:channelName - Post a new message to Firebase
router.post('/firebase/channels/:groupId/:channelName', firebaseChatController.postFirebaseMessage);

// Route: PUT /firebase/messages/:messageId - Edit/update an existing message
router.put('/firebase/messages/:messageId', firebaseChatController.updateFirebaseMessage);

// Route: DELETE /firebase/messages/:messageId - Delete a message from Firebase
router.delete('/firebase/messages/:messageId', firebaseChatController.deleteFirebaseMessage);

// Route: GET /firebase-config - Provide Firebase client configuration
router.get('/firebase-config', firebaseChatController.getConfig);

// ============= GROUP LIFECYCLE ROUTES =============
// Route: DELETE /deleteCommunity - Delete community/group (owner only)
router.delete('/deleteCommunity', verifyToken, validateGroupOwnershipForDelete, controller.deleteCommunity);

// Route: POST /leaveGroup - Leave group (members only, admins restricted)
router.post('/leaveGroup', verifyToken, preventAdminLeaveGroup, controller.leaveGroup);

module.exports = router;