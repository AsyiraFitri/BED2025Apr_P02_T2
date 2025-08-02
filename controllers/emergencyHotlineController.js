const hotlineModel = require('../models/emergencyHotlineModel');

async function getHotlines(req, res) {
  try {
    console.log('Controller: Fetching hotlines...'); // Debug log
    const hotlines = await hotlineModel.getAllHotlines();
    console.log('Controller: Hotlines fetched:', hotlines.length); // Debug log
    res.json(hotlines);
  } catch (err) {
    console.error("Error fetching hotlines:", err);
    res.status(500).json({ error: "Failed to retrieve hotlines" });
  }
}

module.exports = { getHotlines };