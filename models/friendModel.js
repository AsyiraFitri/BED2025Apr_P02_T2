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
        END AS FriendID,
        Status
      FROM Friends
      WHERE Status = 'accepted' 
        AND (UserID = @UserID OR FriendUserID = @UserID)
    `);
  return result.recordset;
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
  await pool.request()
    .input('User1', sql.Int, userId)
    .input('User2', sql.Int, friendId)
    .query(`
      DELETE FROM Friends 
      WHERE (UserID = @User1 AND FriendUserID = @User2)
         OR (UserID = @User2 AND FriendUserID = @User1)
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

//update deleteFriend request function
/*
async function deleteFriendRequest(requestId) {
  const pool = await sql.connect(dbConfig);
  try {
    // First verify the record exists
    const verify = await pool.request()
      .input('FriendID', sql.Int, requestId)
      .query('SELECT 1 FROM Friends WHERE FriendID = @FriendID');
    
    if (verify.recordset.length === 0) {
      throw new Error(`No record found with FriendID: ${requestId}`);
    }

    // Then delete it
    const result = await pool.request()
      .input('FriendID', sql.Int, requestId)
      .query('DELETE FROM Friends WHERE FriendID = @FriendID');

    if (result.rowsAffected[0] === 0) {
      throw new Error('Delete operation affected 0 rows');
    }

    return { 
      success: true, 
      deletedId: requestId,
      rowsAffected: result.rowsAffected[0]
    };
  } finally {
    await pool.close();
  }
}
*/


module.exports = {
  sendFriendRequest,
  getFriends,
  respondToFriendRequestById,
  deleteFriend,
  getIncomingRequests,
  getSentRequests,
};