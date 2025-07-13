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

    card.addEventListener('click', () => {
        document.querySelectorAll('.medication-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
    });

    attachMedicationCardEventListeners(card);
    return card;
}

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

async function updateMedicationDisplay() {
    try {
        const response = await fetch('/api/medications/user/1');
        const medications = await response.json();

        const container = document.getElementById('medicationContainer');
        container.innerHTML = '';

        if (Array.isArray(medications)) {
            medications.forEach(med => {
                const card = createMedicationCard(med.MedicationID, med);
                container.appendChild(card);
            });
        } else if (typeof medications === 'object' && medications !== null && medications.MedicationID) {
            container.appendChild(createMedicationCard(medications.MedicationID, medications));
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

        document.getElementById('editMedication').reset();
        document.getElementById('editMedicineName').value = med.Name;
        document.getElementById('editDosage').value = med.Dosage;
        document.getElementById('editFrequency').value = med.Frequency;
        document.getElementById('editNotes').value = med.Notes || '';

        document.getElementById('editMedicationModalLabel').textContent = 'Edit Medication Details';
        new bootstrap.Modal(document.getElementById('editMedicationModal')).show();

        document.querySelectorAll('.medication-card').forEach(c => c.classList.remove('selected'));
        document.querySelector(`[data-medication-id="${id}"]`).classList.add('selected');
    } catch (error) {
        alert('Failed to load medication data');
    }
}

async function handleDeleteConfirmation() {
    if (!pendingDeleteId) return;

    const modalElement = document.getElementById('confirmDeleteModal');
    const modal = bootstrap.Modal.getInstance(modalElement);

    try {
        const res = await fetch(`/api/medications/${pendingDeleteId}`, { method: 'DELETE' });
        if (!res.ok) throw new Error();

        await updateMedicationDisplay();
        showToast('Medication deleted successfully');
    } catch {
        alert('Error deleting medication');
    } finally {
        pendingDeleteId = null;
        if (modal) modal.hide();
    }
}

async function handleMedicationFormSubmit(e) {
    e.preventDefault();
    const data = {
        Name: document.getElementById('editMedicineName').value,
        Dosage: parseInt(document.getElementById('editDosage').value, 10),
        Frequency: parseInt(document.getElementById('editFrequency').value, 10),
        Notes: document.getElementById('editNotes').value || 'No special instructions',
        UserID: 1
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
        showToast(`Medication ${currentEditingId === 'new' ? 'added' : 'updated'} successfully`);
    } catch (error) {
        console.error('Error saving medication:', error);
        alert('Error saving medication');
    }
}

function showSaveFeedback(selector) {
    const button = document.querySelector(selector);
    button.classList.add('btn-success');
    button.textContent = 'Saved!';
    setTimeout(() => {
        button.classList.remove('btn-success');
        button.textContent = 'Save';
    }, 2000);
}

function toggleCheckbox(checkbox) {
    checkbox.classList.toggle('checked');
    checkbox.classList.toggle('unchecked');
}

// ========== EVENT LISTENERS ==========
document.getElementById('editMedication').addEventListener('submit', handleMedicationFormSubmit);
document.getElementById('editMedicationModal').addEventListener('hidden.bs.modal', () => {
    currentEditingId = null;
    document.getElementById('editMedication').reset();
    document.querySelectorAll('.medication-card').forEach(c => c.classList.remove('selected'));
});

document.addEventListener('DOMContentLoaded', () => {
    updateMedicationDisplay();

    const addBtn = document.getElementById('addMedicationBtn');
    if (addBtn) {
        addBtn.addEventListener('click', addNewMedication);
    }

    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', handleDeleteConfirmation);
    }
});
