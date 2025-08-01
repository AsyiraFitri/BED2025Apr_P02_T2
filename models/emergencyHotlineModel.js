const sql = require('mssql');
const poolPromise = require('../config/db');

async function getAllHotlines() {
  const pool = await poolPromise;
  const result = await pool.request().query('SELECT * FROM EmergencyHotlines');
  return result.recordset;
}

module.exports = { getAllHotlines };
