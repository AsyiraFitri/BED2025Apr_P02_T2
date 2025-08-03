// middlewares/contactValidation.js
function validateContactFields(req, res, next) {
  const { name, phone } = req.body;

  if (!name || !phone) {
    return res.status(400).json({ error: 'Name and Phone are required' });
  }
  if (name.length > 100) {
    return res.status(400).json({ error: 'Name is too long (max 100 characters)' });
  }
  if (phone.length > 20) {
    return res.status(400).json({ error: 'Phone number is too long (max 20 characters)' });
  }

  next();
}

function ensureAuthenticated(req, res, next) {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ error: 'User not authenticated' });
  }
  next();
}

module.exports = { validateContactFields, ensureAuthenticated };
