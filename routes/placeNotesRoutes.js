const express = require("express");
const router = express.Router();
const placeNotesController = require("../controllers/placeNotesController");
const { verifyToken, } = require('../middlewares/authorizeUser');

// get all notes for a user's specific address
router.get("/:address", verifyToken, placeNotesController.getNotesForUserAddress);

// create a new note for a specific address
router.post("/", verifyToken, placeNotesController.createNoteForAddress);

// update a specific note
router.put("/:noteId", verifyToken, placeNotesController.updateNoteForAddress);

// delete a specific note
router.delete("/:noteId", verifyToken, placeNotesController.deleteNoteForAddress);

module.exports = router;
