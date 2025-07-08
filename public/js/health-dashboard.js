// ========== GLOBAL STATE ==========
let currentEditingId = null;
let currentEditingAppointmentId = null;


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
    const scheduleList = generateSchedule(medication.frequency); // 👈 dynamically generate

    const scheduleHTML = scheduleList.map(time => `
        <div class="schedule-item">
            <span class="schedule-time">${time}</span>
            <div class="custom-checkbox" onclick="toggleCheckbox(this)"></div>
        </div>
    `).join('');

    return `
        <div class="medication-card" data-medication-id="${id}">
            <i class="fas fa-edit edit-icon" onclick="editMedication(${id})"></i>
            <div class="medication-name">${medication.name}</div>
            <div class="medication-dosage">
                Take ${medication.dosage} pill${medication.dosage > 1 ? 's' : ''} 
                ${medication.frequency} time${medication.frequency > 1 ? 's' : ''} a day
            </div>
            <div class="medication-schedule">${scheduleHTML}</div>
            <div class="medication-note">Note: ${medication.notes}</div>
        </div>
    `;
}


async function updateMedicationDisplay() {
    const response = await fetch('/api/medications');
    const medications = await response.json();

    const container = document.getElementById('medicationContainer');
    container.innerHTML = '';
    Object.entries(medications).forEach(([id, med]) => {
        container.innerHTML += createMedicationCard(id, med);
    });
}

function addNewMedication() {
    currentEditingId = 'new';
    document.getElementById('editForm').reset();
    document.getElementById('editMedicationModalLabel').textContent = 'Add New Medication';
    const modal = new bootstrap.Modal(document.getElementById('editMedicationModal'));
    modal.show();
}

async function editMedication(id) {
    currentEditingId = id;
    const response = await fetch(`/api/medications/${id}`);
    const med = await response.json();

    document.getElementById('editMedicineName').value = med.name;
    document.getElementById('editDosage').value = med.dosage;
    document.getElementById('editFrequency').value = med.frequency;
    document.getElementById('editNotes').value = med.notes;

    document.getElementById('editMedicationModalLabel').textContent = 'Edit Medication Details';
    const modal = new bootstrap.Modal(document.getElementById('editMedicationModal'));
    modal.show();

    document.querySelectorAll('.medication-card').forEach(card => card.classList.remove('selected'));
    document.querySelector(`[data-medication-id="${id}"]`).classList.add('selected');
}

function cancelEdit() {
    currentEditingId = null;
    document.getElementById('editForm').reset();
    document.querySelectorAll('.medication-card').forEach(card => card.classList.remove('selected'));
    const modalEl = document.getElementById('editMedicationModal');
    const modal = bootstrap.Modal.getInstance(modalEl);
    if (modal) modal.hide();
}

