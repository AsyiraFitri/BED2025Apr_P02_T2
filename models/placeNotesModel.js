const sql = require("mssql");
const dbConfig = require("../dbConfig");

// get all notes associated with a specific user's address
async function getNotesByAddressForUser(userId, address) {
  try {
    const pool = await sql.connect(dbConfig);
    
    // fetch all notes associated with the address for a specific user
    const result = await pool.request()
      .input("UserID", sql.Int, userId)
      .input("Address", sql.NVarChar, address)
      .query("SELECT * FROM PlaceNotes WHERE UserID = @UserID AND Address = @Address");

    return result.recordset;
  } catch (error) {
    throw error;
  }
}

// create a new note associated with an address
async function createPlaceNoteForAddress(userId, address, noteText) {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input("UserID", sql.Int, userId)
      .input("Address", sql.NVarChar, address)
      .input("NoteText", sql.NVarChar, noteText)
      .query("INSERT INTO PlaceNotes (UserID, Address, NoteText) VALUES (@UserID, @Address, @NoteText)");

    return result;
  } catch (error) {
    throw error;
  }
}

// update an existing note by its ID
async function updatePlaceNoteById(noteId, noteText) {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input("NoteID", sql.Int, noteId)
      .input("NoteText", sql.NVarChar, noteText)
      .query("UPDATE PlaceNotes SET NoteText = @NoteText WHERE NoteID = @NoteID");

    return result;
  } catch (error) {
    throw error;
  }
}

// delete a note by its ID
async function deletePlaceNoteById(noteId) {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input("NoteID", sql.Int, noteId)
      .query("DELETE FROM PlaceNotes WHERE NoteID = @NoteID");

    return result;
  } catch (error) {
    throw error;
  }
}

module.exports = {
  getNotesByAddressForUser,
  createPlaceNoteForAddress,
  updatePlaceNoteById,
  deletePlaceNoteById,
};
