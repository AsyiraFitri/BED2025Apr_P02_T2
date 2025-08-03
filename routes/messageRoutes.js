const express = require('express');
const router = express.Router();
const controller = require('../controllers/messageController');

router.post('/', controller.sendMessage);
router.get('/:user1/:user2', controller.getConversation);
router.put('/:messageId', controller.updateMessage);
router.delete('/:messageId', controller.deleteMessage);

router.post('/:messageId/translate', controller.translateMessage);

module.exports = router;