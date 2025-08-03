// Controller for Firebase chat functionality
require('dotenv').config();

// Get messages from Firebase for a channel
const getFirebaseMessages = async (req, res) => {
    try {
        const { groupId, channelName } = req.params;
        const channelId = `${groupId}_${channelName}`;
        const messages = await require('../public/js/firebaseChat').getMessages(channelId);
        res.json(messages);
    } catch (error) {
        console.error('Error getting messages:', error);
        res.status(500).json({ error: error.message });
    }
};

// Post a new message to Firebase for a channel
const postFirebaseMessage = async (req, res) => {
    try {
        const { groupId, channelName } = req.params;
        const { message } = req.body;
        const channelId = `${groupId}_${channelName}`;
        const token = req.headers.authorization;
        if (!token) {
            return res.status(401).json({ error: 'No authorization token provided' });
        }
        const messageId = await require('../public/js/firebaseChat').createMessage(channelId, message, groupId, channelName, token);
        res.json({ success: true, messageId });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ error: error.message });
    }
};

// Edit/update an existing message in Firebase
const updateFirebaseMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        const { newText, groupId, channelName } = req.body;
        const token = req.headers.authorization;
        if (!token) {
            return res.status(401).json({ error: 'No authorization token provided' });
        }
        if (!newText || !newText.trim()) {
            return res.status(400).json({ error: 'Message text is required' });
        }
        const result = await require('../public/js/firebaseChat').updateMessage(messageId, newText.trim(), token, groupId, channelName);
        res.json(result);
    } catch (error) {
        console.error('Error updating message:', error);
        res.status(500).json({ error: error.message });
    }
};

// Delete a message from Firebase
const deleteFirebaseMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        const { groupId, channelName } = req.body;
        const token = req.headers.authorization;
        if (!token) {
            return res.status(401).json({ error: 'No authorization token provided' });
        }
        const result = await require('../public/js/firebaseChat').deleteMessage(messageId, token, groupId, channelName);
        res.json(result);
    } catch (error) {
        console.error('Error deleting message:', error);
        res.status(500).json({ error: error.message });
    }
};

// Serve Firebase client configuration
const getConfig = (req, res) => {
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
};

module.exports = {
    getFirebaseMessages,
    postFirebaseMessage,
    updateFirebaseMessage,
    deleteFirebaseMessage,
    getConfig
};
