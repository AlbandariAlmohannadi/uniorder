const express = require('express');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { hashPassword, comparePassword } = require('../utils/encryption');
const { authenticateToken } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { API_RESPONSE_CODES } = require('../utils/constants');
const { validateLogin, validateChangePassword } = require('../middleware/validation/authValidation');
const userService = require('../services/userService');

const router = express.Router();

// POST /api/auth/login - User login
router.post('/login', validateLogin, asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  // Find user by username or email
  const user = await User.findOne({
    where: {
      [require('sequelize').Op.or]: [
        { username },
        { email: username }
      ]
    }
  });

  if (!user || !user.is_active) {
    return res.status(API_RESPONSE_CODES.UNAUTHORIZED).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  // Verify password
  const isValidPassword = await comparePassword(password, user.password_hash);
  if (!isValidPassword) {
    return res.status(API_RESPONSE_CODES.UNAUTHORIZED).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  // Update last login
  await userService.updateLastLogin(user.id);

  // Generate JWT token
  const token = jwt.sign(
    { 
      id: user.id, 
      username: user.username, 
      role: user.role 
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        last_login: user.last_login
      }
    }
  });
}));

// POST /api/auth/logout - User logout
router.post('/logout', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Logout successful'
  });
});

// GET /api/auth/me - Get current user profile
router.get('/me', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: {
      user: req.user
    }
  });
});

// PUT /api/auth/change-password - Change user password
router.put('/change-password', authenticateToken, validateChangePassword, asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  // Get user with password hash
  const user = await User.findByPk(req.user.id);
  
  // Verify current password
  const isValidPassword = await comparePassword(currentPassword, user.password_hash);
  if (!isValidPassword) {
    return res.status(API_RESPONSE_CODES.BAD_REQUEST).json({
      success: false,
      message: 'Current password is incorrect'
    });
  }

  // Update password
  await userService.updateUserPassword(user.id, newPassword);

  res.json({
    success: true,
    message: 'Password changed successfully'
  });
}));

module.exports = router;