const sql = require('mssql');
const dbConfig = require('../dbConfig');

async function getUserById(req, res) {
  const userId = req.params.userId;
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('UserID', sql.Int, userId)
      .query('SELECT UserID, first_name, last_name FROM Users WHERE UserID = @UserID');
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(result.recordset[0]);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Server error' });
  }
}

module.exports = {
  getUserById
};