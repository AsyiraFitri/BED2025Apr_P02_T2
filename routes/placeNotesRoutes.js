const express = require("express");
const router = express.Router();
const placeNotesController = require("../controllers/placeNotesController");

// get all notes for a user's specific address
router.get("/:userId/:address", placeNotesController.getNotesForUserAddress);

// create a new note for a specific address
router.post("/", placeNotesController.createNoteForAddress);

// update a specific note
router.put("/:noteId", placeNotesController.updateNoteForAddress);

// delete a specific note
router.delete("/:noteId", placeNotesController.deleteNoteForAddress);

module.exports = router;
