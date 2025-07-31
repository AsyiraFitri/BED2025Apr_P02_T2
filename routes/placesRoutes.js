const express = require("express");
const router = express.Router();
const placeController = require("../controllers/placeController");
const { verifyToken, } = require('../middlewares/authorizeUser');
const { validatePlaceData, checkSavedPlace, } = require("../middlewares/validatePlace");

// define routes on the router
router.get("/", verifyToken, placeController.getUserPlaces);
router.post("/", verifyToken , validatePlaceData, checkSavedPlace, placeController.createPlace);
router.put("/:placeId", verifyToken, validatePlaceData, placeController.updatePlace);
router.delete("/:placeId", verifyToken, placeController.deletePlace);

module.exports = router;
