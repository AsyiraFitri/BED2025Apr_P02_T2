// Import the mssql package for SQL server interaction and the DB configuration
const sql = require('mssql');
const config = require('../dbConfig');

// Update group description
async function updateDescription(groupId, newDescription) {
    try {
        const pool = await sql.connect(config);
        await pool.request()
            .input('GroupID', sql.Int, groupId)
            .input('NewDescription', sql.NVarChar(255), newDescription)
            .query('UPDATE HobbyGroups SET GroupDescription = @NewDescription WHERE GroupID = @GroupID');
        return true;
    } 
    catch (error) {
        throw new Error(`Database error in updateDescription: ${error.message}`);
    }
}

// Delete group and all its members (transaction)
async function deleteGroupWithMembers(groupId) {
    try {
        const pool = await sql.connect(config);
        const transaction = new sql.Transaction(pool);
        await transaction.begin();
        try {
            await transaction.request()
                .input('GroupID', sql.Int, groupId)
                .query('DELETE FROM Channels WHERE GroupID = @GroupID');
            await transaction.request()
                .input('GroupID', sql.Int, groupId)
                .query('DELETE FROM Members WHERE GroupID = @GroupID');
            await transaction.request()
                .input('GroupID', sql.Int, groupId)
                .query('DELETE FROM Events WHERE GroupID = @GroupID');
            await transaction.request()
                .input('GroupID', sql.Int, groupId)
                .query('DELETE FROM HobbyGroups WHERE GroupID = @GroupID');

            await transaction.commit();
            return true;
        } 
        catch (error) {
            await transaction.rollback();
            throw error;
        }
    } 
    catch (error) {
        throw new Error(`Database error in deleteGroupWithMembers: ${error.message}`);
    }
}

// Remove a specific user from a group
async function removeUserFromGroup(groupId, userId) {
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

// Check if a user is a member of a group (or admin)
async function checkUserMembership(groupId, userId) {
    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input('GroupID', sql.Int, groupId)
            .input('UserID', sql.Int, userId)
            .query(`
                SELECT 
                    CASE 
                        WHEN u.Role = 'admin' THEN 1
                        WHEN m.UserID IS NOT NULL THEN 1
                        ELSE 0
                    END as isMember
                FROM Users u
                LEFT JOIN Members m ON m.UserID = u.UserID AND m.GroupID = @GroupID
                WHERE u.UserID = @UserID
            `);
        // Check for empty result or missing property
        if (!result || !result.recordset || result.recordset.length === 0) {
            return { isMember: false };
        }
        const row = result.recordset[0];
        return { isMember: !!(row && (row.isMember === 1 || row.isMember === true)) };
    } 
    catch (error) {
        throw new Error(`Database error in checkUserMembership: ${error.message}`);
    }
}

// Get member count for a group
async function getMemberCount(groupId) {
    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input('GroupID', sql.Int, groupId)
            .query('SELECT COUNT(DISTINCT UserID) as memberCount FROM Members WHERE GroupID = @GroupID');
        return result.recordset[0].memberCount;
    } 
    catch (error) {
        throw new Error(`Database error in getMemberCount: ${error.message}`);
    }
}

// Get list of all group members and their roles
async function getMemberListWithRoles(groupId) {
    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input('GroupID', sql.Int, groupId)
            .query(`
                SELECT 
                    m.Name,
                    CASE 
                        WHEN m.UserID = hg.OwnerID THEN 'Owner'
                        WHEN u.role = 'admin' THEN 'Admin'
                        ELSE 'Member'
                    END as Role,
                    CASE 
                        WHEN m.UserID = hg.OwnerID THEN 1
                        WHEN u.role = 'admin' THEN 2
                        ELSE 3
                    END as SortOrder
                FROM Members m
                INNER JOIN HobbyGroups hg ON m.GroupID = hg.GroupID
                INNER JOIN Users u ON m.UserID = u.UserID
                WHERE m.GroupID = @GroupID
                ORDER BY SortOrder ASC, m.Name ASC
            `);
        return result.recordset.map(member => ({
            name: member.Name,
            role: member.Role
        }));
    } 
    catch (error) {
        throw new Error(`Database error in getMemberListWithRoles: ${error.message}`);
    }
}

// Check if a user is the owner of a group
async function checkGroupOwnership(groupId, userId) {
    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input('GroupID', sql.Int, groupId)
            .input('UserID', sql.Int, userId)
            .query('SELECT OwnerID FROM HobbyGroups WHERE GroupID = @GroupID');
        const row = result.recordset[0];
        if (!row) return false;
        return Number(row.OwnerID) === Number(userId);
    } 
    catch (error) {
        throw new Error(`Database error in checkGroupOwnership: ${error.message}`);
    }
}

