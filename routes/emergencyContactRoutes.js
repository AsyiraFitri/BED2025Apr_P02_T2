const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');
const { verifyToken } = require('../middlewares/authorizeUser');

router.get('/', verifyToken, contactController .getAllContacts);
router.post('/', verifyToken, contactController .createContact);

module.exports = router;
