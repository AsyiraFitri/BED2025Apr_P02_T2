import {
  showToast,
  showDeleteModal,
  showSaveFeedback,
  getAuthHeaders
} from './health-utils.js';

import {
  createGoogleEvent,
  updateGoogleEvent,
  deleteGoogleEvent,
  syncAllAppointments,
  updateGoogleCalendarButtons
} from './calendar.js';

// Module state management
let pendingDeleteAppointmentId = null;
let currentEditingAppointmentId = null;

// DOM element references for easy access
const elements = {
  get container() { return document.getElementById('appointmentContainer'); },
  get form() { return document.getElementById('appointmentForm'); },
  get modal() { return document.getElementById('appointmentModal'); },
  get modalLabel() { return document.getElementById('appointmentModalLabel'); },
  get addButton() { return document.getElementById('addAppointmentBtn'); },
  get deleteButton() { return document.getElementById('confirmDeleteBtn'); }
};

// Form field mapping for cleaner code
const formFields = {
  date: 'editAppointmentDate',
  time: 'editAppointmentTime',
  title: 'editAppointmentTitle',
  location: 'editAppointmentLocation',
  doctor: 'editDoctorName',
  notes: 'editAppointmentNotes'
};

// Create appointment card element
function createAppointmentCard(id, appointment) {
  const card = document.createElement('div');
  card.className = 'appointment-card';
  card.dataset.appointmentId = id;
  
  // Build card HTML
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
  
  // Card selection highlight on click
  card.addEventListener('click', () => {
    document.querySelectorAll('.appointment-card').forEach(c => c.classList.remove('selected'));
    card.classList.add('selected');
  });

  attachAppointmentCardEventListeners(card);
  return card;
}

// Attach edit/delete event listeners to appointment card buttons
function attachAppointmentCardEventListeners(card) {
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
      pendingDeleteAppointmentId = id;
      showDeleteModal(id, 'appointment');
    });
  }
}

/* Date/Time Formatting Functions */
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

function getCurrentUser() {
  const user = JSON.parse(sessionStorage.getItem('user'));
  if (!user) throw new Error('User not logged in');
  return user;
}

// Load appointments and render
async function updateAppointmentDisplay() {
  try {
    const user = JSON.parse(sessionStorage.getItem('user'));
    const res = await fetch(`/api/appointments/user/${user.UserID}`, {
      headers: getAuthHeaders()
    });

    if (!res.ok) throw new Error(`Failed to fetch appointments: ${res.statusText}`);

    const appointments = await res.json();
    const container = elements.container;
    container.innerHTML = '';

    if (Array.isArray(appointments) && appointments.length > 0) {
      appointments.forEach(app => {
        const card = createAppointmentCard(app.AppointmentID, app);
        container.appendChild(card);
      });
      
      return appointments; // Return the appointments array for calendar sync
    } else if (appointments?.AppointmentID) {
      container.appendChild(createAppointmentCard(appointments.AppointmentID, appointments));
      return [appointments]; // Return single appointment as array for calendar sync
    } else {
      container.innerHTML = '<p class="text-danger">No appointments found.</p>';
      return []; // Return empty array when no appointments for calendar sync
    }
  } catch (error) {
    console.error('Error fetching appointments:', error);
    elements.container.innerHTML = '<p class="text-danger">Failed to load appointments.</p>';
    return []; // Return empty array on error for calendar sync
  }
}

// Show modal for adding new appointment
function openNewAppointmentModal() {
  currentEditingAppointmentId = 'new';
  elements.form.reset();
  elements.modalLabel.textContent = 'Add New Appointment';
  new bootstrap.Modal(elements.modal).show();
}

// Load appointment data into form and show modal for editing
async function editAppointment(id) {
  currentEditingAppointmentId = id;
  
  try {
    const res = await fetch(`/api/appointments/${id}`, {
      headers: getAuthHeaders()
    });

    if (!res.ok) throw new Error('Appointment not found');
    const appointment = await res.json();
    
    elements.form.reset();
    document.getElementById(formFields.date).value = new Date(appointment.AppointmentDate).toISOString().split('T')[0];
    document.getElementById(formFields.time).value = appointment.AppointmentTime.slice(0, 5);
    document.getElementById(formFields.title).value = appointment.Title;
    document.getElementById(formFields.location).value = appointment.Location;
    document.getElementById(formFields.doctor).value = appointment.DoctorName;
    document.getElementById(formFields.notes).value = appointment.Notes || '';
    
    elements.modalLabel.textContent = 'Edit Appointment Details';
    new bootstrap.Modal(elements.modal).show();
    
    document.querySelectorAll('.appointment-card').forEach(c => c.classList.remove('selected'));
    const selectedCard = document.querySelector(`[data-appointment-id="${id}"]`);
    if (selectedCard) selectedCard.classList.add('selected');
    
  } catch (error) {
    console.error('Edit appointment error:', error);
    showToast('Failed to load appointment data', 'error');
  }
}

