// Import the mssql package and the database configuration
const sql = require('mssql');
const config = require('../dbConfig');

class GroupModel {
    // Method to update the description of a group
    static async updateDescription(groupId, newDescription) {
        try {
            const pool = await sql.connect(config); // Connect to the DB
            await pool.request()
                .input('GroupID', sql.Int, groupId) // Pass GroupID parameter
                .input('NewDescription', sql.NVarChar(255), newDescription) // Pass updated description
                .query('UPDATE HobbyGroups SET GroupDescription = @NewDescription WHERE GroupID = @GroupID'); // Run SQL update query
            return true; // Return true on success
        } 
        catch (error) {
            // Throw a descriptive error if anything fails
            throw new Error(`Database error in updateDescription: ${error.message}`);
        }
    }

    // Method to delete a group and all its members using a transaction
    static async deleteGroupWithMembers(groupId) {
        try {
            const pool = await sql.connect(config);
            const transaction = new sql.Transaction(pool); // Start transaction
            await transaction.begin(); // Begin transaction
            try {
                // Step 1: Delete all channels in the group (if Channels table exists)
                await transaction.request()
                    .input('GroupID', sql.Int, groupId)
                    .query('DELETE FROM Channels WHERE GroupID = @GroupID');

                // Step 2: Delete all members in the group
                await transaction.request()
                    .input('GroupID', sql.Int, groupId)
                    .query('DELETE FROM Members WHERE GroupID = @GroupID');

                // Step 3: Delete the group itself
                await transaction.request()
                    .input('GroupID', sql.Int, groupId)
                    .query('DELETE FROM HobbyGroups WHERE GroupID = @GroupID');

                // Commit changes if all deletions succeed
                await transaction.commit();
                return true;
            } 
            catch (error) {
                // Roll back changes if anything fails
                await transaction.rollback();
                throw error;
            }
        } 
        catch (error) {
            throw new Error(`Database error in deleteGroupWithMembers: ${error.message}`);
        }
    }

    // Method to remove a specific user from a specific group
    static async removeUserFromGroup(groupId, userId) {
        try {
            const pool = await sql.connect(config);
            await pool.request()
                .input('GroupID', sql.Int, groupId)
                .input('UserID', sql.Int, userId)
                .query('DELETE FROM Members WHERE GroupID = @GroupID AND UserID = @UserID');
            return true;
        } 
        catch (error) {
            throw new Error(`Database error in removeUserFromGroup: ${error.message}`);
        }
    }

    // Method to check if a user is a member of a group
    static async checkUserMembership(groupId, userId) {
        try {
            const pool = await sql.connect(config);
            const result = await pool.request()
                .input('GroupID', sql.Int, groupId)
                .input('UserID', sql.Int, userId)
                .query('SELECT COUNT(*) as memberCount FROM Members WHERE GroupID = @GroupID AND UserID = @UserID');
            // Returns true if user is a member
            return result.recordset[0].memberCount > 0;
        } 
        catch (error) {
            throw new Error(`Database error in checkUserMembership: ${error.message}`);
        }
    }

    // Method to count how many users are members of a group
    static async getMemberCount(groupId) {
        try {
            const pool = await sql.connect(config);
            const result = await pool.request()
                .input('GroupID', sql.Int, groupId)
                .query('SELECT COUNT(DISTINCT UserID) as memberCount FROM Members WHERE GroupID = @GroupID');
            // Return the count value
            return result.recordset[0].memberCount;
        } 
        catch (error) {
            throw new Error(`Database error in getMemberCount: ${error.message}`);
        }
    }

    // Method to get a list of all group members and label them as Admin or Member
    static async getMemberListWithRoles(groupId) {
        try {
            const pool = await sql.connect(config);
            const result = await pool.request()
                .input('GroupID', sql.Int, groupId)
                .query(`
                    SELECT 
                        m.Name,
                        -- Assign role based on whether user is the group owner
                        CASE 
                            WHEN m.UserID = hg.OwnerID THEN 'Owner'
                            ELSE 'Member'
                        END as Role,
                        -- Sort Owner first, then Members
                        CASE 
                            WHEN m.UserID = hg.OwnerID THEN 1
                            ELSE 2
                        END as SortOrder
                    FROM Members m
                    INNER JOIN HobbyGroups hg ON m.GroupID = hg.GroupID
                    WHERE m.GroupID = @GroupID
                    ORDER BY SortOrder ASC, m.Name ASC
                `);
            // Return a simplified list of member objects
            return result.recordset.map(member => ({
                name: member.Name,
                role: member.Role
            }));
        } 
        catch (error) {
            throw new Error(`Database error in getMemberListWithRoles: ${error.message}`);
        }
    }

    // Method to check if a user is the owner of a group
    static async checkGroupOwnership(groupId, userId) {
        try {
            const pool = await sql.connect(config);
            const result = await pool.request()
                .input('GroupID', sql.Int, groupId)
                .input('UserID', sql.Int, userId)
                .query('SELECT COUNT(*) as ownerCount FROM HobbyGroups WHERE GroupID = @GroupID AND OwnerID = @UserID');
            // Returns true if user is the owner
            return result.recordset[0].ownerCount > 0;
        } 
        catch (error) {
            throw new Error(`Database error in checkGroupOwnership: ${error.message}`);
        }
    }
}

// Export the class to be used in routes/controllers
module.exports = GroupModel;
