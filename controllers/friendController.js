const friendModel = require('../models/friendModel');

async function sendFriendRequest(req, res) {
  const { userId, friendId } = req.body;
  //Prevent user from sending a friend request to themselves
  if (userId === friendId) {
    return res.status(400).json({ error: "You cannot add yourself as a friend." });
  }
  try {
    await friendModel.sendFriendRequest(userId, friendId);
    res.status(201).json({ message: 'Friend request sent.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getFriends(req, res) {
  const userId = req.params.userId;
  try {
    const result = await friendModel.getFriends(userId);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function respondToFriendRequest(req, res) {
  const { userId, friendUserId, status } = req.body;
  try {
    await friendModel.respondToFriendRequest(userId, friendUserId, status);
    res.json({ message: `Friend request ${status}.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function deleteFriend(req, res) {
  const { userId, friendId } = req.params;
  try {
    await friendModel.deleteFriend(userId, friendId);
    res.json({ message: 'Friend removed.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  sendFriendRequest,
  getFriends,
  respondToFriendRequest,
  deleteFriend
};