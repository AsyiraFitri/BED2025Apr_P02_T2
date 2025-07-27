const express = require('express');
const router = express.Router();
const medicationController = require('../controllers/medicationController');
const { verifyToken } = require('../middlewares/authorizeUser');
const { validateMedicationId, validateMedicationData, validateTrackingData } = require('../middlewares/validateMedication');

// All medication routes require user authorization first
router.use(verifyToken);

// GET /medications/user/:userid - Get all medications for a user
router.get('/user/:userid', medicationController.getMedicationsByUserId);

// GET /medications/:id - Get medication by ID
// Uses validation middleware to check medication ID before calling controller
router.get('/:id', validateMedicationId(), medicationController.getMedicationById);

// POST /medications - Create medication
// Uses validation middleware to check medication data before calling controller
router.post('/', validateMedicationData, medicationController.createMedication);

// PUT /medications/:id - Update medication
// Uses validation middleware to check both ID and data before calling controller
router.put('/:id', validateMedicationId(), validateMedicationData, medicationController.updateMedication);

// DELETE /medications/:id - Delete medication
// Uses validation middleware to check medication ID before calling controller
router.delete('/:id', validateMedicationId(), medicationController.deleteMedication);

// GET /medications/tracking/today - Get today's medication tracking
router.get('/tracking/today', medicationController.getTodayTracking);

// POST /medications/tracking/save - Save medication tracking state
// Uses validation middleware to check tracking data before calling controller
router.post('/tracking/save', validateTrackingData, medicationController.saveTrackingState);

// POST /medications/tracking/reset - Manual reset all tracking (admin/testing)
router.post('/tracking/reset', medicationController.resetAllTracking);

module.exports = router;
