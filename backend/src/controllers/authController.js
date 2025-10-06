const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { AppError } = require('../middleware/errorHandler');
const { API_RESPONSE_CODES } = require('../utils/constants');

const AuthController = {
  // POST /api/auth/login
  async login(req, res, next) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        throw new AppError('Username and password are required', API_RESPONSE_CODES.BAD_REQUEST);
      }

      const user = await User.findOne({ 
        where: { username },
        attributes: ['id', 'username', 'email', 'password_hash', 'role', 'last_login']
      });

      if (!user) {
        throw new AppError('Invalid credentials', API_RESPONSE_CODES.UNAUTHORIZED);
      }

      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
        throw new AppError('Invalid credentials', API_RESPONSE_CODES.UNAUTHORIZED);
      }

      const token = jwt.sign(
        { 
          id: user.id, 
          username: user.username, 
          role: user.role 
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
      );

      await user.update({ last_login: new Date() });

      const userResponse = {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        last_login: user.last_login
      };

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: userResponse,
          token
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // POST /api/auth/logout
  async logout(req, res, next) {
    try {
      res.json({
        success: true,
        message: 'Logout successful'
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/auth/profile
  async getProfile(req, res, next) {
    try {
      const user = await User.findByPk(req.user.id, {
        attributes: ['id', 'username', 'email', 'role', 'last_login', 'created_at']
      });

      if (!user) {
        throw new AppError('User not found', API_RESPONSE_CODES.NOT_FOUND);
      }

      res.json({
        success: true,
        data: { user }
      });
    } catch (error) {
      next(error);
    }
  },

  // PUT /api/auth/profile
  async updateProfile(req, res, next) {
    try {
      const { email } = req.body;
      const userId = req.user.id;

      const user = await User.findByPk(userId);
      if (!user) {
        throw new AppError('User not found', API_RESPONSE_CODES.NOT_FOUND);
      }

      if (email && email !== user.email) {
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser && existingUser.id !== userId) {
          throw new AppError('Email already in use', API_RESPONSE_CODES.BAD_REQUEST);
        }
        user.email = email;
      }

      await user.save();

      const userResponse = {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      };

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: { user: userResponse }
      });
    } catch (error) {
      next(error);
    }
  },

  // PUT /api/auth/change-password
  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user.id;

      if (!currentPassword || !newPassword) {
        throw new AppError('Current password and new password are required', API_RESPONSE_CODES.BAD_REQUEST);
      }

      if (newPassword.length < 6) {
        throw new AppError('New password must be at least 6 characters long', API_RESPONSE_CODES.BAD_REQUEST);
      }

      const user = await User.findByPk(userId);
      if (!user) {
        throw new AppError('User not found', API_RESPONSE_CODES.NOT_FOUND);
      }

      const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
      if (!isValidPassword) {
        throw new AppError('Current password is incorrect', API_RESPONSE_CODES.UNAUTHORIZED);
      }

      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
      
      await user.update({ password_hash: hashedPassword });

      res.json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error) {
      next(error);
    }
  },

  // POST /api/auth/verify-token
  async verifyToken(req, res, next) {
    try {
      const user = await User.findByPk(req.user.id, {
        attributes: ['id', 'username', 'email', 'role']
      });

      if (!user) {
        throw new AppError('User not found', API_RESPONSE_CODES.NOT_FOUND);
      }

      res.json({
        success: true,
        data: { user }
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = AuthController;