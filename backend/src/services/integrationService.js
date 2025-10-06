const { ConnectedApp } = require('../models');
const { DELIVERY_PLATFORMS } = require('../utils/constants');
const { decrypt } = require('../utils/encryption');
const JahezService = require('./integrations/JahezService');
const HungerStationService = require('./integrations/HungerStationService');
const KeetaService = require('./integrations/KeetaService');

const integrationService = {
  // Get all integrations
  async getAllIntegrations() {
    const integrations = await ConnectedApp.findAll({
      attributes: { exclude: ['api_key_encrypted', 'api_secret_encrypted'] },
      order: [['app_name', 'ASC']]
    });

    return integrations.map(integration => ({
      ...integration.toJSON(),
      has_credentials: !!(integration.api_key_encrypted),
      last_sync_formatted: integration.last_sync ? 
        new Date(integration.last_sync).toLocaleString() : 'Never'
    }));
  },

  // Get integration status
  async getIntegrationStatus(platform) {
    const integration = await ConnectedApp.findOne({
      where: { app_name: platform }
    });

    if (!integration) {
      return {
        platform,
        configured: false,
        active: false,
        connected: false,
        last_sync: null,
        error: 'Integration not configured'
      };
    }

    return {
      platform: integration.app_name,
      configured: !!(integration.api_key_encrypted),
      active: integration.is_active,
      connected: integration.sync_status === 'connected',
      last_sync: integration.last_sync,
      sync_status: integration.sync_status,
      webhook_url: integration.webhook_url,
      config: integration.config
    };
  },

  // Configure integration
  async configureIntegration(platform, config) {
    const [integration, created] = await ConnectedApp.upsert({
      app_name: platform,
      ...config,
      last_sync: new Date()
    });

    // Initialize the service with decrypted credentials
    await this.initializeService(platform, integration);

    return integration;
  },

  // Initialize service with credentials
  async initializeService(platform, integration = null) {
    if (!integration) {
      integration = await ConnectedApp.findOne({
        where: { app_name: platform }
      });
    }

    if (!integration || !integration.api_key_encrypted) {
      throw new Error(`${platform} integration not configured`);
    }

    const apiKey = decrypt(integration.api_key_encrypted);
    const apiSecret = integration.api_secret_encrypted ? 
      decrypt(integration.api_secret_encrypted) : null;

    const serviceConfig = {
      apiBaseUrl: this.getApiBaseUrl(platform),
      apiKey,
      apiSecret,
      webhookSecret: integration.webhook_secret,
      timeout: integration.config?.timeout || 30000,
      retryAttempts: integration.config?.retry_attempts || 3
    };

    const service = this.getService(platform);
    service.initialize(serviceConfig);

    return service;
  },

  // Get service instance
  getService(platform) {
    switch (platform) {
      case DELIVERY_PLATFORMS.JAHEZ:
        return JahezService;
      case DELIVERY_PLATFORMS.HUNGERSTATION:
        return HungerStationService;
      case DELIVERY_PLATFORMS.KEETA:
        return KeetaService;
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
  },

  // Get API base URL for platform
  getApiBaseUrl(platform) {
    const urls = {
      [DELIVERY_PLATFORMS.JAHEZ]: process.env.JAHEZ_API_BASE_URL || 'https://api.jahez.net/v1',
      [DELIVERY_PLATFORMS.HUNGERSTATION]: process.env.HUNGERSTATION_API_BASE_URL || 'https://api.hungerstation.com/v1',
      [DELIVERY_PLATFORMS.KEETA]: process.env.KEETA_API_BASE_URL || 'https://api.keeta.com/v1'
    };

    return urls[platform];
  },

  // Toggle integration status
  async toggleIntegration(platform, isActive) {
    const integration = await ConnectedApp.findOne({
      where: { app_name: platform }
    });

    if (!integration) {
      return null;
    }

    await integration.update({ 
      is_active: isActive,
      sync_status: isActive ? integration.sync_status : 'disconnected'
    });

    return integration;
  },

  // Delete integration
  async deleteIntegration(platform) {
    const integration = await ConnectedApp.findOne({
      where: { app_name: platform }
    });

    if (!integration) {
      return false;
    }

    await integration.destroy();
    return true;
  },

  // Test integration connection
  async testIntegrationConnection(platform) {
    try {
      const service = await this.initializeService(platform);
      const isConnected = await service.testConnection();

      // Update sync status
      await ConnectedApp.update(
        { 
          sync_status: isConnected ? 'connected' : 'failed',
          last_sync: new Date()
        },
        { where: { app_name: platform } }
      );

      return {
        platform,
        connected: isConnected,
        tested_at: new Date(),
        status: isConnected ? 'success' : 'failed'
      };
    } catch (error) {
      // Update sync status to failed
      await ConnectedApp.update(
        { 
          sync_status: 'error',
          last_sync: new Date()
        },
        { where: { app_name: platform } }
      );

      return {
        platform,
        connected: false,
        tested_at: new Date(),
        status: 'error',
        error: error.message
      };
    }
  },

  // Get integration statistics
  async getIntegrationStats() {
    const integrations = await ConnectedApp.findAll();
    
    const stats = integrations.reduce((acc, integration) => {
      acc.total++;
      if (integration.api_key_encrypted) acc.configured++;
      if (integration.is_active) acc.active++;
      if (integration.sync_status === 'connected') acc.connected++;
      return acc;
    }, { total: 0, configured: 0, active: 0, connected: 0 });
    
    stats.by_platform = {};
    stats.by_status = {};
    // Group by platform and status in single loop
    integrations.forEach(integration => {
      stats.by_platform[integration.app_name] = {
        configured: !!(integration.api_key_encrypted),
        active: integration.is_active,
        connected: integration.sync_status === 'connected',
        last_sync: integration.last_sync
      };
      
      const status = integration.sync_status || 'unknown';
      stats.by_status[status] = (stats.by_status[status] || 0) + 1;
    });

    return stats;
  },

  // Process webhook from any platform
  async processWebhook(platform, payload, signature = null, eventType = null) {
    try {
      // Get and initialize service
      const service = await this.initializeService(platform);
      
      // Handle webhook based on event type or default processing
      let result;
      if (eventType && service.handleWebhookEvent) {
        result = await service.handleWebhookEvent(eventType, payload);
      } else {
        result = await service.handleIncomingWebhook(payload, signature);
      }

      // Update last sync time
      await ConnectedApp.update(
        { last_sync: new Date() },
        { where: { app_name: platform } }
      );

      return result;
    } catch (error) {
      const logger = require('../utils/logger');
      logger.error('Webhook processing failed', { platform, error: error.message, stack: error.stack });
      
      // Update sync status to error
      await ConnectedApp.update(
        { 
          sync_status: 'error',
          last_sync: new Date()
        },
        { where: { app_name: platform } }
      );

      throw error;
    }
  },

  // Sync menu with platform
  async syncMenuWithPlatform(platform, menuItems) {
    try {
      const service = await this.initializeService(platform);
      
      if (!service.syncMenu) {
        throw new Error(`Menu sync not supported for ${platform}`);
      }

      const result = await service.syncMenu(menuItems);
      
      // Update last sync time
      await ConnectedApp.update(
        { last_sync: new Date() },
        { where: { app_name: platform } }
      );

      return result;
    } catch (error) {
      console.error(`Menu sync failed for ${platform}:`, error.message);
      throw error;
    }
  },

  // Update order status on platform
  async updateOrderStatusOnPlatform(platform, platformOrderId, status, notes = null) {
    try {
      const service = await this.initializeService(platform);
      const result = await service.updateOrderStatus(platformOrderId, status, notes);
      
      return result;
    } catch (error) {
      console.error(`Order status update failed for ${platform}:`, error.message);
      throw error;
    }
  },

  // Get order from platform
  async getOrderFromPlatform(platform, platformOrderId) {
    try {
      const service = await this.initializeService(platform);
      const order = await service.getOrder(platformOrderId);
      
      return order;
    } catch (error) {
      console.error(`Get order failed for ${platform}:`, error.message);
      throw error;
    }
  },

  // Bulk sync all active integrations
  async bulkSyncIntegrations() {
    const activeIntegrations = await ConnectedApp.findAll({
      where: { is_active: true }
    });

    const results = [];

    for (const integration of activeIntegrations) {
      try {
        const result = await this.testIntegrationConnection(integration.app_name);
        results.push(result);
      } catch (error) {
        results.push({
          platform: integration.app_name,
          connected: false,
          status: 'error',
          error: error.message
        });
      }
    }

    return {
      total: activeIntegrations.length,
      successful: results.filter(r => r.connected).length,
      failed: results.filter(r => !r.connected).length,
      results
    };
  },

  // Get webhook URL for platform
  getWebhookUrl(platform, baseUrl = '') {
    const webhookPaths = {
      [DELIVERY_PLATFORMS.JAHEZ]: '/webhooks/jahez',
      [DELIVERY_PLATFORMS.HUNGERSTATION]: '/webhooks/hungerstation',
      [DELIVERY_PLATFORMS.KEETA]: '/webhooks/keeta'
    };

    const path = webhookPaths[platform];
    return path ? `${baseUrl}${path}` : null;
  },

  // Validate webhook signature for platform
  async validateWebhookSignature(platform, payload, signature) {
    try {
      const service = await this.initializeService(platform);
      return service.verifyWebhookSignature(payload, signature);
    } catch (error) {
      console.error(`Webhook signature validation failed for ${platform}:`, error.message);
      return false;
    }
  }
};

module.exports = integrationService;