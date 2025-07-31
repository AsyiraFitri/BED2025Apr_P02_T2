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
  const result = await pool.request()
    .input('UserID', sql.Int, userId)
    .query(`
      SELECT 
        CASE 
          WHEN UserID = @UserID THEN FriendUserID 
          ELSE UserID 
        END AS FriendUserID
      FROM Friends
      WHERE Status = 'accepted' 
        AND (UserID = @UserID OR FriendUserID = @UserID);
    `);
  return result.recordset; // Array of { FriendUserID }
}

// Respond to friend request
async function respondToFriendRequestById(friendId, status) {
  const pool = await sql.connect(dbConfig);
  return pool.request()
    .input('FriendID', sql.Int, friendId)
    .input('Status', sql.NVarChar, status)
    .query(`
      UPDATE Friends
      SET Status = @Status
      WHERE FriendID = @FriendID
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

async function getIncomingRequests(userId) {
  const pool = await sql.connect(dbConfig);
  return pool.request()
    .input('UserID', sql.NVarChar, userId)
    .query(
      `SELECT * FROM Friends WHERE FriendUserID = @UserID AND Status = 'pending'`
    );
}

async function getSentRequests(userId) {
  const pool = await sql.connect(dbConfig);
  return pool.request()
    .input('UserID', sql.NVarChar, userId)
    .query(
      `SELECT * FROM Friends WHERE UserID = @UserID AND Status = 'pending'`
    );
}



module.exports = {
  sendFriendRequest,
  getFriends,
  respondToFriendRequestById,
  deleteFriend,
  getIncomingRequests,
  getSentRequests
};