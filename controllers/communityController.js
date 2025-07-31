// Import the community model to access database methods
const CommunityModel = require('../models/communityModel');
const sql = require('mssql');
const config = require('../dbConfig');

// Fetch all hobby groups
const getAllGroups = async (req, res) => {
  try {
    const groups = await CommunityModel.getAllGroups();
    if (!Array.isArray(groups)) return res.json([]);
    res.json(groups);
  } 
  catch (error) {
    console.error('Error in getAllGroups:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
};

// Create a new hobby group
const createGroup = async (req, res) => {
  const ownerId = req.user.id || req.user.UserID;
  const { groupName, groupDescription } = req.body;
  if (!groupName) return res.status(400).json({ error: 'Group name is required' });
  try {
    const newGroupId = await CommunityModel.createGroup(groupName, groupDescription, ownerId);
    res.status(201).json({ message: 'Group added successfully', groupId: newGroupId });
  } 
  catch (error) {
    console.error('Error in createGroup:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
};

// Get a single group by its ID
const getGroupById = async (req, res) => {
  const groupId = req.params.id;
  try {
    const group = await CommunityModel.getGroupById(groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    res.json(group);
  } 
  catch (error) {
    console.error('Error in getGroupById:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
};

// Handle user login
const loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await CommunityModel.authenticateUser(email, password);
    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    res.json({ success: true, user });
  } 
  catch (error) {
    console.error('Error in loginUser:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// Join a user to a group
const joinGroup = async (req, res) => {
  const userId = req.user.id || req.user.UserID;
  const fullName = `${req.user.first_name || req.user.username || ''} ${req.user.last_name || ''}`.trim();
  const { groupId } = req.body;
  try {
    const result = await CommunityModel.joinGroup(userId, groupId, fullName);
    if (result === true || result === 'duplicate') {
      res.status(200).json({ message: 'Already a member or joined successfully' });
    } 
    else {
      res.status(201).json({ message: 'Joined group successfully' });
    }
  } 
  catch (error) {
    console.error('Error in joinGroup:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
};

module.exports = {
  getAllGroups,
  createGroup,
  getGroupById,
  loginUser,
  joinGroup
};