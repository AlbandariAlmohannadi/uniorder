const { User } = require('../models');
const { hashPassword } = require('../utils/encryption');
const { USER_ROLES } = require('../utils/constants');
const { Op } = require('sequelize');

const userService = {
  // Get users with pagination and filters
  async getUsers({ page = 1, limit = 50, filters = {} }) {
    const offset = (page - 1) * limit;
    const where = {};

    // Apply filters
    if (filters.role) {
      where.role = filters.role;
    }

    if (filters.is_active !== undefined) {
      where.is_active = filters.is_active;
    }

    if (filters.search) {
      where[Op.or] = [
        { username: { [Op.iLike]: `%${filters.search}%` } },
        { email: { [Op.iLike]: `%${filters.search}%` } }
      ];
    }

    const { count, rows } = await User.findAndCountAll({
      where,
      attributes: { exclude: ['password_hash'] },
      order: [['created_at', 'DESC']],
      limit,
      offset
    });

    return {
      users: rows,
      total: count
    };
  },

  // Get user by ID
  async getUserById(id) {
    return await User.findByPk(id, {
      attributes: { exclude: ['password_hash'] }
    });
  },

  // Create new user
  async createUser(userData) {
    const { username, email, password, role } = userData;

    // Check if username or email already exists
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [
          { username },
          { email }
        ]
      }
    });

    if (existingUser) {
      throw new Error('Username or email already exists');
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await User.create({
      username,
      email,
      password_hash: hashedPassword,
      role
    });

    // Return user without password
    const { password_hash, ...userWithoutPassword } = user.toJSON();
    return userWithoutPassword;
  },

  // Update user
  async updateUser(id, updates) {
    const user = await User.findByPk(id);
    if (!user) {
      return null;
    }

    // Check for unique constraints if updating username or email
    if (updates.username || updates.email) {
      const whereClause = {
        id: { [Op.ne]: id }
      };

      if (updates.username && updates.email) {
        whereClause[Op.or] = [
          { username: updates.username },
          { email: updates.email }
        ];
      } else if (updates.username) {
        whereClause.username = updates.username;
      } else if (updates.email) {
        whereClause.email = updates.email;
      }

      const existingUser = await User.findOne({ where: whereClause });
      if (existingUser) {
        throw new Error('Username or email already exists');
      }
    }

    await user.update(updates);
    
    // Return updated user without password
    const { password_hash, ...userWithoutPassword } = user.toJSON();
    return userWithoutPassword;
  },

  // Soft delete user
  async deleteUser(id) {
    const user = await User.findByPk(id);
    if (!user) {
      return false;
    }

    await user.update({ is_active: false });
    return true;
  },

  // Update user password
  async updateUserPassword(id, newPassword) {
    const user = await User.findByPk(id);
    if (!user) {
      throw new Error('User not found');
    }

    const hashedPassword = await hashPassword(newPassword);
    await user.update({ password_hash: hashedPassword });
    
    return true;
  },

  // Toggle user active status
  async toggleUserStatus(id, isActive) {
    const user = await User.findByPk(id);
    if (!user) {
      return null;
    }

    await user.update({ is_active: isActive });
    
    const { password_hash, ...userWithoutPassword } = user.toJSON();
    return userWithoutPassword;
  },

  // Get user statistics
  async getUserStats() {
    const totalUsers = await User.count();
    const activeUsers = await User.count({ where: { is_active: true } });
    const inactiveUsers = totalUsers - activeUsers;

    const usersByRole = await User.findAll({
      attributes: [
        'role',
        [User.sequelize.fn('COUNT', User.sequelize.col('id')), 'count']
      ],
      group: ['role'],
      raw: true
    });

    const recentUsers = await User.findAll({
      where: {
        created_at: {
          [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      },
      attributes: { exclude: ['password_hash'] },
      order: [['created_at', 'DESC']],
      limit: 10
    });

    const lastLoginStats = await User.findAll({
      attributes: [
        [User.sequelize.fn('DATE', User.sequelize.col('last_login')), 'date'],
        [User.sequelize.fn('COUNT', User.sequelize.col('id')), 'count']
      ],
      where: {
        last_login: {
          [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      },
      group: [User.sequelize.fn('DATE', User.sequelize.col('last_login'))],
      order: [[User.sequelize.fn('DATE', User.sequelize.col('last_login')), 'DESC']],
      raw: true
    });

    return {
      total: totalUsers,
      active: activeUsers,
      inactive: inactiveUsers,
      byRole: usersByRole.reduce((acc, item) => {
        acc[item.role] = parseInt(item.count);
        return acc;
      }, {}),
      recent: recentUsers,
      loginActivity: lastLoginStats
    };
  },

  // Search users
  async searchUsers(query, limit = 20) {
    return await User.findAll({
      where: {
        [Op.or]: [
          { username: { [Op.iLike]: `%${query}%` } },
          { email: { [Op.iLike]: `%${query}%` } }
        ],
        is_active: true
      },
      attributes: { exclude: ['password_hash'] },
      limit,
      order: [['username', 'ASC']]
    });
  },

  // Get users by role
  async getUsersByRole(role) {
    if (!Object.values(USER_ROLES).includes(role)) {
      throw new Error('Invalid role');
    }

    return await User.findAll({
      where: { 
        role,
        is_active: true
      },
      attributes: { exclude: ['password_hash'] },
      order: [['username', 'ASC']]
    });
  },

  // Update last login
  async updateLastLogin(userId) {
    const user = await User.findByPk(userId);
    if (user) {
      await user.update({ last_login: new Date() });
    }
    return user;
  }
};

module.exports = userService;