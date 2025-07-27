import { showToast, showDeleteModal, showSaveFeedback, getAuthHeaders } from './health-utils.js';

let pendingDeleteMedicationId = null;
let currentEditingMedicationId = null;
let todayTrackingData = {}; // Store today's tracking data

// Generate schedule times based on frequency
function generateSchedule(frequency) {
    const schedules = {
        1: ["Morning"],
        2: ["Morning", "Night"],
        3: ["Morning", "Afternoon", "Night"],
        4: ["Morning", "Afternoon", "Evening", "Night"]
    };
    return schedules[frequency] || [];
}

// Create medication card element
function createMedicationCard(id, medication) {
    const scheduleList = generateSchedule(medication.Frequency);

    const scheduleHTML = scheduleList.map(time => {
        const isChecked = loadCheckboxState(id, time);
        return `
        <div class="schedule-item">
            <span class="schedule-time">${time}</span>
            <div class="custom-checkbox ${isChecked ? 'checked' : 'unchecked'}"
                 role="checkbox" tabindex="0" aria-checked="${isChecked}"
                 data-medication-id="${id}" data-time-label="${time}">
            </div>
        </div>
        `;
    }).join('');

    const card = document.createElement('div');
    card.className = 'medication-card position-relative';
    card.dataset.medicationId = id;

    card.innerHTML = `
        <div class="d-flex justify-content-between align-items-start mb-2">
            <div class="edit-icon-container" style="cursor:pointer;">
                <i class="fas fa-edit edit-icon me-1"></i><span> Edit</span>
            </div>
            <i class="fas fa-trash-alt delete-icon" style="cursor:pointer;"></i>
        </div>
        <div class="medication-name">${medication.Name}</div>
        <div class="medication-dosage">
            Take ${medication.Dosage} pill${medication.Dosage > 1 ? 's' : ''} 
            ${medication.Frequency} time${medication.Frequency > 1 ? 's' : ''} a day
        </div>
        <div class="medication-schedule">${scheduleHTML}</div>
        <div class="medication-note">Note: ${medication.Notes || 'No special instructions'}</div>
    `;

    // Card selection highlight on click
    card.addEventListener('click', () => {
        document.querySelectorAll('.medication-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
    });

    attachMedicationCardEventListeners(card);
    return card;
}

// Attach edit/delete event listeners to medication card buttons
function attachMedicationCardEventListeners(card) {
    const editBtn = card.querySelector('.edit-icon-container');
    const deleteBtn = card.querySelector('.delete-icon');
    const id = card.dataset.medicationId;

    if (editBtn) {
        editBtn.addEventListener('click', e => {
            e.stopPropagation();
            editMedication(id);
        });
    }

    if (deleteBtn) {
        deleteBtn.addEventListener('click', e => {
            e.stopPropagation();
            pendingDeleteMedicationId = id;
            showDeleteModal(id, 'medication');
        });
    }
}

// Load medications and render
async function updateMedicationDisplay() {
    try {
        const user = JSON.parse(sessionStorage.getItem('user'));
        
        // Load both medications and today's tracking data
        const [medicationsRes, trackingRes] = await Promise.all([
            fetch(`/api/medications/user/${user.UserID}`, { headers: getAuthHeaders() }),
            fetch('/api/medications/tracking/today', { headers: getAuthHeaders() })
        ]);

        const medications = await medicationsRes.json();
        
        // Load tracking data (if request succeeds)
        if (trackingRes.ok) {
            const tracking = await trackingRes.json();
            // Convert tracking array to object for easy lookup
            todayTrackingData = {};
            tracking.forEach(item => {
                const key = `${item.MedicationID}-${item.ScheduleTime}`;
                todayTrackingData[key] = item.IsChecked;
            });
        } else {
            todayTrackingData = {}; // Reset if tracking fetch fails
        }

        const container = document.getElementById('medicationContainer');
        container.innerHTML = '';

        if (Array.isArray(medications)) {
            medications.forEach(med => {
                const card = createMedicationCard(med.MedicationID, med);
                container.appendChild(card);
            });
        } else if (medications?.MedicationID) {
            container.appendChild(createMedicationCard(medications.MedicationID, medications));
        } else {
            container.innerHTML = '<p class="text-danger">Login/Sign Up to add a medication!</p>';
        }
    } catch (error) {
        console.error('Error fetching medications:', error);
        document.getElementById('medicationContainer').innerHTML = '<p class="text-danger">Failed to load medications.</p>';
    }
}

// Show modal for adding new medication
function addNewMedication() {
    currentEditingMedicationId = 'new';
    document.getElementById('editMedication').reset();
    document.getElementById('medicationModalLabel').textContent = 'Add New Medication';
    new bootstrap.Modal(document.getElementById('medicationModal')).show();
}

// Load medication data into form and show modal for editing
async function editMedication(id) {
    currentEditingMedicationId = id;
    try {
        const res = await fetch(`/api/medications/${id}`, {
            headers: getAuthHeaders()
        });

        if (!res.ok) throw new Error('Medication not found');
        const med = await res.json();

        document.getElementById('editMedication').reset();
        document.getElementById('editMedicineName').value = med.Name;
        document.getElementById('editDosage').value = med.Dosage;
        document.getElementById('editFrequency').value = med.Frequency;
        document.getElementById('editNotes').value = med.Notes || '';

        document.getElementById('medicationModalLabel').textContent = 'Edit Medication Details';
        new bootstrap.Modal(document.getElementById('medicationModal')).show();

        document.querySelectorAll('.medication-card').forEach(c => c.classList.remove('selected'));
        document.querySelector(`[data-medication-id="${id}"]`).classList.add('selected');
    } catch (error) {
        console.error('Error fetching medication:', error);
        showToast('Failed to load medication data', 'error');
    }
}


// Confirm deletion modal handling
async function handleDeleteConfirmation() {
    if (!pendingDeleteMedicationId) return;

    const modalElement = document.getElementById('confirmDeleteModal');
    const modal = bootstrap.Modal.getInstance(modalElement);

    try {
        const res = await fetch(`/api/medications/${pendingDeleteMedicationId}`, {
            method: 'DELETE',
            headers: getAuthHeaders({ 'Content-Type': 'application/json' })
        });

        if (!res.ok) throw new Error();

        await updateMedicationDisplay();
        showToast('Medication deleted successfully');
    } catch (error) {
        console.error('Error deleting medication:', error);
        showToast('Error deleting medication', 'error');
    } finally {
        pendingDeleteMedicationId = null;
        if (modal) modal.hide();
    }
}

// Submit handler for add/edit medication form
async function handleMedicationFormSubmit(e) {
    e.preventDefault();
    const user = JSON.parse(sessionStorage.getItem('user'));
    const data = {
        Name: document.getElementById('editMedicineName').value,
        Dosage: parseInt(document.getElementById('editDosage').value, 10),
        Frequency: parseInt(document.getElementById('editFrequency').value, 10),
        Notes: document.getElementById('editNotes').value,
        UserID: user.UserID
    };

    try {
        const res = await fetch(currentEditingMedicationId === 'new' ? '/api/medications' : `/api/medications/${currentEditingMedicationId}`, {
            method: currentEditingMedicationId === 'new' ? 'POST' : 'PUT',
            headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify(data)
        });

        if (!res.ok) throw new Error('Failed to save medication');

        await updateMedicationDisplay();

        const modal = bootstrap.Modal.getInstance(document.getElementById('medicationModal'));
        if (modal) modal.hide();

        showSaveFeedback('#editMedication .btn-confirm');
        showToast(`Medication ${currentEditingMedicationId === 'new' ? 'added' : 'updated'} successfully`);
        currentEditingMedicationId = null;
    } catch (error) {
        console.error('Error saving medication:', error);
        showToast('Error saving medication', 'error');
    }
}

// Helpers for daily checkbox state persistence
function loadCheckboxState(medicationId, timeLabel) {
    const key = `${medicationId}-${timeLabel}`;
    return todayTrackingData[key] || false;
}

// Save checkbox state to backend
async function saveCheckboxState(medicationId, scheduleTime, isChecked) {
    try {
        const response = await fetch('/api/medications/tracking/save', {
            method: 'POST',
            headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({
                medicationId: parseInt(medicationId),
                scheduleTime,
                isChecked
            })
        });

        if (response.ok) {
            // Update local tracking data if save successful
            const key = `${medicationId}-${scheduleTime}`;
            todayTrackingData[key] = isChecked;
        } else {
            console.error('Failed to save tracking state');
            showToast('Failed to save medication tracking', 'warning');
        }
    } catch (error) {
        console.error('Error saving tracking state:', error);
        showToast('Failed to save medication tracking', 'warning');
    }
}

// Toggle checkbox state and save
async function toggleCheckboxElement(checkbox) {
    const isChecked = !checkbox.classList.contains('checked');
    checkbox.classList.toggle('checked', isChecked);
    checkbox.classList.toggle('unchecked', !isChecked);
    checkbox.setAttribute('aria-checked', isChecked);

    const medicationId = checkbox.getAttribute('data-medication-id');
    const scheduleTime = checkbox.getAttribute('data-time-label');
    
    // Save to backend
    await saveCheckboxState(medicationId, scheduleTime, isChecked);
}

// Keyboard handler for accessibility on custom checkboxes
function handleCheckboxKeyDown(event) {
    if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault();
        toggleCheckboxElement(event.target);
    }
}

