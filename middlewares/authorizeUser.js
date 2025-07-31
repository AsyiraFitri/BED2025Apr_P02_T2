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
    
    // Support both 'id' and 'UserID' in the token payload
    const userId = decoded.id || decoded.UserID;
    if (!userId) {
      console.error('No user ID found in token payload'); // Debug log
      return res.status(403).json({ error: 'Invalid token payload' });
    }

    req.user = {
      id: userId, // Always set .id for consistency
      email: decoded.email,
      role: decoded.role,
      first_name: decoded.first_name,
      last_name: decoded.last_name,
      UserID: userId // Also set UserID for legacy code if needed
    };
    console.log('Set req.user to:', req.user); // Debug log
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

module.exports = { verifyToken, verifyAdmin, verifyGroupOwner };