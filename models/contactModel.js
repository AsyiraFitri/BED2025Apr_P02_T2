// models/emergency-contactModel.js
const sql = require('mssql');
const dbConfig = require('../dbConfig');

async function createContact(contactData) {
  const { name, phone, userID } = contactData;

  try {
    const pool = await sql.connect(dbConfig);

    const result = await pool.request()
      .input('Name', sql.NVarChar(100), name)
      .input('Phone', sql.NVarChar(20), phone)
      .input('UserID', sql.Int, userID)
      .query(`
        INSERT INTO EmergencyContacts (name, phone, user_id)
        VALUES (@Name, @Phone, @UserID)
      `);

    return result;
  } catch (error) {
    console.error('Database error (createContact):', error);
    throw error;
  }
}

async function getAllContactsByUser(userID) {
  try {
    const pool = await sql.connect(dbConfig);

    const result = await pool.request()
      .input('UserID', sql.Int, userID)
      .query(`
        SELECT * FROM EmergencyContacts
        WHERE user_id = @UserID
        ORDER BY name ASC
      `);

    return result.recordset;
  } catch (error) {
    console.error('Database error (getAllContactsByUser):', error);
    throw error;
  }
}

module.exports = {
  createContact,
  getAllContactsByUser
};
