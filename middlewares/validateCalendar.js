// GOOGLE CALENDAR MIDDLEWARE
// This file handles Google Calendar integration middleware:
// - Google OAuth token validation
// - Calendar API error handling
// - Event data formatting
// - Integration with appointment middleware

// Validate Google Calendar tokens from request body
function validateGoogleTokens(req, res, next) {
  // Extract tokens from request body
  const { tokens } = req.body;
  
  // Check if tokens exist
  if (!tokens) {
    return res.status(401).json({ error: 'Google Calendar tokens are required' });
  }
  
  // Check if access token exists
  if (!tokens.access_token) {
    return res.status(401).json({ error: 'Google access token is missing' });
  }
  
  // Store validated tokens in request object for controller use
  req.googleTokens = tokens;
  
  // Continue to next middleware
  next();
}

// Validate Google Calendar event ID parameter
function validateGoogleEventId(req, res, next) {
  // Extract event ID from URL parameters
  const eventId = req.params.eventId;
  
  // Check if event ID exists and is not empty
  if (!eventId || eventId.trim().length === 0) {
    return res.status(400).json({ error: 'Google Calendar event ID is required' });
  }
  
  // Store validated event ID in request object
  req.validatedEventId = eventId.trim();
  
  // Continue to next middleware
  next();
}

// Validate Google Calendar appointment data for sync operations
function validateGoogleCalendarData(req, res, next) {
  // Extract required fields for Google Calendar
  const { Title, AppointmentDate, AppointmentTime } = req.body;
  
  // Initialize empty array to collect validation errors
  const errors = [];
  
  // Validate title for Google Calendar event
  if (!Title || typeof Title !== 'string' || Title.trim().length === 0) {
    errors.push('Title is required for Google Calendar sync');
  }
  
  // Validate appointment date
  if (!AppointmentDate) {
    errors.push('AppointmentDate is required for Google Calendar sync');
  } else {
    // Check if date is valid format
    const date = new Date(AppointmentDate);
    if (isNaN(date.getTime())) {
      errors.push('AppointmentDate must be a valid date for Google Calendar');
    }
  }
  
  // Validate appointment time
  if (!AppointmentTime) {
    errors.push('AppointmentTime is required for Google Calendar sync');
  } else if (!AppointmentTime.match(/^\d{2}:\d{2}$/)) {
    errors.push('AppointmentTime must be in HH:MM format for Google Calendar');
  }
  
  // If any validation errors occurred, return them to client
  if (errors.length > 0) {
    return res.status(400).json({ 
      error: 'Google Calendar validation failed', 
      details: errors 
    });
  }
  
  // Create Google Calendar event data object
  req.googleEventData = {
    Title: Title.trim(),
    AppointmentDate: AppointmentDate,
    AppointmentTime: AppointmentTime,
    Location: req.body.Location || '',
    DoctorName: req.body.DoctorName || '',
    Notes: req.body.Notes || '',
    AppointmentID: req.body.AppointmentID,
    GoogleEventID: req.body.GoogleEventID || null
  };
  
  // Continue to next middleware
  next();
}

// Async error handling wrapper for Google Calendar operations
function googleCalendarAsyncHandler(fn) {
  return (req, res, next) => {
    // Execute the async controller function and catch any promise rejections
    Promise.resolve(fn(req, res, next)).catch(error => {
      // Log the error details for debugging purposes
      console.error('Google Calendar operation error:', error);
      
      // Set default error response values
      let statusCode = 500;
      let message = 'Google Calendar operation failed';
      
      // Analyze error message to provide more specific responses
      if (error.message.includes('Invalid Credentials') || error.message.includes('unauthorized')) {
        // Authentication/authorization failed
        statusCode = 401;
        message = 'Google Calendar authentication failed';
      } else if (error.message.includes('quota') || error.message.includes('rate limit')) {
        // API quota exceeded
        statusCode = 429;
        message = 'Google Calendar API rate limit exceeded';
      } else if (error.message.includes('not found')) {
        // Event not found
        statusCode = 404;
        message = 'Google Calendar event not found';
      } else if (error.message.includes('invalid') || error.message.includes('bad request')) {
        // Invalid request data
        statusCode = 400;
        message = 'Invalid Google Calendar request';
      }
      
      // Send error response with appropriate HTTP status code
      res.status(statusCode).json({
        error: message,
        // Include full error stack only in development mode for security
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
      });
    });
  };
}

// Format appointment data for Google Calendar API
function formatCalendarEventData(appointmentData) {
  // Create start and end datetime objects
  const startDateTime = new Date(`${appointmentData.AppointmentDate}T${appointmentData.AppointmentTime}`);
  const endDateTime = new Date(startDateTime.getTime() + 30 * 60000); // Add 30 minutes
  
  // Return formatted Google Calendar event object
  return {
    summary: appointmentData.Title,
    location: appointmentData.Location || '',
    description: `Doctor: ${appointmentData.DoctorName || 'Not specified'}\n\nNotes: ${appointmentData.Notes || 'No special instructions'}`,
    start: { 
      dateTime: startDateTime.toISOString(), 
      timeZone: 'Asia/Singapore' 
    },
    end: { 
      dateTime: endDateTime.toISOString(), 
      timeZone: 'Asia/Singapore' 
    },
    extendedProperties: {
      private: {
        websiteAppointmentId: appointmentData.AppointmentID?.toString() || ''
      }
    }
  };
}

module.exports = {
  validateGoogleTokens,
  validateGoogleEventId,
  validateGoogleCalendarData,
  googleCalendarAsyncHandler,
  formatCalendarEventData
};
