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
    .input('date', sql.Date, new Date(app.date))
    .input('time', sql.VarChar, app.AppointmentTime)
    .input('title', sql.NVarChar, app.Title)
    .input('location', sql.NVarChar, app.Location)
    .input('doctor', sql.NVarChar, app.DoctorName)
    .input('notes', sql.NVarChar, app.Notes)
    .input('userId', sql.Int, app.UserID) // Ensure UserID is passed correctly
    .query(`INSERT INTO Appointments (AppointmentDate, AppointmentTime, Title, Location, DoctorName, Notes, UserID)
            VALUES (@date, @time, @title, @location, @doctor, @notes, @userId)`);
}

async function updateAppointment(id, data) {
  console.log('Updating appointment with:', data);  // Debugging log

  const pool = await sql.connect(dbConfig);
  await pool.request()
    .input('id', sql.Int, id)
    .input('date', sql.Date, new Date(data.AppointmentDate))
    .input('time', sql.VarChar, data.AppointmentTime)
    .input('title', sql.NVarChar, data.Title)
    .input('location', sql.NVarChar, data.Location)
    .input('doctor', sql.NVarChar, data.DoctorName)
    .input('notes', sql.NVarChar, data.Notes)
    .input('userId', sql.Int, data.UserID) // Optional: only needed if updating user
    .query(`UPDATE Appointments 
            SET AppointmentDate = @date,
                AppointmentTime = @time,
                Title = @title,
                Location = @location,
                DoctorName = @doctor,
                Notes = @notes
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
