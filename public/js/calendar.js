import { showToast, getAuthHeaders } from './health-utils.js';
import { updateAppointmentDisplay } from './appointment.js';

// On page load, check if redirected back from Google OAuth with tokens in URL hash
const hash = window.location.hash.substr(1);
const tokensEncoded = new URLSearchParams(hash).get("tokens");

if (tokensEncoded) {
  try {
    const tokens = JSON.parse(decodeURIComponent(tokensEncoded));
    sessionStorage.setItem("google_tokens", JSON.stringify(tokens));
    updateGoogleCalendarButtons();
  } catch (err) {
    console.error("Invalid token format:", err);
  }
  updateGoogleCalendarButtons();
}

function updateGoogleCalendarButtons() {
  const tokens = sessionStorage.getItem("google_tokens");
  const connectBtn = document.getElementById("connectGoogleBtn");
  const syncBtn = document.getElementById("syncGoogleBtn");
  const hint = document.getElementById("googleButtonHint");

  if (tokens) {
    connectBtn.style.display = "none";
    syncBtn.style.display = "inline-block";
    syncBtn.disabled = false;
    hint.textContent = "You are connected! You can sync your appointments now.";
  } else {
    connectBtn.style.display = "inline-block";
    syncBtn.style.display = "inline-block";
    syncBtn.disabled = true;
    hint.textContent = "Please connect your Google Calendar first.";
  }
}

// Create new Google Calendar event
async function createGoogleEvent(appointment, tokens) {
  try {
    const response = await fetch('/google/sync', {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        tokens,
        appointmentId: appointment.AppointmentID,
        title: appointment.Title,
        date: new Date(appointment.AppointmentDate).toISOString().split('T')[0],
        time: appointment.AppointmentTime,
        location: appointment.Location,
        notes: appointment.Notes
      })
    });

    const result = await response.json();
    if (!response.ok) {
      console.warn('Create Google event failed:', result.error);
      return null;
    }

    console.log(`Created Google event for "${appointment.Title}", eventID: ${result.eventID}`);

    // Update backend with new GoogleEventID
    const updateResponse = await fetch(`/api/appointments/${appointment.AppointmentID}`, {
      method: 'PUT',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ GoogleEventID: result.eventID })
    });

    if (!updateResponse.ok) {
      const err = await updateResponse.text();
      console.warn(`Failed to update appointment with GoogleEventID: ${err}`);
    } else {
      appointment.GoogleEventID = result.eventID;
    }

    return result.eventID;

  } catch (err) {
    console.error('Create Google event error:', err);
    return null;
  }
}

// Update existing Google Calendar event
async function updateGoogleEvent(appointment, tokens) {
  if (!appointment.GoogleEventID) {
    console.warn('No GoogleEventID to update.');
    return null;
  }

  try {
    const response = await fetch(`/google/sync/${appointment.GoogleEventID}`, {
      method: 'PUT',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        tokens,
        googleEventId: appointment.GoogleEventID,
        appointmentId: appointment.AppointmentID,
        title: appointment.Title,
        date: new Date(appointment.AppointmentDate).toISOString().split('T')[0],
        time: appointment.AppointmentTime,
        location: appointment.Location,
        notes: appointment.Notes
      })
    });

    const result = await response.json();

    if (!response.ok) {
      console.warn('Update Google event failed:', result.error);
      return null;
    }

    console.log(`Updated Google event for "${appointment.Title}", eventID: ${appointment.GoogleEventID}`);

    return appointment.GoogleEventID;

  } catch (err) {
    console.error('Update Google event error:', err);
    return null;
  }
}

// Delete Google Calendar event by event ID
async function deleteGoogleEvent(googleEventId, tokens) {
  if (!googleEventId) {
    console.warn('No GoogleEventID provided for deletion');
    return false;
  }

  try {
    const response = await fetch(`/google/sync/${googleEventId}`, {
      method: 'DELETE',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' })
    });

    if (!response.ok) {
      const result = await response.json();
      console.warn('Delete Google event failed:', result.error);
      return false;
    }

    console.log(`Deleted Google event with ID: ${googleEventId}`);
    return true;

  } catch (err) {
    console.error('Google event deletion failed:', err);
    return false;
  }
}

async function syncAllAppointments() {
  const tokens = JSON.parse(sessionStorage.getItem("google_tokens"));
  if (!tokens) {
    console.warn('No Google tokens found. Please connect your account.');
    return;
  }

  const appointments = await updateAppointmentDisplay();
  if (!appointments || appointments.length === 0) {
    console.warn('No appointments to sync.');
    return;
  }

  for (const appointment of appointments) {
    if (appointment.GoogleEventID) {
      await updateGoogleEvent(appointment, tokens);
    } else {
      await createGoogleEvent(appointment, tokens);
    }
  }

  showToast('All appointments synced to Google Calendar successfully', 'success');
}

export {
  createGoogleEvent,
  updateGoogleEvent,
  deleteGoogleEvent,
  syncAllAppointments,
  updateGoogleCalendarButtons
};
