const validateGroup = (req, res, next) => {
    const { groupName, groupDescription } = req.body;
    
    // Check if required fields are provided
    if (!groupName || !groupDescription) {
        return res.status(400).json({ 
            error: 'Group name and description are required' 
        });
    }
    
    // Validate group name length
    if (groupName.length < 3 || groupName.length > 50) {
        return res.status(400).json({ 
            error: 'Group name must be between 3 and 50 characters' 
        });
    }
    
    // Validate description length
    if (groupDescription.length < 10 || groupDescription.length > 255) {
        return res.status(400).json({ 
            error: 'Group description must be between 10 and 255 characters' 
        });
    }
    
    // If validation passes, continue to the next middleware/route handler
    next();
};

module.exports = validateGroup;
