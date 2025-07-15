function showToast(message, type = 'success') {
    const toastEl = document.getElementById('actionToast');
    const toastMsg = document.getElementById('toastMessage');

    toastMsg.textContent = message;

    // Clear previous bg classes
    toastEl.classList.remove('bg-success', 'bg-danger', 'bg-warning', 'bg-info');

    // Add class based on type
    toastEl.classList.add(`bg-${type}`);

    const toast = new bootstrap.Toast(toastEl);
    toast.show();
}

let pendingDeleteType = null; // e.g., 'medication' or 'appointment'

function showDeleteModal(id, type) {
    pendingDeleteType = type; // remember what type we are deleting
        if (type === 'appointment') {
        pendingDeleteAppointmentId = id;
    } else if (type === 'medication') {
        pendingDeleteMedicationId = id;
    }

    const modal = new bootstrap.Modal(document.getElementById('confirmDeleteModal'));

    // Change modal body text dynamically
    const modalBody = document.querySelector('#confirmDeleteModal .modal-body');
    modalBody.textContent = `Are you sure you want to delete this ${type}?`;

    modal.show();
}


function showSaveFeedback(selector) {
    const button = document.querySelector(selector);
    button.classList.add('btn-success');
    button.textContent = 'Saved!';
    button.blur();  // remove focus here
    setTimeout(() => {
        button.classList.remove('btn-success');
        button.textContent = 'Save';
    }, 2000);
}

function getAuthToken() {
  return sessionStorage.getItem('token');
}

function getAuthHeaders(additionalHeaders = {}) {
  const token = getAuthToken();
  return {
    Authorization: token ? `Bearer ${token}` : '',
    ...additionalHeaders // Merge with any additional headers
  };
}


