const sql = require("mssql");
const dbConfig = require("../dbConfig");

// Function to check if a place is saved for a specific user
async function checkSavedPlace(userId, placeName) {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input("UserID", sql.Int, userId)
      .input("PlaceName", sql.NVarChar, placeName)
      .query("SELECT * FROM SavedPlaces WHERE UserID = @UserID AND PlaceName = @PlaceName");

    return result.recordset.length > 0 ? result.recordset[0] : null; // Returns the saved place or null if not found
  } catch (error) {
    throw error;
  }
}

async function getUserPlaces(userId) {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input("UserID", sql.Int, userId)
      .query("SELECT * FROM SavedPlaces WHERE UserID = @UserID");
    return result.recordset;
  } catch (error) {
    throw error;
  }
}

async function createPlace(userId, placeName, address, latitude, longitude) {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input("UserID", sql.Int, userId)
      .input("PlaceName", sql.NVarChar, placeName)
      .input("Address", sql.NVarChar, address)
      .input("Latitude", sql.Float, latitude)
      .input("Longitude", sql.Float, longitude)
      .query("INSERT INTO SavedPlaces (UserID, PlaceName, Address, Latitude, Longitude) VALUES (@UserID, @PlaceName, @Address, @Latitude, @Longitude)");
    return result;
  } catch (error) {
    throw error;
  }
}

async function updatePlace(placeId, placeName, address, latitude, longitude) {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input("PlaceID", sql.Int, placeId)
      .input("PlaceName", sql.NVarChar, placeName)
      .input("Address", sql.NVarChar, address)
      .input("Latitude", sql.Float, latitude)
      .input("Longitude", sql.Float, longitude)
      .query("UPDATE SavedPlaces SET PlaceName = @PlaceName, Address = @Address, Latitude = @Latitude, Longitude = @Longitude WHERE PlaceID = @PlaceID");
    return result;
  } catch (error) {
    throw error;
  }
}

async function deletePlace(placeId) {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input("PlaceID", sql.Int, placeId)
      .query("DELETE FROM SavedPlaces WHERE PlaceID = @PlaceID");
    return result;
  } catch (error) {
    throw error;
  }
}

module.exports = {
  checkSavedPlace,
  getUserPlaces,
  createPlace,
  updatePlace,
  deletePlace,
};
