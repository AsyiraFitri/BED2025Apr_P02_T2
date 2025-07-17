// Add safe authentication check function
function checkUserAuthentication() {
  const user = sessionStorage.getItem('user');
  const token = sessionStorage.getItem('token');
  
  if (!user || !token) {
    alert('Please log in first');
    window.location.href = 'login.html';
    return null;
  }
  
  try {
    return JSON.parse(user);
  } catch (error) {
    console.error('Error parsing user data:', error);
    alert('Please log in again');
    sessionStorage.removeItem('user');
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

    // Handle form submission for creating a new community group
    form.addEventListener('submit', async (e) => {
        e.preventDefault(); // Prevent page reload

        // Check user authentication and admin role
        const user = checkUserAuthentication();
        if (!user) return;

        // Check if user has admin role
        if (user.role !== 'admin') {
            alert('Only administrators can create groups');
            return;
        }

        // Get JWT token for authentication
        const token = sessionStorage.getItem('token');
        if (!token) {
            alert('Please log in first');
            window.location.href = 'login.html';
            return;
        }

        // Get input values from form
        const groupName = document.getElementById('groupName').value.trim();
        const groupDescription = document.getElementById('groupDescription').value.trim();

        try {
            // Send POST request to create new group with JWT token
            const response = await fetch('/api/hobby-groups', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ groupName, groupDescription }),
            });

            if (response.ok) {
                const data = await response.json(); // Parse response
                alert('Community group added!');
                modal.style.display = 'none';
                form.reset(); // Reset form inputs

                // Get group ID from response
                const groupId = data.groupId;

                // Auto-join the group after creation
                try {
                    const joinResponse = await fetch('/api/hobby-groups/join', {
                        method: 'POST',
                        headers: { 
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ groupId })
                    });

                    const joinData = await joinResponse.json();

                    if (joinResponse.status === 201) {
                        // Redirect to group page after successful join
                        window.location.href = `group.html?id=${groupId}`;
                    } else {
                        alert('Failed to join group.');
                    }
                } catch (err) {
                    console.error('Error joining group:', err);
                    alert('Error joining group.');
                }
            } else {
                alert('Failed to add group.');
            }
        } catch (error) {
            alert('Error connecting to server.');
            console.error(error);
        }
    });
} else {
    console.warn('Modal elements not found - modal functionality disabled');
}

// Load and display all existing groups
async function loadGroups() {
    try {
        const res = await fetch('/api/hobby-groups'); // Fetch all groups
        const groups = await res.json();
        const container = document.getElementById('communityCards');
        
        if (!container) {
            console.error('communityCards container not found');
            return;
        }

        // Get JWT token for authentication
        const token = sessionStorage.getItem('token');
        container.innerHTML = ''; // Clear existing content

        for (const group of groups) {
            const card = document.createElement('div');
            card.className = 'community-card';

            const title = document.createElement('h3');
            title.textContent = group.GroupName;

            const desc = document.createElement('p');
            desc.textContent = group.GroupDescription;

            const btn = document.createElement('button');
            btn.className = 'join-btn';

            // Check if the logged-in user is already a member
            let isMember = false;
            if (token) {
                try {
                    const membershipRes = await fetch(`/api/groups/checkMembership/${group.GroupID}`, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    const membershipData = await membershipRes.json();
                    isMember = membershipData.isMember;
                } catch (error) {
                    console.error('Error checking membership:', error);
                }
            }

            if (isMember) {
                // If already a member, show "View Group" button
                btn.textContent = 'View Group';
                btn.style.backgroundColor = '#e3f2fd';
                btn.style.color = '#1976d2';
                btn.addEventListener('click', () => {
                    window.location.href = `group.html?id=${group.GroupID}`;
                });
            } else {
                // If not a member, show "Join" button
                btn.textContent = 'Join';
                btn.addEventListener('click', async () => {
                    // Get JWT token for authentication
                    const token = sessionStorage.getItem('token');
                    if (!token) {
                        alert('Please log in first');
                        window.location.href = 'login.html';
                        return;
                    }

                    const groupId = group.GroupID;

                    try {
                        const response = await fetch('/api/hobby-groups/join', {
                            method: 'POST',
                            headers: { 
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify({ groupId })
                        });

                        const data = await response.json();

                        if (response.status === 201) {
                            alert(data.message);
                            window.location.href = `group.html?id=${groupId}`;
                        } else {
                            alert('Failed to join group.');
                        }
                    } catch (err) {
                        console.error('Error joining group:', err);
                        alert('Error joining group.');
                    }
                });
            }

            // Add elements to the card and append to the container
            card.appendChild(title);
            card.appendChild(desc);
            card.appendChild(btn);
            container.appendChild(card);
        }
    } catch (error) {
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

            const groupName = document.getElementById('groupName').value.trim();
            const groupDescription = document.getElementById('groupDescription').value.trim();
            const adminId = user.UserID;

            try {
                const response = await fetch('/api/hobby-groups', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ groupName, groupDescription, adminId }),
                });

                if (response.ok) {
                    const data = await response.json();
                    alert('Community group added!');
                    modal.style.display = 'none';
                    form.reset();

                    const groupId = data.groupId;
                    const userId = user.UserID;
                    const fullName = user.FullName;

                    try {
                        const response = await fetch('/api/hobby-groups/join', {
                            method: 'POST',
                            headers: { 
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify({ groupId })
                        });

                        const data = await response.json();

                        if (response.status === 201) {
                            window.location.href = `group.html?id=${groupId}`;
                        } else {
                            alert('Failed to join group.');
                        }
                    } catch (err) {
                        console.error('Error joining group:', err);
                        alert('Error joining group.');
                    }
                } else {
                    alert('Failed to add group.');
                }
            } catch (error) {
                alert('Error connecting to server.');
                console.error(error);
            }
        });
        
        console.log('Modal functionality initialized successfully');
    } else {
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