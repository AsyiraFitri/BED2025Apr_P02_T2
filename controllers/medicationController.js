const medicationModel = require("../models/medicationModel");

// Get medications by user ID
async function getMedicationsByUserId(req, res) {
  try {
    const userId = parseInt(req.params.userid);
    if (isNaN(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const medications = await medicationModel.getMedicationsByUserId(userId);
    res.json(medications);
  } catch (error) {
    console.error("Controller error (getMedicationsByUserId):", error);
    res.status(500).json({ error: "Failed to fetch medications" });
  }
}

// Get one medication by ID
async function getMedicationById(req, res) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid medication ID" });
    }

    const medication = await medicationModel.getMedicationById(id);
    if (!medication) {
      return res.status(404).json({ error: "Medication not found" });
    }

    res.json(medication);
  } catch (error) {
    console.error("Controller error (getMedicationById):", error);
    res.status(500).json({ error: "Failed to fetch medication" });
  }
}

// Create medication
async function createMedication(req, res) {
  try {
    const med = {
      Name: req.body.Name,
      Dosage: parseInt(req.body.Dosage),
      Frequency: parseInt(req.body.Frequency),
      Notes: req.body.Notes || "No special instructions",
      UserID: 1 // Replace with req.user.userID if using JWT
    };

    await medicationModel.createMedication(med);
    res.status(201).json({ message: "Medication created successfully" });
  } catch (error) {
    console.error("Controller error (createMedication):", error);
    res.status(500).json({ error: "Failed to create medication" });
  }
}

// Update medication
async function updateMedication(req, res) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid medication ID" });
    }

    const med = {
      Name: req.body.Name,
      Dosage: parseInt(req.body.Dosage),
      Frequency: parseInt(req.body.Frequency),
      Notes: req.body.Notes || "No special instructions"
    };

    await medicationModel.updateMedication(id, med);
    res.json({ message: "Medication updated successfully" });
  } catch (error) {
    console.error("Controller error (updateMedication):", error);
    res.status(500).json({ error: "Failed to update medication" });
  }
}

// Delete medication
async function deleteMedication(req, res) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid medication ID" });
    }

    await medicationModel.deleteMedication(id);
    res.json({ message: "Medication deleted successfully" });
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
