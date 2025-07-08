const express = require('express');
const router = express.Router();
const controller = require('../controllers/appointmentController');

router.get('/', controller.getAppointments);
router.post('/', controller.addAppointment);
router.put('/:id', controller.updateAppointment);
router.delete('/:id', controller.deleteAppointment);

module.exports = router;
