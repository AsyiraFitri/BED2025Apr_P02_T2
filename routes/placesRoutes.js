const express = require("express");
const router = express.Router();
const placeController = require("../controllers/placeController");

// Define routes on the router
router.get("/:userId", placeController.getUserPlaces);
router.post("/", placeController.createPlace);
router.put("/:placeId", placeController.updatePlace);
router.delete("/:placeId", placeController.deletePlace);

module.exports = router;
