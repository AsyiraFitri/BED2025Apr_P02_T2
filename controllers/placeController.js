const placeModel = require("../models/placeModel");

async function getUserPlaces(req, res) {
  try {
    const userId = parseInt(req.params.userId);
    const places = await placeModel.getUserPlaces(userId);
    res.json(places);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function createPlace(req, res) {
  try {
    const { userId, placeName, address, latitude, longitude } = req.body;
    await placeModel.createPlace(userId, placeName, address, latitude, longitude);
    res.status(201).json({ message: "Place created" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function updatePlace(req, res) {
  try {
    const placeId = parseInt(req.params.placeId);
    const { placeName, address, latitude, longitude } = req.body;
    await placeModel.updatePlace(placeId, placeName, address, latitude, longitude);
    res.json({ message: "Place updated" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function deletePlace(req, res) {
  try {
    const placeId = parseInt(req.params.placeId);
    await placeModel.deletePlace(placeId);
    res.json({ message: "Place deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  getUserPlaces,
  createPlace,
  updatePlace,
  deletePlace,
};
