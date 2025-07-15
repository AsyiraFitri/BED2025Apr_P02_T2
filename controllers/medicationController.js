const medicationModel = require("../models/medicationModel");

// Require authentication middleware if not done
// Assuming req.user is already populated via middleware

async function getMedicationsByUserId(req, res) {
  try {
    const userId = req.user.UserID;
    const medications = await medicationModel.getMedicationsByUserId(userId);
    res.json(medications);
  } catch (error) {
    console.error("Controller error (getMedicationsByUserId):", error);
    res.status(500).json({ error: "Failed to fetch medications" });
  }
}

async function getMedicationById(req, res) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

    const medication = await medicationModel.getMedicationById(id);
    if (!medication) return res.status(404).json({ error: "Not found" });

    // Optional: check if it belongs to req.user.UserID
    res.json(medication);
  } catch (error) {
    console.error("Controller error (getMedicationById):", error);
    res.status(500).json({ error: "Failed to fetch medication" });
  }
}

async function createMedication(req, res) {
  try {
    const med = {
      Name: req.body.Name,
      Dosage: parseInt(req.body.Dosage),
      Frequency: parseInt(req.body.Frequency),
      Notes: req.body.Notes || "No special instructions",
      UserID: req.user.UserID
    };

    await medicationModel.createMedication(med);
    res.status(201).json({ message: "Medication created successfully" });
  } catch (error) {
    console.error("Controller error (createMedication):", error);
    res.status(500).json({ error: "Failed to create medication" });
  }
}

async function updateMedication(req, res) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

    const med = {
      Name: req.body.Name,
      Dosage: parseInt(req.body.Dosage),
      Frequency: parseInt(req.body.Frequency),
      Notes: req.body.Notes || "No special instructions"
    };

    await medicationModel.updateMedication(id, med);
    res.json({ message: "Updated successfully" });
  } catch (error) {
    console.error("Controller error (updateMedication):", error);
    res.status(500).json({ error: "Failed to update medication" });
  }
}

async function deleteMedication(req, res) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

    await medicationModel.deleteMedication(id);
    res.json({ message: "Deleted successfully" });
  } catch (error) {
    console.error("Controller error (deleteMedication):", error);
    res.status(500).json({ error: "Failed to delete medication" });
  }
}

module.exports = {
  getMedicationsByUserId,
  getMedicationById,
  createMedication,
  updateMedication,
  deleteMedication
};
