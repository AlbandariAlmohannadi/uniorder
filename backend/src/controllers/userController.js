const { User } = require('../models');
const { hashPassword } = require('../utils/encryption');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { API_RESPONSE_CODES, USER_ROLES } = require('../utils/constants');
const userService = require('../services/userService');

const UserController = {
  // GET /api/users - Get all users with pagination and filters
  async getUsers(req, res, next) {
    try {
      const { page = 1, limit = 50, role, search, isActive } = req.query;
      
      const filters = {};
      if (role) filters.role = role;
      if (isActive !== undefined) filters.is_active = isActive === 'true';
      if (search) {
        filters.search = search; // Will be handled in service
      }

      const result = await userService.getUsers({
        page: parseInt(page),
        limit: parseInt(limit),
        filters
      });

      res.json({
        success: true,
        data: result.users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: result.total,
          totalPages: Math.ceil(result.total / parseInt(limit))
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/users/:id - Get specific user
  async getUserById(req, res, next) {
    try {
      const { id } = req.params;
      const user = await userService.getUserById(id);
      
      if (!user) {
        throw new AppError('User not found', API_RESPONSE_CODES.NOT_FOUND);
      }

      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  },

  // POST /api/users - Create new user
  async createUser(req, res, next) {
    try {
      const { username, email, password, role = USER_ROLES.EMPLOYEE } = req.body;

      // Validation
      if (!username || !email || !password) {
        throw new AppError('Username, email, and password are required', API_RESPONSE_CODES.BAD_REQUEST);
      }

      if (password.length < 6) {
        throw new AppError('Password must be at least 6 characters long', API_RESPONSE_CODES.BAD_REQUEST);
      }

      if (!Object.values(USER_ROLES).includes(role)) {
        throw new AppError('Invalid role specified', API_RESPONSE_CODES.BAD_REQUEST);
      }

      const user = await userService.createUser({
        username: username.trim(),
        email: email.trim().toLowerCase(),
        password,
        role
      });

      res.status(API_RESPONSE_CODES.CREATED).json({
        success: true,
        message: 'User created successfully',
        data: user
      });
    } catch (error) {
      next(error);
    }
  },

  // PUT /api/users/:id - Update user
  async updateUser(req, res, next) {
    try {
      const { id } = req.params;
      const updates = req.body;

      // Don't allow password updates through this endpoint
      delete updates.password_hash;
      delete updates.password;

      const user = await userService.updateUser(id, updates);
      
      if (!user) {
        throw new AppError('User not found', API_RESPONSE_CODES.NOT_FOUND);
      }

      res.json({
        success: true,
        message: 'User updated successfully',
        data: user
      });
    } catch (error) {
      next(error);
    }
  },

  // DELETE /api/users/:id - Soft delete user
  async deleteUser(req, res, next) {
    try {
      const { id } = req.params;

      // Prevent self-deletion
      if (parseInt(id) === req.user.id) {
        throw new AppError('Cannot delete your own account', API_RESPONSE_CODES.BAD_REQUEST);
      }

      const deleted = await userService.deleteUser(id);
      
      if (!deleted) {
        throw new AppError('User not found', API_RESPONSE_CODES.NOT_FOUND);
      }

      res.json({
        success: true,
        message: 'User deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  },

  // PUT /api/users/:id/password - Update user password
  async updateUserPassword(req, res, next) {
    try {
      const { id } = req.params;
      const { newPassword } = req.body;

      if (!newPassword || newPassword.length < 6) {
        throw new AppError('New password must be at least 6 characters long', API_RESPONSE_CODES.BAD_REQUEST);
      }

      await userService.updateUserPassword(id, newPassword);

      res.json({
        success: true,
        message: 'Password updated successfully'
      });
    } catch (error) {
      next(error);
    }
  },

  // PUT /api/users/:id/status - Toggle user active status
  async toggleUserStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { isActive } = req.body;

      // Prevent deactivating own account
      if (parseInt(id) === req.user.id && !isActive) {
        throw new AppError('Cannot deactivate your own account', API_RESPONSE_CODES.BAD_REQUEST);
      }

      const user = await userService.toggleUserStatus(id, isActive);
      
      if (!user) {
        throw new AppError('User not found', API_RESPONSE_CODES.NOT_FOUND);
      }

      res.json({
        success: true,
        message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
        data: user
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/users/stats - Get user statistics
  async getUserStats(req, res, next) {
    try {
      const stats = await userService.getUserStats();
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = UserController;