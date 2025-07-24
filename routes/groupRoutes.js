const express = require('express');
const router = express.Router();
const controller = require('../controllers/groupController');
const { validateGroupOwnership, preventAdminLeaveGroup, validateGroupOwnershipForDelete, validateEvent, validateChannel } = require('../middlewares/validateGroup');
const { verifyToken } = require('../middlewares/authorizeUser');
require('dotenv').config();

// Update an event by eventId (protected, admin/owner only)
router.patch('/events/:eventId', verifyToken, validateGroupOwnership, validateEvent, async (req, res) => {
  try {
    const eventId = req.params.eventId;
    const { groupId, title, description, eventDate, startTime, endTime, location } = req.body;
    if (!groupId || !title || !description || !eventDate || !startTime || !endTime || !location) {
      return res.status(400).json({ error: 'Missing required event fields.' });
    }
    // Call the model function to update the event
    await groupModel.updateEvent(eventId, groupId, title, description, eventDate, startTime, endTime, location);
    res.json({ success: true, message: 'Event updated successfully.' });
  } 
  catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ error: error.message });
  }
});

// Import Firebase admin module for real-time chat functionality
const firebaseAdmin = require('../public/js/firebaseChat'); 

// Check if a user is a member of a specific group
router.get('/checkMembership/:groupId', verifyToken, controller.checkMembership);

// Get the total number of members in a group
router.get('/memberCount/:groupId', controller.getMemberCount);

// Get a list of all members in a group with their roles
router.get('/memberList/:groupId', controller.getMemberList);

// Get all channels for a specific group
router.get('/channels/:groupId', controller.getChannels);

// Update group description (owner only)
router.patch('/saveDesc', verifyToken, validateGroupOwnership, controller.saveDesc);

// Create a new channel in a group (owner only)
router.post('/createChannel', verifyToken, validateGroupOwnership, validateChannel, controller.createChannel);

// Delete a channel from a group (owner only)
router.delete('/deleteChannel', verifyToken, validateGroupOwnership, controller.deleteChannel);

// Create a new event in a group (owner only)
const groupModel = require('../models/groupModel');
router.post('/createEvent', verifyToken, validateGroupOwnership, validateEvent, async (req, res) => {
  try {
    const {
      groupId, channelName, title, description, eventDate, startTime, endTime, location
    } = req.body;
    
    const user = req.user; // Populated by verifyToken middleware
    if (!groupId || !title || !eventDate || !startTime || !endTime || !location) {
      return res.status(400).json({ error: 'Missing required event fields.' });
    }
    const creatorId = user.UserID || user.userId;

    // Call the model function with all fields
    await groupModel.createEvent(groupId, channelName, title, description, eventDate, startTime, endTime, location, creatorId);
    res.json({ success: true, message: 'Event created successfully.' });
  } 
  catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete community/group (owner only)
router.delete('/deleteCommunity', verifyToken, validateGroupOwnershipForDelete, async (req, res) => {
  try {
    await controller.deleteCommunity(req, res);
  } 
  catch (error) {
    // If forbidden, show custom message
    if (error && error.status === 403) {
      return res.status(403).json({ error: 'No access: Only the group owner can delete this group.' });
    }
    // Otherwise, show generic error
    res.status(500).json({ error: error.message || 'Failed to delete community.' });
  }
});

// Restrictions: Admins cannot leave groups as they monitor and maintain oversight
// Only members can leave group
router.post('/leaveGroup', verifyToken, preventAdminLeaveGroup, controller.leaveGroup);

// GET messages from a specific channel in a group
// Route: GET /api/groups/firebase/channels/:groupId/:channelName
// Description: Retrieves all messages from a Firebase collection for the specified channel
router.get('/firebase/channels/:groupId/:channelName', async (req, res) => {
  try {
    const { groupId, channelName } = req.params;
    
    // Create unique channel identifier by combining groupId and channelName
    const channelId = `${groupId}_${channelName}`;
    
    // Fetch messages from Firebase using the admin module
    const messages = await firebaseAdmin.getMessages(channelId);
    
    // Return messages as JSON response
    res.json(messages);
  } 
  catch (error) {
    console.error('Error getting messages:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST a new message to a specific channel in a group
// Route: POST /api/groups/firebase/channels/:groupId/:channelName
// Description: Creates a new message in Firebase with user authentication
router.post('/firebase/channels/:groupId/:channelName', async (req, res) => {
  try {
    const { groupId, channelName } = req.params;
    const { message } = req.body;
    
    // Create unique channel identifier
    const channelId = `${groupId}_${channelName}`;
    
    // Extract JWT token from Authorization header for user identification
    const token = req.headers.authorization;
    
    // Validate that authorization token is provided
    if (!token) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }
    
    // Create message in Firebase with user context from JWT token
    const messageId = await firebaseAdmin.createMessage(channelId, message, groupId, channelName, token);
    
    // Return success response with the created message ID
    res.json({ success: true, messageId });
  } 
  catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT route to edit/update an existing message
// Route: PUT /api/groups/firebase/messages/:messageId
// Description: Updates the text content of an existing message (user must own the message)
router.put('/firebase/messages/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;
    const { newText, groupId, channelName } = req.body;
    
    // Extract JWT token for user authentication and ownership verification
    const token = req.headers.authorization;
    
    // Validate authorization token
    if (!token) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }
    
    // Validate that new message text is provided and not empty
    if (!newText || !newText.trim()) {
      return res.status(400).json({ error: 'Message text is required' });
    }
    
    // Update message in Firebase with ownership verification
    const result = await firebaseAdmin.updateMessage(messageId, newText.trim(), token, groupId, channelName);
    
    res.json(result);
  } 
  catch (error) {
    console.error('Error updating message:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE route to remove an existing message
// Route: DELETE /api/groups/firebase/messages/:messageId
// Description: Permanently deletes a message from Firebase (user must own the message)
router.delete('/firebase/messages/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;
    const { groupId, channelName } = req.body;
    
    // Extract JWT token for user authentication and ownership verification
    const token = req.headers.authorization;
    
    // Validate authorization token
    if (!token) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }
    
    // Delete message from Firebase with ownership verification
    const result = await firebaseAdmin.deleteMessage(messageId, token, groupId, channelName);
    
    res.json(result);
  } 
  catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET Firebase configuration for frontend initialization
// Route: GET /api/groups/firebase-config
// Description: Provides Firebase client configuration from environment variables
router.get('/firebase-config', (req, res) => {
  // Construct Firebase configuration object from environment variables
  const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID,
    measurementId: process.env.FIREBASE_MEASUREMENT_ID
  };
  
  // Send configuration as JSON response
  res.json(firebaseConfig);
});

// Delete an event by eventId (protected)
router.delete('/events/:eventId', verifyToken, async (req, res) => {
  try {
    const eventId = req.params.eventId;
    await groupModel.deleteEvent(eventId);
    res.json({ success: true, message: 'Event deleted successfully.' });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all events for a group
router.get('/events/:groupId', async (req, res) => {
  try {
    const groupId = req.params.groupId;
    const events = await groupModel.getEvents(groupId);
    res.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user details by userId (for event author display)
router.get('/user/:userId', controller.getUserDetailsById);

module.exports = router;