// Import Google APIs and load environment variables
const { google } = require('googleapis');
require('dotenv').config();

// Constants for Google Calendar
const CALENDAR_ID = 'primary'; // Use the user's primary calendar
const TIMEZONE = 'Asia/Singapore'; // Set timezone for events

// Create a global OAuth2 client for initial auth flows
const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.SECRET_ID,
  process.env.REDIRECT
);

// Helper: Create a new OAuth2 client and set credentials for API calls
function createOAuthClient(tokens) {
  const client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.SECRET_ID,
    process.env.REDIRECT
  );
  client.setCredentials(tokens); // Set user's tokens for authentication
  return client;
}

// Helper: Validate required fields for appointments before syncing
function validateAppointmentFields(body) {
  const requiredFields = ['Title', 'AppointmentDate', 'AppointmentTime'];
  for (const field of requiredFields) {
    if (!body[field]) return `Missing required field: ${field}`;
  }
  // Check if date and time are valid
  const date = new Date(`${body.AppointmentDate}T${body.AppointmentTime}`);
  if (isNaN(date.getTime())) return 'Invalid date or time format';
  return null;
}

// Step 1: Redirect user to Google OAuth consent screen
function loginWithGoogle(req, res) {
  // Generate Google OAuth URL for user login/consent
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/calendar'],
    prompt: 'consent'
  });
  res.redirect(url); // Redirect user to Google login
}

// Step 2: Handle Google OAuth callback and store tokens
async function handleCallback(req, res) {
  const code = req.query.code; // Authorization code from Google

  try {
    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    // Encode tokens and redirect to frontend with tokens in URL hash
    const encoded = encodeURIComponent(JSON.stringify(tokens));
    res.redirect(`/health.html#tokens=${encoded}`);
  } catch (err) {
    console.error('OAuth error:', err);
    res.status(500).send('Google authentication failed');
  }
}

// Step 3: Sync (create or update) an appointment with Google Calendar
async function syncAppointment(req, res) {
  // Extract tokens from request body
  const tokens = req.body.tokens;
  if (!tokens || !tokens.access_token) {
    return res.status(401).json({ error: 'Missing access token' });
  }

  // Validate required fields
  const validationError = validateAppointmentFields(req.body);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  // Destructure appointment details from request
  const {
    GoogleEventID,
    AppointmentID,
    Title,
    AppointmentDate,
    AppointmentTime,
    Location,
    DoctorName,
    Notes
  } = req.body;

  // Build start and end times for the event (30 min duration)
  const startDateTime = new Date(`${AppointmentDate}T${AppointmentTime}`);
  const endDateTime = new Date(startDateTime.getTime() + 30 * 60000);

  // Create authenticated Google Calendar client
  const auth = createOAuthClient(tokens);
  const calendar = google.calendar({ version: 'v3', auth });

  // Build event object for Google Calendar
  const event = {
    summary: Title,
    location: Location,
    description: Notes || '',
    start: { dateTime: startDateTime.toISOString(), timeZone: TIMEZONE },
    end: { dateTime: endDateTime.toISOString(), timeZone: TIMEZONE },
    extendedProperties: {
      private: {
        websiteAppointmentId: AppointmentID
      }
    }
  };

  try {
    // If GoogleEventID exists, update the event; otherwise, insert new event
    const result = GoogleEventID
      ? await calendar.events.update({
          calendarId: CALENDAR_ID,
          eventId: GoogleEventID,
          resource: event
        })
      : await calendar.events.insert({
          calendarId: CALENDAR_ID,
          resource: event
        });

    // Return event link and ID to frontend
    return res.json({
      message: 'Appointment synced',
      link: result.data.htmlLink,
      eventId: result.data.id
    });
  } catch (err) {
    console.error('Google Calendar sync failed:', err);
    return res.status(500).json({ error: 'Failed to sync appointment' });
  }
}

// Step 4: Edit an existing Google Calendar event for an appointment
async function editAppointment(req, res) {
  // Extract tokens and event ID
  const tokens = req.body.tokens;
  const eventId = req.params.eventId;

  if (!tokens || !tokens.access_token) {
    return res.status(401).json({ error: 'Missing access token' });
  }

  // Validate required fields
  const validationError = validateAppointmentFields(req.body);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  // Destructure updated appointment details
  const { Title, AppointmentDate, AppointmentTime, Location, DoctorName, Notes } = req.body;

  // Build new start and end times
  const startDateTime = new Date(`${AppointmentDate}T${AppointmentTime}`);
  const endDateTime = new Date(startDateTime.getTime() + 30 * 60000);

  // Create authenticated Google Calendar client
  const auth = createOAuthClient(tokens);
  const calendar = google.calendar({ version: 'v3', auth });

  // Build updated event object
  const updatedEvent = {
    summary: Title,
    location: Location,
    description: Notes || '',
    start: { dateTime: startDateTime.toISOString(), timeZone: TIMEZONE },
    end: { dateTime: endDateTime.toISOString(), timeZone: TIMEZONE }
  };

  try {
    // Update the event in Google Calendar
    const result = await calendar.events.update({
      calendarId: CALENDAR_ID,
      eventId,
      resource: updatedEvent
    });

    // Return updated event info
    return res.json({
      message: 'Appointment updated',
      link: result.data.htmlLink,
      eventId: result.data.id
    });
  } catch (err) {
    console.error('Google Calendar update failed:', err);
    return res.status(500).json({ error: 'Failed to update appointment' });
  }
}

// Step 5: Delete a Google Calendar event for an appointment
async function deleteAppointment(req, res) {
  const eventId = req.params.eventId; // Event ID to delete
  const { tokens } = req.body; // Destructure tokens from body

  if (!tokens || !tokens.access_token) {
    return res.status(401).json({ error: 'Missing access token' });
  }

  // Create authenticated Google Calendar client
  const auth = createOAuthClient(tokens);

  try {
    // Delete the event from Google Calendar
    const calendar = google.calendar({ version: 'v3', auth });
    await calendar.events.delete({
      calendarId: CALENDAR_ID,
      eventId
    });
    return res.json({ message: 'Appointment deleted' });
  } catch (err) {
    console.error('Google Calendar delete failed:', err);
    return res.status(500).json({ error: 'Failed to delete appointment' });
  }
}



module.exports = {
  loginWithGoogle,
  handleCallback,
  syncAppointment,
  editAppointment,
  deleteAppointment
};
