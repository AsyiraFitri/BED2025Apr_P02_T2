// =============================
// Medication management logic (frontend)
// Handles CRUD, UI, and daily tracking for medications
// =============================

// Import utility functions for UI feedback and API headers
import { 
  showToast, 
  showDeleteModal, 
  showSaveFeedback, 
  getAuthHeaders,
  getPendingDeleteMedicationId,
  setPendingDeleteMedicationId,
} from './health-utils.js';

// State variables to track which medication is pending deletion or being edited
let currentEditingMedicationId = null;
let todayTrackingData = {}; // Store today's tracking data for checkboxes

// Generate schedule times based on frequency
// frequency: number of times per day (1-4)
// Returns an array of time labels (e.g., ["Morning", "Night"])
function generateSchedule(frequency) {
    const schedules = {
        1: ["Morning"],
        2: ["Morning", "Night"],
        3: ["Morning", "Afternoon", "Night"],
        4: ["Morning", "Afternoon", "Evening", "Night"]
    };
    return schedules[frequency] || [];
}

// Create medication card element for display in the UI
// id: MedicationID, medication: medication object
// Returns a DOM element representing the medication card
function createMedicationCard(id, medication) {
    // 1. Generate schedule times based on frequency
    const scheduleList = generateSchedule(medication.Frequency);

    // 2. Build HTML for schedule checkboxes
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

    // 3. Create card element and set HTML
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

    // 4. Card selection highlight on click
    card.addEventListener('click', () => {
        document.querySelectorAll('.medication-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
    });

    // 5. Attach edit/delete event listeners to icons
    attachMedicationCardEventListeners(card);
    return card;
}

// Attach edit/delete event listeners to medication card buttons
// card: DOM element for the medication card
function attachMedicationCardEventListeners(card) {
    const editBtn = card.querySelector('.edit-icon-container');
    const deleteBtn = card.querySelector('.delete-icon');
    const id = card.dataset.medicationId;

    // Edit button opens the edit modal for this medication
    if (editBtn) {
        editBtn.addEventListener('click', e => {
            e.stopPropagation(); // Prevent card click event
            editMedication(id);
        });
    }

    // Delete button triggers the delete confirmation modal for this medication
    if (deleteBtn) {
        deleteBtn.addEventListener('click', e => {
            e.stopPropagation(); // Prevent card click event
            setPendingDeleteMedicationId(id);
            showDeleteModal(id, 'medication');
        });
    }
}

// Fetch all medications for the current user and render them as cards in the UI
// Returns an array of medication objects (or [] if none)
async function updateMedicationDisplay() {
    try {
        // 1. Get current user from sessionStorage
        const user = JSON.parse(sessionStorage.getItem('user'));

        // 2. Fetch all medications for this user from backend
        const medicationsRes = await fetch(`/api/medications/user`, { headers: getAuthHeaders() });
        if (!medicationsRes.ok) throw new Error(`Failed to fetch medications: ${medicationsRes.statusText}`);
        const medications = await medicationsRes.json();

        // 3. Fetch today's schedule tracking data (checkbox state)
        const schedulesRes = await fetch('/api/medications/schedules/user', { headers: getAuthHeaders() });

        // 4. Load schedule data (if request succeeds)
        if (schedulesRes.ok) {
            const schedules = await schedulesRes.json();
            todayTrackingData = {};
            schedules.forEach(item => {
                const key = `${item.MedicationID}-${item.ScheduleTime}`;
                todayTrackingData[key] = item.IsChecked;
            });
        } else {
            todayTrackingData = {}; // Reset if fetch fails
        }

        // 5. Render each medication as a card in the UI
        const container = document.getElementById('medicationContainer');
        container.innerHTML = '';

        if (Array.isArray(medications) && medications.length > 0) {
            medications.forEach(med => {
                const card = createMedicationCard(med.MedicationID, med);
                container.appendChild(card);
            });
            return medications;
        } else if (medications?.MedicationID) {
            // Single medication object (not array)
            container.appendChild(createMedicationCard(medications.MedicationID, medications));
            return [medications];
        } else {
            // No medications found
            container.innerHTML = '<p class="text-muted">Click the Add button to create a new medication.</p>';
            return [];
        }
    } catch (error) {
        // 6. Handle fetch or parse errors
        console.error('Error fetching medications:', error);
        const container = document.getElementById('medicationContainer');
        if (container) container.innerHTML = '<p class="text-danger">Failed to load medications.</p>';
        return [];
    }
}

// Show modal for adding new medication
// Prepares the form and opens the modal for a new medication
function addNewMedication() {
    currentEditingMedicationId = 'new'; // Set state to "new"
    document.getElementById('editMedication').reset(); // Clear form fields
    document.getElementById('medicationModalLabel').textContent = 'Add New Medication';
    new bootstrap.Modal(document.getElementById('medicationModal')).show(); // Show modal
}

// Load medication data into form and show modal for editing
// id: MedicationID to edit
async function editMedication(id) {
    currentEditingMedicationId = id;
    try {
        // 1. Fetch medication details from backend
        const res = await fetch(`/api/medications/${id}`, {
            headers: getAuthHeaders()
        });

        if (!res.ok) throw new Error('Medication not found');
        const med = await res.json();

        // 2. Populate form fields with medication data
        document.getElementById('editMedication').reset();
        document.getElementById('editMedicineName').value = med.Name;
        document.getElementById('editDosage').value = med.Dosage;
        document.getElementById('editFrequency').value = med.Frequency;
        document.getElementById('editNotes').value = med.Notes || '';

        document.getElementById('medicationModalLabel').textContent = 'Edit Medication Details';
        new bootstrap.Modal(document.getElementById('medicationModal')).show();

        // 3. Highlight the selected card in the UI
        document.querySelectorAll('.medication-card').forEach(c => c.classList.remove('selected'));
        document.querySelector(`[data-medication-id="${id}"]`).classList.add('selected');
    } catch (error) {
        // 4. Handle fetch or parse errors
        console.error('Error fetching medication:', error);
        showToast('Failed to load medication data', 'error');
    }
}


// Confirm deletion modal handling
// Deletes the medication from backend and updates the UI
async function handleDeleteConfirmation() {
    const pendingDeleteMedicationId = getPendingDeleteMedicationId();
    if (!pendingDeleteMedicationId) return; // No medication selected

    const modalElement = document.getElementById('confirmDeleteModal');
    const modal = bootstrap.Modal.getInstance(modalElement);

    try {
        // 1. Delete medication from backend
        const res = await fetch(`/api/medications/${pendingDeleteMedicationId}`, {
            method: 'DELETE',
            headers: getAuthHeaders({ 'Content-Type': 'application/json' })
        });

        if (!res.ok) throw new Error();

        // 2. Refresh UI after deletion
        await updateMedicationDisplay();
        showToast('Medication deleted successfully');
    } catch (error) {
        // 3. Handle deletion errors
        console.error('Error deleting medication:', error);
        showToast('Error deleting medication', 'error');
    } finally {
        // 4. Reset state and hide modal
        setPendingDeleteMedicationId(null);
        if (modal) modal.hide();
    }
}

// Submit handler for add/edit medication form
// Handles both adding and editing medication
async function handleMedicationFormSubmit(e) {
    e.preventDefault(); // Prevent default form submission
    const user = JSON.parse(sessionStorage.getItem('user'));
    const data = {
        Name: document.getElementById('editMedicineName').value,
        Dosage: parseInt(document.getElementById('editDosage').value, 10),
        Frequency: parseInt(document.getElementById('editFrequency').value, 10),
        Notes: document.getElementById('editNotes').value,
        UserID: user.UserID
    };

    try {
        // 1. Save medication to backend (POST for new, PUT for edit)
        const res = await fetch(currentEditingMedicationId === 'new' ? '/api/medications' : `/api/medications/${currentEditingMedicationId}`, {
            method: currentEditingMedicationId === 'new' ? 'POST' : 'PUT',
            headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify(data)
        });

        if (!res.ok) throw new Error('Failed to save medication');

        // 2. Refresh UI with updated medications
        await updateMedicationDisplay();

        // 3. Hide modal after save
        const modal = bootstrap.Modal.getInstance(document.getElementById('medicationModal'));
        if (modal) modal.hide();

        showSaveFeedback('#editMedication .btn-confirm');
        showToast(`Medication ${currentEditingMedicationId === 'new' ? 'added' : 'updated'} successfully`);
        currentEditingMedicationId = null;
    } catch (error) {
        // 4. Handle save errors
        console.error('Error saving medication:', error);
        showToast('Error saving medication', 'error');
    }
}

// Helpers for daily checkbox state persistence
// medicationId: MedicationID, timeLabel: schedule time (e.g., "Morning")
// Returns true if checked, false otherwise
function loadCheckboxState(medicationId, timeLabel) {
    const key = `${medicationId}-${timeLabel}`;
    return todayTrackingData[key] || false;
}

// Save checkbox state to backend
// medicationId: MedicationID, scheduleTime: time label, isChecked: boolean
// Persists the checkbox state for the user for today
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
            // Handle save failure
            console.error('Failed to save tracking state');
            showToast('Failed to save medication tracking', 'warning');
        }
    } catch (error) {
        // Handle network or API errors
        console.error('Error saving tracking state:', error);
        showToast('Failed to save medication tracking', 'warning');
    }
}

