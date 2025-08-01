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
    console.log(`Loading messages between ${currentUserId} and ${currentFriendId}`);
    
    // Get friend's details for the chat header
    const friendRes = await fetch(`http://localhost:3000/api/users/${currentFriendId}`);
    const friend = friendRes.ok ? await friendRes.json() : null;
    
    // Get messages
    const response = await fetch(
      `http://localhost:3000/api/messages/${currentUserId}/${currentFriendId}`
    );
    
    console.log("Messages API response status:", response.status);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const messages = await response.json();
    console.log("Messages received:", messages);
    
    const box = document.getElementById('messageBox');
    box.innerHTML = '';

    if (!messages || messages.length === 0) {
      box.innerHTML = `
        <div class="text-center p-3 text-muted">
          No messages yet. Start the conversation!
        </div>
      `;
      return;
    }

    // Display messages
    messages.forEach(msg => {
      const isCurrentUser = msg.SenderID === currentUserId;
      const messageTime = new Date(msg.Timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      const messageElement = document.createElement('div');
      messageElement.className = `message ${isCurrentUser ? 'sent' : 'received'}`;
      messageElement.innerHTML = `
        <div class="message-content">
          <div class="message-text">${msg.MessageText}</div>
          <div class="message-time">${messageTime}</div>
          ${isCurrentUser ? `
            <div class="message-actions">
              <i class="fas fa-edit" onclick="editMessage(${msg.MessageID}, '${msg.MessageText.replace(/'/g, "\\'")}')"></i>
              <i class="fas fa-trash" onclick="deleteMessage(${msg.MessageID})"></i>
            </div>
          ` : ''}
        </div>
      `;
      box.appendChild(messageElement);
    });

    // Scroll to bottom
    box.scrollTop = box.scrollHeight;
    
  } catch (error) {
    console.error("Error loading messages:", error);
    document.getElementById('messageBox').innerHTML = `
      <div class="alert alert-danger">
        Error loading messages. Please try again.
        ${error.message}
      </div>
    `;
  }
}

async function sendMessage() {
  const input = document.getElementById('messageInput');
  const text = input.value.trim();
  
  if (!text) {
    alert("Please enter a message");
    return;
  }
  
  if (!currentFriendId) {
    alert("Please select a friend to message");
    return;
  }

  try {
    console.log("Attempting to send message:", {
      senderId: currentUserId,
      receiverId: currentFriendId,
      messageText: text
    });

    const response = await fetch('http://localhost:3000/api/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionStorage.getItem('token')}`
      },
      body: JSON.stringify({
        senderId: currentUserId,
        receiverId: currentFriendId,
        messageText: text
      })
    });

    const data = await response.json();
    console.log("Server response:", data);

    if (!response.ok) {
      throw new Error(data.error || 'Failed to send message');
    }

    input.value = '';
    await selectFriend(currentFriendId); // Refresh the conversation
  } catch (error) {
    console.error("Message sending error:", error);
    alert(`Failed to send message: ${error.message}`);
  }
}

async function deleteMessage(id) {
  if (!confirm('Are you sure you want to delete this message?')) {
    return;
  }

  try {
    console.log(`Deleting message ${id}`);
    const response = await fetch(`http://localhost:3000/api/messages/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${sessionStorage.getItem('token')}`
      }
    });

    const data = await response.json();
    console.log("Delete response:", data);

    if (!response.ok) {
      throw new Error(data.error || 'Failed to delete message');
    }

    await selectFriend(currentFriendId); // Refresh the conversation
  } catch (error) {
    console.error("Delete message error:", error);
    alert(`Failed to delete message: ${error.message}`);
    
    // Detailed error logging
    console.group("Delete Error Details");
    console.log("Message ID:", id);
    console.log("Current Friend ID:", currentFriendId);
    console.groupEnd();
  }
}

async function editMessage(id, oldText) {
  try {
    const newText = prompt("Edit your message:", oldText);
    if (newText && newText !== oldText) {
      console.log(`Updating message ${id} to: "${newText}"`);
      
      const response = await fetch(`http://localhost:3000/api/messages/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        },
        body: JSON.stringify({ messageText: newText })
      });

      const data = await response.json();
      console.log("Edit response:", data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update message');
      }

      await selectFriend(currentFriendId); // Refresh the conversation
    }
  } catch (error) {
    console.error("Edit message error:", error);
    alert(`Failed to edit message: ${error.message}`);
    
    // Detailed error logging
    console.group("Edit Error Details");
    console.log("Message ID:", id);
    console.log("Original Text:", oldText);
    console.log("Current Friend ID:", currentFriendId);
    console.groupEnd();
  }
}