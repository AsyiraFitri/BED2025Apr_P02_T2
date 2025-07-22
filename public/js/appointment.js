import { showToast, showDeleteModal, showSaveFeedback, getAuthHeaders, getPendingDeleteAppointmentId } from './health-utils.js';
import { createGoogleEvent, updateGoogleEvent, deleteGoogleEvent, syncAllAppointments, updateGoogleCalendarButtons } from './calendar.js';

let currentEditingAppointmentId = null; // Track currently editing appointment ID
let pendingDeleteAppointmentId = null; // Stores appointment id waiting for delete confirmation

// In-memory cache for all appointments keyed by AppointmentID
const appointmentCache = {};


// ===== Helper / Utility Functions =====

// Formats a date string into a human-readable format like "Mon, 1 Jan"
function formatDate(dateStr) {
  const options = { weekday: 'short', day: 'numeric', month: 'short' };
  const date = new Date(dateStr);
  if (isNaN(date)) return 'Invalid Date'; // Fallback in case of bad input
  return date.toLocaleDateString(undefined, options);
}

// Formats a time string from 24-hour "HH:mm" format into 12-hour format with AM/PM
function formatTime(timeStr) {
  if (!timeStr) return 'Invalid time';

  const [hour, minute] = timeStr.split(':');
  const h = parseInt(hour);
  const m = minute.padStart(2, '0');  // Ensure minutes are two digits

  const isPM = h >= 12;                // Determine if time is PM or AM
  const displayHour = h % 12 === 0 ? 12 : h % 12; // Convert 0 to 12 for 12-hour clock

  return `${displayHour}:${m} ${isPM ? 'PM' : 'AM'}`;
}

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

// ===== Appointment Card UI Functions =====

// Creates and returns a DOM element representing a single appointment card
function createAppointmentCard(id, appointment) {
  const card = document.createElement('div');
  card.className = 'appointment-card';
  card.dataset.appointmentId = id;  // Store appointment ID for later reference

  // Populate card HTML with appointment info, including edit and delete icons
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

  // Add click listener to highlight this card when selected
  card.addEventListener('click', () => {
    document.querySelectorAll('.appointment-card').forEach(c => c.classList.remove('selected'));
    card.classList.add('selected');
  });

  return card;
}

// Attaches click listeners for editing and deleting to icons within each appointment card
function attachCardEventListeners(card) {
  const editBtn = card.querySelector('.edit-icon-container');
  const deleteBtn = card.querySelector('.delete-icon');
  const id = card.dataset.appointmentId;

  if (editBtn) {
    editBtn.addEventListener('click', e => {
      e.stopPropagation();  // Prevent card selection event
      editAppointment(id);  // Open edit modal for this appointment
    });
  }

  if (deleteBtn) {
    deleteBtn.addEventListener('click', e => {
      e.stopPropagation();  // Prevent card selection event
      showDeleteModal(id, 'appointment');  // Show confirmation to delete
    });
  }
}

// ===== Appointment Data Functions =====

// Fetch and display all appointments for the current logged-in user
async function updateAppointmentDisplay() {
  try {
    const user = JSON.parse(sessionStorage.getItem('user'));
    const res = await fetch(`/api/appointments/user/${user.UserID}`, {
      headers: getAuthHeaders()
    });
    const appointments = await res.json();

    // Clear old cache
    for (const key in appointmentCache) {
      delete appointmentCache[key];
    }

    // Populate cache with fresh data
    if (Array.isArray(appointments)) {
      appointments.forEach(app => {
        appointmentCache[app.AppointmentID] = app;
      });
    } else if (appointments?.AppointmentID) {
      appointmentCache[appointments.AppointmentID] = appointments;
    }

    const container = document.getElementById('appointmentContainer');
    container.innerHTML = '';
    if (Array.isArray(appointments)) {
      appointments.forEach(app => {
        const card = createAppointmentCard(app.AppointmentID, app);
        container.appendChild(card);
        attachCardEventListeners(card);
      });
    } else if (appointments?.AppointmentID) {
      const card = createAppointmentCard(appointments.AppointmentID, appointments);
      container.appendChild(card);
      attachCardEventListeners(card);
    } else {
      container.innerHTML = '<p class="text-danger">Login/Sign Up to add appointments!</p>';
    }
    return appointments;
  } catch {
    document.getElementById('appointmentContainer').innerHTML = '<p class="text-danger">Failed to load appointments.</p>';
    return null;
  }
}

// Opens the modal with a blank form to add a new appointment
async function addNewAppointment() {
  currentEditingAppointmentId = 'new';    // Mark as new appointment
  document.getElementById('appointmentForm').reset();
  document.getElementById('appointmentModalLabel').textContent = 'Add New Appointment';
  new bootstrap.Modal(document.getElementById('appointmentModal')).show();
}

