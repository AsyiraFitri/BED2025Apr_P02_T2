const sql = require('mssql');
const dbConfig = require('../dbConfig'); // Adjust the path as necessary

exports.getAll = async () => {
  const pool = await sql.connect(dbConfig);
  const result = await pool.request().query('SELECT * FROM Medications');
  return result.recordset;
};

exports.create = async (med) => {
  const pool = await sql.connect(dbConfig);
  await pool.request()
    .input('name', sql.NVarChar, med.name)
    .input('dosage', sql.Int, med.dosage)
    .input('frequency', sql.Int, med.frequency)
    .input('notes', sql.NVarChar, med.notes)
    .query(`INSERT INTO Medications (Name, Dosage, Frequency, Notes)
            VALUES (@name, @dosage, @frequency, @notes)`);
};

exports.update = async (id, med) => {
  const pool = await sql.connect(dbConfig);
  await pool.request()
    .input('id', sql.Int, id)
    .input('name', sql.NVarChar, med.name)
    .input('dosage', sql.Int, med.dosage)
    .input('frequency', sql.Int, med.frequency)
    .input('notes', sql.NVarChar, med.notes)
    .query(`UPDATE Medications SET Name = @name, Dosage = @dosage, Frequency = @frequency,
            Notes = @notes WHERE MedicationId = @id`);
};

exports.remove = async (id) => {
  const pool = await sql.connect(dbConfig);
  await pool.request()
    .input('id', sql.Int, id)
    .query('DELETE FROM Medications WHERE MedicationId = @id');
};
