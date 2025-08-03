const sql = require('mssql');
const dbConfig = require('../dbConfig');

// [CREATE] - Stores a new message in the database
// Key Points:
// 1. Uses OUTPUT clause to return the newly created MessageID
// 2. Records sender, receiver, message text and automatic timestamp
// 3. Returns the complete result object for error handling
async function sendMessage(senderId, receiverId, messageText) {
  const pool = await sql.connect(dbConfig);
  const result = await pool.request()
    .input("SenderID", sql.Int, senderId)
    .input("ReceiverID", sql.Int, receiverId)
    .input('MessageText', sql.NVarChar, messageText)
    .query(`
      INSERT INTO Messages (SenderID, ReceiverID, MessageText)
      OUTPUT INSERTED.MessageID
      VALUES (@SenderID, @ReceiverID, @MessageText)
    `);
  
  console.log("Message stored with ID:", result.recordset[0].MessageID);
  return result;
}

// [READ] - Retrieves full conversation history
// Key Points:
// 1. Gets messages in both directions (A→B and B→A)
// 2. Orders by timestamp for chronological display
// 3. Returns all message fields for display
async function getConversation(user1, user2) {
  const pool = await sql.connect(dbConfig);
  return pool.request()
    .input('User1', sql.Int, user1)
    .input('User2', sql.Int, user2)
    .query(`
      SELECT * FROM Messages
      WHERE (SenderID = @User1 AND ReceiverID = @User2)
         OR (SenderID = @User2 AND ReceiverID = @User1)
      ORDER BY Timestamp ASC
    `);
}

// [UPDATE] - Modifies an existing message
// Key Points:
// 1. Updates only the message text (timestamp auto-updates)
// 2. Uses precise MessageID targeting
// 3. Could be extended to track edit history
async function updateMessage(messageId, newText) {
  const pool = await sql.connect(dbConfig);
  const result = await pool.request()
    .input('MessageID', sql.Int, messageId)
    .input('MessageText', sql.NVarChar, newText)
    .query(`
      UPDATE Messages 
      SET MessageText = @MessageText
      WHERE MessageID = @MessageID
    `);
  return result;
}

// [DELETE] - Permanently removes a message
// Key Points:
// 1. Hard delete (consider soft delete for production)
// 2. Minimal operation targeting only by MessageID
// 3. Could add archival system for deleted messages
async function deleteMessage(messageId) {
  const pool = await sql.connect(dbConfig);
  const result = await pool.request()
    .input('MessageID', sql.Int, messageId)
    .query(`DELETE FROM Messages WHERE MessageID = @MessageID`);
  return result;
}

module.exports = {
  sendMessage,
  getConversation,
  updateMessage,
  deleteMessage
};