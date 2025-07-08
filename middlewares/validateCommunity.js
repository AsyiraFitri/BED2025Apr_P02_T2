const validateCommunity = (req, res, next) => {
  const { groupName, groupDescription } = req.body;

  if (!groupName || !groupDescription) {
    return res.status(400).json({ message: 'Group name and description are required.' });
  }

  next(); // Continue if valid
};

module.exports = validateCommunity;