async function loadGroupDetails() {
  const params = new URLSearchParams(window.location.search);
  const groupId = params.get('id');

  if (!groupId) {
    document.getElementById('groupTitle').textContent = 'No group selected.';
    return;
  }

  try {
    const res = await fetch(`/api/hobby-groups/${groupId}`);
    if (!res.ok) throw new Error('Group not found');
    
    const group = await res.json();
    console.log(JSON.parse(sessionStorage.getItem("user")).UserID)
    console.log("Group Admin ID: " + group.AdminID);
    if(group.AdminID !=  JSON.parse(sessionStorage.getItem("user")).UserID) {
      document.getElementById('editDescBtn').classList.add('hidden');
      document.getElementById('saveDescBtn').classList.add('hidden');
      document.getElementById('cancelDescBtn').classList.add('hidden');
      document.getElementById('deleteCommunityBtn').classList.add('hidden');
      document.getElementById('leaveCommunityBtn').classList.remove('hidden');
    }
    
    else{
      console.log("Admin ID: " + group.AdminID);
      document.getElementById('editDescBtn').classList.remove('hidden');
      document.getElementById('saveDescBtn').classList.add('hidden');
      document.getElementById('cancelDescBtn').classList.add('hidden');
      document.getElementById('deleteCommunityBtn').classList.remove('hidden');
      document.getElementById('leaveCommunityBtn').classList.add('hidden');
    }

    // Populate group content
    document.getElementById('groupTitle').textContent = group.GroupName;
    document.getElementById('groupDesc').textContent = group.GroupDescription;
    document.getElementById('descriptionText').textContent = group.GroupDescription;
    document.getElementById('descriptionTextarea').value = group.GroupDescription;
    document.querySelector('.settings-title').textContent = group.GroupName;
    
    // Load member count
    await loadMemberCount(groupId);
    await loadMemberList(groupId);
  } catch (err) {
    document.getElementById('groupTitle').textContent = 'Error loading group.';
    console.error(err);
  }
}

async function loadMemberCount(groupId) {
  try {
    const res = await fetch(`/api/groups/memberCount/${groupId}`);
    if (!res.ok) throw new Error('Failed to fetch member count');
    
    const data = await res.json();
    const memberCount = data.memberCount;
    const memberText = memberCount === 1 ? '1 member' : `${memberCount} members`;
    document.getElementById('noMembers').textContent = memberText;
  } catch (error) {
    console.error('Error loading member count:', error);
    document.getElementById('noMembers').textContent = '0 members';
  }
}

async function loadMemberList(groupId) {
  try {
    const res = await fetch(`/api/groups/memberList/${groupId}`);
    if (!res.ok) throw new Error('Failed to fetch member list');
    
    const data = await res.json();
    const membersList = document.querySelector('.members-list');
    membersList.innerHTML = ''; // Clear existing list
    
    if (data.members && data.members.length > 0) {
      data.members.forEach((member, index) => {
        const listItem = document.createElement('li');
        listItem.className = 'member-item';
        listItem.style.display = 'flex';
        listItem.style.justifyContent = 'space-between';
        listItem.style.alignItems = 'center';
        
        const nameSpan = document.createElement('span');
        nameSpan.textContent = `${index + 1}. ${member.name}`;
        
        const roleSpan = document.createElement('span');
        roleSpan.textContent = member.role;
        roleSpan.style.fontWeight = 'bold';
        roleSpan.style.color = member.role === 'Admin' ? '#ff6b35' : '#666';
        
        listItem.appendChild(nameSpan);
        listItem.appendChild(roleSpan);
        membersList.appendChild(listItem);
      });
    } 
    else {
      const listItem = document.createElement('li');
      listItem.className = 'member-item';
      listItem.textContent = 'No members yet';
      membersList.appendChild(listItem);
    }
  } 
  catch (error) {
    console.error('Error loading member list:', error);
    const membersList = document.querySelector('.members-list');
    membersList.innerHTML = '<li class="member-item">Error loading members</li>';
  }
}

window.onload = loadGroupDetails;

// Optional handlers for edit/save/cancel (already included in HTML)
function openSettingsModal() {
  document.getElementById('settingsModal').style.display = 'block';
}

function closeSettingsModal() {
  document.getElementById('settingsModal').style.display = 'none';
}

function editDescription() {
  document.getElementById('descriptionTextarea').classList.remove('hidden');
  document.getElementById('descriptionText').classList.add('hidden');
  document.getElementById('editDescBtn').classList.add('hidden');
  document.getElementById('saveDescBtn').classList.remove('hidden');
  document.getElementById('cancelDescBtn').classList.remove('hidden');
}

function saveDescription() {
  const newText = document.getElementById('descriptionTextarea').value;
  document.getElementById('descriptionText').textContent = newText;
  // check response status and send alert if successful
  fetch('/api/groups/saveDesc', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      groupId: new URLSearchParams(window.location.search).get('id'),
      newDescription: newText
    })
  })
  .then(response => {
    if (!response.ok) {
      alert('Failed to save description. Please try again.');
    }
    alert('Description saved successfully!');
  })
  cancelDescription();
}

function cancelDescription() {
  document.getElementById('descriptionTextarea').classList.add('hidden');
  document.getElementById('descriptionText').classList.remove('hidden');
  document.getElementById('editDescBtn').classList.remove('hidden');
  document.getElementById('saveDescBtn').classList.add('hidden');
  document.getElementById('cancelDescBtn').classList.add('hidden');
}
function deleteCommunity() {
  const groupId = new URLSearchParams(window.location.search).get('id');
  if (confirm('Are you sure you want to delete this community? This action cannot be undone.')) {
    fetch(`/api/groups/deleteCommunity`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ groupId })
    })
    .then(response => {
      if (response.ok) {
        alert('Community deleted successfully.');
        window.location.href = 'community.html'; // Redirect to community page
      } else {
        alert('Failed to delete community. Please try again.');
      }
    })
    .catch(err => {
      console.error('Error deleting community:', err);
      alert('An error occurred while deleting the community.');
    });
  }
} 
function leaveCommunity() {
  const groupId = new URLSearchParams(window.location.search).get('id');
  const userId = JSON.parse(sessionStorage.getItem('user')).UserID;

  if (confirm('Are you sure you want to leave this group?')) {
    fetch('/api/groups/leaveGroup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ groupId, userId })
    })
    .then(response => {
      if (response.ok) {
        alert('You have left the group.');
        window.location.href = 'community.html'; // Redirect to community page
      } else {
        alert('Failed to leave the group. Please try again.');
      }
    })
    .catch(err => {
      console.error('Error leaving group:', err);
      alert('An error occurred while leaving the group.');
    });
  }
}