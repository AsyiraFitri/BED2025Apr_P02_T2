// [FRONTEND FRIEND REQUEST SYSTEM]

// API endpoint configuration
const apiUrl = 'http://localhost:3000/api/friends'; // Adjust if needed

// Current user state
let currentUser = null;

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    // [SECURITY CHECK] Verify user is logged in
    const userData = sessionStorage.getItem('user');
  if (!userData) {
    alert('You must be logged in to access this page.');
    window.location.href = 'auth.html'; // Redirect to login if not logged in
    return;
  }

  // Set current user from session storage
  currentUser = JSON.parse(userData);
  loadFriendData(); // auto-load friend requests
});


// [READ] Load all friend request data
async function loadFriendData() {
  const userId = String(currentUser.UserID);

  try {
    // Fetch incoming requests (requests others sent to you)
    const incomingRes = await fetch(`${apiUrl}/incoming/${String(userId)}`);
    if (!incomingRes.ok) throw new Error('Failed to load incoming requests');
    const incoming = await incomingRes.json();

    // Fetch sent requests (requests you sent to others)
    const sentRes = await fetch(`${apiUrl}/sent/${String(userId)}`);
    if (!sentRes.ok) throw new Error('Failed to load sent requests');
    const sent = await sentRes.json();

    // Display both lists
    displayRequests('incomingRequests', incoming, true);
    displayRequests('sentRequests', sent, false);
  } catch (err) {
    console.error('Error loading friend requests:', err);
  }
}

// Display requests in the UI
function displayRequests(containerId, data, isIncoming) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';

  // Show message if no requests
  if (data.length === 0) {
    container.innerHTML = '<p class="text-muted">No friend requests found.</p>';
    return;
  }

  data.forEach(req => {
    const wrapper = document.createElement('div');
    wrapper.className = 'd-flex justify-content-between align-items-center border p-2 mb-2';
    // Display different buttons for incoming vs sent requests
    wrapper.innerHTML = `
        <span><strong>${isIncoming ? req.UserID : req.FriendUserID}</strong> - ${req.Status}</span>
        <div>
            ${isIncoming && req.Status === 'pending' ? `
                <button class="btn btn-sm btn-success me-2" onclick="respondToRequest(${req.FriendID}, 'accepted')">Accept</button>
                <button class="btn btn-sm btn-danger me-2" onclick="respondToRequest(${req.FriendID}, 'rejected')">Reject</button>
            ` : ''}
        
        </div>
    `;
    container.appendChild(wrapper);
  });
}

// [CREATE] Send new friend request
async function sendFriendRequest() {
  const friendId = document.getElementById('friendUserIdInput').value;
  const user = JSON.parse(sessionStorage.getItem('user'));
  const token = sessionStorage.getItem('token');

  // Validation checks
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
    // API call to send request
    const res = await fetch(`${apiUrl}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` // Include auth token
      },
      body: JSON.stringify({
        userID: String(user.UserID),          // Ensure string type
        friendUserID: String(friendId)        // in case user types a number
      })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || 'Failed to send request');
    }

    // Success handling
    alert(data.message || 'Friend request sent.');
    loadFriendData(); // Refresh list
  } catch (err) {
    console.error("Friend request error:", err);
    alert('Error: ' + err.message);
  }
}

// [UPDATE] Respond to incoming request (accept/reject)
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

// Update delete friend request (commented out)
/*
async function deleteFriendRequest(friendId) {
  if (!confirm('Permanently delete this friend request?')) return;

  try {
    // First verify the request exists
    const verifyRes = await fetch(`http://localhost:3000/api/friends/verify/${friendId}`);
    const verifyData = await verifyRes.json();
    
    if (!verifyData.exists) {
      throw new Error('Request not found in database');
    }

    console.log('Verification result:', verifyData);

    // Then attempt deletion
    const deleteRes = await fetch(`http://localhost:3000/api/friends/request/${friendId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionStorage.getItem('token')}`
      }
    });

    const deleteData = await deleteRes.json();
    console.log('Delete result:', deleteData);
    
    if (!deleteRes.ok) {
      throw new Error(deleteData.error || 'Delete request failed');
    }

    // Verify deletion
    const postVerifyRes = await fetch(`http://localhost:3000/api/friends/verify/${friendId}`);
    const postVerifyData = await postVerifyRes.json();
    
    if (postVerifyData.exists) {
      throw new Error('Request still exists after deletion');
    }

    alert('Friend request successfully deleted');
    loadFriendData();
    
  } catch (error) {
    console.error('Full error:', {
      message: error.message,
      stack: error.stack
    });
    alert(`Deletion failed: ${error.message}`);
  }
}
*/