// routes/request-helpRoutes.js
const express = require('express');
const router = express.Router();
const { 
  getHelpRequests, 
  postHelpRequest, 
  deleteHelpRequest, 
  updateHelpRequest 
} = require('../controllers/request-helpController');
const { validateRequestId, validateStatus } = require('../middlewares/requestValidation');

router.get('/', getHelpRequests);
router.post('/', postHelpRequest);
router.delete('/:id', validateRequestId, deleteHelpRequest);
router.patch('/:id', validateRequestId, validateStatus, updateHelpRequest);

module.exports = router;
