// Import the mssql package for SQL server interaction and DB configuration
const sql = require('mssql');
const config = require('../dbConfig');

// Get all hobby groups from the database
async function getAllGroups() {
    try {
        // Establish connection to the database
        const pool = await sql.connect(config);
        
        // Execute the query to retrieve all hobby groups
        const result = await pool.request().query('SELECT * FROM HobbyGroups');
        
        // Return the result recordset (list of groups)
        return result.recordset;
    } 
    catch (error) {
        // If an error occurs, throw a custom error message with the original error details
        throw new Error(`Database error in getAllGroups: ${error.message}`);
    }
}

// Create a new hobby group
async function createGroup(groupName, groupDescription, ownerId) {
    try {
        // Establish a connection to the database
        const pool = await sql.connect(config);
        
        // Start a transaction for creating the group and adding the owner and default channels
        const transaction = new sql.Transaction(pool);
        await transaction.begin();
        
        try {
            // Insert the new group into the HobbyGroups table
            const groupResult = await transaction.request()
                .input('GroupName', sql.NVarChar(100), groupName)
                .input('GroupDescription', sql.NVarChar(255), groupDescription || '')  // Default empty string if no description
                .input('OwnerID', sql.Int, ownerId)
                .query(
                    `INSERT INTO HobbyGroups (GroupName, GroupDescription, OwnerID)
                    VALUES (@GroupName, @GroupDescription, @OwnerID);
                    SELECT SCOPE_IDENTITY() AS GroupID`
                );
            
            // Retrieve the ID of the newly created group
            const newGroupId = groupResult.recordset[0].GroupID;
            
            // Create default channels for the group
            const defaultChannels = ['announcements', 'events', 'general'];
            for (const channelName of defaultChannels) {
                await transaction.request()
                    .input('GroupID', sql.Int, newGroupId)
                    .input('ChannelName', sql.NVarChar(20), channelName)
                    .query('INSERT INTO Channels (GroupID, ChannelName) VALUES (@GroupID, @ChannelName)');
            }
            
            // Add the owner of the group to the Members table (as the first member)
            const ownerResult = await transaction.request()
                .input('OwnerID', sql.Int, ownerId)
                .query("SELECT UserID, first_name, last_name FROM Users WHERE UserID = @OwnerID");
            
            if (ownerResult.recordset.length > 0) {
                const owner = ownerResult.recordset[0];
                const ownerFullName = `${owner.first_name} ${owner.last_name}`.trim();
                await transaction.request()
                    .input('UserID', sql.Int, owner.UserID)
                    .input('GroupID', sql.Int, newGroupId)
                    .input('Name', sql.NVarChar(500), ownerFullName)
                    .query('INSERT INTO Members (UserID, GroupID, Name) VALUES (@UserID, @GroupID, @Name)');
            }
            
            // Retrieve all admin users and add them to the group (excluding the owner if already added)
            const adminResult = await transaction.request()
                .input('OwnerID', sql.Int, ownerId)
                .query("SELECT UserID, first_name, last_name FROM Users WHERE role = 'admin' AND UserID != @OwnerID");
            
            // Add each admin to the group with their full name
            for (const admin of adminResult.recordset) {
                const fullName = `${admin.first_name} ${admin.last_name}`.trim();
                await transaction.request()
                    .input('UserID', sql.Int, admin.UserID)
                    .input('GroupID', sql.Int, newGroupId)
                    .input('Name', sql.NVarChar(500), fullName)
                    .query('INSERT INTO Members (UserID, GroupID, Name) VALUES (@UserID, @GroupID, @Name)');
            }
            
            // Commit the transaction to save all changes
            await transaction.commit();
            
            // Return the ID of the newly created group
            return newGroupId;
        } 
        catch (error) {
            // If an error occurs during any part of the transaction, roll back the transaction
            await transaction.rollback();
            throw error;
        }
    } 
    catch (error) {
        // If an error occurs in the outer try block, throw a custom error message
        throw new Error(`Database error in createGroup: ${error.message}`);
    }
}

// Get a single group by its ID
async function getGroupById(groupId) {
    try {
        // Establish a connection to the database
        const pool = await sql.connect(config);
        
        // Execute the query to get the group by its ID
        const result = await pool.request()
            .input('GroupID', sql.Int, groupId)
            .query('SELECT * FROM HobbyGroups WHERE GroupID = @GroupID'); 
        
        // Return the group if found, otherwise return null
        return result.recordset.length > 0 ? result.recordset[0] : null;
    } 
    catch (error) {
        // If an error occurs, throw a custom error message
        throw new Error(`Database error in getGroupById: ${error.message}`);
    }
}

// Authenticate user login with email and password
async function authenticateUser(email, password) {
    try {
        // Establish a connection to the database
        const pool = await sql.connect(config);
        
        // Execute the query to check if the email and password match a user
        const result = await pool.request()
            .input('Email', sql.NVarChar(255), email)
            .input('Password', sql.NVarChar(255), password)
            .query('SELECT * FROM Users WHERE email = @Email AND password = @Password');
        
        // Return the user details if found, otherwise return null
        return result.recordset.length > 0 ? result.recordset[0] : null;
    } 
    catch (error) {
        // If an error occurs, throw a custom error message
        throw new Error(`Database error in authenticateUser: ${error.message}`);
    }
}

// Add a user to a group
async function joinGroup(userId, groupId, fullName) {
    try {
        // Establish a connection to the database
        const pool = await sql.connect(config);

        // First, check if the user is already a member of the group
        const existingMember = await pool.request()
            .input('UserID', sql.Int, userId)
            .input('GroupID', sql.Int, groupId)
            .query('SELECT UserID FROM Members WHERE UserID = @UserID AND GroupID = @GroupID');

        // If user is already a member, return success without inserting duplicate
        if (existingMember.recordset.length > 0) {
            return true; // User is already a member, no action needed
        }

        // Insert the user into the Members table for the specified group
        try {
            await pool.request()
                .input('UserID', sql.Int, userId)
                .input('GroupID', sql.Int, groupId)
                .input('Name', sql.NVarChar(500), fullName)
                .query('INSERT INTO Members (UserID, GroupID, Name) VALUES (@UserID, @GroupID, @Name)');
        } catch (insertError) {
            // If duplicate key error, return 'duplicate' so controller can handle
            if (insertError.message && insertError.message.includes('UNIQUE KEY constraint') && insertError.message.includes('Members')) {
                return 'duplicate';
            }
            throw insertError;
        }

        // Return true to indicate success
        return true;
    } 
    catch (error) {
        // If an error occurs, throw a custom error message
        throw new Error(`Database error in joinGroup: ${error.message}`);
    }
}

module.exports = {
    getAllGroups,
    createGroup,
    getGroupById,
    authenticateUser,
    joinGroup
};
