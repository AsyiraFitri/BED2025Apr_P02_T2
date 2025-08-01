// =============================
// Google Calendar integration logic for appointments
// Handles OAuth, syncing, and event CRUD for Google Calendar
// =============================
import { showToast, getAuthHeaders } from './health-utils.js';
import { updateAppointmentDisplay } from './appointment.js';

// Key used to store Google OAuth tokens in sessionStorage
// This allows us to persist the user's Google authentication across page reloads
const TOKEN_STORAGE_KEY = 'google_tokens';

// On page load, check if the URL hash contains Google OAuth tokens (after Google login)
// If so, decode and store them in sessionStorage for later API calls
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

// Show/hide Google Connect/Sync buttons and update hint text based on token presence
// Called on DOMContentLoaded and after OAuth
// Ensures the UI always reflects the user's Google authentication state
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

// Build the payload object for Google Calendar API calls
// Used by create/update Google event
// Accepts an appointment object, Google tokens, and optionally a GoogleEventID
// Returns a payload object matching the backend API requirements
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

// Create a new Google Calendar event for an appointment, or update if already synced
// If the appointment already has a GoogleEventID, this will update the event instead
// After creating a new event, updates the backend with the new GoogleEventID
// Returns the GoogleEventID on success, or null on failure
async function createGoogleEvent(appointment) {
    // 1. Get Google tokens from sessionStorage (must be present to sync)
    const tokensStr = sessionStorage.getItem(TOKEN_STORAGE_KEY);
    if (!tokensStr) {
        console.warn('No Google tokens found. Connect your account first.');
        return null;
    }
    const tokens = JSON.parse(tokensStr);

    // 2. If already synced, update the existing Google event instead of creating a new one
    if (appointment.GoogleEventID && appointment.GoogleEventID.trim() !== '') {
        console.log("googleEventId:", appointment.GoogleEventID);   
        console.log('Appointment already has GoogleEventID, updating existing event instead');
        return await updateGoogleEvent(appointment);
    }

    // 3. Build payload for Google event creation
    const payload = buildEventPayload(appointment, tokens);

    try {
        // 4. Call backend to create Google event
        const response = await fetch('/api/calendar/google/sync', {
            method: 'POST',
            headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify(payload)
        });

        // 5. Parse backend response
        const result = await response.json();
        if (!response.ok) {
            console.warn('Create Google event failed:', result.error);
            return null;
        }

        // 6. Update backend appointment with new GoogleEventID (so future updates work)
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

        // 7. Return the GoogleEventID for further use
        return result.eventId;
    } catch (err) {
        // 8. Handle network or API errors
        console.error('Error creating Google event:', err);
        return null;
    }
}

// Update an existing Google Calendar event for an appointment
// Requires a valid GoogleEventID and Google tokens
// Returns the GoogleEventID on success, or null on failure
async function updateGoogleEvent(appointment) {
    // 1. Ensure tokens are available in sessionStorage
    const tokensStr = sessionStorage.getItem(TOKEN_STORAGE_KEY);
    if (!tokensStr) {
        console.warn('No Google tokens found. Connect your account first.');
        return null;
    }
    // 2. Parse tokens from sessionStorage
    const tokens = JSON.parse(tokensStr);

    // 3. If no GoogleEventID, cannot update
    const googleEventId = appointment.GoogleEventID;
    if (!googleEventId) {
        console.warn('No GoogleEventID found for update.');
        return null;
    }

    // 4. Build the payload for updating the event
    const payload = buildEventPayload(appointment, tokens);

    // 5. Make the API call to update the Google Calendar event
    try {
        const response = await fetch(`/api/calendar/google/sync/${googleEventId}`, {
            method: 'PUT',
            headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify(payload)
        });

        // 6. Parse the response
        const result = await response.json(); 
        if (!response.ok) {
            console.warn('Update Google event failed:', result.error);
            return null;
        }

        // 7. Return the updated GoogleEventID
        return googleEventId;
    } catch (err) {
        // 8. Handle network or API errors
        console.error('Error updating Google event:', err);
        return null;
    }
}

// Delete a Google Calendar event for an appointment (if it exists)
// Requires a valid GoogleEventID and Google tokens
// Returns true on success, false on failure
async function deleteGoogleEvent(appointment) {
    // 1. Get Google tokens from sessionStorage
    const tokensStr = sessionStorage.getItem(TOKEN_STORAGE_KEY);
    if (!tokensStr) {
        console.warn('No Google tokens found. Connect your account first.');
        return false;
    }
    const tokens = JSON.parse(tokensStr);

    // 2. Get GoogleEventID from appointment
    const googleEventId = appointment.GoogleEventID;
    if (!googleEventId) {
        console.warn('No GoogleEventID found for deletion.');
        return false;
    }

    // 3. Make the API call to delete the Google Calendar event
    try {
        const response = await fetch(`/api/calendar/google/sync/${googleEventId}`, {
            method: 'DELETE',
            headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({ tokens: tokens })
        });

        // 4. Check if deletion was successful
        if (!response.ok) {
            const errText = await response.text();
            console.warn('Delete Google event failed:', errText);
            return false;
        }

        // 5. Log and return success
        console.log('Google event deleted successfully:', googleEventId);
        return true;
    } catch (err) {
        // 6. Handle network or API errors
        console.error('Error deleting Google event:', err);
        return false;
    }
}


// Sync all appointments: create or update events on Google Calendar for all appointments
// Loops through all appointments and ensures each is synced to Google Calendar
// Shows a toast on completion
async function syncAllAppointments() {
    // 1. Get Google tokens from sessionStorage
    const tokensStr = sessionStorage.getItem(TOKEN_STORAGE_KEY);
    if (!tokensStr) {
        console.warn('No Google tokens found. Connect your account first.');
        return;
    }

    // 2. Fetch and update UI, returns appointment array
    const appointments = await updateAppointmentDisplay();

    // 3. If no appointments, nothing to sync
    if (!appointments?.length) {
        console.warn('No appointments available to sync.');
        return;
    }

    // 4. Loop through all appointments and sync each one
    for (const appointment of appointments) {
        if (appointment.GoogleEventID) {
            // If already synced, update the event
            await updateGoogleEvent(appointment);
        } else {
            // If not yet synced, create a new event
            await createGoogleEvent(appointment);
        }
    }

    // 5. Show a toast to inform the user
    showToast('All appointments synced to Google Calendar successfully', 'success');
}

// Google Calendar event listener setup
// On DOM load, set up Google Calendar button states and event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Update the UI to reflect Google authentication state
    updateGoogleCalendarButtons();

    // Connect Google button: triggers OAuth flow to get tokens
    const connectBtn = document.getElementById('connectGoogleBtn');
    if (connectBtn) {
        connectBtn.addEventListener('click', () => {
            // Redirect to backend endpoint to start Google OAuth
            window.location.href = '/api/calendar/auth/google';
        });
    }

    // Sync button: syncs all appointments to Google Calendar
    const syncBtn = document.getElementById('syncGoogleBtn');
    if (syncBtn) {
        syncBtn.addEventListener('click', async () => {
            // Check for tokens before syncing
            const tokensStr = sessionStorage.getItem(TOKEN_STORAGE_KEY);
            if (!tokensStr) {
                showToast('Please connect your Google account first.', 'error');
                return;
            }

            try {
                // Sync all appointments to Google Calendar
                await syncAllAppointments();
            } catch (err) {
                // Handle errors and show user feedback
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
