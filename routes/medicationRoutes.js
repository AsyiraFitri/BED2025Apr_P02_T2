
const express = require('express');
const router = express.Router();
const medicationController = require('../controllers/medicationController');
const { verifyToken } = require('../middlewares/authorizeUser');
const { validateMedicationId, validateMedicationData, validateTrackingData } = require('../middlewares/validateMedication');

// All medication routes require user authorization first
router.use(verifyToken);

// GET /medications/user - Get all medications for a user
router.get('/user', medicationController.getMedicationsByUserId);

// Get medication by ID
// Uses validation middleware to check medication ID before calling controller
router.get('/:id', validateMedicationId(), medicationController.getMedicationById);

// Create medication
// Uses validation middleware to check medication data before calling controller
router.post('/', validateMedicationData, medicationController.createMedication);

// Update medication
// Uses validation middleware to check both ID and data before calling controller
router.put('/:id', validateMedicationId(), validateMedicationData, medicationController.updateMedication);

// Delete medication
// Uses validation middleware to check medication ID before calling controller
router.delete('/:id', validateMedicationId(), medicationController.deleteMedication);

// Get all medication schedules (with checkbox state) for the authenticated user
router.get('/schedules/user', medicationController.getMedicationSchedulesByUserId);

// Save medication checkbox state
// Uses validation middleware to check tracking data before calling controller
router.post('/tracking/save', validateTrackingData, medicationController.saveTrackingState);

// Manual reset all tracking (admin/testing)
router.post('/tracking/reset', medicationController.resetAllTracking);

module.exports = router;
