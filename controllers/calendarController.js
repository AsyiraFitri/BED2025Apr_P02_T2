const { google } = require('googleapis');
require('dotenv').config();

console.log('OAuth2 Redirect URI:', process.env.REDIRECT);
const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.SECRET_ID,
  process.env.REDIRECT
);

// Step 1: Redirect to Google login
function loginWithGoogle(req, res) {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/calendar'],
    prompt: 'consent'
  });
  console.log("Redirecting to Google OAuth URL:", url);
  res.redirect(url);
}

// Step 2: Handle redirect with token
async function handleCallback(req, res) {
  const code = req.query.code;

  try {
    const { tokens } = await oauth2Client.getToken(code);
    const encoded = encodeURIComponent(JSON.stringify(tokens));
    res.redirect(`/health.html#tokens=${encoded}`);
  } catch (err) {
    console.error("OAuth error:", err);
    res.status(500).send("Google authentication failed");
  }
}

// Step 3: Sync appointment
async function syncAppointment(req, res) {
  const tokens = req.body.tokens;
  if (!tokens || !tokens.access_token) {
    return res.status(401).json({ error: 'Missing access token' });
  }

  const { title, date, time, location, notes, appointmentId, googleEventId } = req.body;

  // Basic validation
  if (!date || !time) {
    return res.status(400).json({ error: 'Missing date or time for appointment' });
  }

  // Combine date and time, and check validity
  const startDateTime = new Date(`${date}T${time}`);
  if (isNaN(startDateTime.getTime())) {
    return res.status(400).json({ error: 'Invalid date or time format' });
  }

  // 30 minutes appointment length
  const endDateTime = new Date(startDateTime.getTime() + 30 * 60000);

  const auth = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.SECRET_ID,
    process.env.REDIRECT
  );
  auth.setCredentials(tokens);

  const calendar = google.calendar({ version: 'v3', auth });

  const event = {
    summary: title,
    location,
    description: notes || '',
    start: { dateTime: startDateTime.toISOString(), timeZone: 'Asia/Singapore' },
    end: { dateTime: endDateTime.toISOString(), timeZone: 'Asia/Singapore' },
    extendedProperties: {
      private: {
        websiteAppointmentId: appointmentId // Store our ID in Google event
      }
    }
  };

  try {
    // Check if this appointment already exists in Google Calendar

    let result;

    if (googleEventId) {
      // Update the existing Google Calendar event
      result = await calendar.events.update({
        calendarId: 'primary',
        eventId: googleEventId,
        resource: event
      });
    } else {
      // Create new event
      result = await calendar.events.insert({
        calendarId: 'primary',
        resource: event
      });
    }
    console.log("Google Calendar event synced:", result.data);

    res.json({
      message: 'Appointment synced',
      link: result.data.htmlLink,
      eventID: result.data.id
    });
  } catch (err) {
    console.error("Google Calendar sync failed:", err);
    res.status(500).json({ error: 'Failed to sync appointment' });
  }
}


// Step 4: Get upcoming events
async function listEvents(req, res) {
  const tokenHeader = req.headers.authorization?.split(' ')[1];
  if (!tokenHeader) return res.status(401).send('Missing access token');

  const credentials = JSON.parse(decodeURIComponent(tokenHeader));
  const auth = new google.auth.OAuth2();
  auth.setCredentials(credentials);
  const calendar = google.calendar({ version: 'v3', auth });

  try {
    const result = await calendar.events.list({
      calendarId: 'primary',
      timeMin: new Date().toISOString(),
      maxResults: 10,
      singleEvents: true,
      orderBy: 'startTime'
    });
    res.json(result.data.items);
  } catch (err) {
    console.error('Fetch events failed:', err);
    res.status(500).send('Error fetching events');
  }
}

module.exports = {
  loginWithGoogle,
  handleCallback,
  syncAppointment,
  listEvents
};
