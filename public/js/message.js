// message.js

let currentUserId = "";
let currentFriendId = "";

document.addEventListener("DOMContentLoaded", async () => {
  // Check authentication
  const user = JSON.parse(sessionStorage.getItem("user"));
  if (!user) {
    alert("Please log in to access this page.");
    window.location.href = "auth.html";
    return;
  }

  // Initialize current user
  currentUserId = parseInt(user.UserID);
  document.getElementById("displayUserId").textContent = `Logged in as: ${user.first_name} (ID: ${currentUserId})`;
  
  try {
    await loadFriends();
  } catch (error) {
    console.error("Initialization error:", error);
  }
});

async function loadFriends() {
  console.log(`Loading friends for user ${currentUserId}...`);
  
  try {
    const response = await fetch(`http://localhost:3000/api/friends/${currentUserId}`);
    console.log("Friend response status:", response.status);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const friends = await response.json();
    console.log("Friends data received:", friends);
    
    const list = document.getElementById("friendsList");
    list.innerHTML = "<h5 class='text-center mt-2'>Friends</h5>";

    if (!friends || friends.length === 0) {
      list.innerHTML += `<div class="text-muted text-center p-2">No friends yet.</div>`;
      return;
    }

    // Load friend details in parallel
    const friendDetails = await Promise.all(
      friends.map(async friend => {
        const friendId = friend.FriendID;
        try {
          const userResponse = await fetch(`http://localhost:3000/api/users/${friendId}`);
          if (userResponse.ok) {
            return await userResponse.json();
          }
          return { UserID: friendId, first_name: 'User', last_name: friendId };
        } catch (error) {
          console.error(`Error fetching user ${friendId}:`, error);
          return { UserID: friendId, first_name: 'Unknown', last_name: 'User' };
        }
      })
    );

    // Display friends
    friendDetails.forEach(user => {
      const friendElement = document.createElement('div');
      friendElement.className = 'friend-item p-2 d-flex justify-content-between align-items-center';
      friendElement.innerHTML = `
        <span>${user.first_name} ${user.last_name}</span>
        <span class="badge bg-secondary">ID: ${user.UserID}</span>
      `;
      friendElement.onclick = () => selectFriend(user.UserID);
      list.appendChild(friendElement);
    });

  } catch (error) {
    console.error("Error in loadFriends:", error);
    const list = document.getElementById("friendsList");
    list.innerHTML = `
      <h5 class='text-center mt-2'>Friends</h5>
      <div class="alert alert-danger">Error loading friends. Please try again later.</div>
    `;
  }
}

async function selectFriend(friendId) {
  try {
    currentFriendId = parseInt(friendId);
    const res = await fetch(`/api/messages/${currentUserId}/${friendId}`);
    if (!res.ok) throw new Error('Failed to load messages');
    
    const messages = await res.json();
    const box = document.getElementById('messageBox');
    box.innerHTML = '';

    if (messages.length === 0) {
      box.innerHTML = `<div class="text-muted text-center p-3">No messages yet. Start a new conversation!</div>`;
      return;
    }

    // Get friend's details for display
    const friendRes = await fetch(`/api/users/${friendId}`);
    const friend = friendRes.ok ? await friendRes.json() : { first_name: 'User', last_name: friendId };

    messages.forEach(msg => {
      const div = document.createElement('div');
      div.className = `message ${msg.SenderID === currentUserId ? 'own-message' : 'friend-message'}`;
      div.innerHTML = `
        <div class="message-content">
          <div class="message-header">
            <strong>${msg.SenderID === currentUserId ? 'You' : friend.first_name}</strong>
            <small class="text-muted">${new Date(msg.Timestamp).toLocaleString()}</small>
          </div>
          <div class="message-text">${msg.MessageText}</div>
          ${msg.SenderID === currentUserId ? `
            <div class="message-actions">
              <i class="fas fa-edit" onclick="editMessage(${msg.MessageID}, '${escapeHtml(msg.MessageText)}')"></i>
              <i class="fas fa-trash" onclick="deleteMessage(${msg.MessageID})"></i>
            </div>
          ` : ''}
        </div>
      `;
      box.appendChild(div);
    });

    box.scrollTop = box.scrollHeight;
  } catch (error) {
    console.error("Error loading messages:", error);
    document.getElementById('messageBox').innerHTML = `
      <div class="alert alert-danger">Error loading messages</div>
    `;
  }
}

function escapeHtml(text) {
  return text.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

async function sendMessage() {
  const input = document.getElementById('messageInput');
  const text = input.value.trim();
  if (!text || !currentUserId || !currentFriendId) return;

  try {
    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        senderId: currentUserId,
        receiverId: currentFriendId,
        messageText: text
      })
    });

    if (!res.ok) throw new Error('Failed to send message');

    input.value = '';
    await selectFriend(currentFriendId);
    input.focus();
  } catch (error) {
    console.error("Error sending message:", error);
    alert('Failed to send message');
  }
}

async function deleteMessage(id) {
  if (confirm('Are you sure you want to delete this message?')) {
    try {
      const res = await fetch(`/api/messages/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete message');
      await selectFriend(currentFriendId);
    } catch (error) {
      console.error("Error deleting message:", error);
      alert('Failed to delete message');
    }
  }
}

async function editMessage(id, oldText) {
  const newText = prompt("Edit your message:", oldText);
  if (newText && newText !== oldText) {
    try {
      const res = await fetch(`/api/messages/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageText: newText })
      });
      if (!res.ok) throw new Error('Failed to update message');
      await selectFriend(currentFriendId);
    } catch (error) {
      console.error("Error updating message:", error);
      alert('Failed to update message');
    }
  }
}