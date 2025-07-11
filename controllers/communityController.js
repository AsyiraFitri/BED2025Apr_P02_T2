// Import the mssql package and DB config
const sql = require('mssql');
const config = require('../dbConfig');

// Controller to fetch all hobby groups
const getAllGroups = async (req, res) => {
  console.log('=== getAllGroups called ===');
  try {
    console.log('Connecting to database...');
    const pool = await sql.connect(config); // Connect to the database
    console.log('Database connected successfully');

    const result = await pool.request().query('SELECT * FROM HobbyGroups'); // Run the query
    console.log('Query result:', result.recordset);

    res.json(result.recordset); // Send all groups as JSON response
  } catch (error) {
    console.error('Error in getAllGroups:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
};

// Controller to create a new hobby group
const createGroup = async (req, res) => {
  const { groupName, groupDescription, adminId } = req.body; // Extract data from request body

  // Validation: Group name is required
  if (!groupName) {
    return res.status(400).json({ error: 'Group name is required' });
  }

  try {
    const pool = await sql.connect(config); // Connect to DB
    const result = await pool.request()
      .input('GroupName', sql.NVarChar(100), groupName)
      .input('GroupDescription', sql.NVarChar(255), groupDescription || '') // Default to empty string
      .input('AdminID', sql.Int, adminId)
      .query(
        `INSERT INTO HobbyGroups (GroupName, GroupDescription, AdminID)
         VALUES (@GroupName, @GroupDescription, @AdminID);
         SELECT SCOPE_IDENTITY() AS GroupID`
      );

    const newGroupId = result.recordset[0].GroupID; // Get the newly created group ID
    res.status(201).json({
      message: 'Group added successfully',
      groupId: newGroupId
    });
  } catch (error) {
    console.error('DB Insert error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Controller to get a single group by its ID
const getGroupById = async (req, res) => {
  const groupId = req.params.id; // Extract group ID from request URL

  try {
    const pool = await sql.connect(config); // Connect to DB
    const result = await pool.request()
      .input('GroupID', sql.Int, groupId)
      .query('SELECT * FROM HobbyGroups WHERE GroupID = @GroupID');

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Group not found' }); // Group doesn't exist
    }

    res.json(result.recordset[0]); // Send group data
  } catch (error) {
    console.error('DB Fetch error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Controller to handle user login
const loginUser = async (req, res) => {
  const { email, password } = req.body; // Read credentials from request body

  try {
    const pool = await sql.connect(config); // Connect to DB
    const result = await pool.request()
      .input('Email', sql.NVarChar(100), email)
      .input('PasswordHash', sql.NVarChar(255), password) // NOTE: Passwords should be hashed!
      .query('SELECT * FROM Users WHERE Email = @Email AND PasswordHash = @PasswordHash');

    if (result.recordset.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' }); // Invalid login
    }

    const user = result.recordset[0]; // Get the user
    res.json({ success: true, user }); // Send user data
  } catch (error) {
    console.error('Login DB error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// Controller to join a user to a group
const joinGroup = async (req, res) => {
  const { groupId, userId, fullName } = req.body; // Extract relevant data from request body

  try {
    const pool = await sql.connect(config); // Connect to DB
    await pool.request()
      .input('UserID', sql.Int, userId)
      .input('GroupID', sql.Int, groupId)
      .input('Name', sql.NVarChar(500), fullName)
      .query('INSERT INTO Members (UserID, GroupID, Name) VALUES (@UserID, @GroupID, @Name)');

    res.status(201).json({ message: 'Joined group successfully' }); // Success response
  } catch (error) {
    console.error('Join Group error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Export all controller functions
module.exports = {
  getAllGroups,
  createGroup,
  getGroupById,
  loginUser,
  joinGroup
};
