const GroupModel = require('../models/groupModel');

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

const validateGroupOwnership = async (req, res, next) => {
    const { groupId } = req.params || req.body;
    const userId = req.user.UserID;
    
    if (!groupId) {
        return res.status(400).json({ error: 'Group ID is required' });
    }
    
    try {
        // Check if user is admin (admins can modify any group)
        if (req.user.role === 'admin') {
            return next();
        }
        
        // Check if user is the group owner
        const isOwner = await GroupModel.checkGroupOwnership(groupId, userId);
        if (!isOwner) {
            return res.status(403).json({ error: 'Only the group owner can perform this action' });
        }
        
        next();
    } catch (error) {
        console.error('Error validating group ownership:', error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
};

module.exports = {
    validateGroup,
    validateGroupOwnership
};
