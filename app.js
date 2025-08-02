const cors = require('cors');
const express = require("express");
const sql = require("mssql");
const path = require("path");
const bodyParser = require("body-parser");
const dbConfig = require("./dbConfig"); // Database configuration
const dotenv = require("dotenv");

require("dotenv").config(); // Load environment variables from .env file
dotenv.config();

// Initialize app
const app = express(); // Create the Express app
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json()); // For parsing JSON
app.use(express.urlencoded({ extended: true })); // Optional: for form data

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Swagger UI setup
const swaggerFile = require('./swagger-output.json');
const swaggerUi = require('swagger-ui-express');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerFile));

// Content Security Policy middleware to allow images and other resources
app.use((req, res, next) => {
  res.setHeader('Content-Security-Policy', 
    "default-src 'self'; " +
    "img-src 'self' data: https: http:; " +
    "style-src 'self' 'unsafe-inline' https:; " +
    "script-src 'self' 'unsafe-inline' https:; " +
    "font-src 'self' https: data:; " +
    "connect-src 'self' https: http:;"
  );
  next();
});


// ==========================
// Routes by Team Members
// ==========================

// Jing Yin Routes
const hobbyRoutes = require('./routes/communityRoutes');
const groupRoutes = require('./routes/groupRoutes');
app.use('/api/hobby-groups', hobbyRoutes);
app.use('/api/groups', groupRoutes);

// Xuan Tong Routes
const medicationRoutes = require('./routes/medicationRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
app.use('/api/medications', medicationRoutes);
app.use('/api/appointments', appointmentRoutes);

const calendarRoutes = require('./routes/calendarRoutes');
app.use('/api/calendar', calendarRoutes);

// Asyira Routes
const placeRoutes = require('./routes/placesRoutes');
const busRoutes = require('./routes/busRoutes');
const placeNotesRoutes = require('./routes/placeNotesRoutes');
app.use('/api/places', placeRoutes);
app.use('/api/bus', busRoutes);
app.use('/api/place-notes', placeNotesRoutes);
 

// Sandi Routes
const authRoutes = require('./routes/authRoutes');
const requestRoutes = require('./routes/requestRoutes');
const contactRoutes = require('./routes/emergencyContactRoutes');
const emergencyHotlineRoutes = require('./routes/emergencyHotlineRoutes');


app.use('/api/auth', authRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/hotlines', emergencyHotlineRoutes);
//app.get('/api/auth/test-mailgun-simple', testMailgunSimple);

// Yiru Routes
const friendRoutes = require('./routes/friendRoutes');
const messageRoutes = require('./routes/messageRoutes');
// updated
const userRoutes = require('./routes/userRoutes');

app.use('/api/friends', friendRoutes);
app.use('/api/messages', messageRoutes);
// updated
app.use('/api/users', userRoutes);


// ==========================

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

// Graceful shutdown and DB cleanup
process.on("SIGINT", async () => {
  console.log("Server is gracefully shutting down");
  await sql.close();
  console.log("Database connections closed");
  process.exit(0);
});
