// ========== GLOBAL STATE ==========
let currentEditingId = null;

// ========== MEDICATION FUNCTIONS ==========
function generateSchedule(frequency) {
    const schedules = {
        1: ["Morning"],
        2: ["Morning", "Night"],
        3: ["Morning", "Afternoon", "Night"],
        4: ["Morning", "Afternoon", "Evening", "Night"]
    };
    return schedules[frequency] || [];
}

function createMedicationCard(id, medication) {
    const scheduleList = generateSchedule(medication.Frequency);

    const scheduleHTML = scheduleList.map(time => `
        <div class="schedule-item">
            <span class="schedule-time">${time}</span>
            <div class="custom-checkbox" onclick="toggleCheckbox(this)"></div>
        </div>
    `).join('');

    return `
        <div class="medication-card position-relative" data-medication-id="${id}">
            <div class="d-flex justify-content-between align-items-start mb-2">
                <div class="edit-icon-container" onclick="editMedication(${JSON.stringify(id)})">
                    <i class="fas fa-edit edit-icon me-1"></i><span> Edit</span>
                </div>
                <i class="fas fa-trash-alt delete-icon" onclick="deleteMedication(${JSON.stringify(id)})"></i>
            </div>

            <div class="medication-name">${medication.Name}</div>
            <div class="medication-dosage">
                Take ${medication.Dosage} pill${medication.Dosage > 1 ? 's' : ''} 
                ${medication.Frequency} time${medication.Frequency > 1 ? 's' : ''} a day
            </div>
            <div class="medication-schedule">${scheduleHTML}</div>
            <div class="medication-note">Note: ${medication.Notes || 'No special instructions'}</div>
        </div>
    `;
}


async function updateMedicationDisplay() {
    try {
        const response = await fetch('/api/medications/user/1');
        const medications = await response.json();

        const container = document.getElementById('medicationContainer');
        container.innerHTML = '';

        if (Array.isArray(medications)) {
            medications.forEach(med => {
                container.innerHTML += createMedicationCard(med.MedicationID, med);
            });
        } else if (typeof medications === 'object' && medications !== null && medications.MedicationID) {
            container.innerHTML += createMedicationCard(medications.MedicationID, medications);
        } else {
            container.innerHTML = '<p class="text-danger">No medication data found.</p>';
        }
    } catch (error) {
        console.error('Error fetching medications:', error);
        document.getElementById('medicationContainer').innerHTML = '<p class="text-danger">Failed to load medications.</p>';
    }
}

function addNewMedication() {
    currentEditingId = 'new';
    document.getElementById('editMedication').reset();
    document.getElementById('editMedicationModalLabel').textContent = 'Add New Medication';
    new bootstrap.Modal(document.getElementById('editMedicationModal')).show();
}

async function editMedication(id) {
    currentEditingId = id;
    try {
        const response = await fetch(`/api/medications/${id}`);
        if (!response.ok) throw new Error('Medication not found');

        const med = await response.json();

        // Reset form first before setting values
        document.getElementById('editMedication').reset();

        document.getElementById('editMedicineName').value = med.Name;
        document.getElementById('editDosage').value = med.Dosage;
        document.getElementById('editFrequency').value = med.Frequency;
        document.getElementById('editNotes').value = med.Notes || '';

        document.getElementById('editMedicationModalLabel').textContent = 'Edit Medication Details';
        new bootstrap.Modal(document.getElementById('editMedicationModal')).show();

        document.querySelectorAll('.medication-card').forEach(card => card.classList.remove('selected'));
        document.querySelector(`[data-medication-id="${id}"]`).classList.add('selected');
    } catch (error) {
        alert('Failed to load medication data');
    }
}


function cancelEdit() {
    currentEditingId = null;
    document.getElementById('editMedication').reset();
    document.querySelectorAll('.medication-card').forEach(card => card.classList.remove('selected'));
    const modal = bootstrap.Modal.getInstance(document.getElementById('editMedicationModal'));
    if (modal) modal.hide();
}

async function deleteMedication(id) {
    if (!confirm('Are you sure you want to delete this medication?')) return;
    try {
        const res = await fetch(`/api/medications/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error();
        await updateMedicationDisplay();
    } catch {
        alert('Error deleting medication');
    }
}

async function handleMedicationFormSubmit(e) {
    e.preventDefault();
    const data = {
        name: document.getElementById('editMedicineName').value,
        dosage: parseInt(document.getElementById('editDosage').value, 10),
        frequency: parseInt(document.getElementById('editFrequency').value, 10),
        notes: document.getElementById('editNotes').value || 'No special instructions',
        userId: 1 // Hardcoded user ID for now, replace with actual user ID from session
    };

    try {
        const res = await fetch(currentEditingId === 'new' ? '/api/medications' : `/api/medications/${currentEditingId}`, {
            method: currentEditingId === 'new' ? 'POST' : 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('Failed to save medication');

        await updateMedicationDisplay();
        const modal = bootstrap.Modal.getInstance(document.getElementById('editMedicationModal'));
        if (modal) modal.hide();
        currentEditingId = null;
        showSaveFeedback('#editMedication .btn-confirm');
    } catch (error) {
        console.error('Error saving medication:', error);
        alert('Error saving medication');
    }
}


// Function to show save feedback
function showSaveFeedback(selector) {
    const button = document.querySelector(selector);
    button.classList.add('btn-success');
    button.textContent = 'Saved!';
    setTimeout(() => {
        button.classList.remove('btn-success');
        button.textContent = 'Save';
    }, 2000);
}

// toggle checkbox state
function toggleCheckbox(checkbox) {
    checkbox.classList.toggle('checked');
    checkbox.classList.toggle('unchecked');
}

document.getElementById('editMedication').addEventListener('submit', handleMedicationFormSubmit);
document.getElementById('editMedicationModal').addEventListener('hidden.bs.modal', cancelEdit);

// Initialize medication display on page load
document.addEventListener('DOMContentLoaded', () => {
    updateMedicationDisplay();

    const addBtn = document.getElementById('addMedicationBtn');
    if (addBtn) {
        addBtn.addEventListener('click', addNewMedication);
    }

    const medicationForm = document.getElementById('editMedication');
    if (medicationForm) {
        medicationForm.addEventListener('submit', handleMedicationFormSubmit);
    }

    const medicationModal = document.getElementById('editMedicationModal');
    if (medicationModal) {
        medicationModal.addEventListener('hidden.bs.modal', () => {
            currentEditingId = null;
            medicationForm.reset();
            document.querySelectorAll('.medication-card').forEach(c => c.classList.remove('selected'));
        });
    }

    const editButtons = document.querySelectorAll('.edit-icon');
    editButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const medicationId = btn.closest('.medication-card').dataset.medicationId;
            editMedication(medicationId);
        });
    });

    const deleteButtons = document.querySelectorAll('.delete-icon');
    deleteButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const medicationId = btn.closest('.medication-card').dataset.medicationId;
            deleteMedication(medicationId);
        });
    });
});



