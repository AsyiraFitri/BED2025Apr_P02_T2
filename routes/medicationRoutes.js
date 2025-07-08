const express = require('express');
const router = express.Router();
const controller = require('../controllers/medicationController');

router.get('/', controller.getMedications);
router.post('/', controller.addMedication);
router.put('/:id', controller.updateMedication);
router.delete('/:id', controller.deleteMedication);

module.exports = router;
