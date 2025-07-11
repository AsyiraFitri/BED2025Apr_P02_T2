// Import SQL Server module and database config
const sql = require('mssql');
const config = require('../dbConfig');

// Update the description of a group
const saveDesc = async (req, res) => {
    const { groupId, newDescription } = req.body;

    // Validate required fields
    if (!groupId || !newDescription) {
        return res.status(400).json({ error: 'Group ID and new description are required' });
    }

    try {
        const pool = await sql.connect(config); // Connect to DB
        await pool.request()
            .input('GroupID', sql.Int, groupId)
            .input('NewDescription', sql.NVarChar(255), newDescription)
            .query('UPDATE HobbyGroups SET GroupDescription = @NewDescription WHERE GroupID = @GroupID'); // Update description

        res.status(200).json({ message: 'Group description updated successfully' });
    } catch (error) {
        console.error('Error updating group description:', error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
};

// Delete a group and its members (as a "community")
const deleteCommunity = async (req, res) => {
    const { groupId } = req.body;

    // Validate groupId
    if (!groupId) {
        return res.status(400).json({ error: 'Group ID is required' });
    }

    try {
        const pool = await sql.connect(config); // Connect to DB

        // Start a transaction to ensure both deletions succeed or fail together
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            // Delete all members from the group
            await transaction.request()
                .input('GroupID', sql.Int, groupId)
                .query('DELETE FROM Members WHERE GroupID = @GroupID');

            // Delete the group itself
            await transaction.request()
                .input('GroupID', sql.Int, groupId)
                .query('DELETE FROM HobbyGroups WHERE GroupID = @GroupID');

            await transaction.commit(); // Commit the transaction

            res.status(200).json({ message: 'Community and all members deleted successfully' });
        } catch (error) {
            await transaction.rollback(); // Rollback if something fails
            throw error;
        }
    } catch (error) {
        console.error('Error deleting community:', error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
};

// Remove a user from a group (leave group)
const leaveGroup = async (req, res) => {
    const { groupId, userId } = req.body;

    // Validate input
    if (!groupId || !userId) {
        return res.status(400).json({ error: 'Group ID and User ID are required' });
    }

    try {
        const pool = await sql.connect(config); // Connect to DB
        await pool.request()
            .input('GroupID', sql.Int, groupId)
            .input('UserID', sql.Int, userId)
            .query('DELETE FROM Members WHERE GroupID = @GroupID AND UserID = @UserID'); // Delete user from group

        res.status(200).json({ message: 'Left the group successfully' });
    } catch (error) {
        console.error('Error leaving group:', error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
};

// Check if a user is a member of a group
const checkMembership = async (req, res) => {
    const { groupId, userId } = req.params;

    // Validate inputs
    if (!groupId || !userId) {
        return res.status(400).json({ error: 'Group ID and User ID are required' });
    }

    try {
        const pool = await sql.connect(config); // Connect to DB
        const result = await pool.request()
            .input('GroupID', sql.Int, groupId)
            .input('UserID', sql.Int, userId)
            .query('SELECT COUNT(*) as memberCount FROM Members WHERE GroupID = @GroupID AND UserID = @UserID');

        // Check if user is a member
        const isMember = result.recordset[0].memberCount > 0;
        res.status(200).json({ isMember });
    } catch (error) {
        console.error('Error checking membership:', error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
};

// Get the total number of members in a group
const getMemberCount = async (req, res) => {
    const { groupId } = req.params;

    // Validate groupId
    if (!groupId) {
        return res.status(400).json({ error: 'Group ID is required' });
    }

    try {
        const pool = await sql.connect(config); // Connect to DB
        const result = await pool.request()
            .input('GroupID', sql.Int, groupId)
            .query('SELECT COUNT(DISTINCT UserID) as memberCount FROM Members WHERE GroupID = @GroupID');

        const memberCount = result.recordset[0].memberCount;
        res.status(200).json({ memberCount });
    } catch (error) {
        console.error('Error getting member count:', error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
};

// Get list of all members in a group with roles (Admin/Member)
const getMemberList = async (req, res) => {
    const { groupId } = req.params;

    // Validate groupId
    if (!groupId) {
        return res.status(400).json({ error: 'Group ID is required' });
    }

    try {
        const pool = await sql.connect(config); // Connect to DB
        const result = await pool.request()
            .input('GroupID', sql.Int, groupId)
            .query(`
                SELECT 
                    m.Name,
                    CASE 
                        WHEN m.UserID = hg.AdminID THEN 'Admin'
                        ELSE 'Member'
                    END as Role,
                    CASE 
                        WHEN m.UserID = hg.AdminID THEN 1
                        ELSE 2
                    END as SortOrder
                FROM Members m
                INNER JOIN HobbyGroups hg ON m.GroupID = hg.GroupID
                WHERE m.GroupID = @GroupID
                ORDER BY SortOrder ASC, m.Name ASC
            `);

        // Format the output
        const members = result.recordset.map(member => ({
            name: member.Name,
            role: member.Role
        }));
        res.status(200).json({ members });
    } catch (error) {
        console.error('Error getting member list:', error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
};

// Export all controller functions
module.exports = {
    saveDesc,
    deleteCommunity,
    leaveGroup,
    checkMembership,
    getMemberCount,
    getMemberList
};
