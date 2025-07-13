const sql = require("mssql");
const dbConfig = require("../dbConfig");

// Get all medications for a specific user
async function getMedicationsByUserId(userId) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const query = "SELECT * FROM Medications WHERE UserID = @userId";
    const request = connection.request();
    request.input("userId", sql.Int, userId);
    const result = await request.query(query);
    return result.recordset;
  } catch (error) {
    console.error("Database error (getMedicationsByUserId):", error);
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

// Get one medication by ID
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
async function createMedication(med) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const query = `
      INSERT INTO Medications (Name, Dosage, Frequency, Notes, UserID)
      VALUES (@name, @dosage, @frequency, @notes, @userId)
    `;
    const request = connection.request();
    request.input("name", sql.NVarChar, med.Name);
    request.input("dosage", sql.Int, med.Dosage);
    request.input("frequency", sql.Int, med.Frequency);
    request.input("notes", sql.NVarChar, med.Notes);
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
async function updateMedication(id, med) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const query = `
      UPDATE Medications
      SET Name = @name,
          Dosage = @dosage,
          Frequency = @frequency,
          Notes = @notes
      WHERE MedicationID = @id
    `;
    const request = connection.request();
    request.input("id", sql.Int, id);
    request.input("name", sql.NVarChar, med.Name);
    request.input("dosage", sql.Int, med.Dosage);
    request.input("frequency", sql.Int, med.Frequency);
    request.input("notes", sql.NVarChar, med.Notes);
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
