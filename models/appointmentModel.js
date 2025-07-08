const sql = require('mssql');
const dbConfig = require('../dbConfig');

async function getAppointmentsByUserId(userId) {
  const pool = await sql.connect(dbConfig);
  const result = await pool.request()
    .input('userId', sql.Int, userId)
    .query('SELECT * FROM Appointments WHERE UserID = @userId');
  return result.recordset;
}

async function getAppointmentById(id) {
  const pool = await sql.connect(dbConfig);
  const result = await pool.request()
    .input('id', sql.Int, id)
    .query('SELECT * FROM Appointments WHERE AppointmentID = @id');
  return result.recordset[0];
}

async function createAppointment(app) {
  const pool = await sql.connect(dbConfig);
  await pool.request()
    .input('date', sql.Date, app.date)
    .input('time', sql.Time, app.time)
    .input('title', sql.NVarChar, app.title)
    .input('location', sql.NVarChar, app.location)
    .input('doctor', sql.NVarChar, app.doctor)
    .input('notes', sql.NVarChar, app.notes)
    .input('userId', sql.Int, app.userId)
    .query(`INSERT INTO Appointments (Date, Time, Title, Location, DoctorName, Notes, UserID)
            VALUES (@date, @time, @title, @location, @doctor, @notes, @userId)`);
}

async function updateAppointment(id, app) {
  const pool = await sql.connect(dbConfig);
  await pool.request()
    .input('id', sql.Int, id)
    .input('date', sql.Date, app.date)
    .input('time', sql.Time, app.time)
    .input('title', sql.NVarChar, app.title)
    .input('location', sql.NVarChar, app.location)
    .input('doctor', sql.NVarChar, app.doctor)
    .input('notes', sql.NVarChar, app.notes)
    .query(`UPDATE Appointments SET Date = @date, Time = @time, Title = @title,
            Location = @location, DoctorName = @doctor, Notes = @notes
            WHERE AppointmentID = @id`);
}

async function deleteAppointment(id) {
  const pool = await sql.connect(dbConfig);
  await pool.request()
    .input('id', sql.Int, id)
    .query('DELETE FROM Appointments WHERE AppointmentID = @id');
}

module.exports = {
  getAppointmentsByUserId,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  deleteAppointment
};
