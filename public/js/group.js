// Utility function to get user details from JWT token
function getUserFromToken() {
  const token = sessionStorage.getItem('token');
  if (!token) return null;
  
  try {
    // Decode JWT payload (base64 decode the middle part)
    const payload = JSON.parse(atob(token.split('.')[1]));
    return {
      UserID: payload.userId || payload.UserID,
      role: payload.role,
      username: payload.username || payload.name,
      email: payload.email
    };
  } catch (error) {
    console.error('Invalid token:', error);
    return null;
  }
}

// Loads and displays group details when the page loads
async function loadGroupDetails() {
  const params = new URLSearchParams(window.location.search);
  const groupId = params.get('id');

  // Validate that a groupID was provided in the URL
  if (!groupId) {
    document.getElementById('groupTitle').textContent = 'No group selected.';
    return;
  }

  try {
    // Fetch group details from the API
    const res = await fetch(`/api/hobby-groups/${groupId}`);
    if (!res.ok) throw new Error('Group not found');

    const group = await res.json();

    // Get current user information for permission checking
    const user = getUserFromToken();
    if (!user) {
      alert('Please log in first');
      window.location.href = 'login.html';
      return;
    }
    
    const userId = user.UserID;
    const userRole = user.role;
    
    // Determine user permissions (owner or admin have special privileges)
    const isOwner = group.OwnerID === userId;
    const isAdmin = userRole === 'admin';
    const hasAdminPrivileges = isOwner || isAdmin;
    
    // Configure UI based on user permissions
    if (!hasAdminPrivileges) {
      // Members: hide admin controls, show leave option
      document.getElementById('editDescBtn').classList.add('hidden');
      document.getElementById('saveDescBtn').classList.add('hidden');
      document.getElementById('cancelDescBtn').classList.add('hidden');
      document.getElementById('deleteCommunityBtn').classList.add('hidden');
      document.getElementById('channelsSection').style.display = 'none';
      document.getElementById('leaveCommunityBtn').classList.remove('hidden');
    } 
    else {
      // Owners/Admins: show admin controls, hide leave option
      document.getElementById('editDescBtn').classList.remove('hidden');
      document.getElementById('saveDescBtn').classList.add('hidden');
      document.getElementById('cancelDescBtn').classList.add('hidden');
      document.getElementById('deleteCommunityBtn').classList.remove('hidden');
      document.getElementById('channelsSection').style.display = 'block';
      document.getElementById('leaveCommunityBtn').classList.add('hidden');
    }

    // Display group information in the UI
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
    // Handle errors in loading group details
    document.getElementById('groupTitle').textContent = 'Error loading group.';
  }
}