// Submit handler for add/edit appointment form
async function handleAppointmentFormSubmit(e) {
  e.preventDefault();

  try {
    const user = JSON.parse(sessionStorage.getItem('user'));
    const appointmentData = {
      AppointmentDate: document.getElementById(formFields.date).value,
      AppointmentTime: document.getElementById(formFields.time).value,
      Title: document.getElementById(formFields.title).value,
      Location: document.getElementById(formFields.location).value,
      DoctorName: document.getElementById(formFields.doctor).value,
      Notes: document.getElementById(formFields.notes).value || 'No special instructions',
      UserID: user.UserID
    };

    // For updates, preserve the existing GoogleEventID
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

    const res = await fetch(
      currentEditingAppointmentId === 'new' ? '/api/appointments' : `/api/appointments/${currentEditingAppointmentId}`,
      {
        method: currentEditingAppointmentId === 'new' ? 'POST' : 'PUT',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(appointmentData)
      }
    );

    if (!res.ok) throw new Error('Failed to save appointment');

    const savedAppointment = await res.json();
    await updateAppointmentDisplay();

    const modal = bootstrap.Modal.getInstance(elements.modal);
    if (modal) modal.hide();

    showSaveFeedback('#appointmentForm .btn-confirm');
    showToast(`Appointment ${currentEditingAppointmentId === 'new' ? 'created' : 'updated'} successfully`, 'success');
    
    // Get the appointment ID - for new appointments, get from response; for updates, use current ID
    let appointmentId;
    if (currentEditingAppointmentId === 'new') {
      // For new appointments, the response should contain the new appointment data
      appointmentId = savedAppointment.AppointmentID || savedAppointment.appointmentId || savedAppointment.id;
    } else {
      // For updates, use the current editing ID
      appointmentId = currentEditingAppointmentId;
    }
    
    console.log('Appointment ID for sync:', appointmentId);
    currentEditingAppointmentId = null;

    // Sync with Google Calendar if tokens are available (with delay to show both toasts)
    const tokensStr = sessionStorage.getItem('google_tokens');
    if (tokensStr && appointmentId) {
      setTimeout(async () => {
        try {
          // Fetch the updated appointment data to sync with Google Calendar
          const appointmentResponse = await fetch(`/api/appointments/${appointmentId}`, {
            headers: getAuthHeaders()
          });
          
          if (appointmentResponse.ok) {
            const appointmentData = await appointmentResponse.json();
            console.log('Appointment data for sync:', appointmentData);
            
            // Use createGoogleEvent which automatically handles create vs update logic
            const result = await createGoogleEvent(appointmentData);
            
            if (result) {
              showToast('Google Calendar updated successfully', 'success');
            } else {
              showToast('Google Calendar sync failed', 'warning');
            }
          } else {
            console.error('Failed to fetch appointment for sync');
          }
        } catch (syncError) {
          console.error('Error syncing with Google Calendar:', syncError);
          showToast('Google Calendar sync failed', 'warning');
        }
      }, 2000); // 2 second delay to show both toasts
    }

  } catch (error) {
    console.error('Error saving appointment:', error);
    showToast('Failed to save appointment', 'error');
  }
}

// Confirm deletion modal handling
async function handleAppointmentDeletion() {
  if (!pendingDeleteAppointmentId) return;

  const modalElement = document.getElementById('confirmDeleteModal');
  const modal = bootstrap.Modal.getInstance(modalElement);

  try {
    const tokensStr = sessionStorage.getItem('google_tokens');
    let appointment = null;
    let googleSuccess = false;

    if (tokensStr) {
      // Get appointment details first
      const res = await fetch(`/api/appointments/${pendingDeleteAppointmentId}`, {
        headers: getAuthHeaders()
      });

      if (res.ok) {
        appointment = await res.json();

        // Try to delete Google Calendar event first
        if (appointment?.GoogleEventID) {
          googleSuccess = await deleteGoogleEvent(appointment);
        }
      }
    }

    // Delete from backend
    const res = await fetch(`/api/appointments/${pendingDeleteAppointmentId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });

    if (!res.ok) throw new Error('Delete failed');

    await updateAppointmentDisplay();
    showToast('Appointment deleted successfully', 'success');

    // Show Google Calendar result after a delay if there was a sync attempt
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
    console.error('Deletion error:', error);
    showToast('Error deleting appointment', 'error');
  } finally {
    pendingDeleteAppointmentId = null;
    if (modal) modal.hide();
  }
}


// ========== EVENT LISTENERS ==========

function initializeEventListeners() {
  // Form submission
  if (elements.form) {
    elements.form.addEventListener('submit', handleAppointmentFormSubmit);
  }

  // Add appointment button
  if (elements.addButton) {
    elements.addButton.addEventListener('click', openNewAppointmentModal);
  }

  // Confirm delete button
  if (elements.deleteButton) {
    elements.deleteButton.addEventListener('click', handleAppointmentDeletion);
    elements.deleteButton.addEventListener('click', () => {
      elements.deleteButton.blur(); // Remove focus after click
    });
  }

  // Modal event handlers
  if (elements.modal) {
    // Reset form and selection on modal hide
    elements.modal.addEventListener('hidden.bs.modal', () => {
      currentEditingAppointmentId = null;
      if (elements.form) elements.form.reset();
      document.querySelectorAll('.appointment-card').forEach(c => c.classList.remove('selected'));
    });

    // Fix for aria-hidden focus warning
    elements.modal.addEventListener('hidden.bs.modal', () => {
      if (document.activeElement && elements.modal.contains(document.activeElement)) {
        document.activeElement.blur();
      }
    });
  }

  // Fix for Bootstrap modals focus issues
  const modalIds = ['appointmentModal', 'appointmentModalLabel', 'confirmDeleteModal'];
  modalIds.forEach(id => {
    const modal = document.getElementById(id);
    if (modal) {
      modal.addEventListener('hide.bs.modal', () => {
        setTimeout(() => {
          const active = document.activeElement;
          if (active && modal.contains(active)) {
            active.blur();
            const safeFocusTarget = elements.addButton || document.body;
            safeFocusTarget.focus();
          }
        }, 0);
      });
    }
  });
}

// Setup on DOM load
document.addEventListener('DOMContentLoaded', () => {
  initializeEventListeners();
  updateGoogleCalendarButtons();
  updateAppointmentDisplay();
});

// Public API
export {
  updateAppointmentDisplay
};