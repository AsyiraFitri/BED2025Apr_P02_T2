const express = require('express');
const router = express.Router();
const friendController = require('../controllers/friendController');

// Send a friend request
router.post('/', friendController.sendFriendRequest);

// Get all friends (including accepted and pending)
router.get('/:userId', friendController.getFriends);

// Respond to friend request (accept/reject)
router.put('/:friendId', friendController.respondToFriendRequest);

// Delete a friend request or friend
router.delete('/:friendId', friendController.deleteFriend);

// New routes for incoming and sent requests
router.get('/incoming/:userId', friendController.getIncomingRequests);
router.get('/sent/:userId', friendController.getSentRequests);

module.exports = router;