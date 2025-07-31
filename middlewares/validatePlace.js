const placeModel = require("../models/placeModel");

// input validation middleware (for Create and Update operations)
function validatePlaceData(req, res, next) {
    console.log('Request Body:', req.body); 
  const { placeName, address } = req.body;
  if (!placeName || !address) {
    return res.status(400).json({ error: 'Place name and address are required' });
  }

  next(); // proceed to the next middleware (e.g., create or update place)
}

// check if place already exists (for Create operation)
async function checkSavedPlace(req, res, next) {
  const { placeName } = req.body;
  const userId = req.user.id || req.user.UserID; // `req.user` is populated by an external JWT middleware
    console.log("Checking if place exists for userId:", userId, "with placeName:", placeName);
  try {
    const existingPlace = await placeModel.checkSavedPlace(userId, placeName);
    if (existingPlace) {
      return res.status(400).json({ error: 'Place already exists' });
    }
    next(); // proceed to the next middleware 
  } catch (error) {
    res.status(500).json({ error: 'Error checking place existence' });
  }
}

module.exports = {
  validatePlaceData,
  checkSavedPlace,
};
