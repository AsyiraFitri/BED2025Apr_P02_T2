// Loads group details when the page loads
async function loadGroupDetails() {
  const params = new URLSearchParams(window.location.search);
  const groupId = params.get('id');

  if (!groupId) {
    document.getElementById('groupTitle').textContent = 'No group selected.';
    return;
  }

  try {
    const res = await fetch(`/api/hobby-groups/${groupId}`);
    if (!res.ok) throw new Error('Group not found');

    const group = await res.json();

    // Determine if the current user is the group owner or admin
    const user = JSON.parse(sessionStorage.getItem("user"));
    const userId = user.UserID;
    const userRole = user.role;
    
    // Check if user is owner or admin
    const isOwner = group.OwnerID === userId;
    const isAdmin = userRole === 'admin';
    const hasAdminPrivileges = isOwner || isAdmin;
    
    if (!hasAdminPrivileges) {
      // Hide admin-only buttons for regular users
      document.getElementById('editDescBtn').classList.add('hidden');
      document.getElementById('saveDescBtn').classList.add('hidden');
      document.getElementById('cancelDescBtn').classList.add('hidden');
      document.getElementById('deleteCommunityBtn').classList.add('hidden');
      document.getElementById('channelsSection').style.display = 'none';
      document.getElementById('leaveCommunityBtn').classList.remove('hidden');
    } 
    else {
      // Show admin options for owners and admins
      document.getElementById('editDescBtn').classList.remove('hidden');
      document.getElementById('saveDescBtn').classList.add('hidden');
      document.getElementById('cancelDescBtn').classList.add('hidden');
      document.getElementById('deleteCommunityBtn').classList.remove('hidden');
      document.getElementById('channelsSection').style.display = 'block';
      document.getElementById('leaveCommunityBtn').classList.add('hidden');
    }

    // Display group name and description
    document.getElementById('groupTitle').textContent = group.GroupName;
    document.getElementById('groupDesc').textContent = group.GroupDescription;
    document.getElementById('descriptionText').textContent = group.GroupDescription;
    document.getElementById('descriptionTextarea').value = group.GroupDescription;
    document.querySelector('.settings-title').textContent = group.GroupName;

    // Load member count and list
    await loadMemberCount(groupId);
    await loadMemberList(groupId);
    
    // Load channels for sidebar and settings
    await loadChannels(groupId);
  } 
  catch (err) {
    document.getElementById('groupTitle').textContent = 'Error loading group.';
  }
}

// Fetch and display the total number of group members
async function loadMemberCount(groupId) {
  try {
    const res = await fetch(`/api/groups/memberCount/${groupId}`);
    if (!res.ok) throw new Error('Failed to fetch member count');
    const data = await res.json();
    const memberText = data.memberCount === 1 ? '1 member' : `${data.memberCount} members`;
    document.getElementById('noMembers').textContent = memberText;
  } 
  catch (error) {
    document.getElementById('noMembers').textContent = '0 members';
  }
}

// Fetch and display a list of group members with their roles
async function loadMemberList(groupId) {
  try {
    const res = await fetch(`/api/groups/memberList/${groupId}`);
    if (!res.ok) throw new Error('Failed to fetch member list');
    const data = await res.json();
    const membersList = document.querySelector('.members-list');
    membersList.innerHTML = ''; // Clear list before rendering

    if (data.members && data.members.length > 0) {
      data.members.forEach((member, index) => {
        const listItem = document.createElement('li');
        listItem.className = 'member-item';
        listItem.style.display = 'flex';
        listItem.style.justifyContent = 'space-between';
        listItem.style.alignItems = 'center';

        const nameSpan = document.createElement('span');
        nameSpan.textContent = `${index + 1}. ${member.name}`;

        const roleSpan = document.createElement('span');
        roleSpan.textContent = member.role;
        roleSpan.style.fontWeight = 'bold';
        roleSpan.style.color = member.role === 'Owner' ? '#ff6b35' : '#666';

        listItem.appendChild(nameSpan);
        listItem.appendChild(roleSpan);
        membersList.appendChild(listItem);
      });
    } 
    else {
      // Show message if no members
      const listItem = document.createElement('li');
      listItem.className = 'member-item';
      listItem.textContent = 'No members yet';
      membersList.appendChild(listItem);
    }
  } 
  catch (error) {
    document.querySelector('.members-list').innerHTML = '<li class="member-item">Error loading members</li>';
  }
}

