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

    // Populate group content
    document.getElementById('groupTitle').textContent = group.GroupName;
    document.getElementById('groupDesc').textContent = group.GroupDescription;
    document.getElementById('descriptionText').textContent = group.GroupDescription;
    document.getElementById('descriptionTextarea').value = group.GroupDescription;
    document.querySelector('.settings-title').textContent = group.GroupName;
  } catch (err) {
    document.getElementById('groupTitle').textContent = 'Error loading group.';
    console.error(err);
  }
}

window.onload = loadGroupDetails;

// Optional handlers for edit/save/cancel (already included in your HTML, make sure they're not broken)
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
  cancelDescription();
  // Optionally send PATCH request to save changes
}

function cancelDescription() {
  document.getElementById('descriptionTextarea').classList.add('hidden');
  document.getElementById('descriptionText').classList.remove('hidden');
  document.getElementById('editDescBtn').classList.remove('hidden');
  document.getElementById('saveDescBtn').classList.add('hidden');
  document.getElementById('cancelDescBtn').classList.add('hidden');
}
