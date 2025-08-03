const swaggerAutogen = require('swagger-autogen')();

const doc = {
  info: {
    title: 'EverydayCare API Documentation',
    description: 'Documentation follows the order of: Jing Yin, Xuan Tong, Asyira, Sandi, and Yiru. Each section contains endpoints related to the respective team member\'s features.',
  },
  host: 'localhost:3000',
  schemes: ['http'],
  securityDefinitions: {
    bearerAuth: {
      type: 'apiKey',
      name: 'authorization',
      in: 'header',
      description: 'JWT Authorization header using the Bearer scheme. Example: "Bearer {token}"'
    }
  },
  security: [
    {
      bearerAuth: []
    }
  ],
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
  
  // Endpoints that don't require authentication
  const publicEndpoints = [
    '/api/auth/register',
    '/api/auth/login',
    '/api/auth/forgot-password',
    '/api/auth/logout',
    '/api/hotlines/',
    '/api/bus/bus-arrivals',
    '/api/calendar/auth/google',
    '/api/calendar/auth/google/callback'
  ];
  
  // Remove any paths that might be causing the default section FIRST
  const pathsToRemove = [];
  Object.keys(swaggerOutput.paths).forEach(path => {
    // Remove root level paths that don't have proper API structure
    if (path === '/' || path === '/{id}' || path === '/join' || path === '/events/{eventId}' || 
        path === '/checkMembership/{groupId}' || path === '/memberCount/{groupId}' ||
        path === '/memberList/{groupId}' || path === '/channels/{groupId}' ||
        path === '/saveDesc' || path === '/createChannel' || path === '/deleteChannel' ||
        path === '/register' || path === '/events/{eventId}' || 
        !path.startsWith('/api/')) {
      pathsToRemove.push(path);
    }
  });
  
  // Remove the problematic paths
  pathsToRemove.forEach(path => {
    console.log(`Removing problematic path: ${path}`);
    delete swaggerOutput.paths[path];
  });
  
  // Add tags to endpoints based on their paths and handle default section
  Object.keys(swaggerOutput.paths).forEach(path => {
    Object.keys(swaggerOutput.paths[path]).forEach(method => {
      const endpoint = swaggerOutput.paths[path][method];
      
      // Force remove any existing default tags
      if (endpoint.tags) {
        endpoint.tags = endpoint.tags.filter(tag => tag !== 'default');
        if (endpoint.tags.length === 0) {
          delete endpoint.tags;
        }
      }
      
      // Assign tags based on path patterns - EVERY endpoint must have a tag
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
      } else if (path.includes('/places') && !path.includes('/place-notes')) {
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
      } else {
        // Fallback - assign a default tag based on the path structure
        console.log(`Warning: Unhandled path ${path}, assigning to Community`);
        endpoint.tags = ['Community'];
      }
      
      // Add security (JWT) to endpoints that require authentication
      const isPublicEndpoint = publicEndpoints.includes(path);
      const isPublicMethod = (path === '/api/hobby-groups/' && method === 'get') ||
                            (path === '/api/hobby-groups/{id}' && method === 'get') ||
                            (path === '/api/groups/memberCount/{groupId}' && method === 'get') ||
                            (path === '/api/groups/memberList/{groupId}' && method === 'get') ||
                            (path === '/api/groups/channels/{groupId}' && method === 'get') ||
                            (path === '/api/groups/firebase/channels/{groupId}/{channelName}' && method === 'get') ||
                            (path === '/api/groups/firebase-config' && method === 'get') ||
                            (path === '/api/groups/events/{groupId}' && method === 'get') ||
                            (path === '/api/requests/' && method === 'get');
      
      if (!isPublicEndpoint && !isPublicMethod) {
        endpoint.security = [{ bearerAuth: [] }];
      } else {
        // Explicitly remove security for public endpoints
        endpoint.security = [];
      }
      
      // Remove any default responses and clean up response structure
      if (endpoint.responses && endpoint.responses.default) {
        delete endpoint.responses.default;
      }
    });
  });
  
  // Final check - ensure no endpoint is missing tags
  let untaggedCount = 0;
  Object.keys(swaggerOutput.paths).forEach(path => {
    Object.keys(swaggerOutput.paths[path]).forEach(method => {
      const endpoint = swaggerOutput.paths[path][method];
      if (!endpoint.tags || endpoint.tags.length === 0) {
        console.log(`ERROR: Endpoint ${method.toUpperCase()} ${path} has no tags!`);
        untaggedCount++;
      }
    });
  });
  
  if (untaggedCount > 0) {
    console.log(`WARNING: ${untaggedCount} endpoints are missing tags!`);
  }
  
  // Write the updated swagger file
  fs.writeFileSync(outputFile, JSON.stringify(swaggerOutput, null, 2));
  console.log('Tags added to endpoints successfully!');
  console.log('JWT authorization added to protected endpoints!');
  console.log('Default section and problematic paths removed!');
  console.log(`Total endpoints processed: ${Object.keys(swaggerOutput.paths).length}`);
});