// Import the mssql package for SQL server interaction and the DB configuration
const sql = require('mssql');
const config = require('../dbConfig');

class GroupModel {
    // Method to update the description of a group
    static async updateDescription(groupId, newDescription) {
        try {
            const pool = await sql.connect(config); // Establish a connection to the database
            await pool.request()
                .input('GroupID', sql.Int, groupId) // Pass GroupID parameter
                .input('NewDescription', sql.NVarChar(255), newDescription) // Pass the updated description
                .query('UPDATE HobbyGroups SET GroupDescription = @NewDescription WHERE GroupID = @GroupID'); // Run the SQL update query
            return true; // Return true on success if update was successful
        } 
        catch (error) {
            // If anything fails, throw a descriptive error with the error details
            throw new Error(`Database error in updateDescription: ${error.message}`);
        }
    }

    // Method to delete a group and all its members using a transaction
    static async deleteGroupWithMembers(groupId) {
        try {
            const pool = await sql.connect(config); // Establish a connection to the database
            const transaction = new sql.Transaction(pool); // Start a transaction
            await transaction.begin(); // Begin the transaction
            
            try {
                // Step 1: Delete all channels related to the group from the Channels table
                await transaction.request()
                    .input('GroupID', sql.Int, groupId)
                    .query('DELETE FROM Channels WHERE GroupID = @GroupID');

                // Step 2: Delete all members from the Members table for the group
                await transaction.request()
                    .input('GroupID', sql.Int, groupId)
                    .query('DELETE FROM Members WHERE GroupID = @GroupID');

                // Step 3: Finally, delete the group itself from the HobbyGroups table
                await transaction.request()
                    .input('GroupID', sql.Int, groupId)
                    .query('DELETE FROM HobbyGroups WHERE GroupID = @GroupID');

                // Commit the transaction if all steps succeed
                await transaction.commit();
                return true; // Return true if the group and related data were successfully deleted
            } 
            catch (error) {
                // If anything fails during the transaction, roll back all changes
                await transaction.rollback();
                throw error; // Rethrow the error after rollback
            }
        } 
        catch (error) {
            // If the outer try block fails, throw a descriptive error
            throw new Error(`Database error in deleteGroupWithMembers: ${error.message}`);
        }
    }

    // Method to remove a specific user from a specific group
    static async removeUserFromGroup(groupId, userId) {
        try {
            const pool = await sql.connect(config); // Establish a connection to the database
            await pool.request()
                .input('GroupID', sql.Int, groupId) // Pass GroupID parameter
                .input('UserID', sql.Int, userId) // Pass UserID parameter
                .query('DELETE FROM Members WHERE GroupID = @GroupID AND UserID = @UserID'); // Run the query to remove the user
            return true; // Return true on success
        } 
        catch (error) {
            // If anything fails, throw a descriptive error
            throw new Error(`Database error in removeUserFromGroup: ${error.message}`);
        }
    }

    // Method to check if a user is a member of a group (also checks if user is an admin)
    static async checkUserMembership(groupId, userId) {
        try {
            const pool = await sql.connect(config); // Establish a connection to the database
            
            // Query to check if the user is an admin or a member of the group
            const result = await pool.request()
                .input('GroupID', sql.Int, groupId)
                .input('UserID', sql.Int, userId)
                .query(`
                    SELECT 
                        CASE 
                            WHEN u.Role = 'admin' THEN 1  -- User is an admin
                            WHEN m.UserID IS NOT NULL THEN 1  -- User is a member of the group
                            ELSE 0  -- User is neither an admin nor a member
                        END as isMember
                    FROM Users u
                    LEFT JOIN Members m ON m.UserID = u.UserID AND m.GroupID = @GroupID
                    WHERE u.UserID = @UserID
                `);
            
            // Returns true if the user is an admin or a member of the group
            return result.recordset[0].isMember === 1;
        } 
        catch (error) {
            // If anything fails, throw a descriptive error
            throw new Error(`Database error in checkUserMembership: ${error.message}`);
        }
    }

    // Method to count how many users are members of a group
    static async getMemberCount(groupId) {
        try {
            const pool = await sql.connect(config); // Establish a connection to the database
            const result = await pool.request()
                .input('GroupID', sql.Int, groupId) // Pass GroupID parameter
                .query('SELECT COUNT(DISTINCT UserID) as memberCount FROM Members WHERE GroupID = @GroupID'); // Query to count unique users
            return result.recordset[0].memberCount; // Return the count of members
        } 
        catch (error) {
            // If anything fails, throw a descriptive error
            throw new Error(`Database error in getMemberCount: ${error.message}`);
        }
    }

    // Method to get a list of all group members and label them as Owner, Admin, or Member
    static async getMemberListWithRoles(groupId) {
        try {
            const pool = await sql.connect(config); // Establish a connection to the database
            const result = await pool.request()
                .input('GroupID', sql.Int, groupId) // Pass GroupID parameter
                .query(`
                    SELECT 
                        m.Name,
                        -- Assign role based on user type
                        CASE 
                            WHEN m.UserID = hg.OwnerID THEN 'Owner'  -- If UserID matches OwnerID, assign 'Owner'
                            WHEN u.role = 'admin' THEN 'Admin'  -- If user role is admin, assign 'Admin'
                            ELSE 'Member'  -- Otherwise, assign 'Member'
                        END as Role,
                        -- Sort Owner first, then Admins, then Members
                        CASE 
                            WHEN m.UserID = hg.OwnerID THEN 1  -- Owner first in sort order
                            WHEN u.role = 'admin' THEN 2  -- Admins second
                            ELSE 3  -- Members last in sort order
                        END as SortOrder
                    FROM Members m
                    INNER JOIN HobbyGroups hg ON m.GroupID = hg.GroupID
                    INNER JOIN Users u ON m.UserID = u.UserID
                    WHERE m.GroupID = @GroupID
                    ORDER BY SortOrder ASC, m.Name ASC  -- Sort results by role and then by name
                `);
            // Return a simplified list of members with their roles
            return result.recordset.map(member => ({
                name: member.Name,  // Member's name
                role: member.Role   // Member's role (Owner, Admin or Member)
            }));
        } 
        catch (error) {
            // If anything fails, throw a descriptive error
            throw new Error(`Database error in getMemberListWithRoles: ${error.message}`);
        }
    }

    // Method to check if a user is the owner of a group
    static async checkGroupOwnership(groupId, userId) {
        try {
            const pool = await sql.connect(config); // Establish a connection to the database
            const result = await pool.request()
                .input('GroupID', sql.Int, groupId) // Pass GroupID parameter
                .input('UserID', sql.Int, userId) // Pass UserID parameter
                .query('SELECT COUNT(*) as ownerCount FROM HobbyGroups WHERE GroupID = @GroupID AND OwnerID = @UserID'); // Query to check ownership
            // Returns true if user is the owner of the group
            return result.recordset[0].ownerCount > 0;
        } 
        catch (error) {
            // If anything fails, throw a descriptive error
            throw new Error(`Database error in checkGroupOwnership: ${error.message}`);
        }
    }
}

module.exports = GroupModel;