// Create a new event for a group
async function createEvent(groupId, channelName, title, description, eventDate, startTime, endTime, location, createdBy) {
    try {
        const createdAt = new Date();
        const pool = await sql.connect(config);
        await pool.request()
            .input('GroupID', sql.Int, groupId)
            .input('ChannelName', sql.NVarChar(100), channelName)
            .input('Title', sql.NVarChar(100), title)
            .input('Description', sql.NVarChar(sql.MAX), description)
            .input('EventDate', sql.Date, eventDate)
            .input('StartTime', sql.NVarChar(10), startTime)
            .input('EndTime', sql.NVarChar(10), endTime)
            .input('Location', sql.NVarChar(100), location)
            .input('CreatedBy', sql.Int, createdBy)
            .input('CreatedAt', sql.DateTime, createdAt)
            .query(`
                INSERT INTO Events (
                    GroupID, ChannelName, Title, Description, EventDate, StartTime, EndTime, Location, CreatedBy, CreatedAt
                ) 
                VALUES (
                    @GroupID, @ChannelName, @Title, @Description, @EventDate, @StartTime, @EndTime, @Location, @CreatedBy, @CreatedAt
                )
            `);
        return true;
    } 
    catch (error) {
        throw new Error(`Database error in createEvent: ${error.message}`);
    }
}

// Get all events for a group
async function getEvents(groupId) {
    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input('GroupID', sql.Int, groupId)
            .query(`
                SELECT e.EventID, e.Title, e.Description, e.EventDate, e.StartTime, e.EndTime, e.Location, e.CreatedBy, (u.first_name + ' ' + u.last_name) AS CreatorName
                FROM Events e
                LEFT JOIN Users u ON e.CreatedBy = u.UserID
                WHERE e.GroupID = @GroupID
                ORDER BY e.EventDate DESC, e.StartTime ASC
            `);
        return result.recordset;
    } 
    catch (error) {
        throw new Error(`Database error in getEvents: ${error.message}`);
    }
}

// Delete an event by eventId
async function deleteEvent(eventId) {
    try {
        const pool = await sql.connect(config);
        await pool.request()
            .input('EventID', sql.Int, eventId)
            .query('DELETE FROM Events WHERE EventID = @EventID');
        return true;
    } 
    catch (error) {
        throw new Error(`Database error in deleteEvent: ${error.message}`);
    }
}

// Get user details by userId (for event author display)
async function getUserDetailsById(userId) {
    try {
        // Ensure userId is an integer
        const userIdInt = parseInt(userId, 10);
        if (isNaN(userIdInt)) throw new Error('Invalid userId');
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input('UserID', sql.Int, userIdInt)
            .query(`SELECT TOP 1 first_name, last_name, username, email FROM Users WHERE UserID = @UserID`);
        if (result.recordset.length === 0) return { name: `User ${userId}` };
        const { first_name, last_name, username, email } = result.recordset[0];
        let name = [first_name, last_name].filter(Boolean).join(' ').trim();
        if (!name) {
            if (username && username.trim()) {
                name = username.trim();
            } 
            else if (email && email.trim()) {
                name = email.trim();
            } 
            else {
                name = `User ${userId}`;
            }
        }
        return { name };
    } 
    catch (error) {
        throw new Error(`Database error in getUserDetailsById: ${error.message}`);
    }
}

// Update an event by eventId and groupId
// Update an event by eventId and groupId, only if userId matches creator
async function updateEvent(eventId, groupId, title, description, eventDate, startTime, endTime, location, userId) {
    try {
        const pool = await sql.connect(config);
        // Check if the user is the creator of the event
        const check = await pool.request()
            .input('EventID', sql.Int, eventId)
            .query('SELECT CreatedBy FROM Events WHERE EventID = @EventID');
        if (!check.recordset.length) {
            throw new Error('Event not found.');
        }
        if (String(check.recordset[0].CreatedBy) !== String(userId)) {
            throw new Error('Unauthorized: Only the event creator can update this event.');
        }
        await pool.request()
            .input('EventID', sql.Int, eventId)
            .input('GroupID', sql.Int, groupId)
            .input('Title', sql.NVarChar(100), title)
            .input('Description', sql.NVarChar(sql.MAX), description)
            .input('EventDate', sql.Date, eventDate)
            .input('StartTime', sql.NVarChar(10), startTime)
            .input('EndTime', sql.NVarChar(10), endTime)
            .input('Location', sql.NVarChar(100), location)
            .query(`
                UPDATE Events
                SET Title = @Title,
                    Description = @Description,
                    EventDate = @EventDate,
                    StartTime = @StartTime,
                    EndTime = @EndTime,
                    Location = @Location
                WHERE EventID = @EventID AND GroupID = @GroupID
            `);
        return true;
    } 
    catch (error) {
        throw new Error(`Database error in updateEvent: ${error.message}`);
    }
}

module.exports = {
    updateDescription,
    deleteGroupWithMembers,
    removeUserFromGroup,
    checkUserMembership,
    getMemberCount,
    getMemberListWithRoles,
    checkGroupOwnership,
    createEvent,
    getEvents,
    deleteEvent,
    getUserDetailsById,
    updateEvent
};
