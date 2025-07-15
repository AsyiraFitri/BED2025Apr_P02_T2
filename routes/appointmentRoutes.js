const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const { verifyToken } = require('../middlewares/authorizeUser');  // <-- import your auth middleware

// Get all appointments for a user (protected)
router.get('/user/:userid', verifyToken, appointmentController.getAppointmentsByUserId);

// Get appointment by appointment ID (protected)
router.get('/:id', verifyToken, appointmentController.getAppointmentById);

// Create appointment (protected)
router.post('/', verifyToken, appointmentController.createAppointment);

// Update appointment (protected)
router.put('/:id', verifyToken, appointmentController.updateAppointment);

// Delete appointment (protected)
router.delete('/:id', verifyToken, appointmentController.deleteAppointment);

module.exports = router;
