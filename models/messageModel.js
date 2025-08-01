const sql = require('mssql');
const dbConfig = require('../dbConfig');

// Create a new message
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

// Get message history between two users
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

// Update a specific message
async function updateMessage(messageId, newText) {
  const pool = await sql.connect(dbConfig);
  return pool.request()
    .input('MessageID', sql.Int, messageId)
    .input('MessageText', sql.NVarChar, newText)
    .query(`
      UPDATE Messages SET MessageText = @MessageText
      WHERE MessageID = @MessageID
    `);
}

// Delete a specific message
async function deleteMessage(messageId) {
  const pool = await sql.connect(dbConfig);
  return pool.request()
    .input('MessageID', sql.Int, messageId)
    .query(`DELETE FROM Messages WHERE MessageID = @MessageID`);
}

module.exports = {
  sendMessage,
  getConversation,
  updateMessage,
  deleteMessage
};