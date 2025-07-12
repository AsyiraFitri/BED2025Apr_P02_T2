const express = require('express');
const router = express.Router();
const controller = require('../controllers/friendController');

router.post('/request', controller.sendFriendRequest);
router.get('/:userId', controller.getFriends);
router.put('/respond', controller.respondToFriendRequest);
router.delete('/:userId/:friendId', controller.deleteFriend);

module.exports = router;