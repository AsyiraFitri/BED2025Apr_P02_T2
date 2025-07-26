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
  const { MedicationName, Dosage, Frequency, StartDate, EndDate, UserID } = req.body;
  
  // Check required fields
  if (!MedicationName) {
    return res.status(400).json({ error: "MedicationName is required" });
  }
  if (!Dosage) {
    return res.status(400).json({ error: "Dosage is required" });
  }
  if (!Frequency) {
    return res.status(400).json({ error: "Frequency is required" });
  }
  if (!StartDate) {
    return res.status(400).json({ error: "StartDate is required" });
  }
  if (!UserID) {
    return res.status(400).json({ error: "UserID is required" });
  }
  
  // Validate date formats (YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(StartDate)) {
    return res.status(400).json({ error: "StartDate must be in YYYY-MM-DD format" });
  }
  
  // EndDate is optional, but if provided must be valid format
  if (EndDate && !dateRegex.test(EndDate)) {
    return res.status(400).json({ error: "EndDate must be in YYYY-MM-DD format" });
  }
  
  // Validate UserID is a number
  const userIdNum = parseInt(UserID);
  if (isNaN(userIdNum) || userIdNum <= 0) {
    return res.status(400).json({ error: "UserID must be a positive number" });
  }
  
  // Build validated medication object
  const validatedMedication = {
    MedicationName: MedicationName.trim(),
    Dosage: Dosage.trim(),
    Frequency: Frequency.trim(),
    StartDate,
    EndDate: EndDate || null,
    UserID: userIdNum
  };
  
  // Add validated data to request object
  req.validatedData = validatedMedication;
  next();
}

module.exports = {
  validateMedicationId,
  validateMedicationData
};
