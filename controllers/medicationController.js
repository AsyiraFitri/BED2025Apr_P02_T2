const medicationModel = require("../models/medicationModel");


// Get all medications for the authenticated user
// - Uses authenticated user ID from token (req.user.UserID)
// - Calls model to fetch all medications for the user
async function getMedicationsByUserId(req, res) {
  try {
    // Get authenticated user ID from JWT token (set by verifyToken middleware)
    const userId = req.user.id || req.user.UserID;
    if (!userId) {
      return res.status(401).json({ error: "User ID not found in token" });
    }
    
    // Call model to fetch medications
    const medications = await medicationModel.getMedicationsByUserId(userId);
    res.json(medications);
  } catch (error) {
    console.error("Controller error (getMedicationsByUserId):", error);
    res.status(500).json({ error: "Failed to fetch medications" });
  }
}

// Get one medication by ID
// - Uses validated medication ID from middleware (req.validatedId)
// - Calls model to return a single medication based on MedicationID
async function getMedicationById(req, res) {
  try {
    // Get validated medication ID from middleware
    const id = req.validatedId;
    
    // Call model to fetch specific medication
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

// Create a new medication
// - Uses validated medication data from middleware (req.validatedData)
// - Calls the model to insert the validated medication
async function createMedication(req, res) {
  try {
    // Get validated medication data from middleware
    const medication = req.validatedData;
    
    // Call model to create medication
    await medicationModel.createMedication(medication);
    res.status(201).json({ message: "Medication created successfully" });
  } catch (error) {
    console.error("Controller error (createMedication):", error);
    res.status(500).json({ error: "Failed to create medication" });
  }
}

// Update medication by ID
// - Uses validated ID from middleware (req.validatedId)
// - Uses validated medication data from middleware (req.validatedData)
// - Updates medication via model
async function updateMedication(req, res) {
  try {
    // Get validated data from middleware
    const id = req.validatedId;
    const medication = req.validatedData;
    
    // Call model to update medication
    await medicationModel.updateMedication(id, medication);
    res.json({ message: "Medication updated successfully" });
  } catch (error) {
    console.error("Controller error (updateMedication):", error);
    res.status(500).json({ error: "Failed to update medication" });
  }
}

// Delete medication by ID
// - Uses validated medication ID from middleware (req.validatedId)
// - Calls model to delete the medication from the database
async function deleteMedication(req, res) {
  try {
    // Get validated medication ID from middleware
    const id = req.validatedId;
    
    // Call model to delete medication
    await medicationModel.deleteMedication(id);
    res.json({ message: "Medication deleted successfully" });
  } catch (error) {
    console.error("Controller error (deleteMedication):", error);
    res.status(500).json({ error: "Failed to delete medication" });
  }
}

// Get all medication schedules (with checkbox state) for the authenticated user
// - Uses authenticated user ID from token (req.user.UserID)
async function getMedicationSchedulesByUserId(req, res) {
  try {
    // Receives a request from the client to get all medication schedules for the authenticated user
    // Extracts the user ID from the JWT token set by the verifyToken middleware
    const userId = req.user.id || req.user.UserID; 

    // Calls the model to fetch medication schedules for the user
    const schedules = await medicationModel.getMedicationSchedulesByUserId(userId);

    // Sends the schedules as a JSON response
    res.json(schedules);
  } catch (error) {
    console.error("Controller error (getMedicationSchedulesByUserId):", error);
    res.status(500).json({ error: "Failed to fetch medication schedules" });
  }
}

// Save medication checkbox state
// - Uses validated tracking data from middleware (req.validatedTrackingData)
// - Saves checkbox state for a specific medication/time
async function saveTrackingState(req, res) {
  try {
    // Get validated tracking data from middleware
    const { medicationId, scheduleTime, isChecked } = req.validatedTrackingData;

    // Call model to save tracking state
    await medicationModel.saveTracking(medicationId, scheduleTime, isChecked);
    res.json({ message: "Tracking state saved successfully" });
  } catch (error) {
    console.error("Controller error (saveTrackingState):", error);
    res.status(500).json({ error: "Failed to save tracking state" });
  }
}

// Reset all medication tracking (admin function for daily reset)
// - Resets all checkbox states to unchecked
async function resetAllTracking(req, res) {
  try {
    // Call model to reset all medication tracking
    const resetCount = await medicationModel.resetAllTracking();

    // Respond with the number of records reset
    res.json({ 
      message: "All medication tracking reset successfully",
      resetCount 
    });
  } catch (error) {
    console.error("Controller error (resetAllTracking):", error);
    res.status(500).json({ error: "Failed to reset medication tracking" });
  }
}

module.exports = {
  getMedicationsByUserId,
  getMedicationById,
  createMedication,
  updateMedication,
  deleteMedication,
  saveTrackingState,
  resetAllTracking,
  getMedicationSchedulesByUserId
};
