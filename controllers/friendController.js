const sql = require('mssql');
const dbConfig = require('../dbConfig');
const friendModel = require('../models/friendModel');

async function sendFriendRequest(req, res) {
  const { userID: userId, friendUserID: friendId } = req.body;
  console.log("Send Friend Request:", { userId, friendId });

  if (userId === friendId) {
    return res.status(400).json({ error: "You cannot add yourself as a friend." });
  }

  try {
    await friendModel.sendFriendRequest(userId, friendId);
    console.log("Friend request inserted successfully.");
    res.status(201).json({ message: 'Friend request sent.' });
  } catch (err) {
    console.error("Error sending friend request:", err);
    res.status(500).json({ error: err.message });
  }
}

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

async function deleteFriend(req, res) {
  try {
    const { userId, friendId } = req.params;
    await friendModel.deleteFriend(parseInt(userId), parseInt(friendId));
    res.json({ message: 'Friend removed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getIncomingRequests(req, res) {
  const userId = req.params.userId;
  try {
    const result = await friendModel.getIncomingRequests(userId);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

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