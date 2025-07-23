const GroupModel = require('../models/groupModel');

// Middleware to validate group data (name and description)
const validateGroup = (req, res, next) => {
    const { groupName, groupDescription } = req.body;
    
    // Check if required fields are provided in the request body
    if (!groupName || !groupDescription) {
        return res.status(400).json({ 
            error: 'Group name and description are required' 
        });
    }
    
    // Validate group name length (between 3 and 50 characters)
    if (groupName.length < 3 || groupName.length > 50) {
        return res.status(400).json({ 
            error: 'Group name must be between 3 and 50 characters' 
        });
    }
    
    // Validate group description length (between 10 and 255 characters)
    if (groupDescription.length < 10 || groupDescription.length > 255) {
        return res.status(400).json({ 
            error: 'Group description must be between 10 and 255 characters' 
        });
    }
    
    // If all validation checks pass, move on to the next middleware or route handler
    next();
};

// Middleware to validate group ownership (ensure user has proper permissions)
const validateGroupOwnership = async (req, res, next) => {
    // Retrieve groupId from URL parameters (req.params) or from the request body (req.body) if it's not found in params
    const groupId = req.params.groupId || req.body.groupId;
    
    // Get the ID of the user making the request
    const userId = req.user.UserID;
    
    // If groupId is not provided in either the URL params or request body, return an error
    if (!groupId) {
        return res.status(400).json({ error: 'Group ID is required' });
    }
    
    try {
        // Check if user is admin (admins can modify any group)
        if (req.user.role === 'admin') {
            // Admins bypass group ownership check and proceed to the next middleware
            return next();
        }
        
        // Check if user is the owner of the specified group
        const isOwner = await GroupModel.checkGroupOwnership(groupId, userId);
        
        // If the user is not the owner, return a forbidden error (403)
        if (!isOwner) {
            return res.status(403).json({ error: 'Only the group owner can perform this action' });
        }
        
        // If the user is the owner, allow the request to proceed to the next middleware or route handler
        next();
    } 
    catch (error) {
        // Catch any errors during the database check and log them
        console.error('Error validating group ownership:', error);
        
        // Return a server error if something goes wrong
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
};

// Middleware to prevent admins from leaving groups
// Admins should maintain oversight and cannot abandon their responsibilities
const preventAdminLeaveGroup = (req, res, next) => {
    // Check if the user making the request is an admin
    if (req.user && req.user.role === 'admin') {
        return res.status(403).json({ 
            error: 'Administrators cannot leave groups due to oversight responsibilities. Please contact a super admin to downgrade your role if needed.' 
        });
    }
    
    // If not an admin, allow the action to proceed
    next();
};

// Middleware to prevent admins from deleting groups
// Admins should maintain oversight and not delete groups they monitor
const preventAdminDeleteGroup = (req, res, next) => {
    // Check if the user making the request is an admin
    if (req.user && req.user.role === 'admin') {
        return res.status(403).json({ 
            error: 'Administrators cannot delete groups due to oversight responsibilities. Only group owners (non-admin users) can delete their groups.' 
        });
    }
    
    // If not an admin, allow the action to proceed
    next();
};

// Modified validateGroupOwnership that excludes admin privileges for delete operations
const validateGroupOwnershipForDelete = async (req, res, next) => {
    const groupId = req.params.groupId || req.body.groupId;
    const userId = req.user.UserID;
    if (!groupId) {
        return res.status(400).json({ error: 'Group ID is required' });
    }
    try {
        // For delete operations, do NOT allow admin privileges, only actual owners can delete
        const isOwner = await GroupModel.checkGroupOwnership(groupId, userId);
        if (!isOwner) {
            return res.status(403).json({ error: 'Only the group owner can delete this group' });
        }
        next();
    } 
    catch (error) {
        console.error('Error validating group ownership:', error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
};

module.exports = {
    validateGroup,
    validateGroupOwnership,
    preventAdminLeaveGroup,
    preventAdminDeleteGroup,
    validateGroupOwnershipForDelete
};