// Fetch and display the total number of group members
async function loadMemberCount(groupId) {
  try {
    const res = await fetch(`/api/groups/memberCount/${groupId}`);
    if (!res.ok) throw new Error('Failed to fetch member count');
    const data = await res.json();
    
    // Format the member count text (singular/plural)
    const memberText = data.memberCount === 1 ? '1 member' : `${data.memberCount} members`;
    document.getElementById('noMembers').textContent = memberText;
  } 
  catch (error) {
    // Handle error by showing 0 members
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
    
    // Clear existing list before rendering new data
    membersList.innerHTML = '';

    if (data.members && data.members.length > 0) {
      // Create list items for each member
      data.members.forEach((member, index) => {
        const listItem = document.createElement('li');
        listItem.className = 'member-item';
        listItem.style.display = 'flex';
        listItem.style.justifyContent = 'space-between';
        listItem.style.alignItems = 'center';

        // Member name with numbering
        const nameSpan = document.createElement('span');
        nameSpan.textContent = `${index + 1}. ${member.name}`;

        // Member role with colour coding
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
      // Show message when no members exist
      const listItem = document.createElement('li');
      listItem.className = 'member-item';
      listItem.textContent = 'No members yet';
      membersList.appendChild(listItem);
    }
  } 
  catch (error) {
    // Handle error by showing error message
    document.querySelector('.members-list').innerHTML = '<li class="member-item">Error loading members</li>';
  }
}

// Loads channels for the group and populates sidebar and settings
async function loadChannels(groupId) {
  try {
    const res = await fetch(`/api/groups/channels/${groupId}`);
    const channels = await res.json();
    
    // Define the order for channels (announcements, events, general in order)
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
    
    // Populate the sidebar with channel buttons
    const sidebar = document.getElementById('channelsSidebar');
    sidebar.innerHTML = '';
    
    if (sortedChannels.length === 0) {
      // Create default channel if none exist
      const defaultChannel = document.createElement('button');
      defaultChannel.className = 'sidebar-item active';
      defaultChannel.textContent = '#general';
      sidebar.appendChild(defaultChannel);
      
      // Auto-select the default channel to show chat interface
      selectChannel('general');
    } 
    else {
      // Create buttons for each channel
      sortedChannels.forEach((channel, index) => {
        const channelButton = document.createElement('button');
        channelButton.className = 'sidebar-item' + (index === 0 ? ' active' : '');
        channelButton.textContent = `#${channel.ChannelName}`;
        channelButton.onclick = (event) => selectChannel(channel.ChannelName, event);
        sidebar.appendChild(channelButton);
      });
      
      // Auto-select the first channel (usually announcements) to initialize chat
      if (sortedChannels.length > 0) {
        selectChannel(sortedChannels[0].ChannelName);
      }
    }
    
    // Also populate channels list in settings modal for admin management
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
    // Fallback: show default channel if API fails
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
  
  // Validate that channel name is provided
  if (!channelName) {
    alert('Please enter a channel name');
    return;
  }
  
  // Validate channel name format (alphanumeric with dashes, max 20 chars)
  const channelNameRegex = /^[a-zA-Z0-9-]+$/;
  if (!channelNameRegex.test(channelName) || channelName.length > 20) {
    alert('Channel name must be alphanumeric (with dashes only) and max 20 characters');
    return;
  }
  
  try {
    // Check for valid authentication token
    const token = sessionStorage.getItem('token');
    
    if (!token) {
      alert('Please log in first');
      window.location.href = 'login.html';
      return;
    }
    
    // Send API request to create the channel
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
      channelNameInput.value = ''; // Clear input field
      // Reload channels to show the new one
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

// Delete an existing channel (admin only)
async function deleteChannel(channelName) {
  const params = new URLSearchParams(window.location.search);
  const groupId = params.get('id');
  
  // Confirm deletion with user
  if (!confirm(`Are you sure you want to delete the channel #${channelName}?`)) {
    return;
  }
  
  try {
    // Check for valid authentication token
    const token = sessionStorage.getItem('token');
    
    if (!token) {
      alert('Please log in first');
      window.location.href = 'login.html';
      return;
    }
    
    // Send API request to delete the channel
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
      // Reload channels to reflect the deletion
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

// Handles channel selection from sidebar
// Updates UI state, creates chat interface, loads messages and starts polling
function selectChannel(channelName, event) {
  // Update sidebar visual state - remove active from all, add to selected
  document.querySelectorAll('.sidebar-item').forEach(item => {
    item.classList.remove('active');
  });
  
  // Add active class to the clicked channel button
  if (event && event.target) {
    event.target.classList.add('active');
  }
  
  // Set current channel for message operations
  currentChannel = channelName;
  
  // Get group ID from URL for API calls
  const params = new URLSearchParams(window.location.search);
  currentGroupId = params.get('id');
  
  // Create the chat interface in the main content area
  createChatInterface(channelName);
  
  // Load existing messages for this channel
  loadChannelMessages();
  
  // Start polling for new messages every 30 seconds
  startMessagePolling();
}

// Create complete chat interface in main-content area
function createChatInterface(channelName) {
  const mainContent = document.querySelector('.main-content');
  if (!mainContent) return;
  
  // Check user permissions for restricted channels
  const user = getUserFromToken();
  if (!user) {
    alert('Please log in first');
    window.location.href = 'login.html';
    return;
  }
  
  const userRole = user.role;
  const isAdmin = userRole === 'admin';
  
  // Get group owner information (fetch this if not available)
  let isOwner = false;
  const params = new URLSearchParams(window.location.search);
  const groupId = params.get('id');
  
  // Check if current user is owner (info should be available from loadGroupDetails)
  const groupTitle = document.getElementById('groupTitle').textContent;
  const editButton = document.getElementById('editDescBtn');
  isOwner = !editButton.classList.contains('hidden');
  
  const hasAdminPrivileges = isOwner || isAdmin;
  const isRestrictedChannel = channelName === 'announcements' || channelName === 'events';
  const showMessageInput = !isRestrictedChannel || hasAdminPrivileges;
  
  // Clear any existing content and configure for full-height chat layout
  mainContent.innerHTML = '';
  mainContent.style.cssText = `
    background: white;
    border-radius: 12px;
    padding: 0;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    display: flex;
    flex-direction: column;
    height: calc(100vh - 180px);
    min-height: 600px;
    overflow: hidden;
  `;
  
  // Create scrollable messages container
  const messagesContainer = document.createElement('div');
  messagesContainer.id = 'chatMessages';
  messagesContainer.style.cssText = `
    flex: 1;
    padding: 2rem;
    overflow-y: auto;
    background: #f8f9fa;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  `;
  
  // Create loading state shown while messages are being fetched
  const loadingDiv = document.createElement('div');
  loadingDiv.style.cssText = `
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: #666;
    text-align: center;
  `;
  loadingDiv.innerHTML = `
    <div style="font-size: 48px; margin-bottom: 16px;">💬</div>
    <div>Loading messages for #${channelName}...</div>
  `;
  messagesContainer.appendChild(loadingDiv);
  
  // Assemble the chat interface
  mainContent.appendChild(messagesContainer);
  
  // Only add input area if user has permission to send messages
  if (showMessageInput) {
    // Create input area with textarea and send button
    const inputArea = document.createElement('div');
    inputArea.style.cssText = `
      padding: 2rem;
      background: white;
      border-radius: 0 0 12px 12px;
      display: flex;
      gap: 15px;
      align-items: flex-end;
      flex-shrink: 0;
    `;
    inputArea.innerHTML = `
      <textarea id="messageInput" placeholder="Type a message in #${channelName}... (Press Enter to send, Shift+Enter for new line)" style="
        flex: 1;
        padding: 2px 16px;
        border: 1px solid #ddd;
        border-radius: 12px;
        outline: none;
        font-size: 14px;
        font-family: inherit;
        resize: none;
        height: 48px;
        min-height: 48px;
        max-height: 120px;
        overflow-y: auto;
        line-height: 1.4;
        background: #f8f9fa;
        transition: border-color 0.2s;
      "></textarea>
      <button id="sendButton" onclick="sendMessage()" style="
        background: #007bff;
        color: white;
        border: none;
        border-radius: 30px;
        width: 48px;
        height: 48px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        transition: all 0.2s;
        flex-shrink: 0;
        box-shadow: 0 2px 8px rgba(0,123,255,0.3);
      " onmouseover="this.style.backgroundColor='#0056b3'; this.style.transform='scale(1.05)'" onmouseout="this.style.backgroundColor='#007bff'; this.style.transform='scale(1)'">➤</button>
    `;
    mainContent.appendChild(inputArea);
  } 
  else {
    // Show read-only message for restricted channels
    const restrictedMessage = document.createElement('div');
    restrictedMessage.style.cssText = `
      padding: 2rem;
      background: #f8f9fa;
      border-radius: 0 0 12px 12px;
      text-align: center;
      color: #666;
      font-style: italic;
      border-top: 1px solid #e0e0e0;
      flex-shrink: 0;
    `;
    restrictedMessage.innerHTML = `
      <div style="font-size: 14px;">
        📢 Only admins and group owners can post in #${channelName}
      </div>
    `;
    mainContent.appendChild(restrictedMessage);
  }
  
  // Set up event listeners for the message input textarea (only if input exists)
  const messageInput = document.getElementById('messageInput');
  if (messageInput) {
    // Auto-resize textarea based on content (up to max height)
    messageInput.addEventListener('input', function() {
      this.style.height = '48px';
      this.style.height = Math.min(this.scrollHeight, 120) + 'px';
    });
    
    // Handle Enter key behavior: Enter = send, Shift+Enter = new line
    messageInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
    
    // Set initial height and focus the input
    messageInput.style.height = '48px';
    messageInput.focus();
  }
}

// Initializes Firebase and loads all group data
window.onload = async function() {
  // Initialize Firebase connection first
  await initializeFirebase();
  // Then load all group details, members, and channels
  await loadGroupDetails();
};

// Opens the settings modal for group management
function openSettingsModal() {
  document.getElementById('settingsModal').style.display = 'block';
}

// Close the settings modal
function closeSettingsModal() {
  document.getElementById('settingsModal').style.display = 'none';
}

// Enables edit mode for group description
// Shows textarea and save/cancel buttons, hides display text and edit button
function editDescription() {
  // Show textarea for editing, hide read-only text
  document.getElementById('descriptionTextarea').classList.remove('hidden');
  document.getElementById('descriptionText').classList.add('hidden');
  
  // Switch button visibility: hide edit, show save & cancel
  document.getElementById('editDescBtn').classList.add('hidden');
  document.getElementById('saveDescBtn').classList.remove('hidden');
  document.getElementById('cancelDescBtn').classList.remove('hidden');
}

// Saves the new group description to the server
// Validates authentication and sends PATCH request
function saveDescription() {
  const newText = document.getElementById('descriptionTextarea').value;
  const token = sessionStorage.getItem('token');
  
  // Validate authentication
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
      // Update the display text with the new description
      document.getElementById('descriptionText').textContent = newText;
    }
  });

  // Exit edit mode regardless of success/failure
  cancelDescription();
}

// Cancel description editing and restore original view
// Switches back to read-only display mode
function cancelDescription() {
  // Hide textarea, show read-only text
  document.getElementById('descriptionTextarea').classList.add('hidden');
  document.getElementById('descriptionText').classList.remove('hidden');
  
  // Switch button visibility: show edit, hide save & cancel
  document.getElementById('editDescBtn').classList.remove('hidden');
  document.getElementById('saveDescBtn').classList.add('hidden');
  document.getElementById('cancelDescBtn').classList.add('hidden');
}

// Deletes the entire community (admin/owner only)
// Confirms action and redirects to community list on success
function deleteCommunity() {
  const groupId = new URLSearchParams(window.location.search).get('id');
  const token = sessionStorage.getItem('token');
  
  // Validate authentication
  if (!token) {
    alert('Please log in first');
    window.location.href = 'login.html';
    return;
  }

  // Confirm deletion of the community
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
        // Redirect to community list since this group no longer exists
        window.location.href = 'community.html';
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

// Allows a user to leave the group (non-admin users)
// Confirms action and redirects to community list on success
function leaveCommunity() {
  const groupId = new URLSearchParams(window.location.search).get('id');
  const token = sessionStorage.getItem('token');
  
  // Validate authentication
  if (!token) {
    alert('Please log in first');
    window.location.href = 'login.html';
    return;
  }

  // Confirm the user wants to leave
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
        // Redirect to community list since user is no longer a member
        window.location.href = 'community.html';
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

// FIREBASE CONFIGURATION AND SETUP
const { initializeApp } = {
  initializeApp: (config) => firebase.initializeApp(config)
};

const { getFirestore } = {
  getFirestore: (app) => firebase.firestore()
};

// Chat API Configuration Constants
const API_BASE_URL = "http://localhost:3000";
const CHAT_MESSAGES_URL = `${API_BASE_URL}/api/messages`;

// Firebase and Chat Variables
let db = null;                     // Firebase Firestore database instance
let currentChannel = null;         // Currently selected channel name
let currentGroupId = null;         // Currently selected group ID
let messagePollingInterval = null; // Interval ID for message polling

// Initialize Firebase connection with config from backend
// Handles errors gracefully - continues without Firebase if it fails
async function initializeFirebase() {
  try {
    // Fetch Firebase configuration from backend API
    const response = await fetch('/api/groups/firebase-config');
    const firebaseConfig = await response.json();
    
    // Initialize Firebase app and Firestore database
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
  } catch (error) {
    // If Firebase initialization fails, continue without Firebase features
    console.warn('Firebase initialization failed:', error);
  }
}

// Load messages for the current channel from Firebase backend
// Formats the messages and displays them in the chat area
async function loadChannelMessages() {
  // Ensure we have the required channel and group information
  if (!currentGroupId || !currentChannel) return;
  
  try {
    // Fetch messages from our Firebase backend API
    const response = await fetch(`/api/groups/firebase/channels/${currentGroupId}/${currentChannel}`);
    
    if (response.ok) {
      const messages = await response.json();

      // Convert Firebase message format to display format
      const formattedMessages = messages.map(msg => ({
        SenderID: msg.userId,
        MessageText: msg.text,
        Timestamp: msg.timestamp ? new Date(msg.timestamp._seconds * 1000) : new Date(),
        SenderName: msg.userName || `User ${msg.userId}`
      }));
      
      // Display the formatted messages
      displayMessages(formattedMessages);
    } else {
      // If API fails, show empty state
      displayMessages([]);
    }
    
  } catch (error) {
    console.error('Error loading messages:', error);
    // On error, show empty state
    displayMessages([]);
  }
}

// Display messages in the chat area
function displayMessages(messages) {
  const chatMessages = document.getElementById('chatMessages');
  if (!chatMessages) return;
  
  // Get current user info for message styling
  const currentUser = getUserFromToken();
  
  // Handle empty state
  if (messages.length === 0) {
    chatMessages.innerHTML = `
      <div class="empty-chat" style="
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        flex: 1;
        height: 100%;
        min-height: 300px;
        color: #666;
        text-align: center;
        margin: 0;
      ">
        <div class="empty-chat-icon" style="font-size: 48px; margin-bottom: 16px;">💬</div>
        <div>No messages yet. Start the conversation!</div>
      </div>
    `;
    return;
  }
  
  // Clear the loading/empty state and display messages
  chatMessages.innerHTML = '';
  
  // Create and append each message element
  messages.forEach(message => {
    const messageElement = createMessageElement(message, currentUser);
    chatMessages.appendChild(messageElement);
  });
  
  // Auto-scroll to the bottom to show the latest messages
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Creates a styled message element matching the admin post design
function createMessageElement(message, currentUser) {
  const messageDiv = document.createElement('div');
  
  // Determine if this is the current user's message for special styling
  const isOwnMessage = message.SenderID === currentUser.UserID;
  
  // Style the message container with card-like appearance
  messageDiv.style.cssText = `
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    margin-bottom: 1rem;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    border: 1px solid #e0e0e0;
    ${isOwnMessage ? 'border-left: 4px solid #007bff;' : ''}
  `;
  
  // Create message header with avatar and user info
  const header = document.createElement('div');
  header.style.cssText = `
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1rem;
  `;
  
  // Create circular avatar with user's initial
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
    flex-shrink: 0;
  `;
  avatar.textContent = (message.SenderName || message.SenderID.toString()).charAt(0).toUpperCase();
  
  // Create container for author name and timestamp
  const authorInfo = document.createElement('div');
  authorInfo.style.cssText = `
    display: flex;
    flex-direction: column;
    flex: 1;
  `;
  
  // Author name
  const author = document.createElement('div');
  author.style.cssText = `
    font-weight: 600;
    color: #333;
    font-size: 14px;
  `;
  author.textContent = message.SenderName || `User ${message.SenderID}`;
  
  // Message timestamp
  const time = document.createElement('div');
  time.style.cssText = `
    font-size: 12px;
    color: #666;
    opacity: 0.8;
  `;
  time.textContent = formatMessageTime(message.Timestamp);
  
  // Create message content area
  const content = document.createElement('div');
  content.style.cssText = `
    margin-bottom: 0;
    color: #333;
    font-size: 14px;
    line-height: 1.6;
  `;
  
  // Message text with line break preservation
  const text = document.createElement('div');
  text.style.cssText = `
    white-space: pre-wrap;
    word-wrap: break-word;
    margin: 0;
  `;
  text.textContent = message.MessageText;
  
  // Assemble all components into the message element
  authorInfo.appendChild(author);
  authorInfo.appendChild(time);
  header.appendChild(avatar);
  header.appendChild(authorInfo);
  content.appendChild(text);
  messageDiv.appendChild(header);
  messageDiv.appendChild(content);
  
  return messageDiv;
}

// Sends a new message to the current channel via Firebase backend
async function sendMessage() {
  // Get references to input elements
  const messageInput = document.getElementById('messageInput');
  const sendButton = document.getElementById('sendButton');
  
  if (!messageInput || !sendButton) return;
  
  // Validate message content and required state
  const messageText = messageInput.value.trim();
  if (!messageText || !currentGroupId || !currentChannel) return;
  
  // Get user authentication info
  const currentUser = getUserFromToken();
  const token = sessionStorage.getItem("token");
  
  if (!currentUser || !token) {
    alert('Please log in to send messages.');
    return;
  }
  
  // Disable UI elements while sending to prevent double-sending
  messageInput.disabled = true;
  sendButton.disabled = true;
  sendButton.textContent = '⏳'; // Show loading state
  
  try {
    // Send message to Firebase backend API
    const response = await fetch(`/api/groups/firebase/channels/${currentGroupId}/${currentChannel}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        message: messageText
      })
    });
    
    if (response.ok) {
      // Clear input and reset its height on successful send
      messageInput.value = '';
      messageInput.style.height = '48px';
      
      // Small delay to ensure Firestore has processed the write before refreshing
      setTimeout(async () => {
        await loadChannelMessages();
      }, 500);
      
    } else {
      // Handle API error
      const error = await response.json();
      alert(`Failed to send message: ${error.error}`);
    }
    
  } 
  catch (error) {
    console.error('Error sending message:', error);
    alert('Failed to send message. Please try again.');
  } 
  finally {
    // Re-enable UI elements regardless of success/failure
    messageInput.disabled = false;
    sendButton.disabled = false;
    sendButton.textContent = '➤';
    messageInput.focus(); // Return focus for continued typing
  }
}

// Formats message timestamp into user-friendly relative time
function formatMessageTime(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInHours = (now - date) / (1000 * 60 * 60);
  
  if (diffInHours < 1) {
    // Less than 1 hour: show minutes or "just now"
    const minutes = Math.floor(diffInHours * 60);
    return minutes < 1 ? 'just now' : `${minutes}m ago`;
  } else if (diffInHours < 24) {
    // 1-24 hours: show hours
    return `${Math.floor(diffInHours)}h ago`;
  } else {
    // More than 24 hours: show date
    return date.toLocaleDateString();
  }
}

// Starts polling for new messages every 30 seconds
function startMessagePolling() {
  // Clear any existing polling interval to prevent multiple timers
  if (messagePollingInterval) {
    clearInterval(messagePollingInterval);
  }
  
  // Set up new polling every 30 seconds for responsive chat updates
  messagePollingInterval = setInterval(() => {
    // Only poll if we have active channel and group selected
    if (currentGroupId && currentChannel) {
      loadChannelMessages();
    }
  }, 30000); // 30 second interval
}

// Cleanup function: stops message polling when user leaves the page
// Prevent unnecessary API calls and memory leaks
window.addEventListener('beforeunload', function() {
  if (messagePollingInterval) {
    clearInterval(messagePollingInterval);
  }
});
