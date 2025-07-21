// models/request-helpModel.js
const sql = require('mssql');
const dbConfig = require('../dbConfig');

async function createHelpRequest(requestData) {
  const { userID, category, description, request_date, request_time, status } = requestData;

  const pool = await sql.connect(dbConfig);

  const result = await pool.request()
    .input('UserID', sql.Int, userID)
    .input('Category', sql.NVarChar, category)
    .input('Description', sql.NVarChar, description)
    .input('RequestDate', sql.Date, request_date)
    .input('RequestTime', sql.NVarChar, request_time)
    .input('Status', sql.NVarChar, status || 'Pending')
    .query(`
      INSERT INTO HelpRequests (UserID, category, description, request_date, request_time, status)
      VALUES (@UserID, @Category, @Description, @RequestDate, @RequestTime, @Status)
    `);

  return result;
}

module.exports = { createHelpRequest };
