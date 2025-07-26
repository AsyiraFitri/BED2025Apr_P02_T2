// friends.js

let currentUserId = "";
let currentFriendId = "";

document.addEventListener("DOMContentLoaded", () => {
  const user = JSON.parse(sessionStorage.getItem("user"));
  const token = sessionStorage.getItem("token");

  if (!user || !token) {
    alert("Please log in to access this page.");
    window.location.href = "login.html";
    return;
  }

  currentUserId = user.UserID;
  document.getElementById("displayUserId").textContent = `Logged in as: ${currentUserId}`;
  loadFriends();
});

async function loadFriends() {
  const res = await fetch(`/api/friends/${currentUserId}`);
  const friends = await res.json();
  const list = document.getElementById("friendsList");
  list.innerHTML = "<h5 class='text-center mt-2'>Friends</h5>";

  friends.forEach(friend => {
    const friendId = friend.FriendUserID === currentUserId ? friend.UserID : friend.FriendUserID;
    const div = document.createElement('div');
    div.className = 'friend-item';
    div.innerText = friendId;
    div.onclick = () => selectFriend(friendId);
    list.appendChild(div);
  });
}

async function selectFriend(friendId) {
  currentFriendId = friendId;
  const res = await fetch(`/api/messages/${currentUserId}/${friendId}`);
  const messages = await res.json();
  const box = document.getElementById('messageBox');
  box.innerHTML = '';

  messages.forEach(msg => {
    const div = document.createElement('div');
    div.className = msg.SenderID === currentUserId ? 'own-message' : '';
    div.innerHTML = `
      <div>
        <strong>${msg.SenderID}:</strong> ${msg.MessageText}
        ${msg.SenderID === currentUserId ? `
          <span class="message-actions" onclick="editMessage(${msg.MessageID}, '${msg.MessageText.replace(/'/g, "\\'")}')">✏️</span>
          <span class="message-actions" onclick="deleteMessage(${msg.MessageID})">🗑️</span>` : ''}
      </div>
    `;
    box.appendChild(div);
  });

  box.scrollTop = box.scrollHeight;
}

async function sendMessage() {
  const input = document.getElementById('messageInput');
  const text = input.value.trim();
  if (!text || !currentUserId || !currentFriendId) return;

  await fetch('/api/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      senderId: currentUserId,
      receiverId: currentFriendId,
      messageText: text
    })
  });

  input.value = '';
  selectFriend(currentFriendId);
}

async function deleteMessage(id) {
  if (confirm('Delete this message?')) {
    await fetch(`/api/messages/${id}`, { method: 'DELETE' });
    selectFriend(currentFriendId);
  }
}

async function editMessage(id, oldText) {
  const newText = prompt("Edit your message:", oldText);
  if (newText && newText !== oldText) {
    await fetch(`/api/messages/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messageText: newText })
    });
    selectFriend(currentFriendId);
  }
}