const sql = require('mssql');
const config = require('../dbConfig');

const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const pool = await sql.connect(config);
    const result = await pool.request()
      .input('Email', sql.NVarChar(100), email)
      .input('Password', sql.NVarChar(255), password) // Change to PasswordHash if hashed
      .query('SELECT * FROM Users WHERE Email = @Email AND PasswordHash = @Password');

    if (result.recordset.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const user = result.recordset[0];

    res.json({
      success: true,
      user: {
        UserID: user.UserID,
        FullName: user.FullName,
        Email: user.Email,
        Role: user.Role,
        IsVerified: user.IsVerified
        // You can add more fields if needed
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};

module.exports = {
    loginUser
};
