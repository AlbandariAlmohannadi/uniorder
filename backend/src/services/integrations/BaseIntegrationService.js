const axios = require('axios');
const crypto = require('crypto');
const { ORDER_STATUS } = require('../../utils/constants');

class BaseIntegrationService {
  constructor(platformName) {
    this.platformName = platformName;
    this.apiBaseUrl = null;
    this.apiKey = null;
    this.apiSecret = null;
    this.webhookSecret = null;
    this.timeout = 30000;
    this.retryAttempts = 3;
    this.retryDelay = 1000;
  }

  // Initialize service with configuration
  initialize(config) {
    this.apiBaseUrl = config.apiBaseUrl;
    this.apiKey = config.apiKey;
    this.apiSecret = config.apiSecret;
    this.webhookSecret = config.webhookSecret;
    this.timeout = config.timeout || 30000;
    this.retryAttempts = config.retryAttempts || 3;
    this.retryDelay = config.retryDelay || 1000;
  }

  // Create HTTP client with authentication
  createHttpClient() {
    const headers = {
      'Content-Type': 'application/json',
      'User-Agent': 'UniOrder/1.0'
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    if (this.apiSecret) {
      headers['X-API-Secret'] = this.apiSecret;
    }

    return axios.create({
      baseURL: this.apiBaseUrl,
      timeout: this.timeout,
      headers
    });
  }

  // Normalize order data to UniOrder format
  normalizeOrder(platformOrder) {
    throw new Error('normalizeOrder method must be implemented by subclass');
  }

  // Verify webhook signature
  verifyWebhookSignature(payload, signature, secret = null) {
    if (!secret && !this.webhookSecret) {
      console.warn(`No webhook secret configured for ${this.platformName}`);
      return true; // Allow if no secret is configured
    }

    const webhookSecret = secret || this.webhookSecret;
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(JSON.stringify(payload))
      .digest('hex');

    // Handle different signature formats
    const cleanSignature = signature.replace(/^(sha256=|sha1=)/, '');
    
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(cleanSignature, 'hex')
    );
  }

  // Test API connection
  async testConnection(apiKey = null, apiSecret = null) {
    try {
      const testApiKey = apiKey || this.apiKey;
      const testApiSecret = apiSecret || this.apiSecret;

      if (!testApiKey) {
        throw new Error('API key is required for connection test');
      }

      const client = axios.create({
        baseURL: this.apiBaseUrl,
        timeout: 10000,
        headers: {
          'Authorization': `Bearer ${testApiKey}`,
          'X-API-Secret': testApiSecret,
          'Content-Type': 'application/json'
        }
      });

      // Try to make a simple API call (ping or status endpoint)
      const response = await client.get('/ping');
      return response.status === 200;
    } catch (error) {
      console.error(`${this.platformName} connection test failed:`, error.message);
      return false;
    }
  }

  // Handle incoming webhook
  async handleIncomingWebhook(payload, signature = null) {
    try {
      // Verify signature if provided
      if (signature && !this.verifyWebhookSignature(payload, signature)) {
        throw new Error('Invalid webhook signature');
      }

      // Normalize the order data
      const normalizedOrder = this.normalizeOrder(payload);

      // Validate normalized order
      this.validateNormalizedOrder(normalizedOrder);

      return normalizedOrder;
    } catch (error) {
      console.error(`${this.platformName} webhook processing failed:`, error.message);
      throw error;
    }
  }

  // Validate normalized order data
  validateNormalizedOrder(order) {
    const requiredFields = [
      'platform_order_id',
      'customer_name',
      'customer_phone',
      'customer_address',
      'order_items',
      'total_amount'
    ];

    for (const field of requiredFields) {
      if (!order[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    if (!Array.isArray(order.order_items) || order.order_items.length === 0) {
      throw new Error('Order must contain at least one item');
    }

    if (order.total_amount <= 0) {
      throw new Error('Total amount must be greater than 0');
    }

    // Validate order items
    for (const item of order.order_items) {
      if (!item.name || !item.quantity || !item.price) {
        throw new Error('Each order item must have name, quantity, and price');
      }

      if (item.quantity <= 0 || item.price <= 0) {
        throw new Error('Item quantity and price must be greater than 0');
      }
    }
  }

  // Make API request with retry logic
  async makeApiRequest(method, endpoint, data = null, options = {}) {
    const client = this.createHttpClient();
    let lastError;

    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        let response;
        
        switch (method.toUpperCase()) {
          case 'GET':
            response = await client.get(endpoint, options);
            break;
          case 'POST':
            response = await client.post(endpoint, data, options);
            break;
          case 'PUT':
            response = await client.put(endpoint, data, options);
            break;
          case 'DELETE':
            response = await client.delete(endpoint, options);
            break;
          default:
            throw new Error(`Unsupported HTTP method: ${method}`);
        }

        return response.data;
      } catch (error) {
        lastError = error;
        
        // Don't retry on client errors (4xx)
        if (error.response && error.response.status >= 400 && error.response.status < 500) {
          break;
        }

        // Wait before retry (exponential backoff)
        if (attempt < this.retryAttempts) {
          await this.sleep(this.retryDelay * Math.pow(2, attempt - 1));
        }
      }
    }

    throw lastError;
  }

  // Update order status on platform
  async updateOrderStatus(platformOrderId, status, notes = null) {
    throw new Error('updateOrderStatus method must be implemented by subclass');
  }

  // Get order from platform
  async getOrder(platformOrderId) {
    throw new Error('getOrder method must be implemented by subclass');
  }

  // Get platform-specific status mapping
  getStatusMapping() {
    return {
      [ORDER_STATUS.RECEIVED]: 'received',
      [ORDER_STATUS.PREPARING]: 'preparing',
      [ORDER_STATUS.READY]: 'ready',
      [ORDER_STATUS.COMPLETED]: 'completed',
      [ORDER_STATUS.CANCELLED]: 'cancelled'
    };
  }

  // Map UniOrder status to platform status
  mapStatusToPlatform(uniOrderStatus) {
    const mapping = this.getStatusMapping();
    return mapping[uniOrderStatus] || uniOrderStatus;
  }

  // Utility function for delays
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Log webhook activity
  logWebhookActivity(payload, success, error = null) {
    const logData = {
      platform: this.platformName,
      timestamp: new Date().toISOString(),
      success,
      order_id: payload.id || payload.order_id || 'unknown',
      error: error ? error.message : null
    };

    console.log(`Webhook Activity [${this.platformName}]:`, logData);
  }

  // Generate webhook response
  generateWebhookResponse(success, message = null, data = null) {
    return {
      success,
      message: message || (success ? 'Webhook processed successfully' : 'Webhook processing failed'),
      timestamp: new Date().toISOString(),
      platform: this.platformName,
      data
    };
  }

  // Validate webhook payload structure
  validateWebhookPayload(payload) {
    if (!payload || typeof payload !== 'object') {
      throw new Error('Invalid webhook payload: must be a valid object');
    }

    // Basic validation - subclasses should override for platform-specific validation
    return true;
  }

  // Extract customer information
  extractCustomerInfo(platformOrder) {
    return {
      name: 'Unknown Customer',
      phone: 'Unknown',
      address: 'Unknown Address'
    };
  }

  // Extract order items
  extractOrderItems(platformOrder) {
    return [];
  }

  // Calculate total amount
  calculateTotalAmount(items) {
    return items.reduce((total, item) => {
      return total + (parseFloat(item.price) * parseInt(item.quantity));
    }, 0);
  }
}

module.exports = BaseIntegrationService;