// APPOINTMENT VALIDATION MIDDLEWARE
// Simple validation functions for appointment data and parameters
// No database connections - each controller handles its own DB operations

// Validate appointment ID parameter
// - Checks if :id parameter is a valid integer
// - Adds validated ID to req.validatedId for controller use
function validateAppointmentId() {
  return (req, res, next) => {
    const id = parseInt(req.params.id);
    
    // Check if ID is a valid number
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ error: "Invalid appointment ID - must be a positive number" });
    }
    
    // Add validated ID to request object
    req.validatedId = id;
    next();
  };
}

// Validate user ID parameter
// - Checks if :userid parameter is a valid integer
// - Adds validated user ID to req.validatedUserId for controller use
function validateUserId() {
  return (req, res, next) => {
    const userId = parseInt(req.params.userid);
    
    // Check if user ID is a valid number
    if (isNaN(userId) || userId <= 0) {
      return res.status(400).json({ error: "Invalid user ID - must be a positive number" });
    }
    
    // Add validated user ID to request object
    req.validatedUserId = userId;
    next();
  };
}

// Validate appointment data from request body
// - Checks all required fields for appointment creation/update
// - Validates data types and formats
// - Adds validated data to req.validatedData for controller use
function validateAppointmentData(req, res, next) {
  const { AppointmentDate, AppointmentTime, Title, Location, DoctorName, Notes, UserID, GoogleEventID } = req.body;
  
  // Check required fields
  if (!AppointmentDate) {
    return res.status(400).json({ error: "AppointmentDate is required" });
  }
  if (!AppointmentTime) {
    return res.status(400).json({ error: "AppointmentTime is required" });
  }
  if (!Title) {
    return res.status(400).json({ error: "Title is required" });
  }
  if (!Location) {
    return res.status(400).json({ error: "Location is required" });
  }
  if (!DoctorName) {
    return res.status(400).json({ error: "DoctorName is required" });
  }
  if (!UserID) {
    return res.status(400).json({ error: "UserID is required" });
  }
  
  // Validate date format (YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(AppointmentDate)) {
    return res.status(400).json({ error: "AppointmentDate must be in YYYY-MM-DD format" });
  }
  
  // Validate time format (HH:MM)
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  if (!timeRegex.test(AppointmentTime)) {
    return res.status(400).json({ error: "AppointmentTime must be in HH:MM format" });
  }
  
  // Validate UserID is a number
  const userIdNum = parseInt(UserID);
  if (isNaN(userIdNum) || userIdNum <= 0) {
    return res.status(400).json({ error: "UserID must be a positive number" });
  }
  
  // Build validated appointment object
  const validatedAppointment = {
    AppointmentDate,
    AppointmentTime,
    Title: Title.trim(),
    Location: Location.trim(),
    DoctorName: DoctorName.trim(),
    Notes: Notes ? Notes.trim() : "No special instructions",
    UserID: userIdNum,
    GoogleEventID: GoogleEventID || null
  };
  
  // Add validated data to request object
  req.validatedData = validatedAppointment;
  next();
}

module.exports = {
  validateAppointmentId,
  validateUserId,
  validateAppointmentData
};