// Load channels for the group
async function loadChannels(groupId) {
  try {
    const res = await fetch(`/api/groups/channels/${groupId}`);
    const channels = await res.json();
    
    // Define the correct order for channels
    const channelOrder = ['announcements', 'events', 'general', 'guided-meditation', 'daily-checkin'];
    
    // Sort channels based on the predefined order
    const sortedChannels = channels.sort((a, b) => {
      const indexA = channelOrder.indexOf(a.ChannelName);
      const indexB = channelOrder.indexOf(b.ChannelName);
      
      // If channel is not in predefined order, put it at the end
      if (indexA === -1 && indexB === -1) return 0;
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      
      return indexA - indexB;
    });
    
    // Update sidebar
    const sidebar = document.getElementById('channelsSidebar');
    sidebar.innerHTML = '';
    
    if (sortedChannels.length === 0) {
      // Show default channel if no channels exist
      const defaultChannel = document.createElement('button');
      defaultChannel.className = 'sidebar-item active';
      defaultChannel.textContent = '#general';
      sidebar.appendChild(defaultChannel);
    } 
    else {
      // Display all channels with # prefix
      sortedChannels.forEach((channel, index) => {
        const channelButton = document.createElement('button');
        channelButton.className = 'sidebar-item' + (index === 0 ? ' active' : '');
        channelButton.textContent = `#${channel.ChannelName}`;
        channelButton.onclick = (event) => selectChannel(channel.ChannelName, event);
        sidebar.appendChild(channelButton);
      });
    }
    
    // Update channels list in settings modal
    const channelsList = document.getElementById('channelsList');
    if (channelsList) {
      channelsList.innerHTML = '';
      
      sortedChannels.forEach(channel => {
        const listItem = document.createElement('li');
        listItem.className = 'channel-item';
        listItem.innerHTML = `
          <span>#${channel.ChannelName}</span>
          <button class="channel-btn delete-channel-btn" onclick="deleteChannel('${channel.ChannelName}')">Delete</button>
        `;
        channelsList.appendChild(listItem);
      });
    }
  } 
  catch (error) {
    // Fallback: show default channel
    const sidebar = document.getElementById('channelsSidebar');
    sidebar.innerHTML = '<button class="sidebar-item active">#general</button>';
  }
}

// Add a new channel (admin only)
async function addChannel() {
  const params = new URLSearchParams(window.location.search);
  const groupId = params.get('id');
  const channelNameInput = document.getElementById('channelNameInput');
  const channelName = channelNameInput.value.trim();
  
  if (!channelName) {
    alert('Please enter a channel name');
    return;
  }
  
  // Validate channel name
  const channelNameRegex = /^[a-zA-Z0-9-]+$/;
  if (!channelNameRegex.test(channelName) || channelName.length > 20) {
    alert('Channel name must be alphanumeric (with dashes only) and max 20 characters');
    return;
  }
  
  try {
    const token = sessionStorage.getItem('token');
    
    if (!token) {
      alert('Please log in first');
      window.location.href = 'login.html';
      return;
    }
    
    const response = await fetch('/api/groups/createChannel', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ groupId, channelName })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      alert('Channel created successfully!');
      channelNameInput.value = '';
      // Reload channels
      await loadChannels(groupId);
    } 
    else {
      alert(data.error || 'Failed to create channel');
    }
  } 
  catch (error) {
    alert('Error creating channel');
  }
}

// Delete a channel (admin only)
async function deleteChannel(channelName) {
  const params = new URLSearchParams(window.location.search);
  const groupId = params.get('id');
  
  if (!confirm(`Are you sure you want to delete the channel #${channelName}?`)) {
    return;
  }
  
  try {
    const token = sessionStorage.getItem('token');
    
    if (!token) {
      alert('Please log in first');
      window.location.href = 'login.html';
      return;
    }
    
    const response = await fetch('/api/groups/deleteChannel', {
      method: 'DELETE',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ groupId, channelName })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      alert('Channel deleted successfully!');
      // Reload channels
      await loadChannels(groupId);
    } 
    else {
      alert(data.error || 'Failed to delete channel');
    }
  } 
  catch (error) {
    alert('Error deleting channel');
  }
}