// ========== EVENT LISTENERS ==========

function initializeEventListeners() {
  // Form submission
  const form = document.getElementById('editMedication');
  if (form) {
    form.addEventListener('submit', handleMedicationFormSubmit);
  }

  // Add medication button
  const addBtn = document.getElementById('addMedicationBtn');
  if (addBtn) {
    addBtn.addEventListener('click', addNewMedication);
  }

  // Confirm delete button
  const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
  if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener('click', handleDeleteConfirmation);
    confirmDeleteBtn.addEventListener('click', () => {
      confirmDeleteBtn.blur(); // Remove focus after click
    });
  }

  // Modal event handlers
  const medicationModal = document.getElementById('medicationModal');
  if (medicationModal) {
    // Reset form and selection on modal hide
    medicationModal.addEventListener('hidden.bs.modal', () => {
      currentEditingMedicationId = null;
      if (form) form.reset();
      document.querySelectorAll('.medication-card').forEach(c => c.classList.remove('selected'));
    });

    // Fix for aria-hidden focus warning
    medicationModal.addEventListener('hidden.bs.modal', () => {
      if (document.activeElement && medicationModal.contains(document.activeElement)) {
        document.activeElement.blur();
      }
    });
  }

  // Delegated event listeners for medication container
  const container = document.getElementById('medicationContainer');
  if (container) {
    // Checkbox click handler
    container.addEventListener('click', (event) => {
      const checkbox = event.target.closest('.custom-checkbox');
      if (checkbox) {
        toggleCheckboxElement(checkbox);
      }
    });

    // Checkbox keyboard handler
    container.addEventListener('keydown', (event) => {
      if (event.target.classList.contains('custom-checkbox')) {
        handleCheckboxKeyDown(event);
      }
    });
  }

  // Fix for Bootstrap modals focus issues
  const modalIds = ['medicationModal', 'medicationModalLabel', 'confirmDeleteModal'];
  modalIds.forEach(id => {
    const modal = document.getElementById(id);
    if (modal) {
      modal.addEventListener('hide.bs.modal', () => {
        setTimeout(() => {
          const active = document.activeElement;
          if (active && modal.contains(active)) {
            active.blur();
            const safeFocusTarget = addBtn || document.body;
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
  updateMedicationDisplay();
});

