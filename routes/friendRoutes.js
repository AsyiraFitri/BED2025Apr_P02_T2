const express = require('express');
const router = express.Router();
const friendController = require('../controllers/friendController');
const sql = require('mssql');
const dbConfig = require('../dbConfig');

// Send a friend request
router.post('/', friendController.sendFriendRequest);

// Get all friends (including accepted and pending)
router.get('/:userId', friendController.getFriends);

// Respond to friend request (accept/reject)
router.put('/:friendId', friendController.respondToFriendRequest);

// Delete a friend
router.delete('/:userId/:friendId', friendController.deleteFriend);

// New routes for incoming and sent requests
router.get('/incoming/:userId', friendController.getIncomingRequests);
router.get('/sent/:userId', friendController.getSentRequests);

// Delete a friend request
/*
router.delete('/request/:requestId', friendController.deleteFriendRequest);
*/

module.exports = router;