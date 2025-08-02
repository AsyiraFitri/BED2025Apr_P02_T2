const swaggerAutogen = require('swagger-autogen')();

const doc = {
  info: {
    title: 'EverydayCare API Documentation',
    description: 'Documentation follows the order of: Jing Yin, Xuan Tong, Asyira, Sandi, and Yiru. Each section contains endpoints related to the respective team member\'s features.',
  },
  host: 'localhost:3000',
  schemes: ['http'],
  tags: [
    // Jing Yin 
    { name: 'Community', description: 'Community related endpoints' },
    { name: 'Group', description: 'Group related endpoints' },
    { name: 'Members', description: 'Group members endpoints' },
    { name: 'Channels', description: 'Channel endpoints' },
    { name: 'ChatMessages', description: 'Chat messages endpoints' },
    { name: 'Events', description: 'Event endpoints' },

    // Xuan Tong
    { name: "Medications", description: "Medication endpoints" },
    { name: 'MedicationTracker', description: 'Medication tracking endpoints' },
    { name: 'Appointments', description: 'Appointment endpoints' },
    { name: 'Calendar', description: 'Google Calendar integration endpoints' },
    
    // Asyira
    { name: 'Places', description: 'Endpoints related to places, locations, and points of interest' },
    { name: 'PlaceNotes', description: 'Place notes creation, retrieval, editing, and deletion endpoints' },
    { name: 'Bus', description: 'Bus arrival and related endpoints' },

    
    // Sandi
    { name: 'Authentication', description: 'Signup, login, forgot password, and reset password endpoints ( Mailgun and reCAPTCHA integration)' },
    { name: 'HelpRequests', description: 'Emergency help request creation, cancellation, and completion endpoints' },
    { name: 'EmergencyContacts', description: 'Create, edit, and delete emergency contact endpoints' },
    { name: 'EmergencyHotlines', description: 'View and call emergency hotline numbers and SOS endpoints' },

    // Yiru

  ],
};
try {
  console.log(myObject.api);
} catch (err) {
  console.warn('Optional log skipped: myObject is not defined.');
}

const outputFile = './swagger-output.json';
const endpointsFiles = ['./app.js', './routes/communityRoutes.js','./routes/authRoutes.js','./routes/requestRoutes.js','./routes/emergencyContactRoutes.js', './routes/emergencyHotlineRoutes.js'];

swaggerAutogen(outputFile, endpointsFiles, doc);
