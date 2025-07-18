const admin = require('firebase-admin');
const jwt = require('jsonwebtoken');

// Initialize Firebase Admin SDK with environment variable
const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_SDK);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://bed-groupchat-api-default-rtdb.firebaseio.com"
});

// Get Firestore instance
const db = admin.firestore();

// Helper function to extract user details from JWT token
function getUserFromToken(token) {
  try {
    if (!token) {
      throw new Error('No token provided');
    }
    
    // Remove 'Bearer ' prefix if present
    const cleanToken = token.startsWith('Bearer ') ? token.slice(7) : token;
    
    // Verify and decode JWT token
    const decoded = jwt.verify(cleanToken, process.env.JWT_SECRET_KEY);
    
    return {
      userId: decoded.UserID,
      userName: `${decoded.first_name} ${decoded.last_name}`.trim(),
      email: decoded.email,
      firstName: decoded.first_name,
      lastName: decoded.last_name
    };
  } catch (error) {
    console.error('Error extracting user from token:', error);
    throw new Error('Invalid or expired token');
  }
}

// Create a message in a specific channel
async function createMessage(channelId, messageText, groupId, channelName, token) {
  try {
    // Get user details from JWT token
    const user = getUserFromToken(token);
    
    const groupMessageRef = db.collection('groupMessage').doc('NvOli6bXb837LgM9eSJh');

    const messageData = {
      channelId: channelId,
      text: messageText,
      userId: user.userId,
      userName: user.userName,
      userEmail: user.email,
      groupId: groupId,
      channelName: channelName,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await groupMessageRef.collection('messages').add(messageData);


    await groupMessageRef.set({
      lastActivity: admin.firestore.FieldValue.serverTimestamp(),
      lastMessage: messageText,
      lastMessageBy: user.userName
    }, { merge: true });

    return docRef.id;
  } catch (error) {
    console.error('Error creating message:', error);
    throw error;
  }
}

// Get messages from a specific channel
async function getMessages(channelId) {
  const parentDocId = 'NvOli6bXb837LgM9eSJh';

  const subCollectionRef = db
    .collection('groupMessage')
    .doc(parentDocId)
    .collection('messages');

  const snapshot = await subCollectionRef
    .where('channelId', '==', channelId)
    .get();

  const filteredMessages = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));

  console.log(filteredMessages);
  return filteredMessages;
}

// Create a new channel
async function createChannel(groupId, channelName, token) {
  try {
    // Get user details from JWT token
    const user = getUserFromToken(token);
    
    const channelRef = db.collection('channels').doc(`${groupId}_${channelName}`);
    await channelRef.set({
      groupId,
      channelName,
      createdBy: user.userId,
      createdByName: user.userName,
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
  createChannel,
  getUserFromToken
};