// Get references to DOM elements
const modal = document.getElementById('addModal');
const addBtns = document.querySelectorAll('.add-btn');
const closeBtn = document.querySelector('.close-btn');
const form = document.getElementById('addCommunityForm');

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

    // Get input values from form
    const groupName = document.getElementById('groupName').value.trim();
    const groupDescription = document.getElementById('groupDescription').value.trim();
    const adminId = JSON.parse(sessionStorage.getItem('user')).UserID;

    try {
        // Send POST request to create new group
        const response = await fetch('/api/hobby-groups', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ groupName, groupDescription, adminId }),
        });

        if (response.ok) {
            const data = await response.json(); // Parse response
            alert('Community group added!');
            modal.style.display = 'none';
            form.reset(); // Reset form inputs

            // Get logged-in user info
            const user = JSON.parse(sessionStorage.getItem('user'));
            const groupId = data.groupId;
            const userId = user.UserID;
            const fullName = user.FullName;

            // Auto-join the group after creation
            try {
                const response = await fetch('/api/hobby-groups/join', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ groupId, userId, fullName })
                });

                const data = await response.json();

                if (response.status === 201) {
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

// Load and display all existing groups
async function loadGroups() {
    try {
        const res = await fetch('/api/hobby-groups'); // Fetch all groups
        const groups = await res.json();
        const container = document.getElementById('communityCards');
        const user = JSON.parse(sessionStorage.getItem('user'));
        const userId = user ? user.UserID : null;
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
            if (userId) {
                try {
                    const membershipRes = await fetch(`/api/groups/checkMembership/${group.GroupID}/${userId}`);
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
                    const user = JSON.parse(sessionStorage.getItem('user'));
                    if (!user) {
                        alert('Please log in first.');
                        return;
                    }

                    const groupId = group.GroupID;
                    const userId = user.UserID;
                    const fullName = user.FullName;

                    try {
                        const response = await fetch('/api/hobby-groups/join', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ groupId, userId, fullName })
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

// Load groups on window load
window.onload = loadGroups;
