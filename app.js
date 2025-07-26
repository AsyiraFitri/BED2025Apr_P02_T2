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

// Swagger UI setup
const swaggerFile = require('./swagger-output.json');
const swaggerUi = require('swagger-ui-express');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerFile));


// ==========================
// Routes by Team Members
// ==========================

// Xuan Tong Routes
const medicationRoutes = require('./routes/medicationRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
app.use('/api/medications', medicationRoutes);
app.use('/api/appointments', appointmentRoutes);

const calendarRoutes = require('./routes/calendarRoutes');
app.use(calendarRoutes);

// Jing Yin Routes
const hobbyRoutes = require('./routes/communityRoutes');
const authRoutes = require('./routes/authRoutes');
const groupRoutes = require('./routes/groupRoutes');
app.use('/api/hobby-groups', hobbyRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/groups', groupRoutes);

// Yiru Routes
const friendRoutes = require('./routes/friendRoutes');
const messageRoutes = require('./routes/messageRoutes');
app.use('/api/friends', friendRoutes);
app.use('/api/messages', messageRoutes);

// Asyira Routes
const placeRoutes = require('./routes/placesRoutes');
const busRoutes = require('./routes/busRoutes');
app.use('/api/places', placeRoutes)
app.use('/api/bus', busRoutes)

// Sandi Routes
const requestRoutes = require('./routes/requestRoutes');
const contactRoutes = require('./routes/emergencyContactRoutes');
app.use('/api/auth', authRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/contacts', contactRoutes);


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
