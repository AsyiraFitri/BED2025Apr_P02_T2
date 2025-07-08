const sql = require('mssql');
const dbConfig = require('../dbConfig');

async function getMedicationsByUserId(userId) {
  const pool = await sql.connect(dbConfig);
  const result = await pool.request()
    .input('userId', sql.Int, userId)
    .query('SELECT * FROM Medications WHERE UserID = @userId');
  return result.recordset;
}

async function getMedicationById(id) {
  const pool = await sql.connect(dbConfig);
  const result = await pool.request()
    .input('id', sql.Int, id)
    .query('SELECT * FROM Medications WHERE MedicationID = @id');
  return result.recordset[0];
}

async function createMedication(med) {
  const pool = await sql.connect(dbConfig);
  await pool.request()
    .input('name', sql.NVarChar, med.name)
    .input('dosage', sql.Int, med.dosage)
    .input('frequency', sql.Int, med.frequency)
    .input('notes', sql.NVarChar, med.notes)
    .input('userId', sql.Int, med.userId)
    .query(`INSERT INTO Medications (Name, Dosage, Frequency, Notes, UserID)
            VALUES (@name, @dosage, @frequency, @notes, @userId)`);
}

async function updateMedication(id, med) {
  const pool = await sql.connect(dbConfig);
  await pool.request()
    .input('id', sql.Int, id)
    .input('name', sql.NVarChar, med.name)
    .input('dosage', sql.Int, med.dosage)
    .input('frequency', sql.Int, med.frequency)
    .input('notes', sql.NVarChar, med.notes)
    .query(`UPDATE Medications SET Name = @name, Dosage = @dosage, Frequency = @frequency,
            Notes = @notes WHERE MedicationID = @id`);
}

async function deleteMedication(id) {
  const pool = await sql.connect(dbConfig);
  await pool.request()
    .input('id', sql.Int, id)
    .query('DELETE FROM Medications WHERE MedicationID = @id');
}

module.exports = {
  getMedicationsByUserId,
  getMedicationById,
  createMedication,
  updateMedication,
  deleteMedication
};
