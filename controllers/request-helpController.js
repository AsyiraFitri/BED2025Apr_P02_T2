const sql = require('mssql');
const dbConfig = require('../dbConfig');  // adjust your path

async function getHelpRequests(req, res) {
 
  try {
    const pool = await sql.connect(dbConfig);

    // Simple SELECT to get all requests
    const result = await pool.request()
      .query('SELECT UserID, category, description, request_date, request_time, status FROM HelpRequests');

    res.json(result.recordset);

  } catch (error) {
    console.error('Error fetching help requests:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = {
  getHelpRequests
};
