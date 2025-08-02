// =============================
// Google Calendar service for syncing appointments (Node.js backend)
// Handles OAuth2, event CRUD, and validation for Google Calendar API
// =============================

// Import Google APIs client library
const { google } = require('googleapis');
// Load environment variables from .env file (for Google API credentials)
require('dotenv').config();

// Use the user's primary calendar ("primary") and Singapore timezone for all events
const CALENDAR_ID = 'primary';
const TIMEZONE = 'Asia/Singapore';

// Main OAuth2 client for Google API (used for login and token exchange)
const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID, // Google OAuth client ID
  process.env.SECRET_ID, // Google OAuth client secret
  process.env.REDIRECT   // Redirect URI after login
);

// Helper: create a new OAuth2 client and set credentials from tokens
// Used for making authenticated API calls on behalf of the user
// tokens: { access_token, refresh_token, ... }
function createOAuthClient(tokens) {
  const client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.SECRET_ID,
    process.env.REDIRECT
  );
  client.setCredentials(tokens); // Attach user's tokens to the client
  return client;
}

// Helper: validate required fields for appointments
// Returns error string if invalid, otherwise null
// Ensures that all required fields are present and the date/time is valid
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

// Redirect user to Google OAuth login page
// Initiates the OAuth2 flow for Google Calendar access
// Redirects the user to Google's consent screen
function loginWithGoogle(req, res) {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline', // Request refresh token for long-term access
    scope: ['https://www.googleapis.com/auth/calendar'], // Calendar access scope
    prompt: 'consent' // Always show consent screen
  });
  res.redirect(url); // Redirect user to Google login
}

// Handle Google OAuth callback and redirect to frontend with tokens
// Exchanges the authorization code for access/refresh tokens
// Redirects to frontend with tokens in URL hash for client-side storage
async function handleCallback(req, res) {
  const code = req.query.code; // Authorization code from Google
  try {
    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    // Encode tokens and redirect to frontend (health.html)
    const encoded = encodeURIComponent(JSON.stringify(tokens));
    res.redirect(`/health.html#tokens=${encoded}`);
  } catch (err) {
    // Handle OAuth errors
    console.error('OAuth error:', err);
    res.status(500).send('Google authentication failed');
  }
}

// Sync (create or update) an appointment to Google Calendar
// If GoogleEventID exists, update; else, create new event
// Handles both creation and update in a single endpoint for convenience
async function syncAppointment(req, res) {
  // 1. Extract Google tokens from request body
  const tokens = req.body.tokens;
  if (!tokens || !tokens.access_token) {
    // User is not authenticated with Google
    return res.status(401).json({ error: 'Missing access token' });
  }

  // 2. Validate required appointment fields
  const validationError = validateAppointmentFields(req.body);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  // 3. Destructure appointment data from request body
  const {
    GoogleEventID, // If present, update this event; else, create new
    AppointmentID,
    Title,
    AppointmentDate,
    AppointmentTime,
    Location,
    DoctorName,
    Notes
  } = req.body;

  // 4. Set up event start/end times (30 min duration)
  const startDateTime = new Date(`${AppointmentDate}T${AppointmentTime}`);
  const endDateTime = new Date(startDateTime.getTime() + 30 * 60000); // 30 minutes later

  // 5. Create a new OAuth2 client with tokens to access Google Calendar
  const auth = createOAuthClient(tokens); 
  const calendar = google.calendar({ version: 'v3', auth }); // Initialize calendar API

  // 6. Build the event object for Google Calendar
  const event = {
    summary: Title, // Event title
    location: Location, // Event location
    description: Notes || '', // Event notes/description
    start: { dateTime: startDateTime.toISOString(), timeZone: TIMEZONE },
    end: { dateTime: endDateTime.toISOString(), timeZone: TIMEZONE },
    extendedProperties: {
      private: {
        websiteAppointmentId: AppointmentID // Custom property for cross-referencing
      }
    }
  };

  try {
    // 7. If GoogleEventID exists in request body from frontend, update; else, insert new event
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

    // 8. Respond with event link and ID for frontend to store
    return res.json({
      message: 'Appointment synced',
      link: result.data.htmlLink, // Google Calendar event link
      eventId: result.data.id     // Google Calendar event ID
    });
  } catch (err) {
    // 9. Handle Google Calendar API errors
    console.error('Google Calendar sync failed:', err);
    return res.status(500).json({ error: 'Failed to sync appointment' });
  }
}

// Update an existing Google Calendar event for an appointment
// Used when the frontend wants to update an event by eventId
// Requires valid tokens and eventId in the URL
async function editAppointment(req, res) {
  const tokens = req.body.tokens; // Google tokens from request body
  const eventId = req.params.eventId; // Google Calendar event ID from URL

  // 1. Ensure tokens are provided
  if (!tokens || !tokens.access_token) {
    return res.status(401).json({ error: 'Missing access token' });
  }

  // 2. Validate required fields
  const validationError = validateAppointmentFields(req.body);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  // 3. Destructure appointment data from request body
  const { Title, AppointmentDate, AppointmentTime, Location, DoctorName, Notes } = req.body;

  // 4. Set up event start/end times (30 min duration)
  const startDateTime = new Date(`${AppointmentDate}T${AppointmentTime}`);
  const endDateTime = new Date(startDateTime.getTime() + 30 * 60000);

  // 5. Create a new OAuth2 client with tokens to update the event
  const auth = createOAuthClient(tokens);
  const calendar = google.calendar({ version: 'v3', auth });

  // 6. Build the updated event object
  const updatedEvent = {
    summary: Title,
    location: Location,
    description: Notes || '',
    start: { dateTime: startDateTime.toISOString(), timeZone: TIMEZONE },
    end: { dateTime: endDateTime.toISOString(), timeZone: TIMEZONE }
  };

  try {
    // 7. Update the event in Google Calendar
    const result = await calendar.events.update({
      calendarId: CALENDAR_ID, 
      eventId,
      resource: updatedEvent
    });

    // 8. Respond with updated event link and ID
    return res.json({
      message: 'Appointment updated',
      link: result.data.htmlLink,
      eventId: result.data.id
    });
  } catch (err) {
    // 9. Handle Google Calendar API errors
    console.error('Google Calendar update failed:', err);
    return res.status(500).json({ error: 'Failed to update appointment' });
  }
}

// Delete a Google Calendar event for an appointment
// Used when the frontend wants to remove an event by eventId
// Requires valid tokens and eventId in the URL
async function deleteAppointment(req, res) {
  const eventId = req.params.eventId; // Google Calendar event ID from URL
  const { tokens } = req.body; // Google tokens from request body

  // 1. Ensure tokens are provided
  if (!tokens || !tokens.access_token) {
    return res.status(401).json({ error: 'Missing access token' });
  }

  // 2. Create OAuth2 client for this user
  const auth = createOAuthClient(tokens);

  try {
    // 3. Initialize calendar API and delete the event
    const calendar = google.calendar({ version: 'v3', auth });
    await calendar.events.delete({
      calendarId: CALENDAR_ID,
      eventId
    });
    // 4. Respond with success message
    return res.json({ message: 'Appointment deleted' });
  } catch (err) {
    // 5. Handle Google Calendar API errors
    console.error('Google Calendar delete failed:', err);
    return res.status(500).json({ error: 'Failed to delete appointment' });
  }
}

// Export all service functions for use in Express routes
module.exports = {
  loginWithGoogle,    // Redirects to Google login
  handleCallback,     // Handles OAuth callback
  syncAppointment,    // Create or update event
  editAppointment,    // Update event by ID
  deleteAppointment   // Delete event by ID
};
