const sql = require('mssql');
const dbConfig = require('../dbConfig');  
// GET - Fetch all help requests
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
// POST - Create new help request
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
// DELETE - Delete a help request
async function deleteHelpRequest(req, res) {
    try {
        const RequestID = req.params.id;
        
        if (!RequestID || isNaN(RequestID)) {
            return res.status(400).json({ error: 'Invalid request ID' });
        }

        const pool = await sql.connect(dbConfig);
        
        // First check if the request exists and is pending
        const checkResult = await pool.request()
            .input('id', sql.Int, RequestID)
            .query('SELECT status FROM HelpRequests WHERE RequestID  = @id');
        
        if (checkResult.recordset.length === 0) {
            return res.status(404).json({ error: 'Request not found' });
        }

        const request = checkResult.recordset[0];
        if (request.status === 'Completed') {
            return res.status(400).json({ error: 'Cannot cancel completed requests' });
        }

        // Delete the request
        const deleteResult = await pool.request()
            .input('id', sql.Int, RequestID)
            .query('DELETE FROM HelpRequests WHERE RequestID = @id');

        if (deleteResult.rowsAffected[0] === 0) {
            return res.status(404).json({ error: 'Request not found' });
        }

        res.json({ message: 'Request cancelled successfully' });
    } catch (error) {
        console.error('Error deleting help request:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
//Update help request status
async function updateHelpRequest(req, res) {
    try {
        const RequestID = req.params.id;
        const { status } = req.body;
        
        if (!RequestID || isNaN(RequestID)) {
            return res.status(400).json({ error: 'Invalid request ID' });
        }

        if (!status || !['Pending', 'Completed', 'In Progress'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status. Must be Pending, In Progress, or Completed' });
        }

        const pool = await sql.connect(dbConfig);
        
        // Check if request exists
        const checkResult = await pool.request()
            .input('id', sql.Int, RequestID)
            .query('SELECT RequestID FROM HelpRequests WHERE RequestID  = @id');
        
        if (checkResult.recordset.length === 0) {
            return res.status(404).json({ error: 'Request not found' });
        }

        // Update the status
        const updateResult = await pool.request()
            .input('id', sql.Int, RequestID)
            .input('status', sql.NVarChar(50), status)
            .query('UPDATE HelpRequests SET status = @status WHERE RequestID = @id');

        if (updateResult.rowsAffected[0] === 0) {
            return res.status(404).json({ error: 'Request not found' });
        }

        res.json({ message: `Request status updated to ${status}` });
    } catch (error) {
    console.error('Error updating help request:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message,
      stack: error.stack 
    });
}

}
module.exports = {
  getHelpRequests,
  postHelpRequest,
  deleteHelpRequest,
updateHelpRequest
};

