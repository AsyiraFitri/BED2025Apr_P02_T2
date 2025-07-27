// Get all medication schedules (with checkbox state) for a user
// Returns MedicationID, Name, ScheduleTime, IsChecked
async function getMedicationSchedulesByUserId(userId) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const query = `
      SELECT m.MedicationID, m.Name, ms.ScheduleTime, ms.IsChecked
      FROM Medications m
      INNER JOIN MedicationSchedule ms ON m.MedicationID = ms.MedicationID
      WHERE m.UserID = @userId
      ORDER BY m.MedicationID, ms.ScheduleTime
    `;
    const request = connection.request();
    request.input("userId", sql.Int, userId);
    const result = await request.query(query);
    return result.recordset;
  } catch (error) {
    console.error("Database error (getMedicationSchedulesByUserId):", error);
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
// - Creates corresponding schedule entries in MedicationSchedule table
async function createMedication(med) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    
    // Start transaction to ensure both medication and schedule are created together
    const transaction = new sql.Transaction(connection);
    await transaction.begin();
    
    try {
      // Insert medication first
      const medicationQuery = `
        INSERT INTO Medications (Name, Dosage, Frequency, Notes, UserID)
        OUTPUT INSERTED.MedicationID
        VALUES (@name, @dosage, @frequency, @notes, @userId)
      `;

      const medicationRequest = new sql.Request(transaction);
      medicationRequest.input("name", sql.NVarChar, med.Name);
      medicationRequest.input("dosage", sql.NVarChar, med.Dosage);
      medicationRequest.input("frequency", sql.NVarChar, med.Frequency);
      medicationRequest.input("notes", sql.NVarChar, med.Notes);
      medicationRequest.input("userId", sql.Int, med.UserID);

      const medicationResult = await medicationRequest.query(medicationQuery);
      const medicationId = medicationResult.recordset[0].MedicationID;
      
      // Generate schedule times based on frequency
      const scheduleMap = {
        1: ["Morning"],
        2: ["Morning", "Night"],
        3: ["Morning", "Afternoon", "Night"],
        4: ["Morning", "Afternoon", "Evening", "Night"]
      };
      
      const scheduleTimes = scheduleMap[parseInt(med.Frequency)] || [];
      
      // Insert schedule entries for each time slot
      for (const scheduleTime of scheduleTimes) {
        const scheduleQuery = `
          INSERT INTO MedicationSchedule (MedicationID, ScheduleTime, IsChecked)
          VALUES (@medicationId, @scheduleTime, 0)
        `;
        
        const scheduleRequest = new sql.Request(transaction);
        scheduleRequest.input("medicationId", sql.Int, medicationId);
        scheduleRequest.input("scheduleTime", sql.NVarChar, scheduleTime);
        
        await scheduleRequest.query(scheduleQuery);
      }
      
      // Commit transaction
      await transaction.commit();
    } catch (error) {
      // Rollback transaction on error
      await transaction.rollback();
      throw error;
    }
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
// - Updates corresponding schedule entries if frequency changes
async function updateMedication(id, med) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    
    // Start transaction to ensure both medication and schedule are updated together
    const transaction = new sql.Transaction(connection);
    await transaction.begin();
    
    try {
      // Update medication first
      const medicationQuery = `
        UPDATE Medications
        SET Name = @name,
            Dosage = @dosage,
            Frequency = @frequency,
            Notes = @notes
        WHERE MedicationID = @id
      `;

      const medicationRequest = new sql.Request(transaction);
      medicationRequest.input("id", sql.Int, id);
      medicationRequest.input("name", sql.NVarChar, med.Name);
      medicationRequest.input("dosage", sql.NVarChar, med.Dosage);
      medicationRequest.input("frequency", sql.NVarChar, med.Frequency);
      medicationRequest.input("notes", sql.NVarChar, med.Notes);

      await medicationRequest.query(medicationQuery);
      
      // Delete existing schedule entries for this medication
      const deleteScheduleQuery = `
        DELETE FROM MedicationSchedule WHERE MedicationID = @medicationId
      `;
      
      const deleteRequest = new sql.Request(transaction);
      deleteRequest.input("medicationId", sql.Int, id);
      await deleteRequest.query(deleteScheduleQuery);
      
      // Generate new schedule times based on updated frequency
      const scheduleMap = {
        1: ["Morning"],
        2: ["Morning", "Night"],
        3: ["Morning", "Afternoon", "Night"],
        4: ["Morning", "Afternoon", "Evening", "Night"]
      };
      
      const scheduleTimes = scheduleMap[parseInt(med.Frequency)] || [];
      
      // Insert new schedule entries for each time slot
      for (const scheduleTime of scheduleTimes) {
        const scheduleQuery = `
          INSERT INTO MedicationSchedule (MedicationID, ScheduleTime, IsChecked)
          VALUES (@medicationId, @scheduleTime, 0)
        `;
        
        const scheduleRequest = new sql.Request(transaction);
        scheduleRequest.input("medicationId", sql.Int, id);
        scheduleRequest.input("scheduleTime", sql.NVarChar, scheduleTime);
        
        await scheduleRequest.query(scheduleQuery);
      }
      
      // Commit transaction
      await transaction.commit();
    } catch (error) {
      // Rollback transaction on error
      await transaction.rollback();
      throw error;
    }
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
// - Also deletes corresponding schedule entries
async function deleteMedication(id) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    
    // Start transaction to ensure both medication and schedule are deleted together
    const transaction = new sql.Transaction(connection);
    await transaction.begin();
    
    try {
      // Delete schedule entries first (foreign key constraint)
      const deleteScheduleQuery = "DELETE FROM MedicationSchedule WHERE MedicationID = @id";
      const scheduleRequest = new sql.Request(transaction);
      scheduleRequest.input("id", sql.Int, id);
      await scheduleRequest.query(deleteScheduleQuery);
      
      // Delete medication
      const deleteMedicationQuery = "DELETE FROM Medications WHERE MedicationID = @id";
      const medicationRequest = new sql.Request(transaction);
      medicationRequest.input("id", sql.Int, id);
      await medicationRequest.query(deleteMedicationQuery);
      
      // Commit transaction
      await transaction.commit();
    } catch (error) {
      // Rollback transaction on error
      await transaction.rollback();
      throw error;
    }
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


// Save or update medication checkbox state
// - Updates IsChecked status for a specific medication/time
async function saveTracking(medicationId, scheduleTime, isChecked) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const updateQuery = `
      UPDATE MedicationSchedule
      SET IsChecked = @isChecked
      WHERE MedicationID = @medicationId
      AND ScheduleTime = @scheduleTime
    `;
    const request = connection.request();
    request.input("medicationId", sql.Int, medicationId);
    request.input("scheduleTime", sql.NVarChar, scheduleTime);
    request.input("isChecked", sql.Bit, isChecked);
    await request.query(updateQuery);
  } catch (error) {
    console.error("Database error (saveTracking):", error);
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

// Reset all medication tracking for all users (called daily at 12am)
// - Sets all IsChecked values to false for a fresh start each day
async function resetAllTracking() {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const resetQuery = `
      UPDATE MedicationSchedule
      SET IsChecked = 0
    `;
    const request = connection.request();
    const result = await request.query(resetQuery);
    console.log(`Daily reset completed: ${result.rowsAffected[0]} medication schedules reset`);
    return result.rowsAffected[0];
  } catch (error) {
    console.error("Database error (resetAllTracking):", error);
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
  deleteMedication,
  saveTracking,
  resetAllTracking,
  getMedicationSchedulesByUserId
};
