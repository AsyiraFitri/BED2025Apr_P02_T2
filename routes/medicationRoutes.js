const express = require('express');
const router = express.Router();
const medicationController = require('../controllers/medicationController');

// Get all medications for a user (userId param)
router.get('/user/:userid', medicationController.getMedicationsByUserId);

// Get medication by medication ID
router.get('/:id', medicationController.getMedicationById);

// Create medication
router.post('/', medicationController.createMedication);

// Update medication
router.put('/:id', medicationController.updateMedication);

// Delete medication
router.delete('/:id', medicationController.deleteMedication);

module.exports = router;
