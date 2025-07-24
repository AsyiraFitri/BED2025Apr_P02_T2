const sql = require('mssql');
const dbConfig = require('../dbConfig');  // adjust your path

async function getHelpRequests(req, res) {
    console.log('GET /api/requests called'); // Debug log
 
  try {
      console.log('GET /api/requests called'); // Debug log
    const pool = await sql.connect(dbConfig);
     console.log('Database connected successfully'); // Debug log
console.log('Executing query...'); // Debug log
    // Simple SELECT to get all requests
    const result = await pool.request()
      .query('SELECT * FROM HelpRequests ORDER BY request_date DESC');
   console.log('Query executed, rows returned:', result.recordset.length); // Debug log
        console.log('Sample data:', result.recordset[0]); // Debug log
    res.json(result.recordset);

   } catch (error) {
        console.error('Detailed error in getHelpRequests:');
        console.error('Error message:', error.message);
        console.error('Error code:', error.code);
        console.error('Full error:', error);
        
        res.status(500).json({ 
            error: 'Internal server error', 
            details: error.message,
            code: error.code 
        });
    }
}
const { createHelpRequest } = require('../models/request-helpModel');

async function postHelpRequest(req, res) {
  try {
    const requestData = req.body;

    const result = await createHelpRequest(requestData);
        
        res.status(201).json({ 
            message: 'Request submitted successfully!',
            data: result 
        });
    } catch (error) {
        console.error('Error creating help request:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
}

module.exports = {
  getHelpRequests,
  postHelpRequest
};

