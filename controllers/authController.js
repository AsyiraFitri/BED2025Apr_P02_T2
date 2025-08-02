require("dotenv").config();
const sql = require('mssql');
const dbConfig = require('../dbConfig');
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

/* Mailgun Setup */
const Mailgun = require('mailgun.js').default;
const FormData = require('form-data');

const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY;
const DOMAIN = process.env.MAILGUN_DOMAIN;

console.log('=== MAILGUN CONFIG CHECK ===');
console.log('API Key present:', !!MAILGUN_API_KEY);
console.log('API Key format correct:', MAILGUN_API_KEY?.startsWith('key-') && MAILGUN_API_KEY?.length > 40);
console.log('Domain:', DOMAIN);

const mailgun = new Mailgun(FormData);
const mg = mailgun.client({
  username: 'api',
  key: MAILGUN_API_KEY,
  url: 'https://api.mailgun.net'
});

async function registerUser(req, res) {
  console.log("REGISTER req.body:", req.body);

  try {
    const { email, password, first_name, last_name, phone_number } = req.body;
    if (!email || !password || !first_name || !last_name)
      return res.status(400).json({ error: "Missing required fields" });
    
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
    const { email, password, captchaToken } = req.body;
     //reCAPTCHA verification step
    if (!captchaToken) {
      return res.status(400).json({ message: "CAPTCHA token missing" });
    }

    const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${captchaToken}`;

    const captchaRes = await fetch(verifyUrl, { method: 'POST' });
    const captchaData = await captchaRes.json();

    if (!captchaData.success) {
      return res.status(403).json({ message: "Failed CAPTCHA verification" });
    }
    
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

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
    // Get fresh values from environment
    const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY;
    const DOMAIN = process.env.MAILGUN_DOMAIN;
    
    console.log('API Key present:', !!MAILGUN_API_KEY);
    console.log('API Key length:', MAILGUN_API_KEY?.length);
    console.log('API Key starts with correct format:', MAILGUN_API_KEY?.includes('-'));
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
     // Create a fresh Mailgun client instance
    const Mailgun = require('mailgun.js').default;
    const FormData = require('form-data');
    
    const mailgun = new Mailgun(FormData);
    
    // Clean the API key of any potential whitespace/hidden characters
    const cleanApiKey = MAILGUN_API_KEY.trim();
    console.log('Clean API Key length:', cleanApiKey.length);
    console.log('API Key preview:', cleanApiKey.substring(0, 8) + '...' + cleanApiKey.slice(-4));
    
    const mg = mailgun.client({
      username: 'api',
      key: cleanApiKey,
      url: 'https://api.mailgun.net'
    });

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
    console.log('Message from field:', messageData.from);

    try {
      const data = await mg.messages.create(DOMAIN, messageData);
      console.log('✅ Email sent successfully:', data);

      res.status(200).json({ 
        message: "Password reset link has been sent to your email address"
      });
    } catch (mailgunError) {
      console.error('❌ Mailgun error:', {
        status: mailgunError.status,
        message: mailgunError.message,
        details: mailgunError.details,
        stack: mailgunError.stack
      });
      // Log the full error object for debugging
      console.error('Full error object:', JSON.stringify(mailgunError, null, 2));

      if (mailgunError.status === 401) {
        return res.status(500).json({ 
          error: 'Email service authentication failed. Please check API key.',
          debug: {
            keyLength: cleanApiKey.length,
            keyPreview: cleanApiKey.substring(0, 8) + '...',
            domain: DOMAIN
          }
        });
      } else if (mailgunError.status === 400) {
        return res.status(500).json({ 
          error: 'Invalid email request. Please check domain configuration.' ,
          debug: {
            recipient: email,
            domain: DOMAIN
          }
        });
      } else {
        return res.status(500).json({ 
          error: `Email service error: ${mailgunError.message}`,
          status: mailgunError.status,
          details: mailgunError.details
        });
      }
    }

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ 
      error: 'Internal server error. Please try again.',
      debug: error.message
    });
  }
}

async function resetPassword(req, res) {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) return res.status(400).json({ error: "Password required" });

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

// Test function to verify everything works
async function testMailgun(req, res) {
  try {
    console.log('=== MAILGUN TEST ===');
    console.log('API Key:', MAILGUN_API_KEY ? 'Present ✅' : 'Missing ❌');
    console.log('Domain:', DOMAIN || 'Missing ❌');

    if (!MAILGUN_API_KEY || !DOMAIN) {
      return res.status(500).json({ 
        error: 'Mailgun configuration incomplete',
        config: {
          apiKey: !!MAILGUN_API_KEY,
          domain: !!DOMAIN
        }
      });
    }

    const testMessage = {
      from: `Test <postmaster@${DOMAIN}>`,
      to: ['test@example.com'],
      subject: 'Mailgun Test - EverydayCare',
      text: 'This is a test email to verify Mailgun is working correctly.',
      html: '<p>This is a <strong>test email</strong> to verify Mailgun is working correctly.</p>'
    };

    const result = await mg.messages.create(DOMAIN, testMessage);
    console.log('✅ Test email sent:', result);

    res.status(200).json({
      success: true,
      message: 'Mailgun test successful!',
      messageId: result.id,
      status: result.status
    });

  } catch (error) {
    console.error('❌ Mailgun test failed:', error);
    
    res.status(500).json({
      success: false,
      error: 'Mailgun test failed',
      details: {
        message: error.message,
        status: error.status
      }
    });
  }
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

// Test with manual API key entry
async function testWithManualKey(req, res) {
  const { testApiKey, testDomain } = req.body;
  
  if (!testApiKey || !testDomain) {
    return res.status(400).json({ 
      error: 'Please provide testApiKey and testDomain in request body' 
    });
  }
  
  try {
    const Mailgun = require('mailgun.js').default;
    const FormData = require('form-data');
    
    const mailgun = new Mailgun(FormData);
    const mg = mailgun.client({
      username: 'api',
      key: testApiKey.trim(),
      url: 'https://api.mailgun.net'
    });
    
    console.log('Testing with manual key:', {
      keyStart: testApiKey.substring(0, 10),
      keyLength: testApiKey.length,
      domain: testDomain
    });
    
    // Test domain validation
    const domainInfo = await mg.domains.get(testDomain);
    
    res.json({
      success: true,
      message: 'Manual API key test successful!',
      domainInfo: domainInfo.name,
      keyWorking: true
    });
    
  } catch (error) {
    console.error('Manual key test failed:', error);
    
    res.json({
      success: false,
      error: error.message,
      status: error.status,
      details: error.details,
      keyWorking: false
    });
  }
}

// Test with curl command equivalent
async function generateCurlTest(req, res) {
  const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY;
  const DOMAIN = process.env.MAILGUN_DOMAIN;
  
  if (!MAILGUN_API_KEY || !DOMAIN) {
    return res.status(400).json({ error: 'Missing API key or domain' });
  }
  
  const curlCommand = `curl -s --user 'api:${MAILGUN_API_KEY}' \\
  https://api.mailgun.net/v3/${DOMAIN}/messages \\
  -F from='Test <postmaster@${DOMAIN}>' \\
  -F to='test@example.com' \\
  -F subject='Test Email' \\
  -F text='This is a test email'`;
  
  res.json({
    message: 'Copy and paste this curl command in your terminal to test manually',
    curlCommand: curlCommand,
    note: 'If this curl command works, the issue is with the Node.js Mailgun client setup'
  });
}
// Add this test function to your authController.js
async function testMailgunSimple(req, res) {
  try {
    const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY;
    const DOMAIN = process.env.MAILGUN_DOMAIN;
    
    console.log('=== SIMPLE MAILGUN TEST ===');
    console.log('API Key present:', !!MAILGUN_API_KEY);
    console.log('Domain:', DOMAIN);
    
    if (!MAILGUN_API_KEY || !DOMAIN) {
      return res.status(400).json({ error: 'Missing Mailgun configuration' });
    }
    
    const cleanApiKey = MAILGUN_API_KEY.trim();
    
    // Test with a simple fetch request first
    const testUrl = `https://api.mailgun.net/v3/${DOMAIN}/messages`;
    const auth = Buffer.from(`api:${cleanApiKey}`).toString('base64');
    
    const formData = new URLSearchParams();
    formData.append('from', `Test <postmaster@${DOMAIN}>`);
    formData.append('to', 'jessica09052018@gmail.com'); // Your authorized email
    formData.append('subject', 'Simple Test Email');
    formData.append('text', 'This is a simple test email to verify the API key works.');
    
    console.log('Making direct API call...');
    console.log('URL:', testUrl);
    console.log('Auth header present:', !!auth);
    
    const response = await fetch(testUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData
    });
    
    const responseText = await response.text();
    console.log('Response status:', response.status);
    console.log('Response body:', responseText);
    
    if (response.ok) {
      const data = JSON.parse(responseText);
      res.json({
        success: true,
        message: 'Direct API test successful!',
        messageId: data.id,
        response: data
      });
    } else {
      res.status(response.status).json({
        success: false,
        error: 'Direct API test failed',
        status: response.status,
        response: responseText
      });
    }
    
  } catch (error) {
    console.error('Simple test error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
// Add this function to your authController.js to test the API key directly
async function testDirectAPI(req, res) {
  try {
    const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY;
    const DOMAIN = process.env.MAILGUN_DOMAIN;
    
    console.log('=== DIRECT API TEST ===');
    console.log('Testing API key directly with fetch...');
    
    const cleanApiKey = MAILGUN_API_KEY.trim();
    const testUrl = `https://api.mailgun.net/v3/${DOMAIN}/messages`;
    
    // Create form data manually
    const formData = new URLSearchParams();
    formData.append('from', `Test <postmaster@${DOMAIN}>`);
    formData.append('to', 'jessica09052018@gmail.com');
    formData.append('subject', 'Direct API Test');
    formData.append('text', 'Testing direct API call without Mailgun SDK');
    
    // Create auth header
    const auth = Buffer.from(`api:${cleanApiKey}`).toString('base64');
    
    console.log('URL:', testUrl);
    console.log('Auth header length:', auth.length);
    console.log('Form data:', Object.fromEntries(formData));
    
    const response = await fetch(testUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData
    });
    
    const responseText = await response.text();
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers));
    console.log('Response body:', responseText);
    
    if (response.ok) {
      const data = JSON.parse(responseText);
      res.json({
        success: true,
        message: 'Direct API call successful!',
        data: data
      });
    } else {
      res.status(response.status).json({
        success: false,
        error: 'Direct API call failed',
        status: response.status,
        response: responseText,
        headers: Object.fromEntries(response.headers)
      });
    }
    
  } catch (error) {
    console.error('Direct API test error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
}

// Also add this function to test domain access
async function testDomainAccess(req, res) {
  try {
    const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY;
    const DOMAIN = process.env.MAILGUN_DOMAIN;
    
    console.log('=== DOMAIN ACCESS TEST ===');
    
    const cleanApiKey = MAILGUN_API_KEY.trim();
    const domainUrl = `https://api.mailgun.net/v3/domains/${DOMAIN}`;
    const auth = Buffer.from(`api:${cleanApiKey}`).toString('base64');
    
    console.log('Testing domain access...');
    console.log('Domain URL:', domainUrl);
    
    const response = await fetch(domainUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`
      }
    });
    
    const responseText = await response.text();
    console.log('Domain response status:', response.status);
    console.log('Domain response:', responseText);
    
    if (response.ok) {
      const data = JSON.parse(responseText);
      res.json({
        success: true,
        message: 'Domain access successful!',
        domain: data
      });
    } else {
      res.status(response.status).json({
        success: false,
        error: 'Domain access failed',
        status: response.status,
        response: responseText
      });
    }
    
  } catch (error) {
    console.error('Domain access test error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

module.exports = {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
  logoutUser,
  testMailgun,
  debugEnvironment,
  testWithManualKey,
  generateCurlTest,
  testMailgunSimple,
  testDirectAPI
};