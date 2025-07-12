const messageModel = require('../models/messageModel');

async function sendMessage(req, res) {
  const { senderId, receiverId, messageText } = req.body;
  try {
    await messageModel.sendMessage(senderId, receiverId, messageText);
    res.status(201).json({ message: 'Message sent.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getConversation(req, res) {
  const { user1, user2 } = req.params;
  try {
    const result = await messageModel.getConversation(user1, user2);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function updateMessage(req, res) {
  const { messageId } = req.params;
  const { messageText } = req.body;
  try {
    await messageModel.updateMessage(messageId, messageText);
    res.json({ message: 'Message updated.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function deleteMessage(req, res) {
  const { messageId } = req.params;
  try {
    await messageModel.deleteMessage(messageId);
    res.json({ message: 'Message deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  sendMessage,
  getConversation,
  updateMessage,
  deleteMessage
};