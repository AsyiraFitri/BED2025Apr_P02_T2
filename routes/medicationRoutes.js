
const express = require('express');
const router = express.Router();
const medicationController = require('../controllers/medicationController');
const { verifyToken } = require('../middlewares/authorizeUser');
const { validateMedicationId, validateMedicationData, validateTrackingData } = require('../middlewares/validateMedication');

// All medication routes require user authorization first 
router.use(verifyToken);

// GET /medications/user - Get all medications for a user
// Uses authenticated user ID from JWT token
router.get('/user', medicationController.getMedicationsByUserId);

// GET /medications/:id - Get single medication by ID
// Uses validation middleware to check medication ID before calling controller
router.get('/:id', validateMedicationId(), medicationController.getMedicationById);

// POST /medications - Create new medication
// Uses validation middleware to check medication data before calling controller
router.post('/', validateMedicationData, medicationController.createMedication);

// PUT /medications/:id - Update medication by ID
// Uses validation middleware to check both ID and data before calling controller
router.put('/:id', validateMedicationId(), validateMedicationData, medicationController.updateMedication);

// DELETE /medications/:id - Delete medication by ID
// Uses validation middleware to check medication ID before calling controller
router.delete('/:id', validateMedicationId(), medicationController.deleteMedication);

// GET /medications/schedules/user - Get all medication schedules for a user
// Uses authenticated user ID from JWT token to fetch schedule data with checkbox states
router.get('/schedules/user', medicationController.getMedicationSchedulesByUserId);

// POST /medications/tracking/save - Save medication checkbox state
// Uses validation middleware to check tracking data before calling controller
router.post('/tracking/save', validateTrackingData, medicationController.saveTrackingState);

// POST /medications/tracking/reset - Manual reset all tracking (admin/testing)
// Resets all medication tracking states for testing purposes
router.post('/tracking/reset', medicationController.resetAllTracking);

module.exports = router;
