let currentEditingAppointmentId = null;

async function updateAppointmentDisplay() {
    try {
        const res = await fetch('/api/appointments/user/1');
        const appointments = await res.json();

        const container = document.getElementById('appointmentContainer');
        container.innerHTML = '';

        if (Array.isArray(appointments)) {
            appointments.forEach(app => {
                container.appendChild(createAppointmentCard(app.AppointmentID, app));
            });
        } else if (appointments?.AppointmentID) {
            container.appendChild(createAppointmentCard(appointments.AppointmentID, appointments));
        } else {
            container.innerHTML = '<p class="text-danger">No appointment data found.</p>';
        }
    } catch {
        document.getElementById('appointmentContainer').innerHTML = '<p class="text-danger">Failed to load appointments.</p>';
    }
}

function createAppointmentCard(id, appointment) {
    const card = document.createElement('div');
    card.className = 'appointment-card';
    card.dataset.appointmentId = id;

    card.innerHTML = `
        <div class="icon-container">
            <i class="fas fa-edit edit-icon" onclick="editAppointment(${id})"></i>
            <i class="fas fa-trash-alt delete-icon" onclick="deleteAppointment(${id})"></i>
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

    card.addEventListener('click', () => {
        document.querySelectorAll('.appointment-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
    });

    return card;
}

function addNewAppointment() {
    currentEditingAppointmentId = 'new';
    document.getElementById('appointmentForm').reset();
    document.getElementById('appointmentModalLabel').textContent = 'Add New Appointment';
    new bootstrap.Modal(document.getElementById('appointmentModal')).show();
}

async function editAppointment(id) {
    currentEditingAppointmentId = id;
    try {
        const res = await fetch(`/api/appointments/${id}`);
        if (!res.ok) throw new Error();
        const app = await res.json();

        document.getElementById('editAppointmentDate').value = new Date(app.AppointmentDate).toISOString().split('T')[0];
        document.getElementById('editAppointmentTime').value = new Date(app.AppointmentTime).toISOString().substring(11, 16);
        document.getElementById('editAppointmentTitle').value = app.Title;
        document.getElementById('editAppointmentLocation').value = app.Location;
        document.getElementById('editDoctorName').value = app.DoctorName;
        document.getElementById('editAppointmentNotes').value = app.Notes || '';

        document.getElementById('appointmentModalLabel').textContent = 'Edit Appointment Details';
        new bootstrap.Modal(document.getElementById('appointmentModal')).show();

        document.querySelectorAll('.appointment-card').forEach(c => c.classList.remove('selected'));
        document.querySelector(`[data-appointment-id="${id}"]`).classList.add('selected');
    } catch {
        alert('Failed to load appointment data');
    }
}

async function deleteAppointment(id) {
    if (!confirm('Are you sure you want to delete this appointment?')) return;
    try {
        const res = await fetch(`/api/appointments/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error();
        await updateAppointmentDisplay();
    } catch {
        alert('Error deleting appointment');
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
        Notes: document.getElementById('editAppointmentNotes').value || 'No special instructions',
        UserID: 1
    };

    try {
        const res = await fetch(currentEditingAppointmentId === 'new' ? '/api/appointments' : `/api/appointments/${currentEditingAppointmentId}`, {
            method: currentEditingAppointmentId === 'new' ? 'POST' : 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!res.ok) throw new Error();

        await updateAppointmentDisplay();

        const modal = bootstrap.Modal.getInstance(document.getElementById('appointmentModal'));
        if (modal) modal.hide();

        currentEditingAppointmentId = null;
        showSaveFeedback('#appointmentForm .btn-confirm');
    } catch {
        alert('Error saving appointment');
    }
}

// Format date and time for display e.g. "Mon, 1 Jan"
function formatDate(dateStr) {
    const options = { weekday: 'short', day: 'numeric', month: 'short' };
    const date = new Date(dateStr);
    if (isNaN(date)) return 'Invalid Date'; // fallback for broken parsing

    return date.toLocaleDateString(undefined, options);
}

// Format time for display e.g. "2:30 PM"
function formatTime(timeStr) {
    if (!timeStr) return 'Invalid time';

    const date = new Date(timeStr);
    if (isNaN(date)) return 'Invalid time';

    return date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true // or false for 24-hour format
    });
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

document.getElementById('appointmentForm').addEventListener('submit', handleAppointmentFormSubmit);
document.getElementById('appointmentModal').addEventListener('hidden.bs.modal', () => {
    currentEditingAppointmentId = null;
    document.getElementById('appointmentForm').reset();
    document.querySelectorAll('.appointment-card').forEach(c => c.classList.remove('selected'));
});

// Initialize appointment display
document.addEventListener('DOMContentLoaded', () => {
    updateAppointmentDisplay();
    document.getElementById('addAppointmentButton').addEventListener('click', addNewAppointment);
});



