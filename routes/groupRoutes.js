const express = require('express');
const router = express.Router();
const controller = require('../controllers/groupController');
const validateGroup = require('../middlewares/validateGroup');
require('dotenv').config();

const firebaseAdmin = require('../public/js/firebaseChat'); 

// Routes
router.get('/checkMembership/:groupId/:userId', controller.checkMembership);
router.get('/memberCount/:groupId', controller.getMemberCount);
router.get('/memberList/:groupId', controller.getMemberList);
router.get('/channels/:groupId', controller.getChannels);
router.patch('/saveDesc', controller.saveDesc);
router.post('/createChannel', controller.createChannel);
router.delete('/deleteChannel', controller.deleteChannel);
router.delete('/deleteCommunity', controller.deleteCommunity);
router.post('/leaveGroup', controller.leaveGroup);

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
    const { message, userId, userName } = req.body;
    const channelId = `${groupId}_${channelName}`;
    const messageData = {
      text: message,
      userId: userId,
      userName: userName,
      groupId: groupId,
      channelName: channelName
    };
    
    const messageId = await firebaseAdmin.createMessage(channelId, messageData);
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