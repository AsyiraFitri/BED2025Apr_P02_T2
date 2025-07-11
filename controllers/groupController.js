// Import the group model to access database methods
const GroupModel = require('../models/groupModel');
const sql = require('mssql');
const config = require('../dbConfig');

// Controller to update a group's description
const saveDesc = async (req, res) => {
    const { groupId, newDescription } = req.body;

    // Ensure required inputs are present
    if (!groupId || !newDescription) {
        return res.status(400).json({ error: 'Group ID and new description are required' });
    }

    try {
        // Update the description in the database
        await GroupModel.updateDescription(groupId, newDescription);
        res.status(200).json({ message: 'Group description updated successfully' });
    } 
    catch (error) {
        console.error('Error updating group description:', error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
};

// Controller to delete a group and its members
const deleteCommunity = async (req, res) => {
    const { groupId } = req.body;

    // Validate input
    if (!groupId) {
        return res.status(400).json({ error: 'Group ID is required' });
    }

    try {
        // Delete the group and all associated members from the DB
        await GroupModel.deleteGroupWithMembers(groupId);
        res.status(200).json({ message: 'Community and all members deleted successfully' });
    } 
    catch (error) {
        console.error('Error deleting community:', error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
};

// Controller for a user to leave a group
const leaveGroup = async (req, res) => {
    const { groupId, userId } = req.body;

    // Check for required inputs
    if (!groupId || !userId) {
        return res.status(400).json({ error: 'Group ID and User ID are required' });
    }

    try {
        // Remove the user from the group in the DB
        await GroupModel.removeUserFromGroup(groupId, userId);
        res.status(200).json({ message: 'Left the group successfully' });
    } 
    catch (error) {
        console.error('Error leaving group:', error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
};

// Controller to check if a user is already a member of a group
const checkMembership = async (req, res) => {
    const { groupId, userId } = req.params;

    // Validate parameters
    if (!groupId || !userId) {
        return res.status(400).json({ error: 'Group ID and User ID are required' });
    }

    try {
        // Check membership in the DB
        const isMember = await GroupModel.checkUserMembership(groupId, userId);
        res.status(200).json({ isMember });
    } 
    catch (error) {
        console.error('Error checking membership:', error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
};

// Controller to get the number of members in a group
const getMemberCount = async (req, res) => {
    const { groupId } = req.params;

    // Validate input
    if (!groupId) {
        return res.status(400).json({ error: 'Group ID is required' });
    }

    try {
        // Retrieve count from the DB
        const memberCount = await GroupModel.getMemberCount(groupId);
        res.status(200).json({ memberCount });
    } 
    catch (error) {
        console.error('Error getting member count:', error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
};

// Controller to retrieve list of all members with their roles (Admin/Member)
const getMemberList = async (req, res) => {
    const { groupId } = req.params;

    // Validate input
    if (!groupId) {
        return res.status(400).json({ error: 'Group ID is required' });
    }

    try {
        // Get member list with roles from the DB
        const members = await GroupModel.getMemberListWithRoles(groupId);
        res.status(200).json({ members });
    } 
    catch (error) {
        console.error('Error getting member list:', error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
};

// Controller to get all channels for a group
const getChannels = async (req, res) => {
    const groupId = req.params.groupId;

    if (!groupId) {
        return res.status(400).json({ error: 'Group ID is required' });
    }

    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input('GroupID', sql.Int, groupId)
            .query('SELECT * FROM Channels WHERE GroupID = @GroupID ORDER BY ChannelName');
        res.status(200).json(result.recordset);
    } 
    catch (error) {
        console.error('Error getting channels:', error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
};

// Controller to create a new channel (admin only)
const createChannel = async (req, res) => {
    const { groupId, channelName } = req.body;

    if (!groupId || !channelName) {
        return res.status(400).json({ error: 'Group ID and channel name are required' });
    }

    // Validate channel name (alphanumeric and dashes only, max 20 chars)
    const channelNameRegex = /^[a-zA-Z0-9-]+$/;
    if (!channelNameRegex.test(channelName) || channelName.length > 20) {
        return res.status(400).json({ error: 'Channel name must be alphanumeric (with dashes) and max 20 characters' });
    }

    try {
        const pool = await sql.connect(config);
        
        // Check if channel already exists
        const existsResult = await pool.request()
            .input('GroupID', sql.Int, groupId)
            .input('ChannelName', sql.NVarChar(20), channelName)
            .query('SELECT COUNT(*) as count FROM Channels WHERE GroupID = @GroupID AND ChannelName = @ChannelName');
        
        if (existsResult.recordset[0].count > 0) {
            return res.status(409).json({ error: 'Channel name already exists in this group' });
        }

        // Create the channel
        await pool.request()
            .input('GroupID', sql.Int, groupId)
            .input('ChannelName', sql.NVarChar(20), channelName)
            .query('INSERT INTO Channels (GroupID, ChannelName) VALUES (@GroupID, @ChannelName)');
            
        res.status(201).json({ 
            message: 'Channel created successfully', 
            channelName: channelName 
        });
    } 
    catch (error) {
        console.error('Error creating channel:', error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
};

// Controller to delete a channel (admin only)
const deleteChannel = async (req, res) => {
    const { groupId, channelName } = req.body;

    if (!groupId || !channelName) {
        return res.status(400).json({ error: 'Group ID and channel name are required' });
    }

    try {
        const pool = await sql.connect(config);
        await pool.request()
            .input('GroupID', sql.Int, groupId)
            .input('ChannelName', sql.NVarChar(20), channelName)
            .query('DELETE FROM Channels WHERE GroupID = @GroupID AND ChannelName = @ChannelName');
        res.status(200).json({ message: 'Channel deleted successfully' });
    } 
    catch (error) {
        console.error('Error deleting channel:', error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
};

// Export all controller functions for use in routes
module.exports = {
    saveDesc,
    deleteCommunity,
    leaveGroup,
    checkMembership,
    getMemberCount,
    getMemberList,
    getChannels,
    createChannel,
    deleteChannel
};
