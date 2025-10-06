const { ConnectedApp } = require('../models');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { API_RESPONSE_CODES, DELIVERY_PLATFORMS } = require('../utils/constants');
const { encrypt, decrypt } = require('../utils/encryption');
const integrationService = require('../services/integrationService');
const JahezService = require('../services/integrations/JahezService');
const HungerStationService = require('../services/integrations/HungerStationService');
const KeetaService = require('../services/integrations/KeetaService');
const RestaurantController = require('./restaurantController');
const orderService = require('../services/orderService');

const IntegrationController = {
  // GET /api/integrations - Get all integrations
  async getIntegrations(req, res, next) {
    try {
      const integrations = await integrationService.getAllIntegrations();
      
      res.json({
        success: true,
        data: integrations
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/integrations/:platform/status - Check integration status
  async getIntegrationStatus(req, res, next) {
    try {
      const { platform } = req.params;
      
      if (!Object.values(DELIVERY_PLATFORMS).includes(platform)) {
        throw new AppError('Invalid platform', API_RESPONSE_CODES.BAD_REQUEST);
      }

      const status = await integrationService.getIntegrationStatus(platform);
      
      res.json({
        success: true,
        data: status
      });
    } catch (error) {
      next(error);
    }
  },

  // POST /api/integrations/jahez - Configure Jahez integration
  async configureJahez(req, res, next) {
    try {
      const { apiKey, apiSecret, webhookSecret, isActive = true } = req.body;

      if (!apiKey || !webhookSecret) {
        throw new AppError('API key and webhook secret are required', API_RESPONSE_CODES.BAD_REQUEST);
      }

      // Encrypt sensitive data
      const encryptedApiKey = encrypt(apiKey);
      const encryptedApiSecret = apiSecret ? encrypt(apiSecret) : null;

      const config = {
        app_name: DELIVERY_PLATFORMS.JAHEZ,
        api_key_encrypted: encryptedApiKey,
        api_secret_encrypted: encryptedApiSecret,
        webhook_secret: webhookSecret,
        webhook_url: '/webhooks/jahez',
        is_active: isActive,
        config: {
          api_version: 'v1',
          webhook_events: ['order.created', 'order.updated', 'order.cancelled'],
          timeout: 30000,
          retry_attempts: 3
        }
      };

      const integration = await integrationService.configureIntegration(DELIVERY_PLATFORMS.JAHEZ, config);

      // Test the connection
      let connectionStatus = 'unknown';
      try {
        const testResult = await JahezService.testConnection(apiKey, apiSecret);
        connectionStatus = testResult ? 'connected' : 'failed';
        
        await integration.update({ sync_status: connectionStatus });
      } catch (testError) {
        console.error('Jahez connection test failed:', testError.message);
        connectionStatus = 'failed';
      }

      res.json({
        success: true,
        message: 'Jahez integration configured successfully',
        data: {
          ...integration.toJSON(),
          connection_status: connectionStatus
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // POST /api/integrations/hungerstation - Configure HungerStation integration
  async configureHungerStation(req, res, next) {
    try {
      const { apiKey, apiSecret, webhookSecret, isActive = true } = req.body;

      if (!apiKey || !webhookSecret) {
        throw new AppError('API key and webhook secret are required', API_RESPONSE_CODES.BAD_REQUEST);
      }

      const encryptedApiKey = encrypt(apiKey);
      const encryptedApiSecret = apiSecret ? encrypt(apiSecret) : null;

      const config = {
        app_name: DELIVERY_PLATFORMS.HUNGERSTATION,
        api_key_encrypted: encryptedApiKey,
        api_secret_encrypted: encryptedApiSecret,
        webhook_secret: webhookSecret,
        webhook_url: '/webhooks/hungerstation',
        is_active: isActive,
        config: {
          api_version: 'v1',
          webhook_events: ['order.created', 'order.updated', 'order.cancelled'],
          timeout: 30000,
          retry_attempts: 3
        }
      };

      const integration = await integrationService.configureIntegration(DELIVERY_PLATFORMS.HUNGERSTATION, config);

      // Test the connection
      let connectionStatus = 'unknown';
      try {
        const testResult = await HungerStationService.testConnection(apiKey, apiSecret);
        connectionStatus = testResult ? 'connected' : 'failed';
        
        await integration.update({ sync_status: connectionStatus });
      } catch (testError) {
        console.error('HungerStation connection test failed:', testError.message);
        connectionStatus = 'failed';
      }

      res.json({
        success: true,
        message: 'HungerStation integration configured successfully',
        data: {
          ...integration.toJSON(),
          connection_status: connectionStatus
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // POST /api/integrations/keeta - Configure Keeta integration
  async configureKeeta(req, res, next) {
    try {
      const { apiKey, apiSecret, webhookSecret, isActive = true } = req.body;

      if (!apiKey || !webhookSecret) {
        throw new AppError('API key and webhook secret are required', API_RESPONSE_CODES.BAD_REQUEST);
      }

      const encryptedApiKey = encrypt(apiKey);
      const encryptedApiSecret = apiSecret ? encrypt(apiSecret) : null;

      const config = {
        app_name: DELIVERY_PLATFORMS.KEETA,
        api_key_encrypted: encryptedApiKey,
        api_secret_encrypted: encryptedApiSecret,
        webhook_secret: webhookSecret,
        webhook_url: '/webhooks/keeta',
        is_active: isActive,
        config: {
          api_version: 'v1',
          webhook_events: ['order.created', 'order.updated', 'order.cancelled'],
          timeout: 30000,
          retry_attempts: 3
        }
      };

      const integration = await integrationService.configureIntegration(DELIVERY_PLATFORMS.KEETA, config);

      // Test the connection
      let connectionStatus = 'unknown';
      try {
        const testResult = await KeetaService.testConnection(apiKey, apiSecret);
        connectionStatus = testResult ? 'connected' : 'failed';
        
        await integration.update({ sync_status: connectionStatus });
      } catch (testError) {
        console.error('Keeta connection test failed:', testError.message);
        connectionStatus = 'failed';
      }

      res.json({
        success: true,
        message: 'Keeta integration configured successfully',
        data: {
          ...integration.toJSON(),
          connection_status: connectionStatus
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // PUT /api/integrations/:platform/toggle - Toggle integration status
  async toggleIntegration(req, res, next) {
    try {
      const { platform } = req.params;
      const { isActive } = req.body;
      
      if (typeof isActive !== 'boolean') {
        throw new AppError('isActive must be a boolean value', API_RESPONSE_CODES.BAD_REQUEST);
      }

      if (!Object.values(DELIVERY_PLATFORMS).includes(platform)) {
        throw new AppError('Invalid platform', API_RESPONSE_CODES.BAD_REQUEST);
      }

      const integration = await integrationService.toggleIntegration(platform, isActive);
      
      if (!integration) {
        throw new AppError('Integration not found', API_RESPONSE_CODES.NOT_FOUND);
      }

      res.json({
        success: true,
        message: `${platform} integration ${isActive ? 'enabled' : 'disabled'} successfully`,
        data: integration
      });
    } catch (error) {
      next(error);
    }
  },

  // DELETE /api/integrations/:platform - Delete integration
  async deleteIntegration(req, res, next) {
    try {
      const { platform } = req.params;

      if (!Object.values(DELIVERY_PLATFORMS).includes(platform)) {
        throw new AppError('Invalid platform', API_RESPONSE_CODES.BAD_REQUEST);
      }

      const deleted = await integrationService.deleteIntegration(platform);
      
      if (!deleted) {
        throw new AppError('Integration not found', API_RESPONSE_CODES.NOT_FOUND);
      }

      res.json({
        success: true,
        message: `${platform} integration deleted successfully`
      });
    } catch (error) {
      next(error);
    }
  },

  // POST /api/integrations/:platform/test - Test integration connection
  async testIntegration(req, res, next) {
    try {
      const { platform } = req.params;

      if (!Object.values(DELIVERY_PLATFORMS).includes(platform)) {
        throw new AppError('Invalid platform', API_RESPONSE_CODES.BAD_REQUEST);
      }

      const result = await integrationService.testIntegrationConnection(platform);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/integrations/stats - Get integration statistics
  async getIntegrationStats(req, res, next) {
    try {
      const stats = await integrationService.getIntegrationStats();
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  },

  // POST /webhooks/jahez - Handle Jahez webhooks
  async handleJahezWebhook(req, res, next) {
    try {
      if (!RestaurantController.shouldAcceptOrder()) {
        return res.status(200).json({ success: false, message: 'Restaurant is closed' });
      }

      const result = await JahezService.handleWebhookEvent('order.created', req.body);
      
      if (result.success && result.data) {
        const order = await orderService.createOrder(result.data);
        
        if (RestaurantController.shouldAutoAcceptOrder()) {
          await orderService.updateOrderStatus(order.id, 'preparing', null, 'Auto-accepted');
        }
        
        req.app.get('io')?.emit('new_order', order);
      }
      
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
};

module.exports = IntegrationController;