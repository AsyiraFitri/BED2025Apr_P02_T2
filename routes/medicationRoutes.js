const express = require('express');
const router = express.Router();
const medicationController = require('../controllers/medicationController');

// Get all medications for a user (assume userId from query or middleware)
router.get('/', medicationController.getMedicationsByUserId);

// Get medication by ID
router.get('/:id', medicationController.getMedicationById);

// Create new medication
router.post('/', medicationController.createMedication);

// Update medication by ID
router.put('/:id', medicationController.updateMedication);

// Delete medication by ID
router.delete('/:id', medicationController.deleteMedication);

module.exports = router;
