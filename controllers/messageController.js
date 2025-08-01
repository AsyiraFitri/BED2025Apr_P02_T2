const sql = require('mssql');
const dbConfig = require('../dbConfig');
const messageModel = require('../models/messageModel');

async function sendMessage(req, res) {
  const { senderId, receiverId, messageText } = req.body;
  
  console.log("Received message data:", { senderId, receiverId, messageText });

  // Validate input
  if (!senderId || !receiverId || !messageText) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // Verify friendship exists
    const pool = await sql.connect(dbConfig);
    const friendshipCheck = await pool.request()
      .input('User1', sql.Int, senderId)
      .input('User2', sql.Int, receiverId)
      .query(`
        SELECT * FROM Friends 
        WHERE Status = 'accepted'
        AND ((UserID = @User1 AND FriendUserID = @User2)
          OR (UserID = @User2 AND FriendUserID = @User1))
      `);

    if (friendshipCheck.recordset.length === 0) {
      return res.status(403).json({ error: "You can only message friends" });
    }

    // Store message
    const result = await messageModel.sendMessage(
      parseInt(senderId),
      parseInt(receiverId),
      messageText
    );
    
    console.log("Message stored with ID:", result.recordset[0].MessageID);
    res.status(201).json({ 
      message: 'Message sent successfully',
      messageId: result.recordset[0].MessageID
    });
  } catch (err) {
    console.error("Message sending error:", err);
    res.status(500).json({ 
      error: "Internal server error",
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
}

async function getConversation(req, res) {
  const user1 = parseInt(req.params.user1);
  const user2 = parseInt(req.params.user2);
  
  console.log(`Fetching conversation between ${user1} and ${user2}`);

  try {
    const result = await messageModel.getConversation(user1, user2);
    console.log(`Found ${result.recordset.length} messages`);
    res.json(result.recordset);
  } catch (err) {
    console.error("Conversation error:", err);
    res.status(500).json({ 
      error: err.message,
      details: "Failed to retrieve conversation"
    });
  }
}

async function updateMessage(req, res) {
  const messageId = parseInt(req.params.messageId);
  const { messageText } = req.body;
  try {
    await messageModel.updateMessage(messageId, messageText);
    res.json({ message: 'Message updated.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function deleteMessage(req, res) {
  const messageId = parseInt(req.params.messageId);
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