async function handleMedicationFormSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('editMedicineName').value;
    const dosage = parseInt(document.getElementById('editDosage').value);
    const frequency = parseInt(document.getElementById('editFrequency').value);
    const notes = document.getElementById('editNotes').value || 'No special instructions';
    const schedule = generateSchedule(frequency);

    const data = { name, dosage, frequency, notes, schedule };

    try {
        if (currentEditingId === 'new') {
            const res = await fetch('/api/medications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!res.ok) throw new Error('Failed to add medication');
        } else {
            const res = await fetch(`/api/medications/${currentEditingId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!res.ok) throw new Error('Failed to update medication');
        }

        await updateMedicationDisplay(); // await here

        cancelEdit();
        showSaveFeedback('.btn-confirm');
    } catch (error) {
        console.error(error);
        alert('Error saving medication');
    }
}



// ========== APPOINTMENT FUNCTIONS ==========
async function updateAppointmentDisplay() {
    const response = await fetch('/api/appointments');
    const appointments = await response.json();

    const container = document.getElementById('appointmentContainer');
    if (!container) return;

    container.innerHTML = '';

    Object.entries(appointments).forEach(([id, app]) => {
        const card = document.createElement('div');
        card.className = 'appointment-card';
        card.setAttribute('data-appointment-id', id);
        card.innerHTML = `
            <i class="fas fa-edit edit-icon" onclick="editAppointment(${id})"></i>
            <div class="row">
                <div class="col-8">
                    <div class="appointment-date">${formatDate(app.date)}</div>
                </div>
                <div class="col-4">
                    <div class="appointment-time">${formatTime(app.time)}</div>
                </div>
            </div>
            <div class="appointment-title">${app.title}</div>
            <div class="appointment-location">@${app.location}</div>
            <div class="doctor-name">${app.doctor}</div>
            <div class="appointment-note">Note: ${app.notes}</div>
        `;
        container.appendChild(card);
    });
}

function addNewAppointment() {
    currentEditingAppointmentId = 'new';
    document.getElementById('appointmentForm').reset();
    document.getElementById('appointmentModalLabel').textContent = 'Add New Appointment';
    const modal = new bootstrap.Modal(document.getElementById('appointmentModal'));
    modal.show();
}

async function editAppointment(id) {
    currentEditingAppointmentId = id;
    const response = await fetch(`/api/appointments/${id}`);
    const app = await response.json();

    document.getElementById('editAppointmentDate').value = app.date;
    document.getElementById('editAppointmentTime').value = app.time;
    document.getElementById('editAppointmentTitle').value = app.title;
    document.getElementById('editAppointmentLocation').value = app.location;
    document.getElementById('editDoctorName').value = app.doctor;
    document.getElementById('editAppointmentNotes').value = app.notes;

    document.getElementById('appointmentModalLabel').textContent = 'Edit Appointment Details';
    const modal = new bootstrap.Modal(document.getElementById('appointmentModal'));
    modal.show();

    document.querySelectorAll('.appointment-card').forEach(card => card.classList.remove('selected'));
    document.querySelector(`[data-appointment-id="${id}"]`).classList.add('selected');
}

async function handleAppointmentFormSubmit(e) {
    e.preventDefault();
    const data = {
        date: document.getElementById('editAppointmentDate').value,
        time: document.getElementById('editAppointmentTime').value,
        title: document.getElementById('editAppointmentTitle').value,
        location: document.getElementById('editAppointmentLocation').value,
        doctor: document.getElementById('editDoctorName').value,
        notes: document.getElementById('editAppointmentNotes').value || 'No special instructions'
    };

    if (currentEditingAppointmentId === 'new') {
        await fetch('/api/appointments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
    } else {
        await fetch(`/api/appointments/${currentEditingAppointmentId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
    }

    updateAppointmentDisplay();

    const modalEl = document.getElementById('appointmentModal');
    const modal = bootstrap.Modal.getInstance(modalEl);
    if (modal) modal.hide();

    currentEditingAppointmentId = null;
    showSaveFeedback('#appointmentForm .btn-confirm');
}


// ========== UTILITIES ==========
function toggleCheckbox(element) {
    element.classList.toggle('checked');
}

function showSaveFeedback(selector) {
    const btn = document.querySelector(selector);
    const original = btn.textContent;
    btn.textContent = 'Saved!';
    btn.style.backgroundColor = '#28a745';
    setTimeout(() => {
        btn.textContent = original;
        btn.style.backgroundColor = '#ff6b6b';
    }, 2000);
}

function formatDate(dateStr) {
    const options = { weekday: 'short', day: 'numeric', month: 'short' };
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, options);
}

function formatTime(timeStr) {
    if (!timeStr || typeof timeStr !== 'string' || !timeStr.includes(':')) {
        return 'Invalid time'; // fallback display
    }

    const [hour, minute] = timeStr.split(':');
    const date = new Date();
    date.setHours(hour, minute);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}



// ========== EVENT LISTENERS ==========
document.getElementById('editForm').addEventListener('submit', handleMedicationFormSubmit);
document.getElementById('appointmentForm').addEventListener('submit', handleAppointmentFormSubmit);

document.getElementById('editMedicationModal').addEventListener('hidden.bs.modal', cancelEdit);
document.getElementById('appointmentModal').addEventListener('hidden.bs.modal', () => {
    currentEditingAppointmentId = null;
    document.getElementById('appointmentForm').reset();
    document.querySelectorAll('.appointment-card').forEach(card => card.classList.remove('selected'));
});

document.addEventListener('DOMContentLoaded', () => {
    updateMedicationDisplay();
    updateAppointmentDisplay();

    document.querySelectorAll('.add-btn').forEach(btn => {
        btn.addEventListener('mouseenter', () => btn.style.transform = 'translateY(-2px)');
        btn.addEventListener('mouseleave', () => btn.style.transform = 'translateY(0)');
    });
});
