// middlewares/authorizeUser.js
const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  
  console.log('Auth header received:', authHeader); // Debug log
  
  if (!authHeader) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Token format invalid' });
  }

  console.log('Token to verify:', token); // Debug log

  jwt.verify(token, process.env.JWT_SECRET_KEY, (err, decoded) => {
    if (err) {
      console.error('JWT verification error:', err); // Debug log
      
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expired' });
      } else if (err.name === 'JsonWebTokenError') {
        return res.status(403).json({ error: 'Invalid token' });
      } else {
        return res.status(403).json({ error: 'Token verification failed' });
      }
    }

    console.log('Decoded token payload:', decoded); // Debug log
    
    // Check if the decoded token has user ID
    if (!decoded.id) {
      return res.status(403).json({ error: 'Invalid token payload' });
    }

    // Set req.user - now simply using decoded.id
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      first_name: decoded.first_name,
      last_name: decoded.last_name,
    };

    next();
  });
}


function verifyAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Token format invalid' });
  }

  jwt.verify(token, process.env.JWT_SECRET_KEY, (err, decoded) => {
    if (err) {
      console.error('JWT verification error:', err);
      
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expired' });
      } else {
        return res.status(403).json({ error: 'Invalid token' });
      }
    }

    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      first_name: decoded.first_name,
      last_name: decoded.last_name,
    };

    next();
  });
}

function verifyGroupOwner(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Token format invalid' });
  }

  jwt.verify(token, process.env.JWT_SECRET_KEY, (err, decoded) => {
    if (err) {
      console.error('JWT verification error:', err);
      
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expired' });
      } else {
        return res.status(403).json({ error: 'Invalid token' });
      }
    }

    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      first_name: decoded.first_name,
      last_name: decoded.last_name,
    };

    next();
  });
}

// Verify CAPTCHA token middleware
async function verifyCaptcha(req, res, next) {
  const { captchaToken } = req.body;
  if (!captchaToken) {
    return res.status(400).json({ message: "CAPTCHA token missing" });
  }

  const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${captchaToken}`;
  try {
    const captchaRes = await fetch(verifyUrl, { method: 'POST' });
    const captchaData = await captchaRes.json();

    if (!captchaData.success) {
      return res.status(403).json({ message: "Failed CAPTCHA verification" });
    }
    next();
  } catch (err) {
    console.error("CAPTCHA verification error:", err);
    res.status(500).json({ message: "CAPTCHA verification failed" });
  }
}
module.exports = { verifyToken, verifyAdmin, verifyGroupOwner,verifyCaptcha };