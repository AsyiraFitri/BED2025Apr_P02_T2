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
    static async createGroup(groupName, groupDescription, adminId) {
        try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input('GroupName', sql.NVarChar(100), groupName)
            .input('GroupDescription', sql.NVarChar(255), groupDescription || '')
            .input('AdminID', sql.Int, adminId)
            .query(
            `INSERT INTO HobbyGroups (GroupName, GroupDescription, AdminID)
            VALUES (@GroupName, @GroupDescription, @AdminID);
            SELECT SCOPE_IDENTITY() AS GroupID`
            ); 
        return result.recordset[0].GroupID;
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
            .input('Email', sql.NVarChar(100), email)
            .input('PasswordHash', sql.NVarChar(255), password)
            .query('SELECT * FROM Users WHERE Email = @Email AND PasswordHash = @PasswordHash');
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
