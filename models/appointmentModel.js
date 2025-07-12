const sql = require("mssql");
const dbConfig = require("../dbConfig");

// Get all appointments for a specific user
// - Retrieves all appointments where UserID matches the given input
// - Formats the AppointmentTime to HH:mm string for frontend display
async function getAppointmentsByUserId(userId) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const query = "SELECT * FROM Appointments WHERE UserID = @userId";
    const request = connection.request();
    request.input("userId", sql.Int, userId);
    const result = await request.query(query);

    // Format time (remove date portion)
    result.recordset.forEach(app => {
      if (app.AppointmentTime) {
        const t = new Date(app.AppointmentTime);
        const hours = t.getUTCHours().toString().padStart(2, '0');
        const minutes = t.getUTCMinutes().toString().padStart(2, '0');
        app.AppointmentTime = `${hours}:${minutes}`;
      }
    });

    return result.recordset;
  } catch (error) {
    console.error("Database error (getAppointmentsByUserId):", error);
    throw error;
  } finally {
    // Close DB connection
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error("Error closing connection:", err);
      }
    }
  }
}

// Get one appointment by ID
// - Retrieves a specific appointment based on its AppointmentID
// - Also formats the time to HH:mm
async function getAppointmentById(id) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const query = "SELECT * FROM Appointments WHERE AppointmentID = @id";
    const request = connection.request();
    request.input("id", sql.Int, id);
    const result = await request.query(query);

    const appointment = result.recordset[0];

    if (appointment && appointment.AppointmentTime) {
      const t = new Date(appointment.AppointmentTime);
      const hours = t.getUTCHours().toString().padStart(2, '0');
      const minutes = t.getUTCMinutes().toString().padStart(2, '0');
      appointment.AppointmentTime = `${hours}:${minutes}`;
    }

    return appointment;
  } catch (error) {
    console.error("Database error (getAppointmentById):", error);
    throw error;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error("Error closing connection:", err);
      }
    }
  }
}

// Create a new appointment
// - Inserts a new record into the Appointments table
async function createAppointment(app) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const query = `
      INSERT INTO Appointments (AppointmentDate, AppointmentTime, Title, Location, DoctorName, Notes, UserID)
      VALUES (@date, @time, @title, @location, @doctor, @notes, @userId)
    `;

    const request = connection.request();
    request.input("date", sql.Date, new Date(app.date));
    request.input("time", sql.VarChar, app.AppointmentTime);
    request.input("title", sql.NVarChar, app.Title);
    request.input("location", sql.NVarChar, app.Location);
    request.input("doctor", sql.NVarChar, app.DoctorName);
    request.input("notes", sql.NVarChar, app.Notes);
    request.input("userId", sql.Int, app.UserID);

    await request.query(query);
  } catch (error) {
    console.error("Database error (createAppointment):", error);
    throw error;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error("Error closing connection:", err);
      }
    }
  }
}

// Update appointment by ID
// - Updates an existing appointment record with new details
async function updateAppointment(id, data) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const query = `
      UPDATE Appointments
      SET AppointmentDate = @date,
          AppointmentTime = @time,
          Title = @title,
          Location = @location,
          DoctorName = @doctor,
          Notes = @notes
      WHERE AppointmentID = @id
    `;

    const request = connection.request();
    request.input("id", sql.Int, id);
    request.input("date", sql.Date, new Date(data.AppointmentDate));
    request.input("time", sql.VarChar, data.AppointmentTime);
    request.input("title", sql.NVarChar, data.Title);
    request.input("location", sql.NVarChar, data.Location);
    request.input("doctor", sql.NVarChar, data.DoctorName);
    request.input("notes", sql.NVarChar, data.Notes);

    await request.query(query);
  } catch (error) {
    console.error("Database error (updateAppointment):", error);
    throw error;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error("Error closing connection:", err);
      }
    }
  }
}

// Delete appointment by ID
// - Deletes an appointment based on AppointmentID
async function deleteAppointment(id) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const query = "DELETE FROM Appointments WHERE AppointmentID = @id";
    const request = connection.request();
    request.input("id", sql.Int, id);
    await request.query(query);
  } catch (error) {
    console.error("Database error (deleteAppointment):", error);
    throw error;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error("Error closing connection:", err);
      }
    }
  }
}

module.exports = {
  getAppointmentsByUserId,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  deleteAppointment
};
