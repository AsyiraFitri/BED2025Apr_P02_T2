const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');

// Get all appointments for a user (assume userId from query or middleware)
router.get('/', appointmentController.getAppointmentsByUserId);

// Get appointment by ID
router.get('/:id', appointmentController.getAppointmentById);

// Create new appointment
router.post('/', appointmentController.createAppointment);

// Update appointment by ID
router.put('/:id', appointmentController.updateAppointment);

// Delete appointment by ID
router.delete('/:id', appointmentController.deleteAppointment);

module.exports = router;
