// Placeholder for future hotline validations
function validateHotlineFields(req, res, next) {
  const { serviceName, phoneNumber } = req.body;
  
// Ensure both serviceName and phoneNumber are provided
  if (!serviceName || !phoneNumber) {
    return res.status(400).json({ error: 'Service name and phone number are required' });
  }

  next();
}

module.exports = { validateHotlineFields };
