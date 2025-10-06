const express = require('express');
const UserController = require('../controllers/userController');
const { requireAdmin, requireManager } = require('../middleware/roleCheck');
const { authenticateToken } = require('../middleware/auth');
const { validateCreateUser, validateUpdateUser, validateUpdatePassword, validateToggleStatus } = require('../middleware/validation/userValidation');

const router = express.Router();

// All user routes require authentication
router.use(authenticateToken);

// GET /api/users - Get all users (Admin only)
router.get('/', requireAdmin, UserController.getUsers);

// GET /api/users/stats - Get user statistics (Manager+)
router.get('/stats', requireManager, UserController.getUserStats);

// GET /api/users/:id - Get specific user (Admin only)
router.get('/:id', requireAdmin, UserController.getUserById);

// POST /api/users - Create new user (Admin only)
router.post('/', requireAdmin, validateCreateUser, UserController.createUser);

// PUT /api/users/:id - Update user (Admin only)
router.put('/:id', requireAdmin, validateUpdateUser, UserController.updateUser);

// PUT /api/users/:id/password - Update user password (Admin only)
router.put('/:id/password', requireAdmin, validateUpdatePassword, UserController.updateUserPassword);

// PUT /api/users/:id/status - Toggle user status (Admin only)
router.put('/:id/status', requireAdmin, validateToggleStatus, UserController.toggleUserStatus);

// DELETE /api/users/:id - Delete user (Admin only)
router.delete('/:id', requireAdmin, UserController.deleteUser);

module.exports = router;