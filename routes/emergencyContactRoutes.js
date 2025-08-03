// routes/contactRoutes.js
const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');
const { validateContactFields, ensureAuthenticated } = require('../middlewares/contactValidation');

router.get('/', ensureAuthenticated, contactController.getAllContacts);
router.post('/', ensureAuthenticated, validateContactFields, contactController.createContact);
router.get('/:id', ensureAuthenticated, contactController.getContactById);
router.patch('/:id', ensureAuthenticated, validateContactFields, contactController.updateContact);
router.delete('/:id', ensureAuthenticated, contactController.deleteContact);

module.exports = router;
