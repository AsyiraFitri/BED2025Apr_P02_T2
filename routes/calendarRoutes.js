const express = require('express');
const router = express.Router();
const controller = require('../controllers/calendarController');

router.get('/auth/google', controller.loginWithGoogle);
router.get('/auth/google/callback', controller.handleCallback);
router.post('/google/sync', express.json(), controller.syncAppointment); // CREATE
router.put('/google/sync/:eventId', express.json(), controller.editAppointment); // UPDATE
router.delete('/google/sync/:eventId', controller.deleteAppointment); // DELETE

module.exports = router;
