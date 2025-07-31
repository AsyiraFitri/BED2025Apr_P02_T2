const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const { verifyToken } = require('../middlewares/authorizeUser');
const { 
  validateAppointmentId, 
  validateUserId, 
  validateAppointmentData 
} = require('../middlewares/validateAppointment');

// All appointment routes require user authorization first
router.use(verifyToken);

// GET /appointments/user/:userid - Get all appointments for a user
// Uses validation middleware to check user ID before calling controller
router.get('/user', appointmentController.getAppointmentsByUserId);

// GET /appointments/:id - Get single appointment by ID
// Uses validation middleware to check appointment ID before calling controller
router.get('/:id', validateAppointmentId(), appointmentController.getAppointmentById);

// POST /appointments - Create new appointment
// Uses validation middleware to check appointment data before calling controller
router.post('/', validateAppointmentData, appointmentController.createAppointment);

// PUT /appointments/:id - Update appointment by ID
// Uses validation middleware to check both ID and data before calling controller
router.put('/:id', validateAppointmentId(), validateAppointmentData, appointmentController.updateAppointment);

// DELETE /appointments/:id - Delete appointment by ID
// Uses validation middleware to check appointment ID before calling controller
router.delete('/:id', validateAppointmentId(), appointmentController.deleteAppointment);

module.exports = router;
