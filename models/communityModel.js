// Import the mssql package and DB config
const sql = require('mssql');
const config = require('../dbConfig');

class CommunityModel {
    // Get all hobby groups from the database
    static async getAllGroups() {
        try {
        const pool = await sql.connect(config);
        const result = await pool.request().query('SELECT * FROM HobbyGroups');
        return result.recordset;
        } 
        catch (error) {
        throw new Error(`Database error in getAllGroups: ${error.message}`);
        }
    }

    // Create a new hobby group
    static async createGroup(groupName, groupDescription, ownerId) {
        try {
        const pool = await sql.connect(config);
        
        // Start transaction for group creation and admin addition
        const transaction = new sql.Transaction(pool);
        await transaction.begin();
        
        try {
            // Create the group
            const groupResult = await transaction.request()
                .input('GroupName', sql.NVarChar(100), groupName)
                .input('GroupDescription', sql.NVarChar(255), groupDescription || '')
                .input('OwnerID', sql.Int, ownerId)
                .query(
                `INSERT INTO HobbyGroups (GroupName, GroupDescription, OwnerID)
                VALUES (@GroupName, @GroupDescription, @OwnerID);
                SELECT SCOPE_IDENTITY() AS GroupID`
                );
            
            const newGroupId = groupResult.recordset[0].GroupID;
            
            // Get all admin users
            const adminResult = await transaction.request()
                .query("SELECT UserID, first_name, last_name FROM Users WHERE role = 'admin'");
            
            // Add all admins to the group
            for (const admin of adminResult.recordset) {
                const fullName = `${admin.first_name} ${admin.last_name}`.trim();
                await transaction.request()
                    .input('UserID', sql.Int, admin.UserID)
                    .input('GroupID', sql.Int, newGroupId)
                    .input('Name', sql.NVarChar(500), fullName)
                    .query('INSERT INTO Members (UserID, GroupID, Name) VALUES (@UserID, @GroupID, @Name)');
            }
            
            await transaction.commit();
            return newGroupId;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
        } 
        catch (error) {
        throw new Error(`Database error in createGroup: ${error.message}`);
        }
    }

    // Get a single group by its ID
    static async getGroupById(groupId) {
        try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input('GroupID', sql.Int, groupId)
            .query('SELECT * FROM HobbyGroups WHERE GroupID = @GroupID'); 
        return result.recordset.length > 0 ? result.recordset[0] : null;
        } 
        catch (error) {
        throw new Error(`Database error in getGroupById: ${error.message}`);
        }
    }

    // Authenticate user login
    static async authenticateUser(email, password) {
        try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input('Email', sql.NVarChar(255), email)
            .input('Password', sql.NVarChar(255), password)
            .query('SELECT * FROM Users WHERE email = @Email AND password = @Password');
        return result.recordset.length > 0 ? result.recordset[0] : null;
        } 
        catch (error) {
        throw new Error(`Database error in authenticateUser: ${error.message}`);
        }
    }

    // Add a user to a group
    static async joinGroup(userId, groupId, fullName) {
        try {
        const pool = await sql.connect(config);
        await pool.request()
            .input('UserID', sql.Int, userId)
            .input('GroupID', sql.Int, groupId)
            .input('Name', sql.NVarChar(500), fullName)
            .query('INSERT INTO Members (UserID, GroupID, Name) VALUES (@UserID, @GroupID, @Name)');
        return true;
        } 
        catch (error) {
        throw new Error(`Database error in joinGroup: ${error.message}`);
        }
    }
}

module.exports = CommunityModel;
