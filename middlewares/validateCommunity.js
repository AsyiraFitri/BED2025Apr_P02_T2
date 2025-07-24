const validateCommunity = (req, res, next) => {
  const { groupName, groupDescription } = req.body;

  // Treat input with only spaces as empty
  if (!groupName || !groupDescription || groupName.trim().length === 0 || groupDescription.trim().length === 0) {
    return res.status(400).json({ message: 'Group name and description cannot be empty or just spaces.' });
  }
  if (groupName.trim().length < 3 || groupName.trim().length > 50) {
    return res.status(400).json({ message: 'Group name must be between 3 and 50 characters.' });
  }
  if (groupDescription.trim().length < 10 || groupDescription.trim().length > 255) {
    return res.status(400).json({ message: 'Group description must be between 10 and 255 characters.' });
  }
  next(); // Continue if valid
};

module.exports = validateCommunity;