const express = require('express');
const router = express.Router();
const controller = require('../controllers/calendarController');

router.get('/auth/google', controller.loginWithGoogle);
router.get('/auth/google/callback', controller.handleCallback);
router.post('/google/sync', express.json(), controller.syncAppointment);
router.get('/google/events', controller.listEvents);

module.exports = router;
