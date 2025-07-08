async function loadGroupDetails() {
    const params = new URLSearchParams(window.location.search);
    const groupId = params.get('id');

    if (!groupId) {
    document.getElementById('groupTitle').textContent = 'No group selected.';
    return;
    }

    try {
    const res = await fetch(`/api/hobby-groups/${groupId}`);
    const group = await res.json();

    document.getElementById('groupTitle').textContent = group.GroupName;
    // Only update description if it's different from the default content
    if (group.GroupDescription && group.GroupDescription !== document.getElementById('groupDesc').textContent) {
        document.getElementById('groupDesc').textContent = group.GroupDescription;
    }
    } catch (err) {
    document.getElementById('groupTitle').textContent = 'Error loading group.';
    }
}

// Settings modal functions
function openSettingsModal() {
    document.getElementById('settingsModal').classList.add('active');
}

function closeSettingsModal() {
    document.getElementById('settingsModal').classList.remove('active');
}

function leaveCommunity() {
    if (confirm('Are you sure you want to leave this community?')) {
    // Add your leave community logic here
    console.log('Leaving community...');
    closeSettingsModal();
    }
}

function deleteCommunity() {
    if (confirm('Are you sure you want to delete this community? This action cannot be undone.')) {
    // Add your delete community logic here
    console.log('Deleting community...');
    closeSettingsModal();
    }
}

// Close modal when clicking outside
document.getElementById('settingsModal').addEventListener('click', function(e) {
    if (e.target === this) {
    closeSettingsModal();
    }
});

// Sidebar navigation
document.querySelectorAll('.sidebar-item').forEach(item => {
    item.addEventListener('click', function() {
    document.querySelectorAll('.sidebar-item').forEach(i => i.classList.remove('active'));
    this.classList.add('active');
    });
});

// Description editing functions
function editDescription() {
document.getElementById('descriptionText').classList.add('hidden');
document.getElementById('descriptionTextarea').classList.remove('hidden');
document.getElementById('editDescBtn').classList.add('hidden');
document.getElementById('saveDescBtn').classList.remove('hidden');
document.getElementById('cancelDescBtn').classList.remove('hidden');
document.getElementById('descriptionTextarea').focus();
}

function saveDescription() {
const newDescription = document.getElementById('descriptionTextarea').value;
document.getElementById('descriptionText').textContent = newDescription;
document.getElementById('descriptionText').classList.remove('hidden');
document.getElementById('descriptionTextarea').classList.add('hidden');
document.getElementById('editDescBtn').classList.remove('hidden');
document.getElementById('saveDescBtn').classList.add('hidden');
document.getElementById('cancelDescBtn').classList.add('hidden');

// Here you can add API call to save the description
console.log('Saving description:', newDescription);
}

function cancelDescription() {
// Reset textarea to original value
const originalText = document.getElementById('descriptionText').textContent;
document.getElementById('descriptionTextarea').value = originalText;
document.getElementById('descriptionText').classList.remove('hidden');
document.getElementById('descriptionTextarea').classList.add('hidden');
document.getElementById('editDescBtn').classList.remove('hidden');
document.getElementById('saveDescBtn').classList.add('hidden');
document.getElementById('cancelDescBtn').classList.add('hidden');
}

window.onload = loadGroupDetails;
