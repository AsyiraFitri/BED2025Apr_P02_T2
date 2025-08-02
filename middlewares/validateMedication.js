// MEDICATION VALIDATION MIDDLEWARE
// Simple validation functions for medication data and parameters
// No database connections - each controller handles its own DB operations

// Validate medication ID parameter
// - Checks if :id parameter is a valid integer
// - Adds validated ID to req.validatedId for controller use
function validateMedicationId() {
  return (req, res, next) => {
    const id = parseInt(req.params.id);
    
    // Check if ID is a valid number
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ error: "Invalid medication ID - must be a positive number" });
    }
    
    // Add validated ID to request object
    req.validatedId = id;
    next();
  };
}

// Validate medication data from request body
// - Checks all required fields for medication creation/update
// - Validates data types and formats
// - Adds validated data to req.validatedData for controller use
function validateMedicationData(req, res, next) {
  const { Name, Dosage, Frequency, Notes } = req.body;
  
  // Check required fields
  if (!Name) {
    return res.status(400).json({ error: "Name is required" });
  }
  if (!Dosage) {
    return res.status(400).json({ error: "Dosage is required" });
  }
  if (!Frequency) {
    return res.status(400).json({ error: "Frequency is required" });
  }
  
  // Get UserID from JWT token (set by authentication middleware)
  const userId = req.user.id || req.user.UserID;
  if (!userId) {
    return res.status(401).json({ error: "User not authenticated" });
  }
  
  // Build validated medication object
  const validatedMedication = {
    Name: Name.trim(),
    Dosage: Dosage.toString().trim(),
    Frequency: Frequency.toString().trim(),
    Notes: Notes ? Notes.trim() : "No special instructions",
    UserID: userId
  };
  
  // Add validated data to request object
  req.validatedData = validatedMedication;
  next();
}

// Validate medication tracking save data
// - Checks required fields for saving medication tracking state
// - Validates data types and formats
function validateTrackingData(req, res, next) {
  const { medicationId, scheduleTime, isChecked } = req.body;
  
  // Check required fields
  if (!medicationId) {
    return res.status(400).json({ error: "medicationId is required" });
  }
  if (!scheduleTime) {
    return res.status(400).json({ error: "scheduleTime is required" });
  }
  if (typeof isChecked !== 'boolean') {
    return res.status(400).json({ error: "isChecked must be a boolean value" });
  }
  
  // Validate medicationId is a number
  const medicationIdNum = parseInt(medicationId);
  if (isNaN(medicationIdNum) || medicationIdNum <= 0) {
    return res.status(400).json({ error: "medicationId must be a positive number" });
  }
  
  // Validate scheduleTime is one of the allowed values
  const allowedTimes = ['Morning', 'Afternoon', 'Evening', 'Night'];
  if (!allowedTimes.includes(scheduleTime)) {
    return res.status(400).json({ error: "scheduleTime must be one of: Morning, Afternoon, Evening, Night" });
  }
  
  // Add validated data to request object
  req.validatedTrackingData = {
    medicationId: medicationIdNum,
    scheduleTime: scheduleTime.trim(),
    isChecked
  };
  
  next();
}

module.exports = {
  validateMedicationId,
  validateMedicationData,
  validateTrackingData
};
