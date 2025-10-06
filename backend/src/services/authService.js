const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { ROLES } = require('../utils/constants');

const authService = {
  // Authenticate user credentials
  async authenticateUser(username, password) {
    const user = await User.findOne({ 
      where: { username },
      attributes: ['id', 'username', 'email', 'password_hash', 'role', 'last_login']
    });

    if (!user) {
      return null;
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return null;
    }

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      last_login: user.last_login
    };
  },

  // Generate JWT token
  generateToken(user) {
    return jwt.sign(
      { 
        id: user.id, 
        username: user.username, 
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );
  },

  // Verify JWT token
  verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return null;
    }
  },

  // Hash password
  async hashPassword(password) {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  },

  // Compare password with hash
  async comparePassword(password, hash) {
    return await bcrypt.compare(password, hash);
  },

  // Update user last login
  async updateLastLogin(userId) {
    await User.update(
      { last_login: new Date() },
      { where: { id: userId } }
    );
  },

  // Check if user has required role
  hasRole(userRole, requiredRoles) {
    if (!Array.isArray(requiredRoles)) {
      requiredRoles = [requiredRoles];
    }
    return requiredRoles.includes(userRole);
  },

  // Check if user has admin privileges
  isAdmin(userRole) {
    return userRole === ROLES.ADMIN;
  },

  // Check if user has manager or admin privileges
  isManagerOrAdmin(userRole) {
    return [ROLES.ADMIN, ROLES.MANAGER].includes(userRole);
  },

  // Validate password strength
  validatePassword(password) {
    if (!password || password.length < 6) {
      return { valid: false, message: 'Password must be at least 6 characters long' };
    }

    if (!/(?=.*[a-z])/.test(password)) {
      return { valid: false, message: 'Password must contain at least one lowercase letter' };
    }

    if (!/(?=.*[A-Z])/.test(password)) {
      return { valid: false, message: 'Password must contain at least one uppercase letter' };
    }

    if (!/(?=.*\d)/.test(password)) {
      return { valid: false, message: 'Password must contain at least one number' };
    }

    return { valid: true };
  },

  // Generate refresh token
  generateRefreshToken(user) {
    return jwt.sign(
      { id: user.id, type: 'refresh' },
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
  },

  // Verify refresh token
  verifyRefreshToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
      return decoded.type === 'refresh' ? decoded : null;
    } catch (error) {
      return null;
    }
  }
};

module.exports = authService;