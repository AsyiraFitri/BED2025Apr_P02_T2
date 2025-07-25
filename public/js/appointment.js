import {
  showToast,
  showDeleteModal,
  showSaveFeedback,
  getAuthHeaders,
  getPendingDeleteAppointmentId
} from './health-utils.js';

import {
  deleteGoogleEvent,
  syncAllAppointments,
  updateGoogleCalendarButtons
} from './calendar.js';

let currentEditingAppointmentId = null; // Tracks currently editing appointment ID or 'new'

const appointmentCache = {}; // In-memory cache keyed by AppointmentID

// Formats a date string into "Mon, 1 Jan" or returns 'Invalid Date'
function formatDate(dateStr) {
  const options = { weekday: 'short', day: 'numeric', month: 'short' };
  const date = new Date(dateStr);
  if (isNaN(date)) return 'Invalid Date';
  return date.toLocaleDateString(undefined, options);
}

// Formats 24-hour "HH:mm" time to 12-hour format with AM/PM or returns 'Invalid time'
function formatTime(timeStr) {
  if (!timeStr) return 'Invalid time';
  const [hour, minute] = timeStr.split(':');
  const h = parseInt(hour);
  const m = minute.padStart(2, '0');
  const isPM = h >= 12;
  const displayHour = h % 12 === 0 ? 12 : h % 12;
  return `${displayHour}:${m} ${isPM ? 'PM' : 'AM'}`;
}

// Updates in-memory cache and refreshes UI with appointment cards
// - Accepts array or single appointment object
function updateCacheAndUI(appointments) {
  for (const key in appointmentCache) delete appointmentCache[key];
  if (Array.isArray(appointments)) {
    appointments.forEach(app => appointmentCache[app.AppointmentID] = app);
  } else if (appointments?.AppointmentID) {
    appointmentCache[appointments.AppointmentID] = appointments;
  }
  updateAppointmentDisplayFromCache();
}

// Clears container and renders appointment cards from cache
// - Shows message if no appointments found
function updateAppointmentDisplayFromCache() {
  const container = document.getElementById('appointmentContainer');
  container.innerHTML = '';
  const appointments = Object.values(appointmentCache);
  if (appointments.length === 0) {
    container.innerHTML = '<p class="text-danger">No appointment data found.</p>';
    return;
  }
  appointments.forEach(app => {
    const card = createAppointmentCard(app.AppointmentID, app);
    container.appendChild(card);
    attachCardEventListeners(card);
  });
}

// Creates an appointment card DOM element with edit/delete icons
// - Accepts appointment ID and data object
function createAppointmentCard(id, appointment) {
  const card = document.createElement('div');
  card.className = 'appointment-card';
  card.dataset.appointmentId = id;
  card.innerHTML = `
    <div class="d-flex justify-content-between align-items-start mb-2">
      <div class="edit-icon-container" style="cursor:pointer;">
        <i class="fas fa-edit edit-icon me-1"></i><span> Edit</span>
      </div>
      <i class="fas fa-trash-alt delete-icon" style="cursor:pointer;"></i>
    </div>
    <div class="row">
      <div class="col-8">
        <div class="appointment-date">${formatDate(appointment.AppointmentDate)}</div>
      </div>
      <div class="col-4">
        <div class="appointment-time">${formatTime(appointment.AppointmentTime)}</div>
      </div>
    </div>
    <div class="appointment-title">${appointment.Title}</div>
    <div class="appointment-location">@${appointment.Location}</div>
    <div class="doctor-name">${appointment.DoctorName}</div>
    <div class="appointment-note">Note: ${appointment.Notes || 'No special instructions'}</div>
  `;
  // Highlight card on click
  card.addEventListener('click', () => {
    document.querySelectorAll('.appointment-card').forEach(c => c.classList.remove('selected'));
    card.classList.add('selected');
  });
  return card;
}

// Attaches click event listeners for edit and delete icons in a card
// - Accepts a card DOM element
function attachCardEventListeners(card) {
  const editBtn = card.querySelector('.edit-icon-container');
  const deleteBtn = card.querySelector('.delete-icon');
  const id = card.dataset.appointmentId;

  if (editBtn) {
    editBtn.addEventListener('click', e => {
      e.stopPropagation();
      editAppointment(id);
    });
  }
  if (deleteBtn) {
    deleteBtn.addEventListener('click', e => {
      e.stopPropagation();
      showDeleteModal(id, 'appointment');
    });
  }
}

