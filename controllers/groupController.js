const sql = require('mssql');
const config = require('../dbConfig');

const saveDesc = async (req, res) => {
    const { groupId, newDescription } = req.body;
    
    if (!groupId || !newDescription) {
        return res.status(400).json({ error: 'Group ID and new description are required' });
    }
    
    try {
        const pool = await sql.connect(config);
        await pool.request()
        .input('GroupID', sql.Int, groupId)
        .input('NewDescription', sql.NVarChar(255), newDescription)
        .query('UPDATE HobbyGroups SET GroupDescription = @NewDescription WHERE GroupID = @GroupID');
        
        res.status(200).json({ message: 'Group description updated successfully' });
    } 
    catch (error) {
        console.error('Error updating group description:', error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
};
const deleteCommunity = async (req, res) => {
    const { groupId } = req.body;
    
    if (!groupId) {
        return res.status(400).json({ error: 'Group ID is required' });
    }
    
    try {
        const pool = await sql.connect(config);
        
        // Start a transaction to ensure data consistency
        const transaction = new sql.Transaction(pool);
        await transaction.begin();
        
        try {
            // First, delete all members from the group
            await transaction.request()
                .input('GroupID', sql.Int, groupId)
                .query('DELETE FROM Members WHERE GroupID = @GroupID');
            
            // Then, delete the group itself
            await transaction.request()
                .input('GroupID', sql.Int, groupId)
                .query('DELETE FROM HobbyGroups WHERE GroupID = @GroupID');
            
            // Commit the transaction
            await transaction.commit();
            
            res.status(200).json({ message: 'Community and all members deleted successfully' });
        } 
        catch (error) {
            // Rollback the transaction if any operation fails
            await transaction.rollback();
            throw error;
        }
    } 
    catch (error) {
        console.error('Error deleting community:', error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
};
const leaveGroup = async (req, res) => {
    const { groupId, userId } = req.body;
    if (!groupId || !userId) {
        return res.status(400).json({ error: 'Group ID and User ID are required' });
    }
    try {
        const pool = await sql.connect(config);
        await pool.request()
        .input('GroupID', sql.Int, groupId)
        .input('UserID', sql.Int, userId)
        .query('DELETE FROM Members WHERE GroupID = @GroupID AND UserID = @UserID');
        
        res.status(200).json({ message: 'Left the group successfully' });
    } 
    catch (error) {
        console.error('Error leaving group:', error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
};
const checkMembership = async (req, res) => {
    const { groupId, userId } = req.params;
    
    if (!groupId || !userId) {
        return res.status(400).json({ error: 'Group ID and User ID are required' });
    }
    
    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input('GroupID', sql.Int, groupId)
            .input('UserID', sql.Int, userId)
            .query('SELECT COUNT(*) as memberCount FROM Members WHERE GroupID = @GroupID AND UserID = @UserID');
        
        const isMember = result.recordset[0].memberCount > 0;
        res.status(200).json({ isMember });
    } 
    catch (error) {
        console.error('Error checking membership:', error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
};
const getMemberCount = async (req, res) => {
    const { groupId } = req.params;
    
    if (!groupId) {
        return res.status(400).json({ error: 'Group ID is required' });
    }
    
    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input('GroupID', sql.Int, groupId)
            .query('SELECT COUNT(DISTINCT UserID) as memberCount FROM Members WHERE GroupID = @GroupID');
        
        const memberCount = result.recordset[0].memberCount;
        res.status(200).json({ memberCount });
    } 
    catch (error) {
        console.error('Error getting member count:', error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
};
const getMemberList = async (req, res) => {
    const { groupId } = req.params;
    
    if (!groupId) {
        return res.status(400).json({ error: 'Group ID is required' });
    }
    
    try {
        const pool = await sql.connect(config);
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
        
        const members = result.recordset.map(member => ({
            name: member.Name,
            role: member.Role
        }));
        res.status(200).json({ members });
    } 
    catch (error) {
        console.error('Error getting member list:', error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
};

module.exports = {
    saveDesc,
    deleteCommunity,
    leaveGroup,
    checkMembership,
    getMemberCount,
    getMemberList
};