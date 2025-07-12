require("dotenv").config(); // Load environment variables from .env file

const cors = require('cors');
const express = require("express");
const sql = require("mssql");
const path = require("path");
const bodyParser = require("body-parser");
const dbConfig = require("./dbConfig"); // Database configuration


//controllers - Asyira
const { authorizeUser } = require("./middlewares/authorizeUser");
const placeController = require("./controllers/placeController");

// Initialize app
const app = express(); // Create the Express app
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json()); // For parsing JSON
app.use(express.urlencoded({ extended: true })); // Optional: for form data

// Serve static files (CSS, JS, HTML)
app.use(express.static(path.join(__dirname, 'public')));

// ==========================
// Routes by Team Members
// ==========================

// Xuan Tong Routes

const medicationRoutes = require('./routes/medicationRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
app.use('/api/medications', medicationRoutes);
app.use('/api/appointments', appointmentRoutes);

// Jing Yin Routes
const hobbyRoutes = require('./routes/communityRoutes');
const authRoutes = require('./routes/authRoutes');
const groupRoutes = require('./routes/groupRoutes');
app.use('/api/hobby-groups', hobbyRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/groups', groupRoutes);

// Yiru Routes
const friendRoutes = require('./routes/friendRoutes');
app.use('/api/friends', friendRoutes);

// Asyira Routes
app.get("/places/:userId", authorizeUser, placeController.getUserPlaces);
app.post("/places", authorizeUser, placeController.createPlace);
app.put("/places/:placeId", authorizeUser, placeController.updatePlace);
app.delete("/places/:placeId", authorizeUser, placeController.deletePlace);


// Sandi Routes


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
