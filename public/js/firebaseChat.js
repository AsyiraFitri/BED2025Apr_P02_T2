const admin = require('firebase-admin');

// Initialize Firebase Admin SDK with environment variable
const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_SDK);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://bed-groupchat-api-default-rtdb.firebaseio.com"
});

// Get Firestore instance
const db = admin.firestore();

// Create a message in a specific channel
async function createMessage(channelId, message) {
  try {
    const groupMessageRef = db.collection('groupMessage').doc('NvOli6bXb837LgM9eSJh');

    const messageData = {
      channelId: channelId,
      text: message.text,
      userId: message.userId,
      userName: message.userName,
      groupId: message.groupId,
      channelName: message.channelName,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await groupMessageRef.collection('messages').add(messageData);

    await groupMessageRef.set({
      lastActivity: admin.firestore.FieldValue.serverTimestamp(),
      lastMessage: message.text
    }, { merge: true });

    return docRef.id;
  } catch (error) {
    console.error('Error creating message:', error);
    throw error;
  }
}

// Get messages from a specific channel
async function getMessages(channelId, limit = 50) {
  try {
    const snapshot = await db.collection(channelId)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    if (!snapshot || !snapshot.docs) {
      console.log('No messages found for channel:', channelId);
      return [];
    }

    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log('Messages retrieved:', messages);
    return messages;
  } catch (error) {
    console.error('Error getting messages:', error);
    return [];
  }
}

// Create a new channel
async function createChannel(groupId, channelName) {
  try {
    const channelRef = db.collection('channels').doc(`${groupId}_${channelName}`);
    await channelRef.set({
      groupId,
      channelName,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    return channelRef.id;
  } catch (error) {
    console.error('Error creating channel:', error);
    throw error;
  }
}

module.exports = {
  admin,
  db,
  createMessage,
  getMessages,
  createChannel
};
