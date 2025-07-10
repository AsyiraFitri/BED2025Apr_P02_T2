const modal = document.getElementById('addModal');
const addBtns = document.querySelectorAll('.add-btn');
const closeBtn = document.querySelector('.close-btn');
const form = document.getElementById('addCommunityForm');

addBtns.forEach(btn => {
    btn.onclick = () => {
    modal.style.display = 'block';
    };
});

closeBtn.onclick = () => {
    modal.style.display = 'none';
};

window.onclick = (e) => {
    if (e.target === modal) modal.style.display = 'none';
};

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const groupName = document.getElementById('groupName').value.trim();
    const groupDescription = document.getElementById('groupDescription').value.trim();
    const adminId = JSON.parse(sessionStorage.getItem('user')).UserID
    try {
    const response = await fetch('/api/hobby-groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupName, groupDescription, adminId }),
    });

    if (response.ok) {
        const data = await response.json(); // Parse the JSON response first
        alert('Community group added!');
        modal.style.display = 'none';
        form.reset();
        const user = JSON.parse(sessionStorage.getItem('user'));
        const groupId = data.groupId; // Get groupId from the parsed data
        const userId = user.UserID;
        const fullName = user.FullName;
        console.log('Join Group Request:', { groupId, userId, fullName });
        if (!user) {
        alert('Please log in first.');
        return;
        }

        try {
        const response = await fetch('/api/hobby-groups/join', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ groupId, userId, fullName })
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

async function loadGroups() {
    try {
    const res = await fetch('/api/hobby-groups');
    const groups = await res.json();
    const container = document.getElementById('communityCards');
    const user = JSON.parse(sessionStorage.getItem('user'));
    const userId = user ? user.UserID : null;
    container.innerHTML = '';

    for (const group of groups) {
        const card = document.createElement('div');
        card.className = 'community-card';

        const title = document.createElement('h3');
        title.textContent = group.GroupName;

        const desc = document.createElement('p');
        desc.textContent = group.GroupDescription;

        const btn = document.createElement('button');
        btn.className = 'join-btn';

        // Check if user is already a member
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
        btn.textContent = 'View Group';
        btn.style.backgroundColor = '#e3f2fd';
        btn.style.color = '#1976d2';
        btn.addEventListener('click', () => {
            window.location.href = `group.html?id=${group.GroupID}`;
        });
        } 
        else {
        btn.textContent = 'Join';
        btn.addEventListener('click', async () => {
            const user = JSON.parse(sessionStorage.getItem('user'));
            const groupId = group.GroupID;
            const userId = user.UserID;
            const fullName = user.FullName;
            console.log('Join Group Request:', { groupId, userId, fullName });
            if (!user) {
            alert('Please log in first.');
            return;
            }

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

        card.appendChild(title);
        card.appendChild(desc);
        card.appendChild(btn);
        container.appendChild(card);
    }
    } catch (error) {
    console.error('Error loading groups:', error);
    }
}

window.onload = loadGroups;
