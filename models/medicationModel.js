const sql = require("mssql");
const dbConfig = require("../dbConfig");

// Get all medications for a specific user
// - Retrieves all medications where UserID matches the given input
async function getMedicationsByUserId(userId) {
  let connection;
  try {
    // Connect to the database
    connection = await sql.connect(dbConfig);
    
    // Create parameterized query to prevent SQL injection
    const query = "SELECT * FROM Medications WHERE UserID = @userId";
    const request = connection.request();
    request.input("userId", sql.Int, userId);
    const result = await request.query(query);

    return result.recordset;
  } catch (error) {
    console.error("Database error (getMedicationsByUserId):", error);
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

// Get one medication by ID
// - Retrieves a specific medication based on its MedicationID
async function getMedicationById(id) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const query = "SELECT * FROM Medications WHERE MedicationID = @id";
    const request = connection.request();
    request.input("id", sql.Int, id);
    const result = await request.query(query);

    return result.recordset[0];
  } catch (error) {
    console.error("Database error (getMedicationById):", error);
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

// Create a new medication
// - Inserts a new record into the Medications table
async function createMedication(med) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const query = `
      INSERT INTO Medications (MedicationName, Dosage, Frequency, StartDate, EndDate, UserID)
      VALUES (@name, @dosage, @frequency, @startDate, @endDate, @userId)
    `;

    const request = connection.request();
    request.input("name", sql.NVarChar, med.MedicationName);
    request.input("dosage", sql.NVarChar, med.Dosage);
    request.input("frequency", sql.NVarChar, med.Frequency);
    request.input("startDate", sql.Date, new Date(med.StartDate));
    request.input("endDate", sql.Date, med.EndDate ? new Date(med.EndDate) : null);
    request.input("userId", sql.Int, med.UserID);

    await request.query(query);
  } catch (error) {
    console.error("Database error (createMedication):", error);
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

// Update medication by ID
// - Updates an existing medication record with new details
async function updateMedication(id, med) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const query = `
      UPDATE Medications
      SET MedicationName = @name,
          Dosage = @dosage,
          Frequency = @frequency,
          StartDate = @startDate,
          EndDate = @endDate
      WHERE MedicationID = @id
    `;

    const request = connection.request();
    request.input("id", sql.Int, id);
    request.input("name", sql.NVarChar, med.MedicationName);
    request.input("dosage", sql.NVarChar, med.Dosage);
    request.input("frequency", sql.NVarChar, med.Frequency);
    request.input("startDate", sql.Date, new Date(med.StartDate));
    request.input("endDate", sql.Date, med.EndDate ? new Date(med.EndDate) : null);

    await request.query(query);
  } catch (error) {
    console.error("Database error (updateMedication):", error);
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

// Delete medication by ID
// - Deletes a medication based on MedicationID
async function deleteMedication(id) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const query = "DELETE FROM Medications WHERE MedicationID = @id";
    const request = connection.request();
    request.input("id", sql.Int, id);
    await request.query(query);
  } catch (error) {
    console.error("Database error (deleteMedication):", error);
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
  getMedicationsByUserId,
  getMedicationById,
  createMedication,
  updateMedication,
  deleteMedication
};
