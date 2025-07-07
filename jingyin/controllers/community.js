const sql = require('mssql');
const config = require('../../dbConfig');

module.exports = {
  getAllGroups: async (req, res) => {
    try {
      const pool = await sql.connect(config);
      const result = await pool.request().query('SELECT * FROM HobbyGroups');
      res.json(result.recordset);
    } catch (error) {
      console.error('DB Fetch error:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  },

  createGroup: async (req, res) => {
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
  }
};
