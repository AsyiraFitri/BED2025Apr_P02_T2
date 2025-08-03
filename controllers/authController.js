require("dotenv").config();
const sql = require('mssql');
const dbConfig = require('../dbConfig');
const bcrypt = require("bcrypt");  // For password hashing
const jwt = require("jsonwebtoken");

/*    Mailgun Setup for Sending Emails    */
const Mailgun = require('mailgun.js').default;
const FormData = require('form-data');

// Load Mailgun credentials from environment variables
const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY;
const DOMAIN = process.env.MAILGUN_DOMAIN;

// Log Mailgun config status for debugging
console.log('=== MAILGUN CONFIG CHECK ===');
console.log('API Key present:', !!MAILGUN_API_KEY);
console.log('API Key format correct:', MAILGUN_API_KEY?.startsWith('key-') && MAILGUN_API_KEY?.length > 40);
console.log('Domain:', DOMAIN);

// Create Mailgun client
const mailgun = new Mailgun(FormData);
const mg = mailgun.client({
  username: 'api',
  key: MAILGUN_API_KEY,
  url: 'https://api.mailgun.net'
});

/*      User Registration       */
async function registerUser(req, res) {
  console.log("REGISTER req.body:", req.body);

  try {
    const { email, password, first_name, last_name, phone_number } = req.body;

    const cleanedEmail = email.trim().toLowerCase();
    const pool = await sql.connect(dbConfig);

    // Check if user exists
    const existingUser = await pool
      .request()
      .input("email", sql.VarChar, cleanedEmail)
      .query("SELECT * FROM Users WHERE LOWER(email) = LOWER(@email)");

    if (existingUser.recordset.length > 0) {
      return res.status(400).json({ error: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await pool
      .request()
      .input("email", sql.VarChar, cleanedEmail)
      .input("password", sql.VarChar, hashedPassword)
      .input("first_name", sql.VarChar, first_name)
      .input("last_name", sql.VarChar, last_name)
      .input("phone_number", phone_number || null)
      .input("role", sql.VarChar, "user")
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

    const pool = await sql.connect(dbConfig);
    
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

    const token = jwt.sign(
      { 
        id: user.recordset[0].UserID, 
        email: user.recordset[0].email,
        first_name: user.recordset[0].first_name,
        last_name: user.recordset[0].last_name,
        role: user.recordset[0].role || 'user'
      },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "24h" }
    );

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

    console.log('=== FORGOT PASSWORD REQUEST ===');
    console.log('Email:', email);
    console.log('API Key present:', !!MAILGUN_API_KEY);
    console.log('Domain:', DOMAIN);

    if (!MAILGUN_API_KEY || !DOMAIN) {
      return res.status(500).json({ error: 'Email service not configured' });
    }

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

    const messageData = {
      from: `EverydayCare <postmaster@${DOMAIN}>`,
      to: [email],
      subject: 'Password Reset Request - EverydayCare',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p>Hello,</p>
          <p>You requested a password reset for your EverydayCare account.</p>
          <p>Click the button below to reset your password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #4CAF50; 
                      color: white; 
                      padding: 14px 30px; 
                      text-decoration: none; 
                      border-radius: 5px; 
                      display: inline-block;
                      font-weight: bold;">
              Reset Password
            </a>
          </div>
          <p><strong>Important:</strong> This link will expire in 1 hour for security reasons.</p>
          <p>If you didn't request this password reset, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">
            This is an automated message from EverydayCare.
          </p>
        </div>
      `
    };

    console.log('Sending email to:', email);
    console.log('Using domain:', DOMAIN);

    try {
      const data = await mg.messages.create(DOMAIN, messageData);
      console.log('Email sent successfully:', data);

      res.status(200).json({ 
        message: "Password reset link has been sent to your email address"
      });
    } catch (mailgunError) {
      console.error('Mailgun error:', {
        status: mailgunError.status,
        message: mailgunError.message,
        details: mailgunError.details
      });

      if (mailgunError.status === 401) {
        return res.status(500).json({ 
          error: 'Email service authentication failed. Please check API key.' 
        });
      } else if (mailgunError.status === 400) {
        return res.status(500).json({ 
          error: 'Invalid email request. Please check domain configuration.' 
        });
      } else {
        return res.status(500).json({ 
          error: 'Failed to send email. Please try again later.' 
        });
      }
    }

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ 
      error: 'Internal server error. Please try again.' 
    });
  }
}

async function resetPassword(req, res) {
  try {
    const { token } = req.params;
    const { password } = req.body;

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

    // Send confirmation email
    if (MAILGUN_API_KEY && DOMAIN) {
      try {
        const confirmationMessage = {
          from: `EverydayCare <postmaster@${DOMAIN}>`,
          to: [payload.email],
          subject: 'Password Reset Successful - EverydayCare',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">Password Reset Successful</h2>
              <p>Your password has been successfully reset.</p>
              <p>If you didn't make this change, please contact our support team immediately.</p>
            </div>
          `
        };
        
        await mg.messages.create(DOMAIN, confirmationMessage);
        console.log('✅ Confirmation email sent');
      } catch (emailError) {
        console.error("Failed to send confirmation email:", emailError);
      }
    }

    res.status(200).json({ message: "Password has been reset successfully" });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

async function logoutUser(req, res) {
  res.status(200).json({ message: "Logged out successfully" });
}

// Debug function to check environment variables
async function debugEnvironment(req, res) {
  const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY;
  const DOMAIN = process.env.MAILGUN_DOMAIN;
  
  console.log('=== ENVIRONMENT DEBUGGING ===');
  
  // Check for hidden characters
  const apiKeyBytes = MAILGUN_API_KEY ? Array.from(MAILGUN_API_KEY).map(c => c.charCodeAt(0)) : [];
  const hasHiddenChars = apiKeyBytes.some(code => code < 32 || code > 126);
  
  const analysis = {
    apiKey: {
      present: !!MAILGUN_API_KEY,
      length: MAILGUN_API_KEY?.length,
      startsWithKey: MAILGUN_API_KEY?.startsWith('key-'),
      endsWithValidChar: MAILGUN_API_KEY ? MAILGUN_API_KEY.charCodeAt(MAILGUN_API_KEY.length - 1) : null,
      hasHiddenCharacters: hasHiddenChars,
      firstTenChars: MAILGUN_API_KEY?.substring(0, 10),
      lastTenChars: MAILGUN_API_KEY?.substring(MAILGUN_API_KEY.length - 10),
      trimmedLength: MAILGUN_API_KEY?.trim().length,
      rawValue: JSON.stringify(MAILGUN_API_KEY) // Shows hidden chars
    },
    domain: {
      present: !!DOMAIN,
      value: DOMAIN,
      trimmedValue: DOMAIN?.trim(),
      rawValue: JSON.stringify(DOMAIN)
    },
    allMailgunVars: Object.entries(process.env)
      .filter(([key]) => key.includes('MAILGUN'))
      .reduce((acc, [key, value]) => {
        acc[key] = {
          value: value,
          length: value?.length,
          raw: JSON.stringify(value)
        };
        return acc;
      }, {})
  };
  
  console.log('Analysis:', JSON.stringify(analysis, null, 2));
  
  res.json(analysis);
}




module.exports = {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
  logoutUser,
  debugEnvironment,
};