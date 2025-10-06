const { MenuItem } = require('../models');
const { Op } = require('sequelize');

const menuService = {
  // Get menu items with pagination and filters
  async getMenuItems({ page = 1, limit = 50, filters = {}, sortBy = 'name', sortOrder = 'ASC' }) {
    const offset = (page - 1) * limit;
    const where = {};
    const order = [];

    // Apply filters
    if (filters.category) {
      where.category = filters.category;
    }

    if (filters.is_available !== undefined) {
      where.is_available = filters.is_available;
    }

    if (filters.search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${filters.search}%` } },
        { description: { [Op.iLike]: `%${filters.search}%` } },
        { category: { [Op.iLike]: `%${filters.search}%` } }
      ];
    }

    // Apply sorting
    const validSortFields = ['name', 'price', 'category', 'created_at', 'preparation_time'];
    if (validSortFields.includes(sortBy)) {
      order.push([sortBy, sortOrder]);
    } else {
      order.push(['name', 'ASC']);
    }

    const { count, rows } = await MenuItem.findAndCountAll({
      where,
      order,
      limit,
      offset
    });

    return {
      items: rows,
      total: count
    };
  },

  // Get menu item by ID
  async getMenuItemById(id) {
    return await MenuItem.findByPk(id);
  },

  // Create new menu item
  async createMenuItem(itemData) {
    // Check if item with same name already exists
    const existingItem = await MenuItem.findOne({
      where: { name: itemData.name }
    });

    if (existingItem) {
      throw new Error('Menu item with this name already exists');
    }

    return await MenuItem.create(itemData);
  },

  // Update menu item
  async updateMenuItem(id, updates) {
    const item = await MenuItem.findByPk(id);
    if (!item) {
      return null;
    }

    // Check for name uniqueness if updating name
    if (updates.name && updates.name !== item.name) {
      const existingItem = await MenuItem.findOne({
        where: { 
          name: updates.name,
          id: { [Op.ne]: id }
        }
      });

      if (existingItem) {
        throw new Error('Menu item with this name already exists');
      }
    }

    await item.update(updates);
    return item;
  },

  // Delete menu item
  async deleteMenuItem(id) {
    const item = await MenuItem.findByPk(id);
    if (!item) {
      return false;
    }

    await item.destroy();
    return true;
  },

  // Toggle item availability
  async toggleAvailability(id, isAvailable) {
    const item = await MenuItem.findByPk(id);
    if (!item) {
      return null;
    }

    await item.update({ is_available: isAvailable });
    return item;
  },

  // Get all categories
  async getCategories() {
    const categories = await MenuItem.findAll({
      attributes: [
        'category',
        [MenuItem.sequelize.fn('COUNT', MenuItem.sequelize.col('id')), 'count'],
        [MenuItem.sequelize.fn('AVG', MenuItem.sequelize.col('price')), 'avg_price']
      ],
      group: ['category'],
      order: [['category', 'ASC']],
      raw: true
    });

    return categories.map(cat => ({
      name: cat.category,
      count: parseInt(cat.count),
      avgPrice: parseFloat(cat.avg_price).toFixed(2)
    }));
  },

  // Get menu statistics
  async getMenuStats() {
    const totalItems = await MenuItem.count();
    const availableItems = await MenuItem.count({ where: { is_available: true } });
    const unavailableItems = totalItems - availableItems;

    const categories = await this.getCategories();

    const priceStats = await MenuItem.findOne({
      attributes: [
        [MenuItem.sequelize.fn('MIN', MenuItem.sequelize.col('price')), 'min_price'],
        [MenuItem.sequelize.fn('MAX', MenuItem.sequelize.col('price')), 'max_price'],
        [MenuItem.sequelize.fn('AVG', MenuItem.sequelize.col('price')), 'avg_price']
      ],
      raw: true
    });

    const recentItems = await MenuItem.findAll({
      where: {
        created_at: {
          [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      },
      order: [['created_at', 'DESC']],
      limit: 10
    });

    const preparationTimeStats = await MenuItem.findOne({
      attributes: [
        [MenuItem.sequelize.fn('MIN', MenuItem.sequelize.col('preparation_time')), 'min_prep_time'],
        [MenuItem.sequelize.fn('MAX', MenuItem.sequelize.col('preparation_time')), 'max_prep_time'],
        [MenuItem.sequelize.fn('AVG', MenuItem.sequelize.col('preparation_time')), 'avg_prep_time']
      ],
      where: {
        preparation_time: { [Op.not]: null }
      },
      raw: true
    });

    return {
      total: totalItems,
      available: availableItems,
      unavailable: unavailableItems,
      categories: categories,
      pricing: {
        min: parseFloat(priceStats.min_price || 0),
        max: parseFloat(priceStats.max_price || 0),
        average: parseFloat(priceStats.avg_price || 0).toFixed(2)
      },
      preparationTime: {
        min: parseInt(preparationTimeStats?.min_prep_time || 0),
        max: parseInt(preparationTimeStats?.max_prep_time || 0),
        average: parseFloat(preparationTimeStats?.avg_prep_time || 0).toFixed(1)
      },
      recent: recentItems
    };
  },

  // Bulk update items
  async bulkUpdateItems(itemIds, action) {
    const validActions = ['enable', 'disable', 'delete'];
    if (!validActions.includes(action)) {
      throw new Error('Invalid action');
    }

    const items = await MenuItem.findAll({
      where: { id: { [Op.in]: itemIds } }
    });

    if (items.length === 0) {
      throw new Error('No items found');
    }

    let updated = 0;

    switch (action) {
      case 'enable':
        await MenuItem.update(
          { is_available: true },
          { where: { id: { [Op.in]: itemIds } } }
        );
        updated = items.length;
        break;

      case 'disable':
        await MenuItem.update(
          { is_available: false },
          { where: { id: { [Op.in]: itemIds } } }
        );
        updated = items.length;
        break;

      case 'delete':
        await MenuItem.destroy({
          where: { id: { [Op.in]: itemIds } }
        });
        updated = items.length;
        break;
    }

    return {
      action,
      updated,
      items: itemIds
    };
  },

  // Search menu items
  async searchMenuItems(query, limit = 20) {
    return await MenuItem.findAll({
      where: {
        [Op.or]: [
          { name: { [Op.iLike]: `%${query}%` } },
          { description: { [Op.iLike]: `%${query}%` } },
          { category: { [Op.iLike]: `%${query}%` } }
        ]
      },
      order: [['name', 'ASC']],
      limit
    });
  },

  // Get items by category
  async getItemsByCategory(category, includeUnavailable = false) {
    const where = { category };
    
    if (!includeUnavailable) {
      where.is_available = true;
    }

    return await MenuItem.findAll({
      where,
      order: [['name', 'ASC']]
    });
  },

  // Get popular items (this would typically use order data)
  async getPopularItems(limit = 10) {
    // For now, return items sorted by creation date
    // In a real implementation, this would join with order data
    return await MenuItem.findAll({
      where: { is_available: true },
      order: [['created_at', 'DESC']],
      limit
    });
  },

  // Update multiple items' availability based on ingredients
  async updateAvailabilityByIngredient(ingredient, isAvailable) {
    const items = await MenuItem.findAll({
      where: {
        ingredients: {
          [Op.contains]: [ingredient]
        }
      }
    });

    if (items.length > 0) {
      await MenuItem.update(
        { is_available: isAvailable },
        {
          where: {
            ingredients: {
              [Op.contains]: [ingredient]
            }
          }
        }
      );
    }

    return {
      ingredient,
      affected_items: items.length,
      new_status: isAvailable
    };
  }
};

module.exports = menuService;