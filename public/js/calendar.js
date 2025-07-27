import { showToast, getAuthHeaders } from './health-utils.js';
import { updateAppointmentDisplay } from './appointment.js';

const TOKEN_STORAGE_KEY = 'google_tokens';

// Extract and store Google OAuth tokens from URL hash (if any)
(function initGoogleTokensFromHash() {
    const hash = window.location.hash.substr(1);
    const tokensEncoded = new URLSearchParams(hash).get('tokens');
    if (!tokensEncoded) return;

    try {
        const tokens = JSON.parse(decodeURIComponent(tokensEncoded));
        sessionStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(tokens));
    } catch (err) {
        console.error('Invalid token format in URL hash:', err);
    }
})();

// Update Google Connect and Sync buttons based on token presence
function updateGoogleCalendarButtons() {
    const tokens = sessionStorage.getItem(TOKEN_STORAGE_KEY);
    const connectBtn = document.getElementById('connectGoogleBtn');
    const syncBtn = document.getElementById('syncGoogleBtn');
    const hint = document.getElementById('googleButtonHint');

    if (tokens) {
        connectBtn.style.display = 'none';
        syncBtn.style.display = 'inline-block';
        syncBtn.disabled = false;
        hint.textContent = 'You are connected! You can sync your appointments now.';
    } else {
        connectBtn.style.display = 'inline-block';
        syncBtn.style.display = 'inline-block';
        syncBtn.disabled = true;
        hint.textContent = 'Please connect your Google Calendar first.';
    }
}

// Prepare payload for backend Google Calendar API calls
function buildEventPayload(appointment, tokens, googleEventId = null) {
    return {
        tokens: tokens,
        GoogleEventID: googleEventId !== null ? googleEventId : appointment.GoogleEventID || null,
        AppointmentID: appointment.AppointmentID,
        Title: appointment.Title,
        AppointmentDate: new Date(appointment.AppointmentDate).toISOString().split('T')[0], // YYYY-MM-DD
        AppointmentTime: appointment.AppointmentTime,
        Location: appointment.Location,
        DoctorName: appointment.DoctorName,
        Notes: appointment.Notes || 'No special instructions',
        UserID: appointment.UserID, // Ensure UserID is included
    };
}

// Create new Google event and update backend with event ID
async function createGoogleEvent(appointment) {
    const tokensStr = sessionStorage.getItem(TOKEN_STORAGE_KEY);
    if (!tokensStr) {
        console.warn('No Google tokens found. Connect your account first.');
        return null;
    }
    const tokens = JSON.parse(tokensStr);

    // Check if appointment already has a GoogleEventID (already synced)
    if (appointment.GoogleEventID && appointment.GoogleEventID.trim() !== '') {
        console.log("googleEventId:", appointment.GoogleEventID);   
        console.log('Appointment already has GoogleEventID, updating existing event instead');
        return await updateGoogleEvent(appointment);
    }

    const payload = buildEventPayload(appointment, tokens);

    try {
        const response = await fetch('/google/sync', {
            method: 'POST',
            headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        if (!response.ok) {
            console.warn('Create Google event failed:', result.error);
            return null;
        }

        // Update backend with new GoogleEventID
        const updatePayload = buildEventPayload(appointment, tokens, result.eventId);

        const updateResponse = await fetch(`/api/appointments/${appointment.AppointmentID}`, {
            method: 'PUT',
            headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify(updatePayload)
        });

        if (!updateResponse.ok) {
            const errText = await updateResponse.text();
            console.warn('Failed to update appointment with GoogleEventID:', errText);
        } else {
            appointment.GoogleEventID = result.eventId;
        }

        return result.eventId;
    } catch (err) {
        console.error('Error creating Google event:', err);
        return null;
    }
}

// Update existing Google event by event ID
async function updateGoogleEvent(appointment) {
    const tokensStr = sessionStorage.getItem(TOKEN_STORAGE_KEY);
    if (!tokensStr) {
        console.warn('No Google tokens found. Connect your account first.');
        return null;
    }
    const tokens = JSON.parse(tokensStr);

    const googleEventId = appointment.GoogleEventID;
    if (!googleEventId) {
        console.warn('No GoogleEventID found for update.');
        return null;
    }

    const payload = buildEventPayload(appointment, tokens);

    try {
        const response = await fetch(`/google/sync/${googleEventId}`, {
            method: 'PUT',
            headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify(payload)
        });

        console.log("google event id:", googleEventId);
        const result = await response.json();
        if (!response.ok) {
            console.warn('Update Google event failed:', result.error);
            return null;
        }

        return googleEventId;
    } catch (err) {
        console.error('Error updating Google event:', err);
        return null;
    }
}

async function deleteGoogleEvent(appointment) {
    const tokensStr = sessionStorage.getItem(TOKEN_STORAGE_KEY);
    if (!tokensStr) {
        console.warn('No Google tokens found. Connect your account first.');
        return false;
    }
    const tokens = JSON.parse(tokensStr);

    const googleEventId = appointment.GoogleEventID;
    if (!googleEventId) {
        console.warn('No GoogleEventID found for deletion.');
        return false;
    }

    try {
        const response = await fetch(`/google/sync/${googleEventId}`, {
            method: 'DELETE',
            headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({ tokens: tokens })
        });

        if (!response.ok) {
            const errText = await response.text();
            console.warn('Delete Google event failed:', errText);
            return false;
        }

        console.log('Google event deleted successfully:', googleEventId);
        return true;
    } catch (err) {
        console.error('Error deleting Google event:', err);
        return false;
    }
}


// Sync all appointments: create or update events on Google Calendar
async function syncAllAppointments() {
    const tokensStr = sessionStorage.getItem(TOKEN_STORAGE_KEY);
    if (!tokensStr) {
        console.warn('No Google tokens found. Connect your account first.');
        return;
    }

    // Fetch and update UI, returns appointment array
    const appointments = await updateAppointmentDisplay();

    if (!appointments?.length) {
        console.warn('No appointments available to sync.');
        return;
    }

    for (const appointment of appointments) {
        if (appointment.GoogleEventID) {
            await updateGoogleEvent(appointment);
        } else {
            await createGoogleEvent(appointment);
        }
    }

    showToast('All appointments synced to Google Calendar successfully', 'success');
}

// Google Calendar event listener
document.addEventListener('DOMContentLoaded', () => {
    updateGoogleCalendarButtons();

    // Add click listener to connect button
    const connectBtn = document.getElementById('connectGoogleBtn');
    if (connectBtn) {
        connectBtn.addEventListener('click', () => {
            window.location.href = '/auth/google';
        });
    }

    // Add click listener to sync button
    const syncBtn = document.getElementById('syncGoogleBtn');
    if (syncBtn) {
        syncBtn.addEventListener('click', async () => {
            const tokensStr = sessionStorage.getItem(TOKEN_STORAGE_KEY);
            if (!tokensStr) {
                showToast('Please connect your Google account first.', 'error');
                return;
            }

            try {
                await syncAllAppointments();
            } catch (err) {
                console.error('Error syncing appointments:', err);
                showToast('Failed to sync appointments', 'error');
            }
        });
    }   
});

export {
    createGoogleEvent,
    updateGoogleEvent,
    deleteGoogleEvent,
    syncAllAppointments,
    updateGoogleCalendarButtons
};
