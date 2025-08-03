const sql = require('mssql');
const dbConfig = require('../dbConfig');
const messageModel = require('../models/messageModel');
const { translateText } = require('./translationService');

// [CREATE] - Send a new message between users
// Key Points:
// 1. Validates all required fields are present
// 2. Verifies users are friends before allowing messaging
// 3. Stores message in database and returns the new message ID
async function sendMessage(req, res) {
  const { senderId, receiverId, messageText } = req.body;
  
  console.log("Received message data:", { senderId, receiverId, messageText });

  // Validate input
  if (!senderId || !receiverId || !messageText) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // Verify friendship exists before allowing messaging
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

    // Store message in database
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

// [READ] - Get entire conversation between two users
// Key Points:
// 1. Takes both user IDs as parameters
// 2. Returns all messages in chronological order
// 3. Used to display the chat history
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

// [UPDATE] - Edit an existing message
// Key Points:
// 1. Verifies message exists before updating
// 2. In production, would verify user owns the message
// 3. Updates both message text and timestamp
async function updateMessage(req, res) {
  const messageId = parseInt(req.params.messageId);
  const { messageText } = req.body;

  console.log(`Updating message ${messageId} with text: "${messageText}"`);

  if (!messageText) {
    return res.status(400).json({ error: "Message text is required" });
  }

  try {
    const pool = await sql.connect(dbConfig);
    
    // Security check: Verify message exists
    const verifyRes = await pool.request()
      .input('MessageID', sql.Int, messageId)
      .query('SELECT SenderID FROM Messages WHERE MessageID = @MessageID');

    if (verifyRes.recordset.length === 0) {
      return res.status(404).json({ error: "Message not found" });
    }

    // Update the message
    await messageModel.updateMessage(messageId, messageText);
    
    res.json({ 
      message: 'Message updated successfully',
      updatedMessageId: messageId
    });
  } catch (err) {
    console.error("Update message error:", err);
    res.status(500).json({ 
      error: "Failed to update message",
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
}

// [DELETE] - Remove a message
// Key Points:
// 1. Similar security checks as update
// 2. Completely removes message from database
// 3. Could be enhanced with "soft delete" (isDeleted flag)
async function deleteMessage(req, res) {
  const messageId = parseInt(req.params.messageId);

  console.log(`Deleting message ${messageId}`);

  try {
    const pool = await sql.connect(dbConfig);
    
    // Security check: Verify message exists
    const verifyRes = await pool.request()
      .input('MessageID', sql.Int, messageId)
      .query('SELECT SenderID FROM Messages WHERE MessageID = @MessageID');

    if (verifyRes.recordset.length === 0) {
      return res.status(404).json({ error: "Message not found" });
    }

    // Delete the message
    await messageModel.deleteMessage(messageId);
    
    res.json({ 
      message: 'Message deleted successfully',
      deletedMessageId: messageId
    });
  } catch (err) {
    console.error("Delete message error:", err);
    res.status(500).json({ 
      error: "Failed to delete message",
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
}

// [BONUS FEATURE] - Message Translation
// Key Points:
// 1. Uses external translation service
// 2. Preserves original message while returning translation
// 3. Handles language detection automatically
async function translateMessage(req, res) {
  try {
    const { messageId } = req.params;
    const { text } = req.body;

    // Validate input
    if (!text || typeof text !== 'string') {
      return res.status(400).json({
        status: 'error',
        error: 'Invalid input',
        details: 'Text must be a non-empty string'
      });
    }

    console.log(`Translation request for message ${messageId}`);

    // Call translation service
    const translation = await translateText(text);
    
    // Return both original and translated text
    return res.json({
      status: 'success',
      translation: {
        originalText: text,
        translatedText: translation.translatedText,
        sourceLanguage: translation.sourceLanguage,
        targetLanguage: translation.targetLanguage
      }
    });

  } catch (err) {
    console.error('Translation error:', err);
    return res.status(500).json({
      status: 'error',
      error: 'Translation failed',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
}

module.exports = {
  sendMessage,
  getConversation,
  updateMessage,
  deleteMessage,
  translateMessage
};