function validateRequestId(req, res, next) {
  const RequestID = req.params.id;
  //Ensure request id is valid
  if (!RequestID || isNaN(RequestID)) {
    return res.status(400).json({ error: 'Invalid request ID' });
  }
  next();
}

function validateStatus(req, res, next) {
  const { status } = req.body;
  if (!status || !['Pending', 'Completed', 'In Progress'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status. Must be Pending, In Progress, or Completed' });
  }
  next();
}

module.exports = { validateRequestId, validateStatus };