// Handle channel selection - Updated to use main-content space
function selectChannel(channelName, event) {
  // Remove active class from all sidebar items
  document.querySelectorAll('.sidebar-item').forEach(item => {
    item.classList.remove('active');
  });
  
  // Add active class to clicked channel
  if (event && event.target) {
    event.target.classList.add('active');
  }
  
  // Set current channel
  currentChannel = channelName;
  
  // Get group ID from URL
  const params = new URLSearchParams(window.location.search);
  currentGroupId = params.get('id');
  
  // Hide welcome post and show chat in main-content
  const welcomePost = document.getElementById('welcomePost');
  const addCommentSection = document.getElementById('addCommentSection');
  const mainContent = document.querySelector('.main-content');
  
  if (welcomePost) welcomePost.style.display = 'none';
  if (addCommentSection) addCommentSection.style.display = 'none';
  
  // Create or update chat interface in main-content
  createChatInterface(channelName);
  
  // Load messages for this channel
  loadChannelMessages();
  
  // Start polling for new messages
  startMessagePolling();
}

// Create chat interface in main-content (without chat-header)
function createChatInterface(channelName) {
  const mainContent = document.querySelector('.main-content');
  if (!mainContent) return;
  
  // Remove existing chat interface if any
  const existingChat = document.getElementById('chatInterface');
  if (existingChat) {
    existingChat.remove();
  }
  
  // Create new chat interface
  const chatInterface = document.createElement('div');
  chatInterface.id = 'chatInterface';
  chatInterface.style.cssText = `
    display: flex;
    flex-direction: column;
    height: 100%;
    background: white;
    border-radius: 8px;
    overflow: hidden;
  `;
  
  chatInterface.innerHTML = `
    <div id="chatMessages" style="
      flex: 1;
      padding: 20px;
      overflow-y: auto;
      background: #f8f9fa;
      border-bottom: 1px solid #ddd;
      min-height: 400px;
    ">
      <div style="
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 200px;
        color: #666;
        text-align: center;
      ">
        <div style="font-size: 48px; margin-bottom: 16px;">💬</div>
        <div>Loading messages for #${channelName}...</div>
      </div>
    </div>
    <div style="
      padding: 15px;
      background: white;
      border-top: 1px solid #eee;
      display: flex;
      gap: 10px;
      align-items: center;
    ">
      <input type="text" id="messageInput" placeholder="Type a message in #${channelName}..." style="
        flex: 1;
        padding: 12px 16px;
        border: 1px solid #ddd;
        border-radius: 20px;
        outline: none;
        font-size: 14px;
      ">
      <button id="sendButton" onclick="sendMessage()" style="
        background: #007bff;
        color: white;
        border: none;
        border-radius: 20px;
        width: 40px;
        height: 40px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        transition: background-color 0.2s;
      " onmouseover="this.style.backgroundColor='#0056b3'" onmouseout="this.style.backgroundColor='#007bff'">➤</button>
    </div>
  `;
  
  mainContent.appendChild(chatInterface);
  
  // Set up event listeners for the new input
  const messageInput = document.getElementById('messageInput');
  if (messageInput) {
    messageInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
    messageInput.focus();
  }
}

// Load group details when page is loaded
window.onload = async function() {
  await initializeFirebase();
  await loadGroupDetails();
};

// Show settings modal
function openSettingsModal() {
  document.getElementById('settingsModal').style.display = 'block';
}

// Hide settings modal
function closeSettingsModal() {
  document.getElementById('settingsModal').style.display = 'none';
}

// Enable description edit mode
function editDescription() {
  document.getElementById('descriptionTextarea').classList.remove('hidden');
  document.getElementById('descriptionText').classList.add('hidden');
  document.getElementById('editDescBtn').classList.add('hidden');
  document.getElementById('saveDescBtn').classList.remove('hidden');
  document.getElementById('cancelDescBtn').classList.remove('hidden');
}

// Save new group description and update server
function saveDescription() {
  const newText = document.getElementById('descriptionTextarea').value;
  const token = sessionStorage.getItem('token');
  
  if (!token) {
    alert('Please log in first');
    window.location.href = 'login.html';
    return;
  }

  // Send PATCH request to update group description
  fetch('/api/groups/saveDesc', {
    method: 'PATCH',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      groupId: new URLSearchParams(window.location.search).get('id'),
      newDescription: newText
    })
  })
  .then(response => {
    if (!response.ok) {
      alert('Failed to save description. Please try again.');
    } 
    else {
      alert('Description saved successfully!');
      document.getElementById('descriptionText').textContent = newText;
    }
  });

  cancelDescription(); // Exit edit mode
}

// Cancel editing and restore original description view
function cancelDescription() {
  document.getElementById('descriptionTextarea').classList.add('hidden');
  document.getElementById('descriptionText').classList.remove('hidden');
  document.getElementById('editDescBtn').classList.remove('hidden');
  document.getElementById('saveDescBtn').classList.add('hidden');
  document.getElementById('cancelDescBtn').classList.add('hidden');
}

