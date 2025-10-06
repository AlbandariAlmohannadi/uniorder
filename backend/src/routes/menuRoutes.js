const express = require('express');
const MenuController = require('../controllers/menuController');
const { requireManager, requireEmployee } = require('../middleware/roleCheck');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// All menu routes require authentication
router.use(authenticateToken);

// GET /api/menu - Get all menu items (All authenticated users)
router.get('/', requireEmployee, MenuController.getMenuItems);

// GET /api/menu/categories - Get all categories (All authenticated users)
router.get('/categories', requireEmployee, MenuController.getCategories);

// GET /api/menu/stats - Get menu statistics (Manager+)
router.get('/stats', requireManager, MenuController.getMenuStats);

// GET /api/menu/:id - Get specific menu item (All authenticated users)
router.get('/:id', requireEmployee, MenuController.getMenuItemById);

// POST /api/menu - Create new menu item (Manager+)
router.post('/', requireManager, MenuController.createMenuItem);

// POST /api/menu/bulk-update - Bulk update menu items (Manager+)
router.post('/bulk-update', requireManager, MenuController.bulkUpdateItems);

// PUT /api/menu/:id - Update menu item (Manager+)
router.put('/:id', requireManager, MenuController.updateMenuItem);

// PATCH /api/menu/:id/availability - Toggle item availability (Manager+)
router.patch('/:id/availability', requireManager, MenuController.toggleAvailability);

// DELETE /api/menu/:id - Delete menu item (Manager+)
router.delete('/:id', requireManager, MenuController.deleteMenuItem);

module.exports = router;