const { google } = require('googleapis');
const { googleCalendarAsyncHandler, formatCalendarEventData } = require('../middlewares/validateCalendar');
require('dotenv').config();

// CALENDAR CONTROLLER - Business logic layer for Google Calendar operations
// All functions are wrapped with googleCalendarAsyncHandler for automatic error handling
// Google Calendar authentication and event data come from middleware

const CALENDAR_ID = 'primary';
const TIMEZONE = 'Asia/Singapore';

const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.SECRET_ID,
  process.env.REDIRECT
);

// Create new OAuth client and set credentials
function createOAuthClient(tokens) {
  const client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.SECRET_ID,
    process.env.REDIRECT
  );
  // Set the OAuth credentials for API calls
  client.setCredentials(tokens);
  return client;
}

// Validate required fields for appointments
function validateAppointmentFields(body) {
  const requiredFields = ['Title', 'AppointmentDate', 'AppointmentTime'];
  for (const field of requiredFields) {
    if (!body[field]) return `Missing required field: ${field}`;
  }
  // Validate date/time format
  const date = new Date(`${body.AppointmentDate}T${body.AppointmentTime}`);
  if (isNaN(date.getTime())) return 'Invalid date or time format';
  return null;
}

// Initiate Google OAuth login flow
function loginWithGoogle(req, res) {
  // Generate OAuth URL with required scopes and permissions
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',    // Request refresh token
    scope: ['https://www.googleapis.com/auth/calendar'], // Calendar access
    prompt: 'consent'          // Force consent screen
  });
  
  // Redirect user to Google OAuth page
  res.redirect(url);
}

// Handle OAuth callback and exchange code for tokens
const handleCallback = googleCalendarAsyncHandler(async (req, res) => {
  // Extract authorization code from callback URL
  const code = req.query.code;

  // Exchange authorization code for access/refresh tokens
  const { tokens } = await oauth2Client.getToken(code);
  
  // Encode tokens and redirect back to frontend with tokens in URL hash
  const encoded = encodeURIComponent(JSON.stringify(tokens));
  res.redirect(`/health.html#tokens=${encoded}`);
});

// Sync appointment to Google Calendar (create or update event)
const syncAppointment = googleCalendarAsyncHandler(async (req, res) => {
  // Extract tokens from request body
  const tokens = req.body.tokens;
  if (!tokens || !tokens.access_token) {
    return res.status(401).json({ error: 'Missing access token' });
  }

  // Validate appointment data
  const validationError = validateAppointmentFields(req.body);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  // Extract appointment details from request body
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

  // Create start and end datetime objects (30 minute duration)
  const startDateTime = new Date(`${AppointmentDate}T${AppointmentTime}`);
  const endDateTime = new Date(startDateTime.getTime() + 30 * 60000);

  // Create authenticated Google Calendar client
  const auth = createOAuthClient(tokens);
  const calendar = google.calendar({ version: 'v3', auth });

  // Build Google Calendar event object
  const event = {
    summary: Title,                           // Event title
    location: Location,                       // Event location
    description: Notes || '',                 // Event description
    start: { 
      dateTime: startDateTime.toISOString(), 
      timeZone: TIMEZONE 
    },
    end: { 
      dateTime: endDateTime.toISOString(), 
      timeZone: TIMEZONE 
    },
    extendedProperties: {
      private: {
        websiteAppointmentId: AppointmentID   // Link back to our database
      }
    }
  };

  // Either update existing event or create new one
  const result = GoogleEventID
    ? await calendar.events.update({         // Update existing event
        calendarId: CALENDAR_ID,
        eventId: GoogleEventID,
        resource: event
      })
    : await calendar.events.insert({         // Create new event
        calendarId: CALENDAR_ID,
        resource: event
      });

  // Return success response with event details
  return res.json({
    message: 'Appointment synced',
    link: result.data.htmlLink,              // Google Calendar event URL
    eventId: result.data.id                  // Google Calendar event ID
  });
});

// Update existing Google Calendar appointment
const editAppointment = googleCalendarAsyncHandler(async (req, res) => {
  // Extract tokens and event ID from request
  const tokens = req.body.tokens;
  const eventId = req.params.eventId;

  if (!tokens || !tokens.access_token) {
    return res.status(401).json({ error: 'Missing access token' });
  }

  // Validate appointment data
  const validationError = validateAppointmentFields(req.body);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  // Extract updated appointment details
  const { Title, AppointmentDate, AppointmentTime, Location, DoctorName, Notes } = req.body;

  // Create updated start and end datetime objects
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
    start: { 
      dateTime: startDateTime.toISOString(), 
      timeZone: TIMEZONE 
    },
    end: { 
      dateTime: endDateTime.toISOString(), 
      timeZone: TIMEZONE 
    }
  };

  // Update the event in Google Calendar
  const result = await calendar.events.update({
    calendarId: CALENDAR_ID,
    eventId,
    resource: updatedEvent
  });

  // Return success response
  return res.json({
    message: 'Appointment updated',
    link: result.data.htmlLink,
    eventId: result.data.id
  });
});

// Delete Google Calendar appointment
const deleteAppointment = googleCalendarAsyncHandler(async (req, res) => {
  // Extract event ID and tokens from request
  const eventId = req.params.eventId;
  const { tokens } = req.body;

  if (!tokens || !tokens.access_token) {
    return res.status(401).json({ error: 'Missing access token' });
  }

  // Create authenticated Google Calendar client
  const auth = createOAuthClient(tokens);
  const calendar = google.calendar({ version: 'v3', auth });
  
  // Delete the event from Google Calendar
  await calendar.events.delete({
    calendarId: CALENDAR_ID,
    eventId
  });
  
  // Return success response
  return res.json({ message: 'Appointment deleted' });
});

module.exports = {
  loginWithGoogle,
  handleCallback,
  syncAppointment,
  editAppointment,
  deleteAppointment
};