// Delete the community (admin only)
function deleteCommunity() {
  const groupId = new URLSearchParams(window.location.search).get('id');
  const token = sessionStorage.getItem('token');
  
  if (!token) {
    alert('Please log in first');
    window.location.href = 'login.html';
    return;
  }

  if (confirm('Are you sure you want to delete this community? This action cannot be undone.')) {
    fetch(`/api/groups/deleteCommunity`, {
      method: 'DELETE',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ groupId })
    })
    .then(response => {
      if (response.ok) {
        alert('Community deleted successfully.');
        window.location.href = 'community.html'; // Redirect to community list
      } 
      else {
        alert('Failed to delete community. Please try again.');
      }
    })
    .catch(err => {
      alert('An error occurred while deleting the community.');
    });
  }
}

// Allow a user to leave a group
function leaveCommunity() {
  const groupId = new URLSearchParams(window.location.search).get('id');
  const token = sessionStorage.getItem('token');
  
  if (!token) {
    alert('Please log in first');
    window.location.href = 'login.html';
    return;
  }

  if (confirm('Are you sure you want to leave this group?')) {
    fetch('/api/groups/leaveGroup', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ groupId })
    })
    .then(response => {
      if (response.ok) {
        alert('You have left the group.');
        window.location.href = 'community.html'; // Redirect to community list
      } 
      else {
        alert('Failed to leave the group. Please try again.');
      }
    })
    .catch(err => {
      alert('An error occurred while leaving the group.');
    });
  }
}

// Firebase v9+ API compatibility layer
// These provide the exact ES6-style imports you requested:
// import { initializeApp } from "firebase/app";
// import { getFirestore } from "firebase/firestore";
// But implemented using compat mode for better browser support

const { initializeApp } = {
  initializeApp: (config) => firebase.initializeApp(config)
};

const { getFirestore } = {
  getFirestore: (app) => firebase.firestore()
};

// Chat API Configuration
const API_BASE_URL = "http://localhost:3000";
const CHAT_MESSAGES_URL = `${API_BASE_URL}/api/messages`;

// Firebase configuration
let db = null;

// Chat functionality
let currentChannel = null;
let currentGroupId = null;
let messagePollingInterval = null;

// Initialize Firebase
async function initializeFirebase() {
  try {
    // Fetch Firebase config from backend
    const response = await fetch('/api/groups/firebase-config');
    const firebaseConfig = await response.json();
    
    // Use ES6-style functions (that wrap compat mode)
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
  } catch (error) {
    // Firebase initialization failed - continue without Firebase features
  }
}

// Load messages for the current channel using Firebase backend
async function loadChannelMessages() {
  if (!currentGroupId || !currentChannel) return;
  
  try {
    // Fetch messages from Firebase backend
    const response = await fetch(`/api/groups/firebase/channels/${currentGroupId}/${currentChannel}`);
    
    if (response.ok) {
      const messages = await response.json();
      // Convert Firebase messages to display format
      const formattedMessages = messages.map(msg => ({
        SenderID: msg.userId,
        MessageText: msg.text,
        Timestamp: msg.timestamp ? new Date(msg.timestamp._seconds * 1000) : new Date(),
        SenderName: msg.userName || `User ${msg.userId}`
      }));
      
      displayMessages(formattedMessages);
    } else {
      displayMessages([]);
    }
    
  } catch (error) {
    displayMessages([]);
  }
}

