// Import the mssql package and DB config
const sql = require('mssql');
const config = require('../dbConfig');

// Get all channels for a specific group
const getChannelsByGroupId = async (groupId) => {
    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input('GroupID', sql.Int, groupId)
            .query('SELECT * FROM Channels WHERE GroupID = @GroupID ORDER BY ChannelName');
        return result.recordset;
    } 
    catch (error) {
        throw new Error(`Database error in getChannelsByGroupId: ${error.message}`);
    }
};

// Create a new channel
const createChannel = async (groupId, channelName) => {
    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input('GroupID', sql.Int, groupId)
            .input('ChannelName', sql.NVarChar(20), channelName)
            .query(
                `INSERT INTO Channels (GroupID, ChannelName)
                VALUES (@GroupID, @ChannelName);
                SELECT @@ROWCOUNT AS RowsAffected`
            );
        return result.recordset[0] ? result.recordset[0].RowsAffected : 1;
    } 
    catch (error) {
        throw new Error(`Database error in createChannel: ${error.message}`);
    }
};

// Delete a channel
const deleteChannel = async (groupId, channelName) => {
    try {
        const pool = await sql.connect(config);
        await pool.request()
            .input('GroupID', sql.Int, groupId)
            .input('ChannelName', sql.NVarChar(20), channelName)
            .query('DELETE FROM Channels WHERE GroupID = @GroupID AND ChannelName = @ChannelName');
        return true;
    } 
    catch (error) {
        throw new Error(`Database error in deleteChannel: ${error.message}`);
    }
};

// Check if channel name already exists in group
const channelExists = async (groupId, channelName) => {
    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input('GroupID', sql.Int, groupId)
            .input('ChannelName', sql.NVarChar(20), channelName)
            .query('SELECT COUNT(*) as count FROM Channels WHERE GroupID = @GroupID AND ChannelName = @ChannelName');
        return result.recordset[0].count > 0;
    } 
    catch (error) {
        throw new Error(`Database error in channelExists: ${error.message}`);
    }
};

module.exports = {
    getChannelsByGroupId,
    createChannel,
    deleteChannel,
    channelExists
};
