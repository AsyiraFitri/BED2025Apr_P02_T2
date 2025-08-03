// Middleware functions for validating contact data 
// and ensuring that the user is authenticated before accessing contact routes.

function validateContactFields(req, res, next) {
  const { name, phone } = req.body;

// Ensure both name and phone are provided
  if (!name || !phone) {
    return res.status(400).json({ error: 'Name and Phone are required' });
  }
  // Ensure name length is within limit
  if (name.length > 100) {
    return res.status(400).json({ error: 'Name is too long (max 100 characters)' });
  }
   // Ensure phone length is within limit
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
