const express = require('express');
const router = express.Router();
const controller = require('../controllers/calendarController');
const { validateGoogleTokens, validateGoogleEventId, validateGoogleCalendarData } = require('../middlewares/validateCalendar');

// GOOGLE CALENDAR ROUTES - Entry point for all Google Calendar API endpoints
// Route Structure: /google/...
// These routes handle OAuth flow and calendar synchronization

// GET /auth/google
// Initiates Google OAuth login flow
// No middleware needed - just redirects to Google
router.get('/auth/google', controller.loginWithGoogle);

// GET /auth/google/callback
// Handles OAuth callback from Google
// No middleware needed - processes authorization code
router.get('/auth/google/callback', controller.handleCallback);

// POST /google/sync
// Creates or updates a Google Calendar event
// Middleware chain:
// 1. express.json() - Parse JSON request body
// 2. validateGoogleTokens - Validate Google OAuth tokens
// 3. validateGoogleCalendarData - Validate appointment data for calendar
// 4. Controller - Sync appointment to Google Calendar
router.post('/google/sync', express.json(), validateGoogleTokens, validateGoogleCalendarData, controller.syncAppointment);

// PUT /google/sync/:eventId
// Updates an existing Google Calendar event
// Middleware chain:
// 1. express.json() - Parse JSON request body
// 2. validateGoogleEventId - Validate Google Calendar event ID parameter
// 3. validateGoogleTokens - Validate Google OAuth tokens
// 4. validateGoogleCalendarData - Validate updated appointment data
// 5. Controller - Update Google Calendar event
router.put('/google/sync/:eventId', express.json(), validateGoogleEventId, validateGoogleTokens, validateGoogleCalendarData, controller.editAppointment);

// DELETE /google/sync/:eventId
// Deletes a Google Calendar event
// Middleware chain:
// 1. validateGoogleEventId - Validate Google Calendar event ID parameter
// 2. validateGoogleTokens - Validate Google OAuth tokens
// 3. Controller - Delete Google Calendar event
router.delete('/google/sync/:eventId', validateGoogleEventId, validateGoogleTokens, controller.deleteAppointment);

module.exports = router;
