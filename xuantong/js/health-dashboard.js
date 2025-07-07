// ========== GLOBAL STATE ==========
let currentEditingId = null;
let currentEditingAppointmentId = null;

let medications = {
    1: {
        name: "Panadol",
        dosage: 1,
        frequency: 3,
        notes: "Take After Food",
        schedule: ["Morning", "Afternoon", "Night"]
    },
    2: {
        name: "Medicine Name",
        dosage: 2,
        frequency: 2,
        notes: "Take After Food",
        schedule: ["Morning", "Night"]
    }
};

let appointments = {
    1: {
        date: "2025-07-10",
        time: "09:00",
        title: "General Checkup",
        location: "Clinic A",
        doctor: "Dr. Tan",
        notes: "Bring health report"
    }
};


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
    const scheduleHTML = medication.schedule.map(time => `
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

function updateMedicationDisplay() {
    const container = document.getElementById('medicationContainer');
    container.innerHTML = '';
    Object.keys(medications).forEach(id => {
        container.innerHTML += createMedicationCard(id, medications[id]);
    });
}

function addNewMedication() {
    currentEditingId = 'new';
    document.getElementById('editForm').reset();
    document.getElementById('editOffcanvasLabel').textContent = 'Add New Medication';
    new bootstrap.Offcanvas('#editOffcanvas').show();
}

function editMedication(id) {
    currentEditingId = id;
    const med = medications[id];

    document.getElementById('editMedicineName').value = med.name;
    document.getElementById('editDosage').value = med.dosage;
    document.getElementById('editFrequency').value = med.frequency;
    document.getElementById('editNotes').value = med.notes;

    document.getElementById('editOffcanvasLabel').textContent = 'Edit Medication Details';
    new bootstrap.Offcanvas('#editOffcanvas').show();

    document.querySelectorAll('.medication-card').forEach(card => card.classList.remove('selected'));
    document.querySelector(`[data-medication-id="${id}"]`).classList.add('selected');
}

function cancelEdit() {
    currentEditingId = null;
    document.getElementById('editForm').reset();
    document.querySelectorAll('.medication-card').forEach(card => card.classList.remove('selected'));
    const offcanvas = bootstrap.Offcanvas.getInstance(document.getElementById('editOffcanvas'));
    if (offcanvas) offcanvas.hide();
}

function handleMedicationFormSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('editMedicineName').value;
    const dosage = parseInt(document.getElementById('editDosage').value);
    const frequency = parseInt(document.getElementById('editFrequency').value);
    const notes = document.getElementById('editNotes').value || 'No special instructions';
    const schedule = generateSchedule(frequency);

    const data = { name, dosage, frequency, notes, schedule };

    if (currentEditingId === 'new') {
        const newId = Math.max(0, ...Object.keys(medications).map(Number)) + 1;
        medications[newId] = data;
    } else {
        medications[currentEditingId] = data;
    }

    updateMedicationDisplay();
    cancelEdit();
    showSaveFeedback('.btn-confirm');
}


// ========== APPOINTMENT FUNCTIONS ==========
function addNewAppointment() {
    currentEditingAppointmentId = 'new';
    document.getElementById('appointmentForm').reset();
    document.getElementById('appointmentOffcanvasLabel').textContent = 'Add New Appointment';
    new bootstrap.Offcanvas('#appointmentOffcanvas').show();
}

function editAppointment(id) {
    currentEditingAppointmentId = id;
    const app = appointments[id];

    document.getElementById('editAppointmentDate').value = app.date;
    document.getElementById('editAppointmentTime').value = app.time;
    document.getElementById('editAppointmentTitle').value = app.title;
    document.getElementById('editAppointmentLocation').value = app.location;
    document.getElementById('editDoctorName').value = app.doctor;
    document.getElementById('editAppointmentNotes').value = app.notes;

    document.getElementById('appointmentOffcanvasLabel').textContent = 'Edit Appointment Details';
    new bootstrap.Offcanvas('#appointmentOffcanvas').show();

    document.querySelectorAll('.appointment-card').forEach(card => card.classList.remove('selected'));
    document.querySelector(`[data-appointment-id="${id}"]`).classList.add('selected');
}

function handleAppointmentFormSubmit(e) {
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
        const newId = Math.max(0, ...Object.keys(appointments).map(Number)) + 1;
        appointments[newId] = data;
    } else {
        appointments[currentEditingAppointmentId] = data;
    }

    updateAppointmentDisplay();
    const offcanvas = bootstrap.Offcanvas.getInstance(document.getElementById('appointmentOffcanvas'));
    if (offcanvas) offcanvas.hide();

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

function updateAppointmentDisplay() {
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

function formatDate(dateStr) {
    const options = { weekday: 'short', day: 'numeric', month: 'short' };
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, options); // e.g., "Thu, 10 Jul"
}

function formatTime(timeStr) {
    const [hour, minute] = timeStr.split(':');
    const date = new Date();
    date.setHours(hour, minute);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}



// ========== EVENT LISTENERS ==========
document.getElementById('editForm').addEventListener('submit', handleMedicationFormSubmit);
document.getElementById('appointmentForm').addEventListener('submit', handleAppointmentFormSubmit);

document.getElementById('editOffcanvas').addEventListener('hidden.bs.offcanvas', cancelEdit);
document.getElementById('appointmentOffcanvas').addEventListener('hidden.bs.offcanvas', () => {
    currentEditingAppointmentId = null;
    document.getElementById('appointmentForm').reset();
    document.querySelectorAll('.appointment-card').forEach(card => card.classList.remove('selected'));
});

document.addEventListener('DOMContentLoaded', () => {
    updateMedicationDisplay();
    updateAppointmentDisplay();
    document.querySelectorAll('.medication-card, .appointment-card').forEach(card => {
        card.addEventListener('click', e => {
            if (e.target.classList.contains('edit-icon')) return;
            card.style.transform = 'scale(0.98)';
            setTimeout(() => card.style.transform = 'scale(1)', 150);
        });
    });

    document.querySelectorAll('.add-btn').forEach(btn => {
        btn.addEventListener('mouseenter', () => btn.style.transform = 'translateY(-2px)');
        btn.addEventListener('mouseleave', () => btn.style.transform = 'translateY(0)');
    });
});
