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

// ===== Google Calendar Integration =====

// On page load, check if redirected back from Google OAuth with tokens in URL hash
const hash = window.location.hash.substr(1);  // Remove leading '#'
const tokensEncoded = new URLSearchParams(hash).get("tokens");

if (tokensEncoded) {
  // Decode and parse tokens, then store them in sessionStorage for later use
try {
  const tokens = JSON.parse(decodeURIComponent(tokensEncoded));
  sessionStorage.setItem("google_tokens", JSON.stringify(tokens));
  updateGoogleCalendarButtons();
} catch (err) {
  console.error("Invalid token format:", err);
}

  // Update UI buttons to reflect that the user is now connected
  updateGoogleCalendarButtons();
}

// Updates the display and enable/disable state of Connect and Sync buttons
function updateGoogleCalendarButtons() {
  const tokens = sessionStorage.getItem("google_tokens"); // Check if tokens exist
  const connectBtn = document.getElementById("connectGoogleBtn");
  const syncBtn = document.getElementById("syncGoogleBtn");
  const hint = document.getElementById("googleButtonHint"); // Text hint for user

  if (tokens) {
    connectBtn.style.display = "none";   // Hide Connect button if connected
    syncBtn.style.display = "inline-block";
    syncBtn.disabled = false;             // Enable Sync button to allow syncing
    hint.textContent = "You are connected! You can sync your appointments now.";
  } else {
    connectBtn.style.display = "inline-block";  // Show Connect button if not connected
    syncBtn.style.display = "inline-block";     // Show Sync button but disable it
    syncBtn.disabled = true;                     // Disable Sync until connected
    hint.textContent = "Please connect your Google Calendar first.";
  }
}

// Sends appointment data to backend which syncs it with Google Calendar API
async function syncToGoogleCalendar() {
  // Get tokens from sessionStorage
  const tokens = JSON.parse(sessionStorage.getItem("google_tokens"));
  if (!tokens) {
    console.warn('No Google tokens found. Please connect your account.');
    return;
  }

  // Fetch appointments by calling updateAppointmentDisplay()
  const appointments = await updateAppointmentDisplay();

  if (!appointments || (Array.isArray(appointments) && appointments.length === 0)) {
    console.warn('No appointments to sync.');
    return;
  }

  // Normalize in case a single appointment object is returned
  const appointmentsArray = Array.isArray(appointments) ? appointments : [appointments];

  for (const appointment of appointmentsArray) {
    try {
      console.log("Syncing appointment to Google Calendar with data:", appointment);

      const response = await fetch('/google/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokens,                    // OAuth tokens for authentication
          title: appointment.Title,
          date: new Date(appointment.AppointmentDate).toISOString().split('T')[0],
          time: appointment.AppointmentTime,
          location: appointment.Location,
          notes: appointment.Notes
        })
      });

      const result = await response.json();

      if (response.ok) {
        console.log(`Synced "${appointment.Title}" to Google Calendar. Event link: ${result.link}`);
        // Optionally show a toast or UI feedback here
      } else {
        console.warn('Google sync error:', result.error);
      }
    } catch (err) {
      console.error('Google sync failed for appointment:', appointment, err);
    }
  }
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

    // Update UI
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
      container.innerHTML = '<p class="text-danger">No appointment data found.</p>';
    }

    return appointments;  // <== Return fetched data for google calendar sync
  } catch {
    document.getElementById('appointmentContainer').innerHTML = '<p class="text-danger">Failed to load appointments.</p>';
    return null;  // Return null on error
  }
}


// Opens the modal with a blank form to add a new appointment
function addNewAppointment() {
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

let pendingDeleteAppointmentId = null;  // Stores appointment id waiting for delete confirmation

// Called when user confirms delete; sends delete request to backend and updates UI
async function handleAppointmentsDeleteConfirmation() {
  if (!pendingDeleteAppointmentId) return;

  const modalElement = document.getElementById('confirmDeleteModal');
  const modal = bootstrap.Modal.getInstance(modalElement);

  try {
    const res = await fetch(`/api/appointments/${pendingDeleteAppointmentId}`, {
      method: 'DELETE',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' })
    });
    if (!res.ok) throw new Error();

    await updateAppointmentDisplay();  // Refresh list after delete
    showToast('Appointment deleted successfully');
  } catch {
    alert('Error deleting appointment');
  } finally {
    pendingDeleteAppointmentId = null;
    if (modal) modal.hide();
  }
}

// Handles the form submission for adding/editing an appointment
async function handleAppointmentFormSubmit(e) {
  e.preventDefault();  // Prevent default form submission

  const user = JSON.parse(sessionStorage.getItem('user'));

  // Collect data from form fields
  const data = {
    AppointmentDate: document.getElementById('editAppointmentDate').value,
    AppointmentTime: document.getElementById('editAppointmentTime').value,
    Title: document.getElementById('editAppointmentTitle').value,
    Location: document.getElementById('editAppointmentLocation').value,
    DoctorName: document.getElementById('editDoctorName').value,
    Notes: document.getElementById('editAppointmentNotes').value || 'No special instructions',
    UserID: user.UserID
  };

  try {
    // Decide if POST (new) or PUT (edit) based on currentEditingAppointmentId
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

    await updateAppointmentDisplay();   // Refresh appointments list

    // Hide modal after successful save
    const modal = bootstrap.Modal.getInstance(document.getElementById('appointmentModal'));
    if (modal) modal.hide();

    // Show save feedback on button
    showSaveFeedback('#appointmentForm .btn-confirm');

    const action = currentEditingAppointmentId === 'new' ? 'added' : 'updated';
    currentEditingAppointmentId = null;  // Reset editing id
    showToast(`Appointment ${action} successfully`);

    // Attempt to sync to Google Calendar if user is connected
    await syncToGoogleCalendar(data);
  } catch {
    alert('Error saving appointment');
  }
}

// ===== Event Listeners =====

// When Connect Google button is clicked, redirect user to OAuth connect URL
document.getElementById('connectGoogleBtn').addEventListener('click', () => {
  window.location.href = '/auth/google'; // Your OAuth endpoint URL
});

// When Sync Google button is clicked, gather form data and sync it to Google Calendar
document.getElementById('syncGoogleBtn').addEventListener('click', async () => {
  const tokens = JSON.parse(sessionStorage.getItem("google_tokens"));
  if (!tokens) {
    alert('Please connect your Google account first.');
    return;
  }

  // Collect current form data for syncing
  const data = {
    AppointmentDate: document.getElementById('editAppointmentDate').value,
    AppointmentTime: document.getElementById('editAppointmentTime').value,
    Title: document.getElementById('editAppointmentTitle').value,
    Location: document.getElementById('editAppointmentLocation').value,
    DoctorName: document.getElementById('editDoctorName').value,
    Notes: document.getElementById('editAppointmentNotes').value || 'No special instructions'
  };

  try {
    await syncToGoogleCalendar(data);
  } catch (err) {
    alert('Failed to sync to Google Calendar.');
  }
});

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
