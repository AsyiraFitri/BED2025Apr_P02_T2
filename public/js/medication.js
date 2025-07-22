import { showToast, showDeleteModal, showSaveFeedback, getAuthToken, getAuthHeaders } from './health-utils.js';

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
            showDeleteModal(id, 'medication');
        });
    }
}

// Load medications and render
async function updateMedicationDisplay() {
    try {
        const user = JSON.parse(sessionStorage.getItem('user'));
        const res = await fetch(`/api/medications/user/${user.UserID}`, {
            headers: getAuthHeaders()
        });

        const medications = await res.json();
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
        alert('Failed to load medication data');
    }
}

let pendingDeleteMedicationId = null;
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
    } catch {
        alert('Error deleting medication');
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
        Notes: document.getElementById('editNotes').value || 'No special instructions',
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
        alert('Error saving medication');
    }
}

// Helpers for daily checkbox state persistence
function getTodayKey() {
    return new Date().toISOString().split('T')[0];
}

function resetCheckboxesIfNewDay() {
    const storedDate = sessionStorage.getItem('medicationCheckboxLastDate');
    const today = getTodayKey();

    if (storedDate !== today) {
        Object.keys(sessionStorage).forEach(key => {
            if (key.startsWith('medicationCheckboxes_')) {
                sessionStorage.removeItem(key);
            }
        });
        sessionStorage.setItem('medicationCheckboxLastDate', today);
    }
}

function saveCheckboxState(medicationId, timeLabel, isChecked) {
    const key = `medicationCheckboxes_${getTodayKey()}`;
    const state = JSON.parse(sessionStorage.getItem(key)) || {};
    if (!state[medicationId]) state[medicationId] = {};
    state[medicationId][timeLabel] = isChecked;
    sessionStorage.setItem(key, JSON.stringify(state));
}

function loadCheckboxState(medicationId, timeLabel) {
    const key = `medicationCheckboxes_${getTodayKey()}`;
    const state = JSON.parse(sessionStorage.getItem(key)) || {};
    return state[medicationId]?.[timeLabel] || false;
}

// Toggle checkbox state and save
function toggleCheckboxElement(checkbox) {
    const isChecked = !checkbox.classList.contains('checked');
    checkbox.classList.toggle('checked', isChecked);
    checkbox.classList.toggle('unchecked', !isChecked);
    checkbox.setAttribute('aria-checked', isChecked);

    const medicationId = checkbox.getAttribute('data-medication-id');
    const timeLabel = checkbox.getAttribute('data-time-label');
    saveCheckboxState(medicationId, timeLabel, isChecked);
}

// Keyboard handler for accessibility on custom checkboxes
function handleCheckboxKeyDown(event) {
    if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault();
        toggleCheckboxElement(event.target);
    }
}

// ========== EVENT LISTENERS ==========

// Form submission
document.getElementById('editMedication').addEventListener('submit', handleMedicationFormSubmit);

// Reset form and selection on modal hide
document.getElementById('medicationModal').addEventListener('hidden.bs.modal', () => {
    currentEditingMedicationId = null;
    document.getElementById('editMedication').reset();
    document.querySelectorAll('.medication-card').forEach(c => c.classList.remove('selected'));
});

// Delegated event listener for checkbox click and keyboard interaction inside medicationContainer
document.getElementById('medicationContainer').addEventListener('click', (event) => {
    const checkbox = event.target.closest('.custom-checkbox');
    if (checkbox) {
        toggleCheckboxElement(checkbox);
    }
});

document.getElementById('medicationContainer').addEventListener('keydown', (event) => {
    if (event.target.classList.contains('custom-checkbox')) {
        handleCheckboxKeyDown(event);
    }
});

// Setup on DOM load
document.addEventListener('DOMContentLoaded', () => {
    resetCheckboxesIfNewDay();
    updateMedicationDisplay();

    // Add button: add id to your Add button in HTML, or replace this code with your button id
    const addBtn = document.getElementById('addMedicationBtn');
    if (addBtn) {
        addBtn.addEventListener('click', addNewMedication);
    }

    // Confirm delete button
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', handleDeleteConfirmation);
        // remove focus from button after click
        confirmDeleteBtn.addEventListener('click', () => {
            confirmDeleteBtn.blur();
        });
    }

    // ** Fix for aria-hidden focus warning **
    const medicationModal = document.getElementById('medicationModal');
    if (medicationModal) {
        medicationModal.addEventListener('hidden.bs.modal', () => {
            if (document.activeElement && medicationModal.contains(document.activeElement)) {
                document.activeElement.blur();
            }
        });
    }
});

// Fix for Bootstrap modals not removing focus from active elements (remove aria-hidden focus warning)
const medicationModalIds = ['medicationModal', 'medicationModalLabel', 'confirmDeleteModal'];
medicationModalIds.forEach(id => {
    const modal = document.getElementById(id);
    if (modal) {
        modal.addEventListener('hide.bs.modal', () => {
            setTimeout(() => {
                const active = document.activeElement;
                if (active && modal.contains(active)) {
                    active.blur();

                    // Optional: move focus to a safe location
                    const safeFocusTarget = document.getElementById('addMedicationBtn') || document.body;
                    safeFocusTarget.focus();
                }
            }, 0); // Defer until after Bootstrap starts hiding
        });
    }
});