// Toggle checkbox state and save
// checkbox: DOM element for the custom checkbox
// Updates UI and persists state to backend
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
// Allows toggling with space/enter keys
function handleCheckboxKeyDown(event) {
    if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault();
        toggleCheckboxElement(event.target);
    }
}

// ========== EVENT LISTENERS ========== 

// Set up all event listeners for form, buttons, modals, and checkboxes
// Ensures UI is interactive and state is managed correctly
function initializeEventListeners() {
    // Form submission handler (add/edit medication)
    const form = document.getElementById('editMedication');
    if (form) {
        form.addEventListener('submit', handleMedicationFormSubmit);
    }

    // Add medication button handler (opens add modal)
    const addBtn = document.getElementById('addMedicationBtn');
    if (addBtn) {
        addBtn.addEventListener('click', addNewMedication);
    }

    // Confirm delete button handler (deletes medication)
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', handleDeleteConfirmation);
        confirmDeleteBtn.addEventListener('click', () => {
            confirmDeleteBtn.blur(); // Remove focus after click
        });
    }

    // Modal event handlers for form reset and focus management
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

    // Delegated event listeners for medication container (checkboxes)
    const container = document.getElementById('medicationContainer');
    if (container) {
        // Checkbox click handler
        container.addEventListener('click', (event) => {
            const checkbox = event.target.closest('.custom-checkbox');
            if (checkbox) {
                toggleCheckboxElement(checkbox);
            }
        });

        // Checkbox keyboard handler for accessibility
        container.addEventListener('keydown', (event) => {
            if (event.target.classList.contains('custom-checkbox')) {
                handleCheckboxKeyDown(event);
            }
        });
    }

    // Fix for Bootstrap modals focus issues (return focus to add button)
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
// Ensures everything is set up when the page loads
document.addEventListener('DOMContentLoaded', () => {
    initializeEventListeners();
    updateMedicationDisplay();
});

