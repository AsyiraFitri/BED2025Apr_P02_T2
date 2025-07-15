const express = require('express');
const router = express.Router();
const medicationController = require('../controllers/medicationController');
const { verifyToken } = require('../middlewares/authorizeUser');  // <-- import auth middleware

// Get all medications for a user (userId param, protected)
router.get('/user/:userid', verifyToken, medicationController.getMedicationsByUserId);

// Get medication by medication ID (protected)
router.get('/:id', verifyToken, medicationController.getMedicationById);

// Create medication (protected)
router.post('/', verifyToken, medicationController.createMedication);

// Update medication (protected)
router.put('/:id', verifyToken, medicationController.updateMedication);

// Delete medication (protected)
router.delete('/:id', verifyToken, medicationController.deleteMedication);

module.exports = router;
