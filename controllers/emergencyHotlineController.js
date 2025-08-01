const hotlineModel = require('../models/emergencyHotlineModel');

async function getHotlines(req, res) {
  try {
    const hotlines = await hotlineModel.getAllHotlines();
    res.json(hotlines);
  } catch (err) {
    console.error("Error fetching hotlines:", err);
    res.status(500).json({ error: "Failed to retrieve hotlines" });
  }
}

module.exports = { getHotlines };
