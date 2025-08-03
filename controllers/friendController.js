const sql = require('mssql');
const dbConfig = require('../dbConfig');
const friendModel = require('../models/friendModel');

// [FRIEND REQUEST FEATURE - CREATE OPERATION]
// This handles sending a new friend request from one user to another
// Key points :
// 1. Validates that users can't friend themselves
// 2. Calls the model to insert the request into database
// 3. Returns appropriate success/error responses
async function sendFriendRequest(req, res) {
  // Extract user IDs from request body
  const { userID: userId, friendUserID: friendId } = req.body;
  console.log("Send Friend Request:", { userId, friendId });

  // Validation: Prevent self-friending
  if (userId === friendId) {
    return res.status(400).json({ error: "You cannot add yourself as a friend." });
  }

  try {
    // Database operation through the model
    await friendModel.sendFriendRequest(userId, friendId);
    console.log("Friend request inserted successfully.");
    res.status(201).json({ message: 'Friend request sent.' });
  } catch (err) {
    console.error("Error sending friend request:", err);
    res.status(500).json({ error: err.message });
  }
}

// [FRIENDS LIST FEATURE - READ OPERATION]
// Gets all accepted friends for a user
// Key points:
// 1. Takes userID from URL params
// 2. Fetches friend relationships from database
// 3. Returns array of friend objects
async function getFriends(req, res) {
  const userId = parseInt(req.params.userId);
  try {
    console.log("Fetching friends for userID:", userId);
    const friends = await friendModel.getFriends(userId);
    console.log("Friends found:", friends);
    res.json(friends);
  } catch (error) {
    console.error("Error in getFriends:", error);
    res.status(500).json({ error: "Server error" });
  }
}

// [FRIEND REQUEST RESPONSE FEATURE - UPDATE OPERATION]
// Handles accepting/rejecting incoming friend requests
// Key points:
// 1. Uses friendId from URL params to identify which request
// 2. Status ('accepted'/'rejected') comes from request body
// 3. Updates the request status in database
async function respondToFriendRequest(req, res) {
  const friendId = parseInt(req.params.friendId);
  const { status } = req.body;
  try {
    await friendModel.respondToFriendRequestById(friendId, status);
    res.json({ message: `Friend request ${status}.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// [FRIEND REMOVAL FEATURE - DELETE OPERATION]
// Removes a friend relationship completely
// Key points:
// 1. Takes both user IDs from URL params
// 2. Deletes the friendship record from database
// 3. Works both ways (A->B and B->A)
async function deleteFriend(req, res) {
  try {
    const { userId, friendId } = req.params;
    await friendModel.deleteFriend(parseInt(userId), parseInt(friendId));
    res.json({ message: 'Friend removed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// [INCOMING REQUESTS - READ OPERATION]
// Gets all pending requests sent to the current user
// Key points:
// 1. Shows requests awaiting response
// 2. Used to display "Friend Requests" notification
async function getIncomingRequests(req, res) {
  const userId = req.params.userId;
  try {
    const result = await friendModel.getIncomingRequests(userId);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// [SENT REQUESTS - READ OPERATION]
// Gets all requests the user has sent that are pending
// Key points:
// 1. Shows "Pending" requests in UI
// 2. Helps users track outgoing requests
async function getSentRequests(req, res) {
  const userId = req.params.userId;
  try {
    const result = await friendModel.getSentRequests(userId);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

//update deleteFriend request function
/*
async function deleteFriendRequest(req, res) {
  const requestId = parseInt(req.params.requestId);
  console.log(`Attempting to delete request ID: ${requestId}`);
  
  try {
    const result = await friendModel.deleteFriendRequest(requestId);
    console.log('Delete result:', result);
    
    res.json({ 
      success: true,
      message: 'Friend request deleted successfully',
      deletedId: requestId
    });
  } catch (err) {
    console.error('Delete failed:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
}
*/

module.exports = {
  sendFriendRequest,
  getFriends,
  respondToFriendRequest,
  deleteFriend,
  getIncomingRequests,
  getSentRequests,
};