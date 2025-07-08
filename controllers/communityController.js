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
  const { groupName, groupDescription } = req.body;

  if (!groupName) {
    return res.status(400).json({ error: 'Group name is required' });
  }

  try {
    const pool = await sql.connect(config);
    await pool.request()
      .input('GroupName', sql.NVarChar(100), groupName)
      .input('GroupDescription', sql.NVarChar(255), groupDescription || '')
      .query('INSERT INTO HobbyGroups (GroupName, GroupDescription) VALUES (@GroupName, @GroupDescription)');
    res.status(201).json({ message: 'Group added' });
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

// Make sure to export all functions
module.exports = {
  getAllGroups,
  createGroup,
  getGroupById
};