// Opens the modal with existing data for editing an appointment by id
async function editAppointment(id) {
  currentEditingAppointmentId = id;   // Mark currently editing this id
  try {
    const res = await fetch(`/api/appointments/${id}`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error();
    const app = await res.json();

    // Fill form fields with existing appointment data
    document.getElementById('editAppointmentDate').value = new Date(app.AppointmentDate).toISOString().split('T')[0];
    document.getElementById('editAppointmentTime').value = app.AppointmentTime.slice(0, 5);
    document.getElementById('editAppointmentTitle').value = app.Title;
    document.getElementById('editAppointmentLocation').value = app.Location;
    document.getElementById('editDoctorName').value = app.DoctorName;
    document.getElementById('editAppointmentNotes').value = app.Notes || '';

    // Change modal title and show modal
    document.getElementById('appointmentModalLabel').textContent = 'Edit Appointment Details';
    new bootstrap.Modal(document.getElementById('appointmentModal')).show();

    // Highlight the selected card in the UI
    document.querySelectorAll('.appointment-card').forEach(c => c.classList.remove('selected'));
    document.querySelector(`[data-appointment-id="${id}"]`).classList.add('selected');
  } catch {
    alert('Failed to load appointment data');
  }
}

// Called when user confirms delete; sends delete request to backend and updates UI
async function handleAppointmentsDeleteConfirmation() {
  const pendingDeleteAppointmentId = getPendingDeleteAppointmentId();

  if (!pendingDeleteAppointmentId) return;

  const modalElement = document.getElementById('confirmDeleteModal');
  const modal = bootstrap.Modal.getInstance(modalElement);

  try {
    const res = await fetch(`/api/appointments/${pendingDeleteAppointmentId}`, {
      method: 'DELETE',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' })
    });
    if (!res.ok) throw new Error();

    // Remove from cache
    delete appointmentCache[pendingDeleteAppointmentId];

    // Refresh UI with cached data (avoid another fetch if you want)
    updateAppointmentDisplayFromCache();

    showToast('Appointment deleted successfully');
  } catch {
    alert('Error deleting appointment');
  } finally {
    // No need to reset here, the variable lives in health-utils.js and will be overwritten next time
    if (modal) modal.hide();
  }
}

// Handles the form submission for adding/editing an appointment
async function handleAppointmentFormSubmit(e) {
  e.preventDefault();

  const user = JSON.parse(sessionStorage.getItem('user'));

  const data = {
    AppointmentDate: document.getElementById('editAppointmentDate').value,
    AppointmentTime: document.getElementById('editAppointmentTime').value,
    Title: document.getElementById('editAppointmentTitle').value,
    Location: document.getElementById('editAppointmentLocation').value,
    DoctorName: document.getElementById('editDoctorName').value,
    Notes: document.getElementById('editAppointmentNotes').value || 'No special instructions',
    UserID: user.UserID
  };

  let googleEventId = null;

  if (currentEditingAppointmentId !== 'new') {
    // Look up cached appointment to get GoogleEventID
    const cachedAppointment = appointmentCache[currentEditingAppointmentId];
    if (cachedAppointment && cachedAppointment.GoogleEventID) {
      googleEventId = cachedAppointment.GoogleEventID;
    }
  }

  // Add GoogleEventID to data if it exists
  if (googleEventId) {
    data.GoogleEventID = googleEventId;
  }

  // Fetch API to create or update appointment
  try {
    const res = await fetch(
      currentEditingAppointmentId === 'new'
        ? '/api/appointments'
        : `/api/appointments/${currentEditingAppointmentId}`,
      {
        method: currentEditingAppointmentId === 'new' ? 'POST' : 'PUT',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(data)
      }
    );

    if (!res.ok) throw new Error();

    // Refresh appointments and cache
    await updateAppointmentDisplayFromCache();

    // Hide modal and feedback
    const modal = bootstrap.Modal.getInstance(document.getElementById('appointmentModal'));
    if (modal) modal.hide();
    showSaveFeedback('#appointmentForm .btn-confirm');

    const action = currentEditingAppointmentId === 'new' ? 'added' : 'updated';
    currentEditingAppointmentId = null;
    showToast(`Appointment ${action} successfully`);

    // Sync all appointments to Google Calendar after update
    await syncToGoogleCalendar();

  } catch {
    alert('Error saving appointment');
  }
}


// ===== Event Listeners =====


// Listen for form submission to handle adding/editing appointment
document.getElementById('appointmentForm').addEventListener('submit', handleAppointmentFormSubmit);

// When the appointment modal closes, reset form and clear selection
document.getElementById('appointmentModal').addEventListener('hidden.bs.modal', () => {
  currentEditingAppointmentId = null;
  document.getElementById('appointmentForm').reset();
  document.querySelectorAll('.appointment-card').forEach(c => c.classList.remove('selected'));
});

// Listen for confirmation button click in delete modal to delete appointment
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
if (confirmDeleteBtn) {
  confirmDeleteBtn.addEventListener('click', handleAppointmentsDeleteConfirmation);
}

// ===== Initialization =====

// When DOM is ready, initialize appointment list and Google Calendar buttons
document.addEventListener('DOMContentLoaded', () => {
  updateGoogleCalendarButtons();  // Update Connect/Sync button states
  updateAppointmentDisplay();      // Load and show appointment cards

  // Bind Add New Appointment button
  const addBtn = document.getElementById('addAppointmentBtn');
  if (addBtn) {
    addBtn.addEventListener('click', addNewAppointment);
  }
});

// Fixes Bootstrap modal focus issue by removing focus from active elements when hiding
const appointmentModalIds = ['appointmentModal', 'appointmentModalLabel', 'confirmDeleteModal'];
appointmentModalIds.forEach(id => {
  const modal = document.getElementById(id);
  if (modal) {
    modal.addEventListener('hide.bs.modal', () => {
      setTimeout(() => {
        const active = document.activeElement;
        if (active && modal.contains(active)) {
          active.blur();  // Remove focus from active element

          // Move focus to a safe fallback element (Add button or body)
          const safeFocusTarget = document.getElementById('addAppointmentBtn') || document.body;
          safeFocusTarget.focus();
        }
      }, 0); // Delay to ensure Bootstrap hides modal first
    });
  }
});

// export everything
export {
  updateAppointmentDisplay
};