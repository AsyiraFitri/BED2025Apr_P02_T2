const sql = require('mssql');
const config = require('../dbConfig'); // This imports your config object

async function getAllHotlines() {
  try {
    console.log('Model: Getting hotlines from database...');
    const pool = await sql.connect(config); // Use sql.connect with your config
    const result = await pool.request().query('SELECT * FROM EmergencyHotlines');
    console.log('Model: Query result:', result.recordset.length, 'records');
    return result.recordset;
  } catch (err) {
    console.error('Database query failed:', err);
    throw err;
  }
}

module.exports = { getAllHotlines };