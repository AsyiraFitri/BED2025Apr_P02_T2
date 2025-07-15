// googleCalendar.js
let isSignedIn = false;

function initGoogleAPI() {
  gapi.load('client:auth2', () => {
    gapi.client.init({
      apiKey: 'YOUR_API_KEY',
      clientId: 'YOUR_CLIENT_ID.apps.googleusercontent.com',
      discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
      scope: 'https://www.googleapis.com/auth/calendar.events'
    }).then(() => {
      const authInstance = gapi.auth2.getAuthInstance();
      isSignedIn = authInstance.isSignedIn.get();

      // Optional: Set up login button
      document.getElementById('googleSignInBtn').onclick = () => {
        authInstance.signIn().then(() => {
          isSignedIn = true;
          showToast('Signed in with Google');
        });
      };
    });
  });
}

function addEventToGoogleCalendar(appointment) {
  if (!isSignedIn) {
    showToast('Please sign in with Google to sync your calendar');
    return;
  }

  const event = {
    summary: appointment.Title,
    location: appointment.Location,
    description: appointment.Notes,
    start: {
      dateTime: `${appointment.AppointmentDate}T${appointment.AppointmentTime}:00`,
      timeZone: 'Asia/Singapore'
    },
    end: {
      dateTime: `${appointment.AppointmentDate}T${calculateEndTime(appointment.AppointmentTime)}`,
      timeZone: 'Asia/Singapore'
    }
  };

  gapi.client.calendar.events.insert({
    calendarId: 'primary',
    resource: event
  }).then(() => {
    showToast('Appointment added to Google Calendar');
  }).catch(() => {
    alert('Failed to add event to Google Calendar');
  });
}

function calculateEndTime(startTime) {
  const [h, m] = startTime.split(':').map(Number);
  const date = new Date();
  date.setHours(h, m + 30);
  return date.toTimeString().slice(0, 5); // HH:mm
}

// Export functions if using modules
