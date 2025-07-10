const sql = require('mssql');
const config = require('../dbConfig');

const getAllGroups = async (req, res) => {
  console.log('=== getAllGroups called ===');
  try {
    console.log('Connecting to database...');
    const pool = await sql.connect(config);
    console.log('Database connected successfully');
    
    const result = await pool.request().query('SELECT * FROM HobbyGroups');
    console.log('Query result:', result.recordset);
    
    res.json(result.recordset);
  } catch (error) {
    console.error('Error in getAllGroups:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
};

const createGroup = async (req, res) => {
  const { groupName, groupDescription , adminId} = req.body;

  if (!groupName) {
    return res.status(400).json({ error: 'Group name is required' });
  }

  try {
    const pool = await sql.connect(config);
    const result = await pool.request()
      .input('GroupName', sql.NVarChar(100), groupName)
      .input('GroupDescription', sql.NVarChar(255), groupDescription || '')
      .input('AdminID', sql.Int, adminId) // Assuming adminId is passed in the request body
      .query('INSERT INTO HobbyGroups (GroupName, GroupDescription, AdminID) VALUES (@GroupName, @GroupDescription, @AdminID); SELECT SCOPE_IDENTITY() AS GroupID');
    
    const newGroupId = result.recordset[0].GroupID;
    res.status(201).json({ 
      message: 'Group added successfully', 
      groupId: newGroupId 
    });
  } catch (error) {
    console.error('DB Insert error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const getGroupById = async (req, res) => {
  const groupId = req.params.id;

  try {
    const pool = await sql.connect(config);
    const result = await pool.request()
      .input('GroupID', sql.Int, groupId)
      .query('SELECT * FROM HobbyGroups WHERE GroupID = @GroupID');

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Group not found' });
    }

    res.json(result.recordset[0]);
  } catch (error) {
    console.error('DB Fetch error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
const loginUser = async (req, res) => {
  const { email, password } = req.body; // Read email and password from client

  try {
    const pool = await sql.connect(config);
    const result = await pool.request()
      .input('Email', sql.NVarChar(100), email)
      .input('PasswordHash', sql.NVarChar(255), password) // assuming password is not hashed for now
      .query('SELECT * FROM Users WHERE Email = @Email AND PasswordHash = @PasswordHash');

    if (result.recordset.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const user = result.recordset[0];
    res.json({ success: true, user }); // Send full user object back to frontend
  } catch (error) {
    console.error('Login DB error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};
const joinGroup = async (req, res) => {
  const { groupId, userId, fullName } = req.body; // Receive all needed data
 
  try {
    const pool = await sql.connect(config);
    await pool.request()
      .input('UserID', sql.Int, userId)
      .input('GroupID', sql.Int, groupId)
      .input("Name", sql.NVarChar(500), fullName)
      .query('INSERT INTO Members (UserID, GroupID, Name) VALUES (@UserID, @GroupID, @Name)');

    res.status(201).json({ message: 'Joined group successfully' });

  } catch (error) {
    console.error('Join Group error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = {
  getAllGroups,
  createGroup,
  getGroupById,
  loginUser,
  joinGroup
};