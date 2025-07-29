const { google } = require('googleapis');
require('dotenv').config();

const CALENDAR_ID = 'primary';
const TIMEZONE = 'Asia/Singapore';

const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.SECRET_ID,
  process.env.REDIRECT
);

// Helper: create new OAuth client and set credentials
function createOAuthClient(tokens) {
  const client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.SECRET_ID,
    process.env.REDIRECT
  );
  client.setCredentials(tokens);
  return client;
}

// Helper: validate required fields for appointments
function validateAppointmentFields(body) {
  const requiredFields = ['Title', 'AppointmentDate', 'AppointmentTime'];
  for (const field of requiredFields) {
    if (!body[field]) return `Missing required field: ${field}`;
  }
  const date = new Date(`${body.AppointmentDate}T${body.AppointmentTime}`);
  if (isNaN(date.getTime())) return 'Invalid date or time format';
  return null;
}

function loginWithGoogle(req, res) {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/calendar'],
    prompt: 'consent'
  });
  res.redirect(url);
}

async function handleCallback(req, res) {
  const code = req.query.code;

  try {
    const { tokens } = await oauth2Client.getToken(code);
    const encoded = encodeURIComponent(JSON.stringify(tokens));
    res.redirect(`/health.html#tokens=${encoded}`);
  } catch (err) {
    console.error('OAuth error:', err);
    res.status(500).send('Google authentication failed');
  }
}

async function syncAppointment(req, res) {
  const tokens = req.body.tokens;
  if (!tokens || !tokens.access_token) {
    return res.status(401).json({ error: 'Missing access token' });
  }

  const validationError = validateAppointmentFields(req.body);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

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

  const startDateTime = new Date(`${AppointmentDate}T${AppointmentTime}`);
  const endDateTime = new Date(startDateTime.getTime() + 30 * 60000);

  const auth = createOAuthClient(tokens);
  const calendar = google.calendar({ version: 'v3', auth });

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

async function editAppointment(req, res) {
  const tokens = req.body.tokens;
  const eventId = req.params.eventId;

  if (!tokens || !tokens.access_token) {
    return res.status(401).json({ error: 'Missing access token' });
  }

  const validationError = validateAppointmentFields(req.body);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  const { Title, AppointmentDate, AppointmentTime, Location, DoctorName, Notes } = req.body;

  const startDateTime = new Date(`${AppointmentDate}T${AppointmentTime}`);
  const endDateTime = new Date(startDateTime.getTime() + 30 * 60000);

  const auth = createOAuthClient(tokens);
  const calendar = google.calendar({ version: 'v3', auth });

  const updatedEvent = {
    summary: Title,
    location: Location,
    description: Notes || '',
    start: { dateTime: startDateTime.toISOString(), timeZone: TIMEZONE },
    end: { dateTime: endDateTime.toISOString(), timeZone: TIMEZONE }
  };

  try {
    const result = await calendar.events.update({
      calendarId: CALENDAR_ID,
      eventId,
      resource: updatedEvent
    });

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

async function deleteAppointment(req, res) {
  const eventId = req.params.eventId;
  const { tokens } = req.body; // Destructure tokens from body

  if (!tokens || !tokens.access_token) {
    return res.status(401).json({ error: 'Missing access token' });
  }

  const auth = createOAuthClient(tokens);

  try {
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
