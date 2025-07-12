const sql = require('mssql');
const dbConfig = require('../dbConfig');

// Send friend request
async function sendFriendRequest(userId, friendId) {
  const pool = await sql.connect(dbConfig);
  return pool.request()
    .input('UserID', sql.NVarChar, userId)
    .input('FriendUserID', sql.NVarChar, friendId)
    .input('Status', sql.NVarChar, 'pending')
    .query(`
      INSERT INTO Friends (UserID, FriendUserID, Status)
      VALUES (@UserID, @FriendUserID, @Status)
    `);
}

// Get friends and pending requests
async function getFriends(userId) {
  const pool = await sql.connect(dbConfig);
  return pool.request()
    .input('UserID', sql.NVarChar, userId)
    .query(`
      SELECT * FROM Friends 
      WHERE (UserID = @UserID OR FriendUserID = @UserID)
    `);
}

// Respond to friend request
async function respondToFriendRequest(userId, friendUserId, status) {
  const pool = await sql.connect(dbConfig);
  return pool.request()
    .input('UserID', sql.NVarChar, userId)
    .input('FriendUserID', sql.NVarChar, friendUserId)
    .input('Status', sql.NVarChar, status)
    .query(`
      UPDATE Friends
      SET Status = @Status
      WHERE UserID = @UserID AND FriendUserID = @FriendUserID
    `);
}

// Delete friend
async function deleteFriend(userId, friendId) {
  const pool = await sql.connect(dbConfig);
  return pool.request()
    .input('UserID', sql.NVarChar, userId)
    .input('FriendUserID', sql.NVarChar, friendId)
    .query(`
      DELETE FROM Friends 
      WHERE (UserID = @UserID AND FriendUserID = @FriendUserID)
         OR (UserID = @FriendUserID AND FriendUserID = @UserID)
    `);
}

module.exports = {
  sendFriendRequest,
  getFriends,
  respondToFriendRequest,
  deleteFriend
};