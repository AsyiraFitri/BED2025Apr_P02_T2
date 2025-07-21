// Import the community model functions that handle database logic
const {
  getAllGroups: getAllGroupsModel,
  createGroup: createGroupModel,
  getGroupById: getGroupByIdModel,
  authenticateUser: authenticateUserModel,
  joinGroup: joinGroupModel
} = require('../models/communityModel');

// Fetch all hobby groups
const getAllGroups = async (req, res) => {
  console.log('=== getAllGroups called ===');
  try {
    console.log('Fetching all groups from database...');
    const groups = await getAllGroupsModel(); // Retrieve all groups from DB
    console.log('Query result:', groups);    
    // Ensure we always return an array
    if (!Array.isArray(groups)) {
      console.warn('Groups is not an array, returning empty array');
      return res.json([]);
    }
    res.json(groups); // Send group list as JSON response
  } 
  catch (error) {
    console.error('Error in getAllGroups:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message }); // Handle server error
  }
};

// Create a new hobby group
const createGroup = async (req, res) => {
  // Get user details from JWT token (added by verifyAdmin middleware)
  const ownerId = req.user.UserID;
  const { groupName, groupDescription } = req.body; // Extract data from request body
  
  // Validate: group name must be provided
  if (!groupName) {
    return res.status(400).json({ error: 'Group name is required' });
  }
  try {
    // Call model to insert new group into database
    const newGroupId = await createGroupModel(groupName, groupDescription, ownerId);
    // Send success response with new group ID
    res.status(201).json({
      message: 'Group added successfully',
      groupId: newGroupId
    });
  } 
  catch (error) {
    console.error('Error in createGroup:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message }); // Handle server error
  }
};

// Get a single group by its ID
const getGroupById = async (req, res) => {
  const groupId = req.params.id; // Extract group ID from URL parameter
  try {
    const group = await getGroupByIdModel(groupId); // Fetch group from DB by ID
    if (!group) {
      return res.status(404).json({ message: 'Group not found' }); // If group doesn't exist
    }
    res.json(group); // Return group details
  } 
  catch (error) {
    console.error('Error in getGroupById:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message }); // Handle server error
  }
};

// Handle user login
const loginUser = async (req, res) => {
  const { email, password } = req.body; // Get email and password from frontend
  try {
    const user = await authenticateUserModel(email, password); // Check credentials in DB
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' }); // Authentication failed
    }
    res.json({ success: true, user }); // Login successful, send user data
  } 
  catch (error) {
    console.error('Error in loginUser:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' }); // Handle server error
  }
};

// Join a user to a group
const joinGroup = async (req, res) => {
  // Get user details from JWT token (added by verifyToken middleware)
  const userId = req.user.UserID;
  const fullName = `${req.user.first_name} ${req.user.last_name}`.trim();
  const { groupId } = req.body; // Extract group ID from request body
  
  try {
    const result = await joinGroupModel(userId, groupId, fullName); // Add user to group in DB
    if (result === true || result === 'duplicate') {
      // User was already a member, just joined, or duplicate key error
      res.status(200).json({ message: 'Already a member or joined successfully' });
    } else {
      // Fallback, but should not happen
      res.status(201).json({ message: 'Joined group successfully' });
    }
  } 
  catch (error) {
    console.error('Error in joinGroup:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message }); // Handle server error
  }
};

// Export all controller functions for use in routing
module.exports = {
  getAllGroups,
  createGroup,
  getGroupById,
  loginUser,
  joinGroup
};
