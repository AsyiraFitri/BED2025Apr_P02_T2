const placeNotesModel = require("../models/placeNotesModel");

// get all notes associated with a specific user's address
async function getNotesForUserAddress(req, res) {
  try {
    const userId = req.user.id || req.user.UserID;
    const address = req.params.address; // address to check for notes

    const notes = await placeNotesModel.getNotesByAddressForUser(userId, address);

    if (notes.length === 0) {
      return res.status(404).json({ message: "No notes found for this address" });
    }

    res.json(notes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// create a new note for a specific address
async function createNoteForAddress(req, res) {
  try {
    const { address, noteText } = req.body;
    const userId = req.user.id || req.user.UserID;
    await placeNotesModel.createPlaceNoteForAddress(userId, address, noteText);

    res.status(201).json({ message: "Note created successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// update a specific note for an address
async function updateNoteForAddress(req, res) {
  try {
    const noteId = parseInt(req.params.noteId);
    const { noteText } = req.body;

    await placeNotesModel.updatePlaceNoteById(noteId, noteText);

    res.json({ message: "Note updated successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// delete a specific note for an address
async function deleteNoteForAddress(req, res) {
  try {
    const noteId = parseInt(req.params.noteId);

    await placeNotesModel.deletePlaceNoteById(noteId);

    res.json({ message: "Note deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  getNotesForUserAddress,
  createNoteForAddress,
  updateNoteForAddress,
  deleteNoteForAddress,
};
