const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');
const { verifyToken } = require('../middlewares/authorizeUser');

router.get('/', verifyToken, contactController .getAllContacts);
router.post('/', verifyToken, contactController .createContact);
router.delete('/:id', verifyToken, contactController.deleteContact);
router.get('/:id', verifyToken, contactController.getContactById);
router.patch('/:id', verifyToken, contactController.updateContact);
module.exports = router;
