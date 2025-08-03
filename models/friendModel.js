const sql = require('mssql');
const dbConfig = require('../dbConfig');

// [DATABASE OPERATIONS - FRIEND REQUEST SYSTEM]

// [CREATE] - Inserts a new friend request into database
// Key Points:
// 1. Establishes connection to SQL Server
// 2. Uses parameterized queries to prevent SQL injection
// 3. Sets default status to 'pending'
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

// [READ] - Gets all accepted friends for a user
// Key Points:
// 1. Handles bidirectional friendships (A->B and B->A)
// 2. Uses CASE statement to normalize friend IDs
// 3. Only returns 'accepted' status relationships
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

// [UPDATE] - Changes request status (accept/reject)
// Key Points:
// 1. Updates single record identified by FriendID
// 2. Status can be 'accepted' or 'rejected'
// 3. Affects the notification system
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

// [DELETE] - Removes friendship completely
// Key Points:
// 1. Deletes relationship in both directions
// 2. Uses two conditions in WHERE clause
// 3. Important for privacy/cleanup functionality
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

// [READ] - Gets pending requests received by user
// Key Points:
// 1. Used for "Friend Requests" notification badge
// 2. Only shows requests where current user is recipient
// 3. Returns full request details for display
async function getIncomingRequests(userId) {
  const pool = await sql.connect(dbConfig);
  return pool.request()
    .input('UserID', sql.NVarChar, userId)
    .query(
      `SELECT * FROM Friends WHERE FriendUserID = @UserID AND Status = 'pending'`
    );
}

// [READ] - Gets pending requests sent by user
// Key Points:
// 1. Shows "Pending" status in UI
// 2. Helps users track outgoing requests
// 3. Mirrors structure of getIncomingRequests
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