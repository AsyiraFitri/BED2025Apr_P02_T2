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
    { name: 'Friends', description: 'Friend request and management endpoints' },
    { name: 'Messages', description: 'Private messaging endpoints' },
    { name: 'Users', description: 'User profile and information endpoints' },
  ],
};

const outputFile = './swagger-output.json';
const endpointsFiles = [
  './app.js', 
  './routes/communityRoutes.js',
  './routes/groupRoutes.js',
  './routes/medicationRoutes.js',
  './routes/appointmentRoutes.js',
  './routes/calendarRoutes.js',
  './routes/placesRoutes.js',
  './routes/placeNotesRoutes.js',
  './routes/busRoutes.js',
  './routes/authRoutes.js',
  './routes/requestRoutes.js',
  './routes/emergencyContactRoutes.js', 
  './routes/emergencyHotlineRoutes.js',
  './routes/friendRoutes.js',
  './routes/messageRoutes.js',
  './routes/userRoutes.js'
];

swaggerAutogen(outputFile, endpointsFiles, doc).then(() => {
  console.log('Swagger documentation generated successfully!');
  
  // Post-process the generated file to add tags based on route paths
  const fs = require('fs');
  const swaggerOutput = JSON.parse(fs.readFileSync(outputFile, 'utf8'));
  
  // Add tags to endpoints based on their paths
  Object.keys(swaggerOutput.paths).forEach(path => {
    Object.keys(swaggerOutput.paths[path]).forEach(method => {
      const endpoint = swaggerOutput.paths[path][method];
      
      // Assign tags based on path patterns
      if (path.includes('/hobby-groups')) {
        endpoint.tags = ['Community'];
      } else if (path.includes('/groups')) {
        if (path.includes('/events')) {
          endpoint.tags = ['Events'];
        } else if (path.includes('/firebase') || path.includes('/messages')) {
          endpoint.tags = ['ChatMessages'];
        } else if (path.includes('/channels')) {
          endpoint.tags = ['Channels'];
        } else if (path.includes('/member') || path.includes('/user/')) {
          endpoint.tags = ['Members'];
        } else {
          endpoint.tags = ['Group'];
        }
      } else if (path.includes('/medications')) {
        if (path.includes('/tracking') || path.includes('/schedules')) {
          endpoint.tags = ['MedicationTracker'];
        } else {
          endpoint.tags = ['Medications'];
        }
      } else if (path.includes('/appointments')) {
        endpoint.tags = ['Appointments'];
      } else if (path.includes('/calendar')) {
        endpoint.tags = ['Calendar'];
      } else if (path.includes('/places')) {
        endpoint.tags = ['Places'];
      } else if (path.includes('/place-notes')) {
        endpoint.tags = ['PlaceNotes'];
      } else if (path.includes('/bus')) {
        endpoint.tags = ['Bus'];
      } else if (path.includes('/auth')) {
        endpoint.tags = ['Authentication'];
      } else if (path.includes('/requests')) {
        endpoint.tags = ['HelpRequests'];
      } else if (path.includes('/contacts')) {
        endpoint.tags = ['EmergencyContacts'];
      } else if (path.includes('/hotlines')) {
        endpoint.tags = ['EmergencyHotlines'];
      } else if (path.includes('/friends')) {
        endpoint.tags = ['Friends'];
      } else if (path.includes('/messages')) {
        endpoint.tags = ['Messages'];
      } else if (path.includes('/users')) {
        endpoint.tags = ['Users'];
      }
    });
  });
  
  // Write the updated swagger file
  fs.writeFileSync(outputFile, JSON.stringify(swaggerOutput, null, 2));
  console.log('Tags added to endpoints successfully!');
});