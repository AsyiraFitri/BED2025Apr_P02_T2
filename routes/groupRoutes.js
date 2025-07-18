const express = require('express');
const router = express.Router();
const controller = require('../controllers/groupController');
const { validateGroup, validateGroupOwnership } = require('../middlewares/validateGroup');
const { verifyToken } = require('../middlewares/authorizeUser');
require('dotenv').config();

const firebaseAdmin = require('../public/js/firebaseChat'); 

// Routes
router.get('/checkMembership/:groupId', verifyToken, controller.checkMembership);
router.get('/memberCount/:groupId', controller.getMemberCount);
router.get('/memberList/:groupId', controller.getMemberList);
router.get('/channels/:groupId', controller.getChannels);
router.patch('/saveDesc', verifyToken, validateGroupOwnership, controller.saveDesc); // Only owner can change description
router.post('/createChannel', verifyToken, validateGroupOwnership, controller.createChannel); // Only owner can create channels
router.delete('/deleteChannel', verifyToken, validateGroupOwnership, controller.deleteChannel); // Only owner can delete channels
router.delete('/deleteCommunity', verifyToken, validateGroupOwnership, controller.deleteCommunity); // Only owner can delete group
router.post('/leaveGroup', verifyToken, controller.leaveGroup);

router.get('/firebase/channels/:groupId/:channelName', async (req, res) => {
  try {
    const { groupId, channelName } = req.params;
    const channelId = `${groupId}_${channelName}`;
    const messages = await firebaseAdmin.getMessages(channelId);
    res.json(messages);
  } catch (error) {
    console.error('Error getting messages:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/firebase/channels/:groupId/:channelName', async (req, res) => {
  try {
    const { groupId, channelName } = req.params;
    const { message } = req.body;
    const channelId = `${groupId}_${channelName}`;
    const token = req.headers.authorization; // Get JWT token from Authorization header
    
    if (!token) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }
    
    const messageId = await firebaseAdmin.createMessage(channelId, message, groupId, channelName, token);
    res.json({ success: true, messageId });
  } 
  catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: error.message });
  }
});

// Serve Firebase configuration to frontend
router.get('/firebase-config', (req, res) => {
  const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID,
    measurementId: process.env.FIREBASE_MEASUREMENT_ID
  };
  
  res.json(firebaseConfig);
});

module.exports = router;