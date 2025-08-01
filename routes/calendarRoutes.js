const express = require('express');
const router = express.Router();
const service = require('../public/js/googleCalendarService.js');
const { validateGoogleTokens, validateGoogleEventId } = require('../middlewares/validateAppointment');


// GOOGLE CALENDAR ROUTES - Entry point for all Google Calendar API endpoints
// Route Structure: /google/...
// These routes handle OAuth flow and calendar synchronization

// GET /auth/google
// Initiates Google OAuth login flow
// No middleware needed - just redirects to Google
router.get('/auth/google', service.loginWithGoogle);

router.get('/auth/google/callback', service.handleCallback);

router.post('/google/sync', service.syncAppointment);

router.put('/google/sync/:eventId', validateGoogleEventId, validateGoogleTokens, service.editAppointment);

// DELETE /google/sync/:eventId
// Deletes a Google Calendar event
// Middleware chain:
// 1. validateGoogleEventId - Validate Google Calendar event ID parameter
// 2. validateGoogleTokens - Validate Google OAuth tokens
// 3. Service - Delete Google Calendar event
router.delete('/google/sync/:eventId', validateGoogleEventId, validateGoogleTokens, service.deleteAppointment);

module.exports = router;
