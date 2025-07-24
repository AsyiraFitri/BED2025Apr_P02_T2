// JWT utility function to decode user information from a token
function getUserFromToken() {
  // Retrieve the JWT token from sessionStorage
  const token = sessionStorage.getItem('token');

  // If the token doesn't exist, alert the user and redirect to login page
  if (!token) {
    alert('Please log in first');
    window.location.href = 'login.html';
    return;
  }

  try {
    // JWT tokens are formatted as: header.payload.signature
    // Split the token and extract the payload (the second part)
    const base64Url = token.split('.')[1];

    // Convert base64 URL-safe format to standard base64
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');

    // Decode the base64 string into a JSON string
    const jsonPayload = decodeURIComponent(
      atob(base64) // Decode base64 to ASCII string
        .split('') // Convert string to array of characters
        .map(function(c) {
          // Convert each character to its percent-encoded form
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join('') // Join all encoded characters into a single string
    );

    // Parse the JSON string and return the resulting user object
    return JSON.parse(jsonPayload);
  } 
  catch (error) {
    // If any error occurs during decoding/parsing, log it and return null
    console.error('Error decoding JWT token:', error);
    return null;
  }
}

// Add safe authentication check function
function checkUserAuthentication() {
  const token = sessionStorage.getItem('token');
  
  if (!token) {
    alert('Please log in first');
    window.location.href = 'login.html';
    return null;
  }
  
  try {
    const user = getUserFromToken();
    if (!user) {
      alert('Please log in again');
      sessionStorage.removeItem('token');
      window.location.href = 'login.html';
      return null;
    }
    return user;
  } 
  catch (error) {
    console.error('Error parsing user data:', error);
    alert('Please log in again');
    sessionStorage.removeItem('token');
    window.location.href = 'login.html';
    return null;
  }
}

// Get references to DOM elements with null checks
const modal = document.getElementById('addModal');
const addBtns = document.querySelectorAll('.add-btn');
const closeBtn = document.querySelector('.close-btn');
const form = document.getElementById('addCommunityForm');

// Only set up modal functionality if elements exist
if (modal && addBtns && closeBtn && form) {
    // Open the "Add Community" modal when any .add-btn is clicked
    addBtns.forEach(btn => {
        btn.onclick = () => {
            modal.style.display = 'block';
        };
    });

    // Close the modal when the close button is clicked
    closeBtn.onclick = () => {
        modal.style.display = 'none';
    };

    // Close the modal if the user clicks outside the modal content
    window.onclick = (e) => {
        if (e.target === modal) modal.style.display = 'none';
    };
} 
else {
    console.warn('Modal elements not found - modal functionality disabled');
}

// Load and display all existing groups
async function loadGroups() {
    try {
        const res = await fetch('/api/hobby-groups'); // Fetch all groups from API
        const groups = await res.json(); // Parse response JSON

        let container = document.getElementById('communityCards');
        if (!container) return; // Exit if container does not exist (not on community page)

        const token = sessionStorage.getItem('token'); // Get JWT token for auth
        container.innerHTML = ''; // Clear existing content

        for (const group of groups) {
            const card = document.createElement('div'); // Create card element for group
            card.className = 'community-card';

            const title = document.createElement('h3'); // Group title element
            title.textContent = group.GroupName;

            const desc = document.createElement('p'); // Group description element
            desc.textContent = group.GroupDescription;

            const btn = document.createElement('button'); // Join/View Group button
            btn.className = 'join-btn';

            // Check if the user is already a member of this group
            let isMember = false;
            if (token) {
                try {
                    const membershipRes = await fetch(`/api/groups/checkMembership/${group.GroupID}`, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${token}` // Pass auth token
                        }
                    });
                    const membershipData = await membershipRes.json();
                    isMember = membershipData.isMember; // Update membership status
                } 
                catch (error) {
                    console.error('Error checking membership:', error);
                }
            }

            if (isMember) {
                // If member, show "View Group" button with styling and link
                btn.textContent = 'View Group';
                btn.style.backgroundColor = '#e3f2fd';
                btn.style.color = '#1976d2';
                btn.addEventListener('click', () => {
                    window.location.href = `group.html?id=${group.GroupID}`;
                });
            } 
            else {
                // If not a member, show "Join" button
                btn.textContent = 'Join';
                btn.addEventListener('click', async () => {
                    const token = sessionStorage.getItem('token');
                    if (!token) {
                        alert('Please log in first');
                        window.location.href = 'login.html';
                        return;
                    }

                    const groupId = group.GroupID;

                    try {
                        // Attempt to join group via POST request
                        const response = await fetch('/api/hobby-groups/join', {
                            method: 'POST',
                            headers: { 
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify({ groupId })
                        });

                        let data = {};
                        try {
                            // Try to parse JSON body if present
                            if (response.headers.get("content-length") !== "0") {
                                data = await response.json();
                            }
                        } 
                        catch (jsonError) {
                            console.warn('No JSON body in response');
                        }

                        if (response.status === 201) {
                            // Joined successfully, show alert and redirect
                            alert('Successfully joined the group!');
                            window.location.href = `group.html?id=${groupId}`;
                        } 
                        else if (response.status === 200) {
                            // Double-check membership if response is 200 OK
                            let isActuallyMember = false;
                            try {
                                const membershipRes = await fetch(`/api/groups/checkMembership/${groupId}`, {
                                    method: 'GET',
                                    headers: {
                                        'Authorization': `Bearer ${token}`
                                    }
                                });
                                const membershipData = await membershipRes.json();
                                isActuallyMember = membershipData.isMember;
                            } 
                            catch (err) {}
                            if (isActuallyMember) {
                                alert('Successfully joined the group!');
                                window.location.href = `group.html?id=${groupId}`;
                            } 
                            else {
                                alert(data.message || 'Failed to join group.');
                            }
                        } 
                        else {
                            // Handle other error responses
                            alert(data.message || 'Failed to join group.');
                        }
                    } 
                    catch (err) {
                        console.error('Error joining group:', err);
                        alert('Error joining group.');
                    }
                });
            }

            // Append title, description and button to the group card
            card.appendChild(title);
            card.appendChild(desc);
            card.appendChild(btn);
            // Append card to container on the page
            container.appendChild(card);
        }
    } 
    catch (error) {
        console.error('Error loading groups:', error);
    }
}

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Get references to DOM elements with null checks
    const modal = document.getElementById('addModal');
    const addBtns = document.querySelectorAll('.add-btn');
    const closeBtn = document.querySelector('.close-btn');
    const form = document.getElementById('addCommunityForm');

    // Only set up modal functionality if elements exist
    if (modal && addBtns.length > 0 && closeBtn && form) {
        // Open the "Add Community" modal when any .add-btn is clicked
        addBtns.forEach(btn => {
            btn.onclick = () => {
                modal.style.display = 'block';
            };
        });

        // Close the modal when the close button is clicked
        closeBtn.onclick = () => {
            modal.style.display = 'none';
        };

        // Close the modal if the user clicks outside the modal content
        window.onclick = (e) => {
            if (e.target === modal) modal.style.display = 'none';
        };

        // Handle form submission for creating a new community group
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const user = checkUserAuthentication();
            if (!user) return;

            // Always get the token for authenticated requests
            const token = sessionStorage.getItem('token');
            if (!token) {
                alert('Please log in first');
                window.location.href = 'login.html';
                return;
            }

            const groupName = document.getElementById('groupName').value.trim();
            const groupDescription = document.getElementById('groupDescription').value.trim();

            try {
                const response = await fetch('/api/hobby-groups', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ groupName, groupDescription }),
                });

                if (response.ok) {
                    const data = await response.json();
                    alert('Community group added!');
                    modal.style.display = 'none';
                    form.reset();

                    const groupId = data.groupId;
                    window.location.href = `group.html?id=${groupId}`;
                } 
                else {
                    let errorMsg = 'Failed to add group.';
                    try {
                        const errorData = await response.json();
                        if (errorData && errorData.message) {
                            errorMsg = errorData.message;
                        }
                    } 
                    catch (err) {
                        console.error('Error parsing response:', err);
                    }
                    alert(errorMsg);
                }
            } 
            catch (error) {
                alert('Error connecting to server.');
                console.error(error);
            }
        });
        
        console.log('Modal functionality initialized successfully');
    } 
    else {
        console.warn('Modal elements not found - modal functionality disabled');
        console.log('Modal:', modal);
        console.log('Add buttons:', addBtns.length);
        console.log('Close button:', closeBtn);
        console.log('Form:', form);
    }

    // Load groups after DOM is ready
    loadGroups();
    
    // Control UI based on user role
    checkUserRoleAndSetUI();
});

// Function to check user role and set UI visibility
function checkUserRoleAndSetUI() {
    const user = checkUserAuthentication();
    if (!user) return;

    // Hide "Add Community" button for non-admin users
    const addBtns = document.querySelectorAll('.add-btn');
    if (user.role !== 'admin') {
        addBtns.forEach(btn => {
            btn.style.display = 'none';
        });
        
        // Also hide the modal if it exists
        const modal = document.getElementById('addModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }
}