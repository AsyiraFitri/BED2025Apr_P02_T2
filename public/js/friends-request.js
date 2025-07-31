
const apiUrl = 'http://localhost:3000/api/friends'; // Adjust if needed

let currentUser = null;

document.addEventListener('DOMContentLoaded', () => {
  const userData = sessionStorage.getItem('user');
  if (!userData) {
    alert('You must be logged in to access this page.');
    window.location.href = 'auth.html'; // Redirect to login if not logged in
    return;
  }

  currentUser = JSON.parse(userData);
  loadFriendData(); // auto-load friend requests
});

async function loadFriendData() {
  const userId = String(currentUser.UserID);

  try {
    const incomingRes = await fetch(`${apiUrl}/incoming/${String(userId)}`);
    if (!incomingRes.ok) throw new Error('Failed to load incoming requests');
    const incoming = await incomingRes.json();

    const sentRes = await fetch(`${apiUrl}/sent/${String(userId)}`);
    if (!sentRes.ok) throw new Error('Failed to load sent requests');
    const sent = await sentRes.json();

    displayRequests('incomingRequests', incoming, true);
    displayRequests('sentRequests', sent, false);
  } catch (err) {
    console.error('Error loading friend requests:', err);
  }
}

function displayRequests(containerId, data, isIncoming) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';

  if (data.length === 0) {
    container.innerHTML = '<p class="text-muted">No friend requests found.</p>';
    return;
  }

  data.forEach(req => {
    const wrapper = document.createElement('div');
    wrapper.className = 'd-flex justify-content-between align-items-center border p-2 mb-2';
    wrapper.innerHTML = `
      <span><strong>${isIncoming ? req.UserID : req.FriendUserID}</strong> - ${req.Status}</span>
      <div>
        ${isIncoming && req.Status === 'pending' ? `
          <button class="btn btn-sm btn-success me-2" onclick="respondToRequest(${req.FriendID}, 'accepted')">Accept</button>
          <button class="btn btn-sm btn-danger me-2" onclick="respondToRequest(${req.FriendID}, 'rejected')">Reject</button>
        ` : ''}
        <button class="btn btn-sm btn-outline-secondary" onclick="deleteFriendRequest(${req.FriendID})">Delete</button>
      </div>
    `;
    container.appendChild(wrapper);
  });
}

async function sendFriendRequest() {
  const friendId = document.getElementById('friendUserIdInput').value;
  const user = JSON.parse(sessionStorage.getItem('user'));
  const token = sessionStorage.getItem('token');

  if (!user || !token) {
    return alert('You must be logged in.');
  }

  if (!friendId) {
    return alert("Enter your friend's User ID.");
  }

  console.log('Sending Friend Request:', {
    userID: String(user.UserID),
    friendUserID: String(friendId),
    userIDType: typeof String(user.UserID),
    friendIDType: typeof String(friendId)
  });

  try {
    const res = await fetch(`${apiUrl}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` // 🔒 Send token here
      },
      body: JSON.stringify({
        userID: String(user.UserID),          // force it to string
        friendUserID: String(friendId)        // in case user types a number
      })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || 'Failed to send request');
    }

    alert(data.message || 'Friend request sent.');
    loadFriendData(); // Refresh list
  } catch (err) {
    console.error("Friend request error:", err);
    alert('Error: ' + err.message);
  }
}

async function respondToRequest(friendId, status) {
  try {
    const res = await fetch(`${apiUrl}/${friendId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.message || 'Failed to update request');
    }

    loadFriendData();
  } catch (err) {
    console.error("Respond request error:", err);
    alert('Error updating friend request: ' + err.message);
  }
}

async function deleteFriendRequest(friendId) {
  try {
    const res = await fetch(`${apiUrl}/${friendId}`, { method: 'DELETE' });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.message || 'Failed to delete request');
    }
    loadFriendData();
  } catch (err) {
    console.error("Delete friend request error:", err);
    alert('Error deleting friend request: ' + err.message);
  }
}