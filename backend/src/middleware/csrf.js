const crypto = require('crypto');

// Simple CSRF protection middleware
const csrfProtection = {
  // Generate CSRF token
  generateToken() {
    return crypto.randomBytes(32).toString('hex');
  },

  // Middleware to add CSRF token to session
  addToken(req, res, next) {
    if (!req.session) {
      return next(new Error('Session middleware required for CSRF protection'));
    }
    
    if (!req.session.csrfToken) {
      req.session.csrfToken = this.generateToken();
    }
    
    res.locals.csrfToken = req.session.csrfToken;
    next();
  },

  // Middleware to verify CSRF token
  verifyToken(req, res, next) {
    if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
      return next();
    }

    const token = req.headers['x-csrf-token'] || req.body._csrf;
    const sessionToken = req.session?.csrfToken;

    if (!token || !sessionToken || token !== sessionToken) {
      return res.status(403).json({
        success: false,
        message: 'Invalid CSRF token'
      });
    }

    next();
  }
};

module.exports = csrfProtection;