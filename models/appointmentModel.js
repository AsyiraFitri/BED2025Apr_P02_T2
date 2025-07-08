const sql = require('mssql');
const dbConfig = require('../dbConfig');

exports.getAll = async () => {
  const pool = await sql.connect(dbConfig);
  const result = await pool.request().query('SELECT * FROM Appointments');
  return result.recordset;
};

exports.create = async (appointment) => {
  const pool = await sql.connect(dbConfig);
  await pool.request()
    .input('date', sql.Date, appointment.date)
    .input('time', sql.Time, appointment.time)
    .input('title', sql.NVarChar, appointment.title)
    .input('location', sql.NVarChar, appointment.location)
    .input('doctor', sql.NVarChar, appointment.doctor)
    .input('notes', sql.NVarChar, appointment.notes)
    .query(`INSERT INTO Appointments (Date, Time, Title, Location, Doctor, Notes)
            VALUES (@date, @time, @title, @location, @doctor, @notes)`);
};

exports.update = async (id, appointment) => {
  const pool = await sql.connect(dbConfig);
  await pool.request()
    .input('id', sql.Int, id)
    .input('date', sql.Date, appointment.date)
    .input('time', sql.Time, appointment.time)
    .input('title', sql.NVarChar, appointment.title)
    .input('location', sql.NVarChar, appointment.location)
    .input('doctor', sql.NVarChar, appointment.doctor)
    .input('notes', sql.NVarChar, appointment.notes)
    .query(`UPDATE Appointments SET Date = @date, Time = @time, Title = @title,
            Location = @location, Doctor = @doctor, Notes = @notes WHERE AppointmentId = @id`);
};

exports.remove = async (id) => {
  const pool = await sql.connect(dbConfig);
  await pool.request()
    .input('id', sql.Int, id)
    .query('DELETE FROM Appointments WHERE AppointmentId = @id');
};
