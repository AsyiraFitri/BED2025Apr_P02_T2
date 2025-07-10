const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');

// Get all appointments for a user
router.get('/user/:userid', appointmentController.getAppointmentsByUserId);

// Get appointment by appointment ID
router.get('/:id', appointmentController.getAppointmentById);

// Create appointment
router.post('/', appointmentController.createAppointment);

// Update appointment
router.put('/:id', appointmentController.updateAppointment);

// Delete appointment
router.delete('/:id', appointmentController.deleteAppointment);

module.exports = router;
