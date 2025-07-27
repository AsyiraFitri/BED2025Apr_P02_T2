const express = require('express');
const router = express.Router();
const controller = require('../controllers/calendarController');
// const { validateGoogleTokens, validateGoogleEventId, validateGoogleCalendarData } = require('../middlewares/validateCalendar');

// GOOGLE CALENDAR ROUTES - Entry point for all Google Calendar API endpoints
// Route Structure: /google/...
// These routes handle OAuth flow and calendar synchronization

// GET /auth/google
// Initiates Google OAuth login flow
// No middleware needed - just redirects to Google
router.get('/auth/google', controller.loginWithGoogle);

router.get('/auth/google/callback', controller.handleCallback);

router.post('/google/sync', express.json(), controller.syncAppointment);


router.put('/google/sync/:eventId', express.json(), controller.editAppointment);

// DELETE /google/sync/:eventId
// Deletes a Google Calendar event
// Middleware chain:
// 1. validateGoogleEventId - Validate Google Calendar event ID parameter
// 2. validateGoogleTokens - Validate Google OAuth tokens
// 3. Controller - Delete Google Calendar event
router.delete('/google/sync/:eventId', controller.deleteAppointment);

module.exports = router;
