const { AppError } = require('../middleware/errorHandler');
const { API_RESPONSE_CODES } = require('../utils/constants');

// In-memory store for restaurant settings (in production, use database)
let restaurantSettings = {
  is_open: true,
  auto_accept: false,
  updated_at: new Date()
};

const RestaurantController = {
  // GET /api/restaurant/status
  async getStatus(req, res, next) {
    try {
      res.json({
        success: true,
        data: restaurantSettings
      });
    } catch (error) {
      next(error);
    }
  },

  // PATCH /api/restaurant/status
  async updateStatus(req, res, next) {
    try {
      const { is_open } = req.body;

      if (typeof is_open !== 'boolean') {
        throw new AppError('is_open must be a boolean', API_RESPONSE_CODES.BAD_REQUEST);
      }

      restaurantSettings.is_open = is_open;
      restaurantSettings.updated_at = new Date();

      // Emit real-time update
      req.app.get('io')?.emit('restaurant_status_changed', {
        is_open,
        updated_by: req.user.username,
        timestamp: new Date()
      });

      res.json({
        success: true,
        message: `Restaurant ${is_open ? 'opened' : 'closed'} successfully`,
        data: restaurantSettings
      });
    } catch (error) {
      next(error);
    }
  },

  // PATCH /api/restaurant/auto-accept
  async updateAutoAccept(req, res, next) {
    try {
      const { auto_accept } = req.body;

      if (typeof auto_accept !== 'boolean') {
        throw new AppError('auto_accept must be a boolean', API_RESPONSE_CODES.BAD_REQUEST);
      }

      restaurantSettings.auto_accept = auto_accept;
      restaurantSettings.updated_at = new Date();

      // Emit real-time update
      req.app.get('io')?.emit('auto_accept_changed', {
        auto_accept,
        updated_by: req.user.username,
        timestamp: new Date()
      });

      res.json({
        success: true,
        message: `Auto-accept ${auto_accept ? 'enabled' : 'disabled'} successfully`,
        data: restaurantSettings
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/restaurant/settings
  async getSettings(req, res, next) {
    try {
      // Extended settings for future use
      const settings = {
        ...restaurantSettings,
        preparation_time: 15, // minutes
        max_orders_per_hour: 30,
        working_hours: {
          open: '09:00',
          close: '23:00'
        }
      };

      res.json({
        success: true,
        data: settings
      });
    } catch (error) {
      next(error);
    }
  },

  // Check if restaurant should accept new orders
  shouldAcceptOrder() {
    return restaurantSettings.is_open;
  },

  // Check if orders should be auto-accepted
  shouldAutoAcceptOrder() {
    return restaurantSettings.is_open && restaurantSettings.auto_accept;
  }
};

module.exports = RestaurantController;