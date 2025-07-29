const apiBaseUrl = "http://localhost:3000/api";

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
  } 
  catch (error) {
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
    const res = await fetch(`${apiBaseUrl}/hobby-groups/${groupId}`);
    if (!res.ok) throw new Error('Group not found');

    const group = await res.json();

    // Get current user information for permission checking
    const user = getUserFromToken();
    if (!user) {
      alert('Please log in first');
      window.location.href = 'auth.html';
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
    // Fix: Only set groupDesc if it exists
    const groupDescElem = document.getElementById('groupDesc');
    if (groupDescElem) {
      groupDescElem.textContent = group.GroupDescription;
    }
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
    console.error('Error loading group details:', err);
    const groupTitleElem = document.getElementById('groupTitle');
    if (groupTitleElem) {
      groupTitleElem.textContent = 'Error loading group.';
    } 
    else {
      console.warn("groupTitle element not found in DOM. Can't display error message.");
    }
  }
}

// Fetch and display the total number of group members
async function loadMemberCount(groupId) {
  try {
    const res = await fetch(`${apiBaseUrl}/groups/memberCount/${groupId}`);
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
    const res = await fetch(`${apiBaseUrl}/groups/memberList/${groupId}`);
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
    const res = await fetch(`${apiBaseUrl}/groups/channels/${groupId}`);
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
        channelButton.addEventListener('click', (event) => selectChannel(channel.ChannelName, event));
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
  
  try {
    // Check for valid authentication token
    const token = sessionStorage.getItem('token');
    
    if (!token) {
      alert('Please log in first');
      window.location.href = 'auth.html';
      return;
    }
    
    // Send API request to create the channel
    const response = await fetch(`${apiBaseUrl}/groups/createChannel`, {
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
      window.location.href = 'auth.html';
      return;
    }
    
    // Send API request to delete the channel
    const response = await fetch(`${apiBaseUrl}/groups/deleteChannel`, {
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
async function selectChannel(channelName, event) {
  // Update sidebar visual state - remove active from all, add to selected
  console.log("Selecting channel:", channelName);
  console.log("Event target:", event && event.target);
  document.querySelectorAll('.sidebar-item').forEach(item => {
    item.classList.remove('active');
  });
  if (event && event.target) {
    event.target.classList.add('active');
  }

  currentChannel = channelName;
  const params = new URLSearchParams(window.location.search);
  currentGroupId = params.get('id');

  if (channelName == 'events') {
    console.log("Loading events channel");

    const mainContent = document.getElementById('mainContent');
    if (mainContent) {
      mainContent.innerHTML = '';
      mainContent.className = 'main-content';
    }
    loadGroupEvents(currentGroupId);
    const eventsDiv = document.getElementById('eventsChannel');
    if (eventsDiv) {
      eventsDiv.style.display = 'block';
      eventsDiv.innerHTML = '<div>Loading events...</div>';
      // Ensure loadGroupEvents is always called and DOM is ready
      window.requestAnimationFrame(() => {
        if (typeof loadGroupEvents === 'function') {
          loadGroupEvents(currentGroupId);
        }
      });
    }
  } 
  else {
    const eventsDiv = document.getElementById('eventsChannel');
    if (eventsDiv) {
      eventsDiv.style.display = 'none';
    }

  }
  createChatInterface(channelName);
  loadChannelMessages();
  startMessagePolling();
}

// Create complete chat interface in main-content area
function createChatInterface(channelName) {
  const mainContent = document.getElementById('mainContent');
  console.log(mainContent);
  if (!mainContent) return;

  // Check user permissions for restricted channels
  const user = getUserFromToken();
  if (!user) {
    alert('Please log in first');
    window.location.href = 'auth.html';
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
  mainContent.className = 'main-content-chat';

  // Create scrollable messages container
  const messagesContainer = document.createElement('div');
  messagesContainer.id = 'chatMessages';

  // Create loading state shown while messages are being fetched
  const loadingDiv = document.createElement('div');
  loadingDiv.className = 'loading-state';
  loadingDiv.innerHTML = `
    <div class="loading-icon">💬</div>
    <div>Loading messages for #${channelName}...</div>
  `;
  messagesContainer.appendChild(loadingDiv);

  // Assemble the chat interface
  mainContent.appendChild(messagesContainer);
  console.log(hasAdminPrivileges, "isOwner:", isOwner, "isAdmin:", isAdmin, "showMessageInput:", showMessageInput);
  // Only for "events" channel: show event form instead of message input
  if (channelName == 'events') {
      const events = document.createElement('div');
      events.id = 'eventsChannel';
      events.style.display = 'block';
      mainContent.appendChild(events);
      document.getElementById("chatMessages").style.display = 'none';
    if (hasAdminPrivileges) {
      // Match chat input area spacing and alignment
      const eventForm = document.createElement('div');
      eventForm.className = 'input-area';
      eventForm.style.display = 'flex';
      eventForm.style.gap = '15px';
      eventForm.style.alignItems = 'flex-end';
      eventForm.style.justifyContent = 'flex-end';
      eventForm.style.background = 'white';
      eventForm.style.borderRadius = '0 0 12px 12px';
      eventForm.style.padding = '2rem';
      eventForm.style.flexShrink = '0';
      const createbutton = document.createElement('button');
      createbutton.id = 'eventSubmitBtn';
      createbutton.textContent = '+';
      createbutton.onclick = () => {
        showEventCreationForm();
      };
      eventForm.appendChild(createbutton);
      mainContent.appendChild(eventForm);
    }
    // No input for non-admins/owners in events channel
  } 
  else if (showMessageInput) {
    // Create input area with textarea and send button (with + icon)
    const inputArea = document.createElement('div');

    inputArea.className = 'input-area';
    inputArea.innerHTML = `
      <textarea id="messageInput"></textarea>
      <button id="sendButton" onclick="sendMessage()">➤</button>
    `;
    mainContent.appendChild(inputArea);

    // Always update the placeholder after adding to DOM
    const messageInput = inputArea.querySelector('#messageInput');
    if (messageInput) {
      messageInput.placeholder = `Type a message in #${channelName}... (Press Enter to send, Shift+Enter for new line)`;

      // Remove all previous event listeners by replacing the node
      const newInput = messageInput.cloneNode(true);
      messageInput.parentNode.replaceChild(newInput, messageInput);

      // Add event listeners to the new textarea
      newInput.addEventListener('input', function() {
        this.style.height = '48px';
        this.style.height = Math.min(this.scrollHeight, 120) + 'px';
      });

      newInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          sendMessage();
        }
      });

      newInput.style.height = '48px';
      newInput.focus();
    }
  }
  else {
    // Show read-only message for restricted channels
    const restrictedMessage = document.createElement('div');
    restrictedMessage.className = 'restricted-message';
    restrictedMessage.innerHTML = `
      <div>
        📢 Only admins and group owners can post in #${channelName}
      </div>
    `;
    mainContent.appendChild(restrictedMessage);
  }

  // Set up event listeners for the message input textarea (only if input exists)
  const messageInput = document.getElementById('messageInput');
  if (messageInput) {
    // Always set the placeholder to match the current channel
    messageInput.setAttribute(
      'placeholder',
      `Type a message in #${channelName}... (Press Enter to send, Shift+Enter for new line)`
    );

    // Remove all previous event listeners by replacing the node
    const newInput = messageInput.cloneNode(true);
    messageInput.parentNode.replaceChild(newInput, messageInput);

    // Add event listeners to the new textarea
    newInput.addEventListener('input', function() {
      this.style.height = '48px';
      this.style.height = Math.min(this.scrollHeight, 120) + 'px';
    });

    newInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });

    newInput.style.height = '48px';
    newInput.focus();
  }
}

// Add this function to handle event form submission for SQL DB
async function submitEventForm(groupId) {
  const title = document.getElementById('eventTitle').value.trim();
  const description = document.getElementById('eventDescription').value.trim();
  const date = document.getElementById('eventDate').value;
  const token = sessionStorage.getItem('token');

  if (!token) {
    alert('Please log in first');
    window.location.href = 'auth.html';
    return;
  }

  try {
    const response = await fetch(`${apiBaseUrl}/groups/events/${groupId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        title,
        description,
        date
      })
    });
    if (response.ok) {
      alert('Event created successfully!');
      // Optionally clear form fields
      document.getElementById('eventTitle').value = '';
      document.getElementById('eventDescription').value = '';
      document.getElementById('eventDate').value = '';
      // Optionally reload events/messages here
      if (typeof loadGroupEvents === 'function') {
        loadGroupEvents(groupId);
      }
    } 
    else {
      const data = await response.json();
      alert(data.error || 'Failed to create event');
    }
  } 
  catch (error) {
    alert('Error creating event');
  }
};

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
  // Get references to event modal elements
  const eventOverlay = document.getElementById('eventModalOverlay');
  const eventCloseBtn = document.querySelector('.event-modal-close');
  const eventForm = document.getElementById('eventCreateForm');

  // Only set up modal functionality if elements exist
  if (eventOverlay && eventCloseBtn && eventForm) {
    // Close modal when the close button is clicked
    eventCloseBtn.onclick = () => {
      eventOverlay.style.display = 'none';
      eventForm.reset();
    };

    // Close modal if the user clicks outside the modal content
    eventOverlay.onclick = (e) => {
      if (e.target === eventOverlay) {
        eventOverlay.style.display = 'none';
        eventForm.reset();
      }
    };

    // Handle form submission for creating a new event
    eventForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      // ...existing event creation logic...
    });
  } 
  else {
    console.warn('Event modal elements not found - event modal functionality disabled');
  }
});

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
    window.location.href = 'auth.html';
    return;
  }

  // Send PATCH request to update group description
  fetch(`${apiBaseUrl}/groups/saveDesc`, {
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
    window.location.href = 'auth.html';
    return;
  }

  // Confirm deletion of the community
  if (confirm('Are you sure you want to delete this community? This action cannot be undone.')) {
    fetch(`${apiBaseUrl}/groups/deleteCommunity`, {
      method: 'DELETE',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ groupId })
    })
    .then(async response => {
      if (response.ok) {
        alert('Community deleted successfully.');
        // Redirect to community list since this group no longer exists
        window.location.href = 'community.html';
      } else {
        let errorMsg = 'Failed to delete community. Please try again.';
        try {
          const errorData = await response.json();
          if (errorData && errorData.error) {
            errorMsg = errorData.error;
          }
        } 
        catch (err) {
          console.error('Error parsing response:', err);
        }
        alert(errorMsg);
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
    window.location.href = 'auth.html';
    return;
  }

  // Confirm the user wants to leave
  if (confirm('Are you sure you want to leave this group?')) {
    fetch(`${apiBaseUrl}/groups/leaveGroup`, {
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
    const response = await fetch(`${apiBaseUrl}/groups/firebase-config`);
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
    const response = await fetch(`${apiBaseUrl}/groups/firebase/channels/${currentGroupId}/${currentChannel}`);
    
    if (response.ok) {
      const messages = await response.json();

      // Convert Firebase message format to display format
      const formattedMessages = messages.map(msg => ({
        id: msg.id, // Include message ID for edit/delete functionality
        SenderID: msg.userId,
        MessageText: msg.text,
        Timestamp: msg.timestamp ? new Date(msg.timestamp._seconds * 1000) : new Date(),
        SenderName: msg.userName || `User ${msg.userId}`,
        edited: msg.edited || false // Track if message was edited
      }));
      
      // Display the formatted messages
      displayMessages(formattedMessages);
    } 
    else {
      // If API fails, show empty state
      displayMessages([]);
    }
    
  } 
  catch (error) {
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
      <div class="empty-chat">
        <div class="empty-chat-icon">💬</div>
        <div>No messages yet. Start the conversation!</div>
      </div>
    `;
    return;
  }

  // Sort messages by timestamp (oldest first)
  messages.sort((a, b) => {
    const timeA = a.Timestamp instanceof Date ? a.Timestamp.getTime() : new Date(a.Timestamp).getTime();
    const timeB = b.Timestamp instanceof Date ? b.Timestamp.getTime() : new Date(b.Timestamp).getTime();
    return timeA - timeB;
  });

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
  messageDiv.className = `message-container ${isOwnMessage ? 'own-message' : ''}`;
  
  // Create message header with avatar and user info
  const header = document.createElement('div');
  header.className = 'message-header';
  
  // Add three-dot menu for own messages
  if (isOwnMessage) {
    const menuButton = document.createElement('button');
    menuButton.className = 'message-menu-button';
    menuButton.innerHTML = '⋮';
    menuButton.title = 'Message options';
    
    // Create dropdown menu
    const dropdownMenu = document.createElement('div');
    dropdownMenu.className = 'message-dropdown';
    
    // Edit option
    const editOption = document.createElement('button');
    editOption.className = 'dropdown-option';
    editOption.innerHTML = 'Edit';
    editOption.onmouseover = () => editOption.style.background = '#f8f9fa';
    editOption.onmouseout = () => editOption.style.background = 'none';
    editOption.onclick = (e) => {
      e.stopPropagation();
      dropdownMenu.style.display = 'none';
      editMessage(message.id, messageDiv);
    };
    
    // Delete option
    const deleteOption = document.createElement('button');
    deleteOption.className = 'dropdown-option delete';
    deleteOption.innerHTML = 'Delete';
    deleteOption.onmouseover = () => deleteOption.style.background = '#fef2f2';
    deleteOption.onmouseout = () => deleteOption.style.background = 'none';
    deleteOption.onclick = (e) => {
      e.stopPropagation();
      dropdownMenu.style.display = 'none';
      deleteMessage(message.id, messageDiv);
    };
    
    // Add options to dropdown
    dropdownMenu.appendChild(editOption);
    dropdownMenu.appendChild(deleteOption);
    
    // Toggle dropdown on button click
    menuButton.onclick = (e) => {
      e.stopPropagation();
      const isVisible = dropdownMenu.style.display === 'block';
      
      // Hide all other dropdowns
      document.querySelectorAll('.message-dropdown').forEach(dropdown => {
        dropdown.style.display = 'none';
      });
      
      dropdownMenu.style.display = isVisible ? 'none' : 'block';
    };
    
    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
      dropdownMenu.style.display = 'none';
    });
    
    menuButton.onmouseover = () => menuButton.style.background = '#f0f0f0';
    menuButton.onmouseout = () => menuButton.style.background = 'none';
    
    dropdownMenu.className = 'message-dropdown';
    menuButton.appendChild(dropdownMenu);
    header.appendChild(menuButton);
  }
  
  // Create circular avatar with user's initial
  const avatar = document.createElement('div');
  avatar.className = `message-avatar ${isOwnMessage ? 'own' : 'other'}`;
  avatar.style.background = isOwnMessage ? '#007bff' : '#6c757d';
  avatar.textContent = (message.SenderName || message.SenderID.toString()).charAt(0).toUpperCase();
  
  // Create container for author name and timestamp
  const authorInfo = document.createElement('div');
  authorInfo.className = 'author-info';
  
  // Author name
  const author = document.createElement('div');
  author.className = 'author-name';
  author.textContent = message.SenderName || `User ${message.SenderID}`;
  
  // Message timestamp
  const time = document.createElement('div');
  time.className = 'message-time';
  time.textContent = formatMessageTime(message.Timestamp);
  
  // Create message content area
  const content = document.createElement('div');
  content.className = 'message-content';
  
  // Message text with line break preservation
  const text = document.createElement('div');
  text.className = 'message-text';
  
  // Set the actual message text content with line break handling
  const messageText = (message.MessageText || '').replace(/\n/g, '<br>');
  text.innerHTML = messageText;
  
  // Add edited indicator if message was edited
  if (message.edited) {
    const editedIndicator = document.createElement('span');
    editedIndicator.className = 'edited-indicator';
    editedIndicator.textContent = ' (edited)';
    text.appendChild(editedIndicator);
  }
  
  // Assemble all components into the message element
  authorInfo.appendChild(author);
  authorInfo.appendChild(time);
  header.appendChild(avatar);
  header.appendChild(authorInfo);
  content.appendChild(text);
  messageDiv.appendChild(header);
  messageDiv.appendChild(content);
  
  // Store message ID on the element for later reference
  messageDiv.dataset.messageId = message.id;
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
    const response = await fetch(`${apiBaseUrl}/groups/firebase/channels/${currentGroupId}/${currentChannel}`, {
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
      
    } 
    else {
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
  } 
  else if (diffInHours < 24) {
    // 1-24 hours: show hours
    return `${Math.floor(diffInHours)}h ago`;
  } 
  else {
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

// Edit a message (user's own messages only)
async function editMessage(messageId, messageElement) {
  const messageTextDiv = messageElement.querySelector('.message-text');
  
  // Get original text without the "(edited)" indicator and convert <br> back to newlines
  let originalText = messageTextDiv.innerHTML;
  if (originalText.includes('<span class="edited-indicator">')) {
    originalText = originalText.replace(/<span class="edited-indicator">.*?<\/span>/g, '');
  }
  originalText = originalText.replace(/<br>/g, '\n').trim();
  
  // Create edit textarea
  const editTextarea = document.createElement('textarea');
  editTextarea.className = 'edit-textarea';
  editTextarea.value = originalText;
  
  // Create action buttons container
  const editActions = document.createElement('div');
  editActions.className = 'edit-actions';
  
  // Save button
  const saveButton = document.createElement('button');
  saveButton.className = 'edit-save-btn';
  saveButton.textContent = 'Save';
  saveButton.onmouseover = () => saveButton.style.background = '#218838';
  saveButton.onmouseout = () => saveButton.style.background = '#28a745';
  
  // Cancel button
  const cancelButton = document.createElement('button');
  cancelButton.className = 'edit-cancel-btn';
  cancelButton.textContent = 'Cancel';
  cancelButton.onmouseover = () => cancelButton.style.background = '#5a6268';
  cancelButton.onmouseout = () => cancelButton.style.background = '#6c757d';
  
  // Save edit functionality
  saveButton.onclick = async () => {
    const newText = editTextarea.value.trim();
    if (!newText) {
      alert('Message cannot be empty');
      return;
    }
    
    if (newText === originalText) {
      // No changes, just cancel
      cancelEdit();
      return;
    }
    
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch(`${apiBaseUrl}/groups/firebase/messages/${messageId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          groupId: currentGroupId,
          channelName: currentChannel,
          newText: newText
        })
      });
      
      if (response.ok) {
        // Update the message display - clear existing content and set new text with line breaks
        const newTextWithBreaks = newText.replace(/\n/g, '<br>');
        messageTextDiv.innerHTML = newTextWithBreaks;
        
        // Add "edited" indicator
        const editedIndicator = document.createElement('span');
        editedIndicator.className = 'edited-indicator';
        editedIndicator.textContent = ' (edited)';
        messageTextDiv.appendChild(editedIndicator);
        
        cancelEdit();
      } 
      else {
        const error = await response.json();
        alert(`Failed to edit message: ${error.error || 'Unknown error'}`);
      }
    } 
    catch (error) {
      console.error('Error editing message:', error);
      alert('Failed to edit message. Please try again.');
    }
  };
  
  // Cancel edit functionality
  const cancelEdit = () => {
    messageTextDiv.style.display = 'block';
    editTextarea.remove();
    editActions.remove();
  };
  
  cancelButton.onclick = cancelEdit;
  
  // Replace message text with edit interface
  messageTextDiv.style.display = 'none';
  editActions.appendChild(saveButton);
  editActions.appendChild(cancelButton);
  messageTextDiv.parentNode.appendChild(editTextarea);
  messageTextDiv.parentNode.appendChild(editActions);
  
  // Focus and select text in textarea
  editTextarea.focus();
  editTextarea.select();
}

// Delete a message (user's own messages only)
async function deleteMessage(messageId, messageElement) {
  // Confirm deletion
  if (!confirm('Are you sure you want to delete this message? This action cannot be undone.')) {
    return;
  }
  
  try {
    const token = sessionStorage.getItem('token');
    const response = await fetch(`${apiBaseUrl}/groups/firebase/messages/${messageId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        groupId: currentGroupId,
        channelName: currentChannel
      })
    });
    
    if (response.ok) {
      // Remove message element with fade animation
      messageElement.style.transition = 'opacity 0.3s ease-out';
      messageElement.style.opacity = '0';
      
      setTimeout(() => {
        messageElement.remove();
      }, 300);
    } 
    else {
      const error = await response.json();
      alert(`Failed to delete message: ${error.error || 'Unknown error'}`);
    }
  } 
  catch (error) {
    console.error('Error deleting message:', error);
    alert('Failed to delete message. Please try again.');
  }
}

// Fetch and display all events for the current group
async function loadGroupEvents(groupId) {
  console.log('Loading events for group ID:', groupId);
  if (!groupId) return;
  try {
    const response = await fetch(`${apiBaseUrl}/groups/events/${groupId}`);
    if (!response.ok) throw new Error('Failed to fetch events');
    const events = await response.json();
    renderEventList(events);
  } 
  catch (error) {
    console.error('Error loading events:', error);
    renderEventList([]);
  }
}

// Render a list of event cards in the events channel
function renderEventList(events) {
  let container = document.getElementById('eventsChannel');
  if (!container) {
    container = document.createElement('div');
    container.id = 'eventsChannel';
    document.getElementById('mainContent').appendChild(container);
  }
  container.innerHTML = '';
  if (!events || events.length === 0) {
    container.innerHTML = '<div style="padding:2rem;text-align:center;color:#888;">No events yet.</div>';
    return;
  }
  // Get current user ID for own-message logic
  const currentUser = getUserFromToken();
  const currentUserId = currentUser && currentUser.UserID;
  events.forEach(event => {
    // Create a chat-like message container for each event
    const card = document.createElement('div');
    let cardClass = 'message-container event-card';
    if (currentUserId && event.CreatedBy && String(event.CreatedBy) === String(currentUserId)) {
      cardClass += ' own-message';
    }
    card.className = cardClass;

    // Message header with creator info and avatar
    const header = document.createElement('div');
    header.className = 'message-header';

    // Avatar (first letter of creator name)
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar other';
    avatar.style.background = '#4e8cff';
    let creator = event.CreatorName || event.Creator || event.CreatedBy;
    if (typeof creator !== 'string') {
      creator = 'Event';
    }
    avatar.textContent = creator.charAt(0).toUpperCase();

    // Author info
    const authorInfo = document.createElement('div');
    authorInfo.className = 'author-info';
    const author = document.createElement('div');
    author.className = 'author-name';
    // Set a placeholder while fetching full name
    author.textContent = 'Loading...';
    // Fetch full name using CreatedBy (userID)
    if (event.CreatedBy) {
      fetch(`${apiBaseUrl}/groups/user/${event.CreatedBy}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          // Try to use the correct property for full name
          let fullName = data && (data.name || data.fullName || data.username);
          if (fullName) {
            author.textContent = fullName;
            // Update avatar letter to first letter of full name
            avatar.textContent = fullName.charAt(0).toUpperCase();
          } 
          else {
            author.textContent = `User ${event.CreatedBy}`;
            avatar.textContent = 'U';
          }
        })
        .catch(() => {
          author.textContent = `User ${event.CreatedBy}`;
          avatar.textContent = 'U';
        });
    } 
    else {
      author.textContent = 'Unknown';
      avatar.textContent = 'U';
    }
    const time = document.createElement('div');
    time.className = 'message-time';
    time.textContent = formatEventDate(event.CreatedAt);
    authorInfo.appendChild(author);
    authorInfo.appendChild(time);
    header.appendChild(avatar);
    header.appendChild(authorInfo);

    // Card content
    const content = document.createElement('div');
    content.className = 'message-content';
    content.innerHTML = `
      <div class="event-title">${event.Title}</div>
      <div class="event-desc">${event.Description || ''}</div>
      <div class="event-meta">🗓️ ${formatEventDate(event.EventDate)}</div>
      <div class="event-meta">⏰ ${formatEventTime(event.StartTime)} - ${formatEventTime(event.EndTime)}</div>
      <div class="event-meta">📍 ${event.Location}</div>   
    `;

    // Footer for layout only
    const footer = document.createElement('div');
    footer.className = 'event-footer';

    // Add three-dot menu to header for own events
    if (currentUserId && event.CreatedBy && String(event.CreatedBy) === String(currentUserId)) {
      // Three-dot vertical menu button
      const menuButton = document.createElement('button');
      menuButton.className = 'event-menu-button';
      menuButton.innerHTML = '&#8942;'; // vertical ellipsis
      menuButton.title = 'Event options';
      // Styling moved to CSS: .event-menu-button
      menuButton.classList.add('event-menu-button-topright');

      // Dropdown menu
      const dropdownMenu = document.createElement('div');
      dropdownMenu.className = 'event-dropdown';
      // Styling moved to CSS: .event-dropdown
      dropdownMenu.classList.add('event-dropdown-topright');

      // Edit option
      const editOption = document.createElement('button');
      editOption.className = 'dropdown-option';
      editOption.textContent = 'Edit';
      // Styling moved to CSS: .dropdown-option
      editOption.onclick = (e) => {
        e.stopPropagation();
        dropdownMenu.style.display = 'none';
        // Open event edit modal with pre-filled values
        showEventEditForm(event);
      };

    // Show event edit modal with pre-filled values
    function showEventEditForm(event) {
      // Remove any existing modal
      const existingModal = document.getElementById('eventModalOverlay');
      if (existingModal) existingModal.remove();

      // Create overlay
      const overlay = document.createElement('div');
      overlay.id = 'eventModalOverlay';
      overlay.className = 'event-modal-overlay';

      // Create modal form container
      const modal = document.createElement('div');
      modal.className = 'event-modal-container';

      // Load modal HTML from group.html
      fetch('group.html')
        .then(res => res.text())
        .then(html => {
          // Extract modal HTML by id
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = html;
          const modalContent = tempDiv.querySelector('#eventModalTemplate');
          if (!modalContent) {
            alert('Event modal template not found in group.html');
            return;
          }
          modal.innerHTML = modalContent.innerHTML;
          overlay.appendChild(modal);
          document.body.appendChild(overlay);

          // Attach close (X) button handler
          const closeBtn = modal.querySelector('.event-modal-close');
          const form = modal.querySelector('#eventCreateForm');
          if (closeBtn && form) {
            closeBtn.onclick = function() {
              overlay.remove();
              form.reset();
            };
          }

          // Pre-fill form fields with event data
          if (form) {
            form.querySelector('#eventTitleInput').value = event.Title || '';
            form.querySelector('#eventDescriptionInput').value = event.Description || '';
            form.querySelector('#eventDateInput').value = event.EventDate ? event.EventDate.slice(0,10) : '';
            form.querySelector('#eventStartTimeInput').value = event.StartTime || '';
            form.querySelector('#eventEndTimeInput').value = event.EndTime || '';
            form.querySelector('#eventLocationInput').value = event.Location || '';

            // Change modal title to 'Update Event'
            const modalTitle = modal.querySelector('h2');
            if (modalTitle) modalTitle.textContent = 'Update Event';

            // Change submit button text to 'Update Event'
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) submitBtn.textContent = 'Update Event';

            // Attach submit handler for updating event
            form.onsubmit = async function(e) {
              e.preventDefault();
              const title = form.querySelector('#eventTitleInput').value.trim();
              const description = form.querySelector('#eventDescriptionInput').value.trim();
              const eventDate = form.querySelector('#eventDateInput').value;
              const startTime = form.querySelector('#eventStartTimeInput').value;
              const endTime = form.querySelector('#eventEndTimeInput').value;
              const location = form.querySelector('#eventLocationInput').value.trim();
              const token = sessionStorage.getItem('token');
              const params = new URLSearchParams(window.location.search);
              const groupId = params.get('id');

              try {
                const response = await fetch(`${apiBaseUrl}/groups/events/${event.EventID}`, {
                  method: 'PATCH',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                  },
                  body: JSON.stringify({
                    groupId, title, description, eventDate, startTime, endTime, location
                  })
                });
                if (response.ok) {
                  alert('Event updated successfully!');
                  overlay.remove();
                  // Reload events list
                  await loadGroupEvents(groupId);
                } 
                else {
                  const data = await response.json();
                  alert(data.error || 'Failed to update event');
                }
              } 
              catch (err) {
                alert('Error updating event');
              }
            };
          }

          // Clicking outside closes modal
          overlay.onclick = function(e) {
            if (e.target === overlay) overlay.remove();
          };
        })
        .catch(() => {
          alert('Failed to load event modal template from group.html');
        });
    }

      // Delete option (uses existing delete logic)
      const deleteOption = document.createElement('button');
      deleteOption.className = 'dropdown-option delete';
      deleteOption.textContent = 'Delete';
      // Styling moved to CSS: .dropdown-option.delete
      deleteOption.onclick = async function(e) {
        e.stopPropagation();
        dropdownMenu.style.display = 'none';
        if (!confirm('Are you sure you want to delete this event?')) return;
        const token = sessionStorage.getItem('token');
        try {
          const response = await fetch(`${apiBaseUrl}/groups/events/${event.EventID}`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          });
          if (response.ok) {
            alert('Event deleted successfully.');
            const params = new URLSearchParams(window.location.search);
            const groupId = params.get('id');
            await loadGroupEvents(groupId); // Refresh event list
          } 
          else {
            const data = await response.json();
            alert('Failed to delete event');
          }
        } 
        catch (err) {
          alert('Error deleting event: ' + err);
        }
      };

      dropdownMenu.appendChild(editOption);
      dropdownMenu.appendChild(deleteOption);

      // Toggle dropdown on button click
      menuButton.onclick = (e) => {
        e.stopPropagation();
        // Hide all other dropdowns
        document.querySelectorAll('.event-dropdown').forEach(dropdown => {
          dropdown.style.display = 'none';
        });
        dropdownMenu.style.display = dropdownMenu.style.display === 'block' ? 'none' : 'block';
      };

      // Close dropdown when clicking outside
      document.addEventListener('click', () => {
        dropdownMenu.style.display = 'none';
      });

      // Positioning: relative parent for dropdown
      header.classList.add('event-header-relative');
      header.appendChild(menuButton);
      header.appendChild(dropdownMenu);
    }

    // Assemble card
    card.appendChild(header);
    card.appendChild(content);
    card.appendChild(footer);
    container.appendChild(card);
  });
}

// Format event date (YYYY-MM-DD to readable)
function formatEventDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

// Format event time (HH:mm:ss or HH:mm to readable)
function formatEventTime(timeStr) {
  console.log('Formatting time:', timeStr);
  if (!timeStr) return '';

  try {
    // Parse the ISO time string to a Date object
    const date = new Date(timeStr);

    // Use toLocaleTimeString to format to 12-hour clock with AM/PM
    const options = {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'UTC' // Ensure UTC to match the 'Z' in ISO string
    };

    return date.toLocaleTimeString('en-US', options);
  } 
  catch (e) {
    console.error('Invalid time string:', timeStr);
    return timeStr;
  }
}

// Shows the event creation form modal
function showEventCreationForm() {
  // Remove any existing modal
  const existingModal = document.getElementById('eventModalOverlay');
  if (existingModal) existingModal.remove();

  // Create overlay
  const overlay = document.createElement('div');
  overlay.id = 'eventModalOverlay';
  overlay.className = 'event-modal-overlay';

  // Create modal form container
  const modal = document.createElement('div');
  modal.className = 'event-modal-container';

  // Load modal HTML from group.html
  fetch('group.html')
    .then(res => res.text())
    .then(html => {
      // Extract modal HTML by id
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      const modalContent = tempDiv.querySelector('#eventModalTemplate');
      if (!modalContent) {
        alert('Event modal template not found in group.html');
        return;
      }
      modal.innerHTML = modalContent.innerHTML;
      overlay.appendChild(modal);
      document.body.appendChild(overlay);

      // Attach close (X) button handler
      const closeBtn = modal.querySelector('.event-modal-close');
      const form = modal.querySelector('#eventCreateForm');
      if (closeBtn && form) {
        closeBtn.onclick = function() {
          overlay.remove();
          form.reset();
        };
      }

      // Attach submit handler to the form
      if (form) {
        form.onsubmit = async function(e) {
          e.preventDefault();
          const title = document.getElementById('eventTitleInput').value.trim();
          const description = document.getElementById('eventDescriptionInput').value.trim();
          const eventDate = document.getElementById('eventDateInput').value;
          const startTime = document.getElementById('eventStartTimeInput').value;
          const endTime = document.getElementById('eventEndTimeInput').value;
          const location = document.getElementById('eventLocationInput').value.trim();
          const groupId = currentGroupId;
          const channelName = "events";
          const token = sessionStorage.getItem('token');

          try {
            const response = await fetch(`${apiBaseUrl}/groups/createEvent`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({groupId, channelName, title, description, eventDate, startTime, endTime, location})
            });
            if (response.ok) {
              alert('Event created successfully!');
              overlay.remove();
              await loadGroupEvents(currentGroupId);
            } 
            else {
              const data = await response.json();
              alert(data.error || 'Failed to create event');
            }
          } 
          catch (err) {
            alert('Error creating event');
          }
        };
      }

      // Clicking outside closes modal
      overlay.onclick = function(e) {
        if (e.target === overlay) overlay.remove();
      };
    })
    .catch(() => {
      alert('Failed to load event modal template from group.html');
    });
}
