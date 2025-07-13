const express = require('express');
const router = express.Router();
const requestsController  = require('../controllers/request-helpController');

router.get('/', requestsController.getHelpRequests);

module.exports = router;
