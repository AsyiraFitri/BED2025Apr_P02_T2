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
    const scheduleList = generateSchedule(medication.Frequency);

    const scheduleHTML = scheduleList.map(time => `
        <div class="schedule-item">
            <span class="schedule-time">${time}</span>
            <div class="custom-checkbox" onclick="toggleCheckbox(this)"></div>
        </div>
    `).join('');

    return `
        <div class="medication-card" data-medication-id="${id}">
            <i class="fas fa-edit edit-icon" onclick="editMedication(${JSON.stringify(id)})"></i>
            <div class="medication-name">${medication.Name}</div>
            <div class="medication-dosage">
                Take ${medication.Dosage} pill${medication.Dosage > 1 ? 's' : ''} 
                ${medication.Frequency} time${medication.Frequency > 1 ? 's' : ''} a day
            </div>
            <div class="medication-schedule">${scheduleHTML}</div>
            <div class="medication-note">Note: ${medication.Notes}</div>
        </div>
    `;
}

async function updateMedicationDisplay() {
    const response = await fetch('/api/medications');
    const medications = await response.json();

    const container = document.getElementById('medicationContainer');
    container.innerHTML = '';

    if (Array.isArray(medications)) {
        medications.forEach(med => {
            container.innerHTML += createMedicationCard(med.MedicationID, med);
        });
    } else {
        Object.entries(medications).forEach(([id, med]) => {
            container.innerHTML += createMedicationCard(id, med);
        });
    }
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
    try {
        const response = await fetch(`/api/medications/${id}`);
        if (!response.ok) throw new Error('Medication not found');

        const med = await response.json();

        // Populate form with fetched medication data
        document.getElementById('editMedicineName').value = med.Name;
        document.getElementById('editDosage').value = med.Dosage;
        document.getElementById('editFrequency').value = med.Frequency;
        document.getElementById('editNotes').value = med.Notes || '';

        document.getElementById('editMedicationModalLabel').textContent = 'Edit Medication Details';
        const modal = new bootstrap.Modal(document.getElementById('editMedicationModal'));
        modal.show();

        document.querySelectorAll('.medication-card').forEach(card => card.classList.remove('selected'));
        document.querySelector(`[data-medication-id="${id}"]`).classList.add('selected');
    } catch (error) {
        console.error('Error fetching medication:', error);
        alert('Failed to load medication data');
    }
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

    const data = { Name: name, Dosage: dosage, Frequency: frequency, Notes: notes, Schedule: schedule };

    try {
        let res;
        if (currentEditingId === 'new') {
            res = await fetch('/api/medications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!res.ok) throw new Error('Failed to add medication');
        } else {
            res = await fetch(`/api/medications/${currentEditingId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!res.ok) throw new Error('Failed to update medication');
        }

        await updateMedicationDisplay();

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

    if (Array.isArray(appointments)) {
        appointments.forEach(app => {
            const card = document.createElement('div');
            card.className = 'appointment-card';
            card.setAttribute('data-appointment-id', app.AppointmentID);
            card.innerHTML = `
                <i class="fas fa-edit edit-icon" onclick="editAppointment(${app.AppointmentID})"></i>
                <div class="row">
                    <div class="col-8">
                        <div class="appointment-date">${formatDate(app.Date)}</div>
                    </div>
                    <div class="col-4">
                        <div class="appointment-time">${formatTime(app.Time)}</div>
                    </div>
                </div>
                <div class="appointment-title">${app.Title}</div>
                <div class="appointment-location">@${app.Location}</div>
                <div class="doctor-name">${app.DoctorName}</div>
                <div class="appointment-note">Note: ${app.Notes}</div>
            `;
            container.appendChild(card);
        });
    } else {
        Object.entries(appointments).forEach(([id, app]) => {
            // fallback in case backend returns object instead of array
        });
    }
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
    try {
        const response = await fetch(`/api/appointments/${id}`);
        if (!response.ok) throw new Error('Appointment not found');

        const app = await response.json();

        document.getElementById('editAppointmentDate').value = app.Date;
        document.getElementById('editAppointmentTime').value = app.Time;
        document.getElementById('editAppointmentTitle').value = app.Title;
        document.getElementById('editAppointmentLocation').value = app.Location;
        document.getElementById('editDoctorName').value = app.DoctorName;
        document.getElementById('editAppointmentNotes').value = app.Notes || '';

        document.getElementById('appointmentModalLabel').textContent = 'Edit Appointment Details';
        const modal = new bootstrap.Modal(document.getElementById('appointmentModal'));
        modal.show();

        document.querySelectorAll('.appointment-card').forEach(card => card.classList.remove('selected'));
        document.querySelector(`[data-appointment-id="${id}"]`).classList.add('selected');
    } catch (error) {
        console.error('Error fetching appointment:', error);
        alert('Failed to load appointment data');
    }
}

async function handleAppointmentFormSubmit(e) {
    e.preventDefault();
    const data = {
        Date: document.getElementById('editAppointmentDate').value,
        Time: document.getElementById('editAppointmentTime').value,
        Title: document.getElementById('editAppointmentTitle').value,
        Location: document.getElementById('editAppointmentLocation').value,
        DoctorName: document.getElementById('editDoctorName').value,
        Notes: document.getElementById('editAppointmentNotes').value || 'No special instructions'
    };

    try {
        let res;
        if (currentEditingAppointmentId === 'new') {
            res = await fetch('/api/appointments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!res.ok) throw new Error('Failed to add appointment');
        } else {
            res = await fetch(`/api/appointments/${currentEditingAppointmentId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!res.ok) throw new Error('Failed to update appointment');
        }

        await updateAppointmentDisplay();

        const modalEl = document.getElementById('appointmentModal');
        const modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) modal.hide();

        currentEditingAppointmentId = null;
        showSaveFeedback('#appointmentForm .btn-confirm');
    } catch (error) {
        console.error(error);
        alert('Error saving appointment');
    }
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
