const express = require('express');
const router = express.Router();
const requestsController  = require('../controllers/request-helpController');

router.get('/', requestsController.getHelpRequests);
router.post('/', requestsController.postHelpRequest);
router.delete('/:id', requestsController.deleteHelpRequest);
router.patch('/:id',requestsController.updateHelpRequest);

module.exports = router;
