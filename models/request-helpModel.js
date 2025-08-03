// models/request-helpModel.js
const sql = require('mssql');
const dbConfig = require('../dbConfig');

async function createHelpRequest(requestData) {
  const { userID, category, description, request_date, request_time, status } = requestData;

  try {
    const pool = await sql.connect(dbConfig);

    // Ensure request_time is a string and not empty
    const timeString = request_time ? String(request_time) : null;
    
    console.log('Time being inserted:', timeString, 'Type:', typeof timeString); // Debug log
    const result = await pool.request()
      .input('user_id', sql.Int, userID)
      .input('Category', sql.NVarChar, category)
      .input('Description', sql.NVarChar, description)
      .input('RequestDate', sql.Date, request_date)
      .input('RequestTime', sql.NVarChar(10), timeString) 
      .input('Status', sql.NVarChar, status || 'Pending')
      .query(`
        INSERT INTO HelpRequests (user_id, category, description, request_date, request_time, status)
        VALUES (@user_id, @Category, @Description, @RequestDate, @RequestTime, @Status)
      `);

    return result;
  } catch (error) {
    console.error('Database error details:', error);
    throw error;
  }
}

async function getAllHelpRequests() {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request().query('SELECT * FROM HelpRequests ORDER BY request_date DESC');
    return result.recordset;
  } catch (error) {
    console.error('Error fetching requests:', error);
    throw error;
  }
}

async function getRequestById(RequestID) {
  const pool = await sql.connect(dbConfig);
  const checkResult = await pool.request()
    .input('id', sql.Int, RequestID)
    .query('SELECT * FROM HelpRequests WHERE RequestID = @id');
  return checkResult;
}

async function deleteRequestById(RequestID) {
  const pool = await sql.connect(dbConfig);
  const deleteResult = await pool.request()
    .input('id', sql.Int, RequestID)
    .query('DELETE FROM HelpRequests WHERE RequestID = @id');
  return deleteResult;
}

async function updateRequestStatus(RequestID, status) {
  const pool = await sql.connect(dbConfig);
  const updateResult = await pool.request()
    .input('id', sql.Int, RequestID)
    .input('status', sql.NVarChar(50), status)
    .query('UPDATE HelpRequests SET status = @status WHERE RequestID = @id');
  return updateResult;
}

module.exports = { 
  createHelpRequest, 
  getAllHelpRequests, 
  getRequestById,
  deleteRequestById, 
  updateRequestStatus 
};
