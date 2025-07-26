// swagger.js or swagger-config.js
const swaggerAutogen = require('swagger-autogen')();

const doc = {
  info: {
    title: 'Community Group Chat API',
    description: 'API documentation for EverydayCare',
  },
  host: 'localhost:3000',
  schemes: ['http'],
  tags: [
    { name: 'Community', description: 'Community related endpoints' },
    { name: 'Group', description: 'Group related endpoints' },
    { name: 'Members', description: 'Group members endpoints' },
    { name: 'Channels', description: 'Channel endpoints' },
    { name: 'ChatMessages', description: 'Chat messages endpoints' },
    { name: 'Events', description: 'Event endpoints' },
  ],
};

const outputFile = './swagger-output.json';
const endpointsFiles = ['./app.js', './routes/communityRoutes.js'];

swaggerAutogen(outputFile, endpointsFiles, doc);
