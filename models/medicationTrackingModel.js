const sql = require("mssql");
const dbConfig = require("../dbConfig");

// Get today's medication tracking for a user
// - Returns all tracking records for today for the given user
async function getTodayTrackingByUserId(userId) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    
    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    
    const query = `
      SELECT ms.MedicationID, ms.ScheduleTime, ms.IsChecked 
      FROM MedicationSchedule ms
      INNER JOIN Medications m ON ms.MedicationID = m.MedicationID
      WHERE m.UserID = @userId AND CAST(GETDATE() AS DATE) = @date
    `;
    
    const request = connection.request();
    request.input("userId", sql.Int, userId);
    request.input("date", sql.Date, today);
    
    const result = await request.query(query);
    return result.recordset;
  } catch (error) {
    console.error("Database error (getTodayTrackingByUserId):", error);
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

// Save or update medication tracking for today
// - Updates IsChecked status for a specific medication/time
async function saveTracking(userId, medicationId, scheduleTime, isChecked) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    
    // Update the IsChecked status for the specific schedule
    const updateQuery = `
      UPDATE ms
      SET IsChecked = @isChecked
      FROM MedicationSchedule ms
      INNER JOIN Medications m ON ms.MedicationID = m.MedicationID
      WHERE m.UserID = @userId 
      AND ms.MedicationID = @medicationId 
      AND ms.ScheduleTime = @scheduleTime
    `;
    
    const request = connection.request();
    request.input("userId", sql.Int, userId);
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
  getTodayTrackingByUserId,
  saveTracking,
  resetAllTracking
};
