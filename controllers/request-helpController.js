// Controller for managing help requests.
// Handles CRUD operations by calling functions from request-helpModel.

const { 
  createHelpRequest, 
  getAllHelpRequests, 
  getRequestById, 
  deleteRequestById, 
  updateRequestStatus 
} = require('../models/request-helpModel');

// GET - Fetch all help requests
async function getHelpRequests(req, res) {
  console.log('GET /api/requests called'); // Debug log
  try {
    const requests = await getAllHelpRequests();
    console.log('Rows returned:', requests.length); // Debug log
    if (requests.length > 0) console.log('Sample data:', requests[0]);
    res.json(requests);
  } catch (error) {
    console.error('Detailed error in getHelpRequests:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message,
      code: error.code 
    });
  }
}

// POST - Create new help request
async function postHelpRequest(req, res) {
  try {
    const requestData = req.body;
    const result = await createHelpRequest(requestData);
    res.status(201).json({ 
      message: 'Request submitted successfully!',
      data: result 
    });
  } catch (error) {
    console.error('Error creating help request:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

// DELETE - Delete a help request
async function deleteHelpRequest(req, res) {
  try {
    const RequestID = req.params.id;

    const checkResult = await getRequestById(RequestID);
    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }

    const request = checkResult.recordset[0];
    if (request.status === 'Completed') {
      return res.status(400).json({ error: 'Cannot cancel completed requests' });
    }

    const deleteResult = await deleteRequestById(RequestID);
    if (deleteResult.rowsAffected[0] === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }

    res.json({ message: 'Request cancelled successfully' });
  } catch (error) {
    console.error('Error deleting help request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// PATCH - Update help request status
async function updateHelpRequest(req, res) {
  try {
    const RequestID = req.params.id;
    const { status } = req.body;

    const checkResult = await getRequestById(RequestID);
    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }

    const updateResult = await updateRequestStatus(RequestID, status);
    if (updateResult.rowsAffected[0] === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }

    res.json({ message: `Request status updated to ${status}` });
  } catch (error) {
    console.error('Error updating help request:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message,
      stack: error.stack 
    });
  }
}

module.exports = {
  getHelpRequests,
  postHelpRequest,
  deleteHelpRequest,
  updateHelpRequest
};