// Sends POST request to create a new appointment
// - Returns created appointment object
async function createAppointment(data) {
  const res = await fetch('/api/appointments', {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to create appointment');
  return await res.json();
}

// Fetches all appointments for a given user ID
// - Returns an array or single appointment object
async function getAppointmentsByUser(userId) {
  const res = await fetch(`/api/appointments/user/${userId}`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to fetch appointments');
  return await res.json();
}

// Fetches a single appointment by ID
// - Returns an appointment object
async function getAppointmentById(id) {
  const res = await fetch(`/api/appointments/${id}`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to fetch appointment');
  return await res.json();
}

// Sends PUT request to update appointment by ID
// - Returns updated appointment object
async function updateAppointment(id, data) {
  const res = await fetch(`/api/appointments/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to update appointment');
  return await res.json();
}

// Sends DELETE request to delete appointment by ID
// - Returns true if successful
async function deleteAppointment(id) {
  const res = await fetch(`/api/appointments/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to delete appointment');
  return true;
}

// Fetches and displays all appointments for logged-in user
// - Updates cache and UI accordingly
async function updateAppointmentDisplay() {
  try {
    const user = JSON.parse(sessionStorage.getItem('user'));
    if (!user) throw new Error('User not logged in');
    const appointments = await getAppointmentsByUser(user.UserID);
    updateCacheAndUI(appointments);
    return appointments;
  } catch {
    document.getElementById('appointmentContainer').innerHTML = '<p class="text-danger">Failed to load appointments.</p>';
    return null;
  }
}

// Opens modal to add a new appointment with empty form
function addNewAppointment() {
  currentEditingAppointmentId = 'new';
  document.getElementById('appointmentForm').reset();
  document.getElementById('appointmentModalLabel').textContent = 'Add New Appointment';
  new bootstrap.Modal(document.getElementById('appointmentModal')).show();
}

// Opens modal and loads data for editing existing appointment by ID
async function editAppointment(id) {
  currentEditingAppointmentId = id;
  try {
    const app = await getAppointmentById(id);
    document.getElementById('editAppointmentDate').value = new Date(app.AppointmentDate).toISOString().split('T')[0];
    document.getElementById('editAppointmentTime').value = app.AppointmentTime.slice(0, 5);
    document.getElementById('editAppointmentTitle').value = app.Title;
    document.getElementById('editAppointmentLocation').value = app.Location;
    document.getElementById('editDoctorName').value = app.DoctorName;
    document.getElementById('editAppointmentNotes').value = app.Notes || '';
    document.getElementById('appointmentModalLabel').textContent = 'Edit Appointment Details';
    new bootstrap.Modal(document.getElementById('appointmentModal')).show();
    document.querySelectorAll('.appointment-card').forEach(c => c.classList.remove('selected'));
    const selectedCard = document.querySelector(`[data-appointment-id="${id}"]`);
    if (selectedCard) selectedCard.classList.add('selected');
  } catch {
    alert('Failed to load appointment data');
  }
}

// Handles delete confirmation modal and deletes appointment if confirmed
// - Updates cache and UI
async function handleAppointmentsDeleteConfirmation() {
  const idToDelete = getPendingDeleteAppointmentId();
  if (!idToDelete) return;

  const modalElement = document.getElementById('confirmDeleteModal');
  const modal = bootstrap.Modal.getInstance(modalElement);

  try {
    const appointment = appointmentCache[idToDelete];
    if (!appointment) {
      throw new Error('Appointment data not found');
    }

    // 1. Delete from backend first
    await deleteAppointment(idToDelete);
    showToast('Appointment deleted successfully', 'success'); // Local deletion toast

    // 2. Handle Google Calendar sync if needed
    const tokensStr = sessionStorage.getItem('google_tokens');
    if (tokensStr && appointment.GoogleEventID) {
      const tokens = JSON.parse(tokensStr);
      const googleSuccess = await deleteGoogleEvent(appointment, tokens);
      
      if (googleSuccess) {
        showToast('Google Calendar updated successfully', 'success'); // Google-specific toast
      } else {
        showToast('Failed to update Google Calendar', 'warning');
      }
    }

    // 3. Update UI
    delete appointmentCache[idToDelete];
    updateAppointmentDisplayFromCache();

  } catch (err) {
    console.error('Error deleting appointment:', err);
    showToast('Failed to delete appointment', 'error');
  } finally {
    if (modal) modal.hide();
  }
}



// Handles form submission for creating/updating appointment
// - Syncs all appointments with Google Calendar after success
// Handle appointment form submission (create or update)
async function handleAppointmentFormSubmit(e) {
  e.preventDefault();

  // Retrieve the currently logged-in user
  const user = JSON.parse(sessionStorage.getItem('user'));
  if (!user) {
    alert('You must be logged in');
    return;
  }

  // Build the appointment data object
  const data = {
    AppointmentDate: new Date(document.getElementById('editAppointmentDate').value).toISOString().split('T')[0],
    AppointmentTime: document.getElementById('editAppointmentTime').value,
    Title: document.getElementById('editAppointmentTitle').value,
    Location: document.getElementById('editAppointmentLocation').value,
    DoctorName: document.getElementById('editDoctorName').value,
    Notes: document.getElementById('editAppointmentNotes').value || 'No special instructions',
    UserID: user.UserID
  };

  // If editing an existing appointment, include its Google Event ID (if any)
  if (currentEditingAppointmentId !== 'new') {
    const cachedAppointment = appointmentCache[currentEditingAppointmentId];
    if (cachedAppointment?.GoogleEventID) {
      data.GoogleEventID = cachedAppointment.GoogleEventID;
    }
  }

  try {
    // Create or update the appointment
    let savedAppointment;
    if (currentEditingAppointmentId === 'new') {
      savedAppointment = await createAppointment(data);
    } else {
      savedAppointment = await updateAppointment(currentEditingAppointmentId, data);
    }

    // Update local cache and UI
    appointmentCache[savedAppointment.AppointmentID] = savedAppointment;
    updateAppointmentDisplayFromCache();

    // Close the modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('appointmentModal'));
    if (modal) modal.hide();

    // Show visual feedback
    showSaveFeedback('#appointmentForm .btn-confirm');
    const action = currentEditingAppointmentId === 'new' ? 'added' : 'updated';
    currentEditingAppointmentId = null;
    showToast(`Appointment ${action} successfully`);

    // Sync with Google Calendar only if connected before
    const tokensStr = sessionStorage.getItem('google_tokens');
    if (tokensStr) {
      await syncAllAppointments();
    }


  } catch (err) {
    console.error('Error saving appointment:', err);
    alert('Error saving appointment');
  }
}


// Event listeners

document.getElementById('appointmentForm').addEventListener('submit', handleAppointmentFormSubmit);

document.getElementById('appointmentModal').addEventListener('hidden.bs.modal', () => {
  currentEditingAppointmentId = null;
  document.getElementById('appointmentForm').reset();
  document.querySelectorAll('.appointment-card').forEach(c => c.classList.remove('selected'));
});

const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
if (confirmDeleteBtn) {
  confirmDeleteBtn.addEventListener('click', handleAppointmentsDeleteConfirmation);
}

document.addEventListener('DOMContentLoaded', () => {
  updateGoogleCalendarButtons();
  updateAppointmentDisplay();
  const addBtn = document.getElementById('addAppointmentBtn');
  if (addBtn) {
    addBtn.addEventListener('click', addNewAppointment);
  }
});

// Fixes Bootstrap modal focus issue by removing focus from active elements when hiding
['appointmentModal', 'appointmentModalLabel', 'confirmDeleteModal'].forEach(id => {
  const modal = document.getElementById(id);
  if (modal) {
    modal.addEventListener('hide.bs.modal', () => {
      setTimeout(() => {
        const active = document.activeElement;
        if (active && modal.contains(active)) {
          active.blur();
          const safeFocusTarget = document.getElementById('addAppointmentBtn') || document.body;
          safeFocusTarget.focus();
        }
      }, 0);
    });
  }
});

export {
  updateAppointmentDisplay,
};
