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


// Validate appointment data from request body
// - Checks all required fields for appointment creation/update
// - Validates data types and formats
// - Adds validated data to req.validatedData for controller use
function validateAppointmentData(req, res, next) {
  const { AppointmentDate, AppointmentTime, Title, Location, DoctorName, Notes, GoogleEventID } = req.body;
  
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

  // Only allow letters, spaces, and periods for DoctorName
  const doctorNameRegex = /^[A-Za-z\s.]+$/;
  if (!doctorNameRegex.test(DoctorName.trim())) {
    return res.status(400).json({ error: "DoctorName must contain only letters, spaces, and periods" });
  }
  
  // Get UserID from JWT token (set by authentication middleware)
  const userId = req.user.id || req.user.UserID;
  if (!userId) {
    return res.status(401).json({ error: "User not authenticated" });
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
  
  // Build validated appointment object
  const validatedAppointment = {
    AppointmentDate,
    AppointmentTime,
    Title: Title.trim(),
    Location: Location.trim(),
    DoctorName: DoctorName.trim(),
    Notes: Notes ? Notes.trim() : "No special instructions",
    UserID: userId,
    GoogleEventID: GoogleEventID || null
  };
  
  // Add validated data to request object
  req.validatedData = validatedAppointment;
  next();
}

// Validate Google Calendar event ID parameter
// - Checks if :eventId parameter exists and is valid
// - Adds validated event ID to req.validatedEventId for controller use
function validateGoogleEventId(req, res, next) {
  const eventId = req.params.eventId;
  
  // Check if event ID is provided
  if (!eventId || eventId.trim() === '') {
    return res.status(400).json({ error: "Google Calendar event ID is required" });
  }
  
  // Add validated event ID to request object
  req.validatedEventId = eventId.trim();
  next();
}

// Validate Google OAuth tokens from request body
// - Checks if tokens object exists and has required properties
// - Adds validated tokens to req.validatedTokens for controller use
function validateGoogleTokens(req, res, next) {
  const { tokens } = req.body;
  
  // Check if tokens object exists
  if (!tokens || typeof tokens !== 'object') {
    return res.status(400).json({ error: "Google OAuth tokens are required" });
  }
  
  // Check if tokens has access_token (minimum requirement)
  if (!tokens.access_token) {
    return res.status(400).json({ error: "Google OAuth access token is required" });
  }
  
  // Add validated tokens to request object
  req.validatedTokens = tokens;
  next();
}

module.exports = {
  validateAppointmentId,
  validateAppointmentData,
  validateGoogleEventId,
  validateGoogleTokens
};
