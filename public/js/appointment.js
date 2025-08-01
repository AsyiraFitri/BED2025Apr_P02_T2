// =============================
// Appointment management logic (frontend)
// Handles CRUD, UI, and Google Calendar sync for appointments
// =============================

// Import utility functions for UI feedback and API headers
import {
  showToast,
  showDeleteModal,
  showSaveFeedback,
  getAuthHeaders
} from './health-utils.js';

// Import Google Calendar sync functions
import {
  createGoogleEvent,
  deleteGoogleEvent,
  updateGoogleCalendarButtons
} from './calendar.js';

// State variables to track which appointment is pending deletion or being edited
// Used to coordinate modal actions and form state
let pendingDeleteAppointmentId = null;
let currentEditingAppointmentId = null;

// ...removed DOM element references and form field mapping for consistency with medication.js...

// Create a DOM element for an appointment card, including edit/delete icons and details
// id: AppointmentID, appointment: appointment object
// Returns a DOM element representing the appointment card
function createAppointmentCard(id, appointment) {
  const card = document.createElement('div');
  card.className = 'appointment-card';
  card.dataset.appointmentId = id;
  // Build card HTML with appointment details (date, time, title, location, doctor, notes)
  card.innerHTML = `
    <div class="d-flex justify-content-between align-items-start mb-2">
      <div class="edit-icon-container" style="cursor:pointer;" title="Edit appointment">
        <i class="fas fa-edit edit-icon me-1"></i><span> Edit</span>
      </div>
      <i class="fas fa-trash-alt delete-icon" style="cursor:pointer;" title="Delete appointment"></i>
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
  // Highlight card when selected (for UI feedback)
  card.addEventListener('click', () => {
    document.querySelectorAll('.appointment-card').forEach(c => c.classList.remove('selected'));
    card.classList.add('selected');
  });
  // Attach edit/delete event listeners to icons
  attachAppointmentCardEventListeners(card);
  return card;
}

// Attach edit/delete event listeners to the card's icons
// card: DOM element for the appointment card
function attachAppointmentCardEventListeners(card) {
  const editBtn = card.querySelector('.edit-icon-container');
  const deleteBtn = card.querySelector('.delete-icon');
  const id = card.dataset.appointmentId;

  // Edit button opens the edit modal for this appointment
  if (editBtn) {
    editBtn.addEventListener('click', e => {
      e.stopPropagation(); // Prevent card click event
      editAppointment(id);
    });
  }

  // Delete button triggers the delete confirmation modal for this appointment
  if (deleteBtn) {
    deleteBtn.addEventListener('click', e => {
      e.stopPropagation(); // Prevent card click event
      pendingDeleteAppointmentId = id;
      showDeleteModal(id, 'appointment');
    });
  }
}

// Format a date string as "Mon, 1 Jan" for display
// dateStr: string in YYYY-MM-DD format
function formatDate(dateStr) {
  try {
    const options = { weekday: 'short', day: 'numeric', month: 'short' };
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'Invalid Date'; // Check for invalid dates
    return date.toLocaleDateString(undefined, options); // Format as "Mon, 1 Jan"
  } catch (error) {
    console.error('Date formatting error:', error);
    return 'Invalid Date';
  }
}

// Format a time string as 12-hour format (e.g., 2:30 PM) for display
// timeStr: string in HH:MM format
function formatTime(timeStr) {
  if (!timeStr || !timeStr.match(/^\d{2}:\d{2}$/)) return 'Invalid time'; // Basic validation
  try {
    const [hour, minute] = timeStr.split(':');
    const h = parseInt(hour, 10); // Convert to number
    const m = minute.padStart(2, '0'); // Ensure 2-digit minute
    const isPM = h >= 12; // Determine AM/PM
    const displayHour = h % 12 === 0 ? 12 : h % 12; // Convert to 12-hour format
    return `${displayHour}:${m} ${isPM ? 'PM' : 'AM'}`; // Return formatted string
  } catch (error) {
    console.error('Time formatting error:', error);
    return 'Invalid time';
  }
}

// Fetch all appointments for the current user and render them as cards in the UI
// Returns an array of appointment objects (or [] if none)
async function updateAppointmentDisplay() {
  try {
    // 1. Get current user from sessionStorage
    const user = JSON.parse(sessionStorage.getItem('user'));
    // 2. Fetch all appointments for this user from backend
    const res = await fetch(`/api/appointments/user`, {
      headers: getAuthHeaders()
    });

    if (!res.ok) throw new Error(`Failed to fetch appointments: ${res.statusText}`);

    // 3. Parse appointments array from response
    const appointments = await res.json();
    const container = document.getElementById('appointmentContainer');
    container.innerHTML = '';

    // 4. Render each appointment as a card in the UI
    if (Array.isArray(appointments) && appointments.length > 0) {
      appointments.forEach(app => {
        const card = createAppointmentCard(app.AppointmentID, app);
        container.appendChild(card);
      });
      return appointments;
    } else if (appointments?.AppointmentID) {
      // Single appointment object (not array)
      container.appendChild(createAppointmentCard(appointments.AppointmentID, appointments));
      return [appointments];
    } else {
      // No appointments found
      container.innerHTML = '<p class="text-muted">Click the Add button to create a new appointment.</p>';
      return [];
    }
  } catch (error) {
    // 5. Handle fetch or parse errors
    console.error('Error fetching appointments:', error);
    const container = document.getElementById('appointmentContainer');
    if (container) container.innerHTML = '<p class="text-danger">Failed to load appointments.</p>';
    return [];
  }
}

// Show modal for adding a new appointment (reset form and set modal title)
// Prepares the form and opens the modal for a new appointment
function addNewAppointment() {
  currentEditingAppointmentId = 'new'; // Set state to "new"
  const form = document.getElementById('appointmentForm');
  if (form) form.reset(); // Clear form fields
  const modalLabel = document.getElementById('appointmentModalLabel');
  if (modalLabel) modalLabel.textContent = 'Add New Appointment';
  const modal = document.getElementById('appointmentModal');
  if (modal) new bootstrap.Modal(modal).show(); // Show modal
}

// Load appointment data into form and show modal for editing
// id: AppointmentID to edit
async function editAppointment(id) {
  currentEditingAppointmentId = id;
  try {
    // 1. Fetch appointment details from backend
    const res = await fetch(`/api/appointments/${id}`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Appointment not found');
    const appointment = await res.json();

    // 2. Populate form fields with appointment data
    const form = document.getElementById('appointmentForm');
    if (form) form.reset();
    document.getElementById('editAppointmentDate').value = new Date(appointment.AppointmentDate).toISOString().split('T')[0];
    document.getElementById('editAppointmentTime').value = appointment.AppointmentTime.slice(0, 5);
    document.getElementById('editAppointmentTitle').value = appointment.Title;
    document.getElementById('editAppointmentLocation').value = appointment.Location;
    document.getElementById('editDoctorName').value = appointment.DoctorName;
    document.getElementById('editAppointmentNotes').value = appointment.Notes || '';

    // 3. Set modal title and show modal
    const modalLabel = document.getElementById('appointmentModalLabel');
    if (modalLabel) modalLabel.textContent = 'Edit Appointment Details';
    const modal = document.getElementById('appointmentModal');
    if (modal) new bootstrap.Modal(modal).show();

    // 4. Highlight the selected card in the UI
    document.querySelectorAll('.appointment-card').forEach(c => c.classList.remove('selected'));
    const selectedCard = document.querySelector(`[data-appointment-id="${id}"]`);
    if (selectedCard) selectedCard.classList.add('selected');
  } catch (error) {
    // 5. Handle fetch or parse errors
    console.error('Error fetching appointment:', error);
    showToast('Failed to load appointment data', 'error');
  }
}

// Handle form submission for adding or editing an appointment
// e: submit event from form
async function handleAppointmentFormSubmit(e) {
  e.preventDefault(); // Prevent default form submission

  try {
    // 1. Gather form data from input fields
    const user = JSON.parse(sessionStorage.getItem('user'));
    const doctorName = document.getElementById('editDoctorName').value;
    
    // 2. Validate doctor name - no numbers allowed
    if (/\d/.test(doctorName)) {
      showToast('Invalid field: Doctor name cannot contain numbers', 'error');
      return;
    }
    
    const appointmentData = {
      AppointmentDate: document.getElementById('editAppointmentDate').value,
      AppointmentTime: document.getElementById('editAppointmentTime').value,
      Title: document.getElementById('editAppointmentTitle').value,
      Location: document.getElementById('editAppointmentLocation').value,
      DoctorName: doctorName,
      Notes: document.getElementById('editAppointmentNotes').value || 'No special instructions',
      UserID: user.UserID
    };

    // 3. If editing, preserve the GoogleEventID for sync
    if (currentEditingAppointmentId !== 'new') {
      try {
        const existingResponse = await fetch(`/api/appointments/${currentEditingAppointmentId}`, {
          headers: getAuthHeaders()
        });
        if (existingResponse.ok) {
          const existingAppointment = await existingResponse.json();
          appointmentData.GoogleEventID = existingAppointment.GoogleEventID;
        }
      } catch (error) {
        console.warn('Could not fetch existing appointment GoogleEventID:', error);
      }
    }

    // 4. Save appointment to backend (POST for new, PUT for edit)
    const res = await fetch(
      currentEditingAppointmentId === 'new' ? '/api/appointments' : `/api/appointments/${currentEditingAppointmentId}`,
      {
        method: currentEditingAppointmentId === 'new' ? 'POST' : 'PUT',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(appointmentData)
      }
    );

    if (!res.ok) throw new Error('Failed to save appointment');

    // 5. Refresh UI with updated appointments
    const savedAppointment = await res.json();
    await updateAppointmentDisplay();

    // 6. Hide modal after save
    const modal = bootstrap.Modal.getInstance(document.getElementById('appointmentModal'));
    if (modal) modal.hide();

    showSaveFeedback('#appointmentForm .btn-confirm');
    showToast(`Appointment ${currentEditingAppointmentId === 'new' ? 'created' : 'updated'} successfully`, 'success');

    // 7. Get the appointment ID for Google sync
    let appointmentId;
    if (currentEditingAppointmentId === 'new') {
      appointmentId = savedAppointment.AppointmentID || savedAppointment.appointmentId || savedAppointment.id;
    } else {
      appointmentId = currentEditingAppointmentId;
    }

    console.log('Appointment ID for sync:', appointmentId);
    currentEditingAppointmentId = null;

    // 8. If Google tokens exist, sync with Google Calendar (with delay for user feedback)
    const tokensStr = sessionStorage.getItem('google_tokens');
    if (tokensStr && appointmentId) {
      setTimeout(async () => {
        let googleSuccess = false;

        try {
          const appointmentResponse = await fetch(`/api/appointments/${appointmentId}`, {
            headers: getAuthHeaders()
          });

          if (appointmentResponse.ok) {
            const appointmentData = await appointmentResponse.json();
            console.log('Appointment data for sync:', appointmentData);

            const result = await createGoogleEvent(appointmentData);
            googleSuccess = !!result;
          } else {
            console.error('Failed to fetch appointment for sync');
          }
        } catch (syncError) {
          console.error('Error syncing with Google Calendar:', syncError);
        }

        // Show toast separately after sync completes
        if (googleSuccess) {
          showToast('Google Calendar updated successfully', 'success');
        } else {
          showToast('Google Calendar sync failed', 'warning');
        }

      }, 2500); // 2.5 second delay after saving to backend
    }


  } catch (error) {
    // 9. Handle save errors
    console.error('Error saving appointment:', error);
    showToast('Failed to save appointment', 'error');
  }
}

// Handle confirmation and deletion of an appointment (and Google event if needed)
// Deletes both the appointment from backend and the Google Calendar event if present
async function handleAppointmentDeletion() {
  if (!pendingDeleteAppointmentId) return; // No appointment selected

  const modalElement = document.getElementById('confirmDeleteModal');
  const modal = bootstrap.Modal.getInstance(modalElement);

  try {
    // 1. If Google tokens exist, try to delete the Google Calendar event first
    const tokensStr = sessionStorage.getItem('google_tokens');
    let appointment = null;
    let googleSuccess = false;

    if (tokensStr) {
      // Fetch appointment details to get GoogleEventID
      const res = await fetch(`/api/appointments/${pendingDeleteAppointmentId}`, {
        headers: getAuthHeaders()
      });

      if (res.ok) {
        appointment = await res.json();
        // Delete Google event if it exists
        if (appointment?.GoogleEventID) {
          googleSuccess = await deleteGoogleEvent(appointment);
          console.log('Google Calendar event deleted:', googleSuccess);
        }
      }
    }

    // 2. Delete appointment from backend
    const res = await fetch(`/api/appointments/${pendingDeleteAppointmentId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });

    if (!res.ok) throw new Error('Delete failed');

    // 3. Refresh UI after deletion
    await updateAppointmentDisplay();
    showToast('Appointment deleted successfully', 'success');

    // 4. Show Google Calendar result after a delay if there was a sync attempt
    if (tokensStr && appointment?.GoogleEventID) {
      setTimeout(() => {
        if (googleSuccess) {
          showToast('Google Calendar updated successfully', 'success');
        } else {
          showToast('Google Calendar sync failed', 'warning');
        }
      }, 2000); // 2 second delay to show both toasts
    }

  } catch (error) {
    // 5. Handle deletion errors
    console.error('Deletion error:', error);
    showToast('Error deleting appointment', 'error');
  } finally {
    // 6. Reset state and hide modal
    pendingDeleteAppointmentId = null;
    if (modal) modal.hide();
  }
}


