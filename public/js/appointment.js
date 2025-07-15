

// Update display with appointments and attach event listeners after creating cards
async function updateAppointmentDisplay() {
    try {
        const user = JSON.parse(sessionStorage.getItem('user'));
        const res = await fetch(`/api/appointments/user/${user.UserID}`, {
            headers: getAuthHeaders()
        });
        const appointments = await res.json();

        const container = document.getElementById('appointmentContainer');
        container.innerHTML = '';
        

        if (Array.isArray(appointments)) {
            appointments.forEach(app => {
                const card = createAppointmentCard(app.AppointmentID, app);

                container.appendChild(card);
                attachCardEventListeners(card);
            });
        } else if (appointments?.AppointmentID) {
            const card = createAppointmentCard(appointments.AppointmentID, appointments);
            container.appendChild(card);
            attachCardEventListeners(card);
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
        <div class="d-flex justify-content-between align-items-start mb-2">
            <div class="edit-icon-container" style="cursor:pointer;">
                <i class="fas fa-edit edit-icon me-1"></i><span> Edit</span>
            </div>
            <i class="fas fa-trash-alt delete-icon" style="cursor:pointer;"></i>
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

// Attach listeners to edit and delete icons inside each card
function attachCardEventListeners(card) {
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
            showDeleteModal(id, 'appointment');
        });
    }
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
        const res = await fetch(`/api/appointments/${id}`, {
            headers: getAuthHeaders()
        });
        if (!res.ok) throw new Error();
        const app = await res.json();

        document.getElementById('editAppointmentDate').value = new Date(app.AppointmentDate).toISOString().split('T')[0];
        document.getElementById('editAppointmentTime').value = app.AppointmentTime.slice(0, 5);
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

let pendingDeleteAppointmentId = null;
async function handleAppointmentsDeleteConfirmation() {
    
    if (!pendingDeleteAppointmentId) return;

    const modalElement = document.getElementById('confirmDeleteModal');
    const modal = bootstrap.Modal.getInstance(modalElement);

    try {
        const res = await fetch(`/api/appointments/${pendingDeleteAppointmentId}`, {
            method: 'DELETE',
            headers: getAuthHeaders({ 'Content-Type': 'application/json' })
        });
        if (!res.ok) throw new Error();

        await updateAppointmentDisplay();
        showToast('Appointment deleted successfully');
    } catch {
        alert('Error deleting appointment');
    } finally {
        pendingDeleteAppointmentId = null;
        if (modal) modal.hide();
    }
}

async function handleAppointmentFormSubmit(e) {
    e.preventDefault();
    const user = JSON.parse(sessionStorage.getItem('user'));
    const data = {
        AppointmentDate: document.getElementById('editAppointmentDate').value,
        AppointmentTime: document.getElementById('editAppointmentTime').value,
        Title: document.getElementById('editAppointmentTitle').value,
        Location: document.getElementById('editAppointmentLocation').value,
        DoctorName: document.getElementById('editDoctorName').value,
        Notes: document.getElementById('editAppointmentNotes').value || 'No special instructions',
        UserID: user.UserID
    };

    try {
        const res = await fetch(currentEditingAppointmentId === 'new' ? '/api/appointments' : `/api/appointments/${currentEditingAppointmentId}`, {
            method: currentEditingAppointmentId === 'new' ? 'POST' : 'PUT',
            headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify(data)
        });

        if (!res.ok) throw new Error();

        await updateAppointmentDisplay();

        const modal = bootstrap.Modal.getInstance(document.getElementById('appointmentModal'));
        if (modal) modal.hide();

        showSaveFeedback('#appointmentForm .btn-confirm');

        const action = currentEditingAppointmentId === 'new' ? 'added' : 'updated';
        currentEditingAppointmentId = null;
        showToast(`Appointment ${action} successfully`);

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

function extractTimeFromUTC(dateTimeString) {
    const dateObj = new Date(dateTimeString);
    const localHour = String(dateObj.getHours()).padStart(2, '0');
    const localMinute = String(dateObj.getMinutes()).padStart(2, '0');
    return `${localHour}:${localMinute}`;
}

function formatTime(timeStr) {
    if (!timeStr) return 'Invalid time';

    const [hour, minute] = timeStr.split(':');
    const h = parseInt(hour);
    const m = minute.padStart(2, '0'); 

    const isPM = h >= 12;
    const displayHour = h % 12 === 0 ? 12 : h % 12;

    return `${displayHour}:${m} ${isPM ? 'PM' : 'AM'}`;
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

// Initialize appointment display and add new appointment button listener
document.addEventListener('DOMContentLoaded', () => {
    updateAppointmentDisplay();

    const addBtn = document.getElementById('addAppointmentBtn');
    if (addBtn) {
        addBtn.addEventListener('click', addNewAppointment);
    }

    // Delete confirm button in the modal
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', handleAppointmentsDeleteConfirmation);
    }
});

// Fix for Bootstrap modals not removing focus from active elements (remove aria-hidden focus warning)
const appointmentModalIds = ['appointmentModal', 'appointmentModalLabel', 'confirmDeleteModal'];
appointmentModalIds.forEach(id => {
    const modal = document.getElementById(id);
    if (modal) {
        modal.addEventListener('hide.bs.modal', () => {
            setTimeout(() => {
                const active = document.activeElement;
                if (active && modal.contains(active)) {
                    active.blur();

                    // Optional: move focus to a safe location
                    const safeFocusTarget = document.getElementById('addAppointmentBtn') || document.body;
                    safeFocusTarget.focus();
                }
            }, 0); // Defer until after Bootstrap starts hiding
        });
    }
});