// Display messages in the chat area
function displayMessages(messages) {
  const chatMessages = document.getElementById('chatMessages');
  if (!chatMessages) return;
  
  const currentUser = JSON.parse(sessionStorage.getItem("user"));
  
  if (messages.length === 0) {
    chatMessages.innerHTML = `
      <div class="empty-chat" style="
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 200px;
        color: #666;
        text-align: center;
      ">
        <div class="empty-chat-icon" style="font-size: 48px; margin-bottom: 16px;">💬</div>
        <div>No messages yet. Start the conversation!</div>
      </div>
    `;
    return;
  }
  
  chatMessages.innerHTML = '';
  
  messages.forEach(message => {
    const messageElement = createMessageElement(message, currentUser);
    chatMessages.appendChild(messageElement);
  });
  
  // Scroll to bottom
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Create a message element with inline styling
function createMessageElement(message, currentUser) {
  const messageDiv = document.createElement('div');
  
  // Check if it's the current user's message
  const isOwnMessage = message.SenderID === currentUser.UserID;
  
  messageDiv.style.cssText = `
    display: flex;
    margin-bottom: 16px;
    ${isOwnMessage ? 'flex-direction: row-reverse;' : 'flex-direction: row;'}
  `;
  
  const avatar = document.createElement('div');
  avatar.style.cssText = `
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: ${isOwnMessage ? '#007bff' : '#6c757d'};
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    font-size: 14px;
    margin: ${isOwnMessage ? '0 0 0 12px' : '0 12px 0 0'};
    flex-shrink: 0;
  `;
  avatar.textContent = (message.SenderName || message.SenderID.toString()).charAt(0).toUpperCase();
  
  const content = document.createElement('div');
  content.style.cssText = `
    max-width: 70%;
    background: ${isOwnMessage ? '#007bff' : '#fff'};
    color: ${isOwnMessage ? 'white' : '#333'};
    padding: 12px 16px;
    border-radius: 18px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    position: relative;
  `;
  
  const header = document.createElement('div');
  header.style.cssText = `
    font-size: 12px;
    font-weight: bold;
    margin-bottom: 4px;
    opacity: 0.8;
  `;
  
  const author = document.createElement('span');
  author.textContent = message.SenderName || `User ${message.SenderID}`;
  
  const time = document.createElement('span');
  time.style.cssText = `
    margin-left: 8px;
    font-weight: normal;
    opacity: 0.7;
  `;
  time.textContent = formatMessageTime(message.Timestamp);
  
  const text = document.createElement('div');
  text.style.cssText = `
    font-size: 14px;
    line-height: 1.4;
    word-wrap: break-word;
  `;
  text.textContent = message.MessageText;
  
  header.appendChild(author);
  header.appendChild(time);
  content.appendChild(header);
  content.appendChild(text);
  
  messageDiv.appendChild(avatar);
  messageDiv.appendChild(content);
  
  return messageDiv;
}

// Send a message using Firebase backend
async function sendMessage() {
  const messageInput = document.getElementById('messageInput');
  const sendButton = document.getElementById('sendButton');
  
  if (!messageInput || !sendButton) return;
  
  const messageText = messageInput.value.trim();
  if (!messageText || !currentGroupId || !currentChannel) return;
  
  const currentUser = JSON.parse(sessionStorage.getItem("user"));
  const token = sessionStorage.getItem("token");
  
  if (!currentUser || !token) {
    alert('Please log in to send messages.');
    return;
  }
  
  // Disable input while sending
  messageInput.disabled = true;
  sendButton.disabled = true;
  sendButton.textContent = '⏳';
  
  try {
    // Send message to Firebase backend
    const response = await fetch(`/api/groups/firebase/channels/${currentGroupId}/${currentChannel}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` // Add JWT token
      },
      body: JSON.stringify({
        message: messageText
      })
    });
    
    if (response.ok) {
      // Clear input and reload messages immediately
      messageInput.value = '';
      
      // Add a small delay to ensure Firestore has processed the write
      setTimeout(async () => {
        await loadChannelMessages();
      }, 500);
      
    } else {
      const error = await response.json();
      alert(`Failed to send message: ${error.error}`);
    }
    
  } catch (error) {
    alert('Failed to send message. Please try again.');
  } finally {
    // Re-enable input
    messageInput.disabled = false;
    sendButton.disabled = false;
    sendButton.textContent = '➤';
    messageInput.focus();
  }
}

// Format message timestamp
function formatMessageTime(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInHours = (now - date) / (1000 * 60 * 60);
  
  if (diffInHours < 1) {
    const minutes = Math.floor(diffInHours * 60);
    return minutes < 1 ? 'just now' : `${minutes}m ago`;
  } else if (diffInHours < 24) {
    return `${Math.floor(diffInHours)}h ago`;
  } else {
    return date.toLocaleDateString();
  }
}

// Start polling for new messages
function startMessagePolling() {
  // Clear existing interval
  if (messagePollingInterval) {
    clearInterval(messagePollingInterval);
  }
  
  // Poll every 30 seconds for more responsive chat
  messagePollingInterval = setInterval(() => {
    if (currentGroupId && currentChannel) {
      loadChannelMessages();
    }
  }, 30000);
}

// Stop polling when leaving the page
window.addEventListener('beforeunload', function() {
  if (messagePollingInterval) {
    clearInterval(messagePollingInterval);
  }
});
