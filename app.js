const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sql = require('mssql');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Serve frontend static files
app.use(express.static(path.join(__dirname, 'public')));


// SQL Config
const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  options: {
    encrypt: true,
    trustServerCertificate: true
  }
};

sql.connect(dbConfig)
  .then(pool => {
    console.log('✅ Connected to SQL Server');
    app.locals.db = pool;
  })
  .catch(err => console.error('❌ DB Connection Error:', err));

// API Routes
const medicationRoutes = require('./routes/medicationRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');

app.use('/api/medications', medicationRoutes);
app.use('/api/appointments', appointmentRoutes);

const hobbyRoutes = require('./routes/communityRoutes');
app.use('/api/hobby-groups', hobbyRoutes);


app.listen(PORT, () => {
  console.log(`🚀 Server listening on http://localhost:${PORT}`);
});
