require('dotenv').config();

const express = require('express');
const path = require('path');
const app = express();

// Middleware to parse JSON body
app.use(express.json());

// Serve static files from 'public' folder
app.use(express.static(path.join(__dirname, '../public')));

// ALSO serve static files from 'jingyin' folder for your CSS
app.use('/jingyin', express.static(path.join(__dirname, './')));

// Routes
const hobbyRoutes = require('routes/communityRoutes');
app.use('/api/hobby-groups', hobbyRoutes);

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
