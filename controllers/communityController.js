// Import the community model that handles database logic
const CommunityModel = require('../models/communityModel');

// Controller to fetch all hobby groups
const getAllGroups = async (req, res) => {
  console.log('=== getAllGroups called ===');
  try {
    console.log('Fetching all groups from database...');
    const groups = await CommunityModel.getAllGroups(); // Retrieve all groups from DB
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

// Controller to create a new hobby group
const createGroup = async (req, res) => {
  const { groupName, groupDescription, adminId } = req.body; // Extract data from request body
  // Validate: group name must be provided
  if (!groupName) {
    return res.status(400).json({ error: 'Group name is required' });
  }
  try {
    // Call model to insert new group into database
    const newGroupId = await CommunityModel.createGroup(groupName, groupDescription, adminId);
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

// Controller to get a single group by its ID
const getGroupById = async (req, res) => {
  const groupId = req.params.id; // Extract group ID from URL parameter
  try {
    const group = await CommunityModel.getGroupById(groupId); // Fetch group from DB by ID
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

// Controller to handle user login
const loginUser = async (req, res) => {
  const { email, password } = req.body; // Get email and password from frontend
  try {
    const user = await CommunityModel.authenticateUser(email, password); // Check credentials in DB
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

// Controller to join a user to a group
const joinGroup = async (req, res) => {
  const { groupId, userId, fullName } = req.body; // Extract data from frontend
  try {
    await CommunityModel.joinGroup(userId, groupId, fullName); // Add user to group in DB
    res.status(201).json({ message: 'Joined group successfully' }); // Success message
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