// ========== EVENT LISTENERS ========== 

// Set up all event listeners for form, buttons, and modals
// Ensures UI is interactive and state is managed correctly
function initializeEventListeners() {
  // Form submission handler (add/edit appointment)
  const form = document.getElementById('appointmentForm');
  if (form) {
    form.addEventListener('submit', handleAppointmentFormSubmit);
  }

  // Add appointment button handler (opens add modal)
  const addBtn = document.getElementById('addAppointmentBtn');
  if (addBtn) {
    addBtn.addEventListener('click', addNewAppointment);
  }

  // Confirm delete button handler (deletes appointment)
  const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
  if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener('click', handleAppointmentDeletion);
    confirmDeleteBtn.addEventListener('click', () => {
      confirmDeleteBtn.blur(); // Remove focus after click
    });
  }

  // Modal event handlers for form reset and focus management
  const modal = document.getElementById('appointmentModal');
  if (modal) {
    modal.addEventListener('hidden.bs.modal', () => {
      currentEditingAppointmentId = null;
      if (form) form.reset();
      document.querySelectorAll('.appointment-card').forEach(c => c.classList.remove('selected'));
    });

    modal.addEventListener('hidden.bs.modal', () => {
      if (document.activeElement && modal.contains(document.activeElement)) {
        document.activeElement.blur();
      }
    });
  }

  // Fix for Bootstrap modals focus issues (return focus to add button)
  const modalIds = ['appointmentModal', 'appointmentModalLabel', 'confirmDeleteModal'];
  modalIds.forEach(id => {
    const modalEl = document.getElementById(id);
    if (modalEl) {
      modalEl.addEventListener('hide.bs.modal', () => {
        setTimeout(() => {
          const active = document.activeElement;
          if (active && modalEl.contains(active)) {
            active.blur();
            const safeFocusTarget = addBtn || document.body;
            safeFocusTarget.focus();
          }
        }, 0);
      });
    }
  });
}

// Initialize event listeners and UI on DOM load
// Ensures everything is set up when the page loads
document.addEventListener('DOMContentLoaded', () => {
  initializeEventListeners();
  updateGoogleCalendarButtons(); // Show correct Google button state
  updateAppointmentDisplay();    // Render appointments
});

// Public API (exported for use in other modules)
export {
  updateAppointmentDisplay
};