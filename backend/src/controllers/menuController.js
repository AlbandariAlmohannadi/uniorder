const { MenuItem } = require('../models');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { API_RESPONSE_CODES } = require('../utils/constants');
const menuService = require('../services/menuService');

const MenuController = {
  // GET /api/menu - Get all menu items with filters
  async getMenuItems(req, res, next) {
    try {
      const { 
        page = 1, 
        limit = 50, 
        category, 
        isAvailable, 
        search,
        sortBy = 'name',
        sortOrder = 'ASC'
      } = req.query;

      const filters = {};
      if (category) filters.category = category;
      if (isAvailable !== undefined) filters.is_available = isAvailable === 'true';
      if (search) filters.search = search;

      const result = await menuService.getMenuItems({
        page: parseInt(page),
        limit: parseInt(limit),
        filters,
        sortBy,
        sortOrder: sortOrder.toUpperCase()
      });

      res.json({
        success: true,
        data: result.items,
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

  // GET /api/menu/:id - Get specific menu item
  async getMenuItemById(req, res, next) {
    try {
      const { id } = req.params;
      const item = await menuService.getMenuItemById(id);
      
      if (!item) {
        throw new AppError('Menu item not found', API_RESPONSE_CODES.NOT_FOUND);
      }

      res.json({
        success: true,
        data: item
      });
    } catch (error) {
      next(error);
    }
  },

  // POST /api/menu - Create new menu item
  async createMenuItem(req, res, next) {
    try {
      const {
        name,
        description,
        price,
        category,
        is_available = true,
        image_url,
        preparation_time,
        ingredients = [],
        allergens = [],
        nutritional_info = {}
      } = req.body;

      // Validation
      if (!name || !price || !category) {
        throw new AppError('Name, price, and category are required', API_RESPONSE_CODES.BAD_REQUEST);
      }

      if (price <= 0) {
        throw new AppError('Price must be greater than 0', API_RESPONSE_CODES.BAD_REQUEST);
      }

      const itemData = {
        name: name.trim(),
        description: description?.trim(),
        price: parseFloat(price),
        category: category.trim(),
        is_available,
        image_url,
        preparation_time: preparation_time ? parseInt(preparation_time) : null,
        ingredients,
        allergens,
        nutritional_info
      };

      const item = await menuService.createMenuItem(itemData);

      // Emit real-time update
      req.app.get('io')?.emit('menu_item_created', item);

      res.status(API_RESPONSE_CODES.CREATED).json({
        success: true,
        message: 'Menu item created successfully',
        data: item
      });
    } catch (error) {
      next(error);
    }
  },

  // PUT /api/menu/:id - Update menu item
  async updateMenuItem(req, res, next) {
    try {
      const { id } = req.params;
      const updates = req.body;

      // Validate price if provided
      if (updates.price !== undefined && updates.price <= 0) {
        throw new AppError('Price must be greater than 0', API_RESPONSE_CODES.BAD_REQUEST);
      }

      // Validate preparation_time if provided
      if (updates.preparation_time !== undefined) {
        updates.preparation_time = parseInt(updates.preparation_time);
      }

      const item = await menuService.updateMenuItem(id, updates);
      
      if (!item) {
        throw new AppError('Menu item not found', API_RESPONSE_CODES.NOT_FOUND);
      }

      // Emit real-time update
      req.app.get('io')?.emit('menu_item_updated', item);

      res.json({
        success: true,
        message: 'Menu item updated successfully',
        data: item
      });
    } catch (error) {
      next(error);
    }
  },

  // DELETE /api/menu/:id - Delete menu item
  async deleteMenuItem(req, res, next) {
    try {
      const { id } = req.params;
      
      const deleted = await menuService.deleteMenuItem(id);
      
      if (!deleted) {
        throw new AppError('Menu item not found', API_RESPONSE_CODES.NOT_FOUND);
      }

      // Emit real-time update
      req.app.get('io')?.emit('menu_item_deleted', { id: parseInt(id) });

      res.json({
        success: true,
        message: 'Menu item deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  },

  // PATCH /api/menu/:id/availability - Toggle item availability
  async toggleAvailability(req, res, next) {
    try {
      const { id } = req.params;
      const { is_available } = req.body;

      if (typeof is_available !== 'boolean') {
        throw new AppError('is_available must be a boolean value', API_RESPONSE_CODES.BAD_REQUEST);
      }

      const item = await menuService.toggleAvailability(id, is_available);
      
      if (!item) {
        throw new AppError('Menu item not found', API_RESPONSE_CODES.NOT_FOUND);
      }

      // Emit real-time update
      req.app.get('io')?.emitItemAvailabilityChange({
        itemId: item.id,
        itemName: item.name,
        isAvailable: item.is_available
      });

      res.json({
        success: true,
        message: `Menu item ${is_available ? 'enabled' : 'disabled'} successfully`,
        data: item
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/menu/categories - Get all categories
  async getCategories(req, res, next) {
    try {
      const categories = await menuService.getCategories();
      
      res.json({
        success: true,
        data: categories
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/menu/stats - Get menu statistics
  async getMenuStats(req, res, next) {
    try {
      const stats = await menuService.getMenuStats();
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  },

  // POST /api/menu/bulk-update - Bulk update menu items
  async bulkUpdateItems(req, res, next) {
    try {
      const { items, action } = req.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        throw new AppError('Items array is required', API_RESPONSE_CODES.BAD_REQUEST);
      }

      if (!['enable', 'disable', 'delete'].includes(action)) {
        throw new AppError('Invalid action. Must be enable, disable, or delete', API_RESPONSE_CODES.BAD_REQUEST);
      }

      const result = await menuService.bulkUpdateItems(items, action);

      // Emit real-time update
      req.app.get('io')?.emit('menu_bulk_update', { items, action });

      res.json({
        success: true,
        message: `Bulk ${action} completed successfully`,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = MenuController;