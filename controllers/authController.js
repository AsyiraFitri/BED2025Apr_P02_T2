require("dotenv").config();
const sql = require('mssql');
const dbConfig = require('../dbConfig');
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

async function registerUser(req, res) {
  console.log("REGISTER req.body:", req.body);

  try {
    const { email, password, first_name, last_name, phone_number } = req.body;
    if (!email || !password || !first_name || !last_name)
      return res.status(400).json({ error: "Missing required fields" });

    const pool = await sql.connect(dbConfig);

    // Check if user exists
    const existingUser = await pool
      .request()
      .input("email", sql.VarChar, email)
      .query("SELECT * FROM Users WHERE email = @email");

    if (existingUser.recordset.length > 0) {
      return res.status(400).json({ error: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await pool
      .request()
      .input("email", sql.VarChar, email)
      .input("password", sql.VarChar, hashedPassword)
      .input("first_name", sql.VarChar, first_name)
      .input("last_name", sql.VarChar, last_name)
      .input("phone_number", phone_number || null)
      .input("role", sql.VarChar, "user") // Default role is user
      .query("INSERT INTO Users (email, password, first_name, last_name, phone_number, role) VALUES (@email, @password, @first_name, @last_name, @phone_number, @role)");

    res.status(201).json({ message: "User registered" });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

async function loginUser(req, res) {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const pool = await sql.connect(dbConfig);
    
    // Check if user exists
    const user = await pool
      .request()
      .input("email", sql.VarChar, email)
      .query("SELECT * FROM Users WHERE email = @email");

    if (user.recordset.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isValidPassword = await bcrypt.compare(password, user.recordset[0].password);
    
    if (!isValidPassword) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        UserID: user.recordset[0].UserID, 
        email: user.recordset[0].email,
        first_name: user.recordset[0].first_name,
        last_name: user.recordset[0].last_name,
        role: user.recordset[0].role || 'user'
      },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "24h" }
    );

    // Return user data and token
    res.status(200).json({
      message: "Login successful",
      token: token,
      user: {
        UserID: user.recordset[0].UserID,
        email: user.recordset[0].email,
        first_name: user.recordset[0].first_name,
        last_name: user.recordset[0].last_name,
        role: user.recordset[0].role || 'user',
        FullName: `${user.recordset[0].first_name} ${user.recordset[0].last_name}`.trim()
      }
    });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

async function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email required" });

    const pool = await sql.connect(dbConfig);

    const user = await pool
      .request()
      .input("email", email)
      .query("SELECT * FROM Users WHERE email = @email");

    if (user.recordset.length === 0)
      return res.status(400).json({ error: "User not found" });

    const token = jwt.sign({ email }, process.env.RESET_SECRET, {
      expiresIn: "1h",
    });

    const resetUrl = `http://localhost:3000/reset-password.html?token=${token}`;
    res.json({ 
      message: "Password reset link generated", 
      resetUrl: resetUrl
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

async function resetPassword(req, res) {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) return res.status(400).json({ error: "Password required" });

    // Verify token
    let payload;
    try {
      payload = jwt.verify(token, process.env.RESET_SECRET);
    } catch {
      return res.status(400).json({ error: "Invalid or expired token" });
    }

    const pool = await sql.connect(dbConfig);

    const hashedPassword = await bcrypt.hash(password, 10);

    await pool
      .request()
      .input("email", payload.email)
      .input("password", hashedPassword)
      .query("UPDATE Users SET password = @password WHERE email = @email");

    res.json({ message: "Password has been reset" });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
};