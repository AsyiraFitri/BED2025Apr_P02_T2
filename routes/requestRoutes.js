const express = require('express');
const router = express.Router();
const requestsController  = require('../controllers/request-helpController');

router.get('/', requestsController.getHelpRequests);
router.post('/', requestsController.postHelpRequest);

module.exports = router;
