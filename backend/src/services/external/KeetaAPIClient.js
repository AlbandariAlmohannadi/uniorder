const axios = require('axios');
const logger = require('../../utils/logger');

class KeetaAPIClient {
  constructor() {
    this.baseURL = process.env.KEETA_API_BASE_URL || 'https://api.keeta.com/v1';
    this.apiKey = process.env.KEETA_API_KEY;
    this.timeout = 30000;
    this.retryAttempts = 3;
    this.retryDelay = 1000;
  }

  createHttpClient() {
    return axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'UniOrder/1.0'
      }
    });
  }

  async makeRequest(method, endpoint, data = null) {
    const client = this.createHttpClient();
    let lastError;

    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        const response = await client.request({
          method,
          url: endpoint,
          data
        });
        return response.data;
      } catch (error) {
        lastError = error;
        
        if (error.response?.status >= 400 && error.response?.status < 500) {
          break;
        }

        if (attempt < this.retryAttempts) {
          await new Promise(resolve => setTimeout(resolve, this.retryDelay * Math.pow(2, attempt - 1)));
        }
      }
    }

    logger.error(`Keeta API request failed after ${this.retryAttempts} attempts:`, lastError.message);
    throw lastError;
  }

  async confirmOrder(platformOrderId) {
    try {
      const response = await this.makeRequest('PATCH', `/orders/${platformOrderId}`, {
        status: 'confirmed',
        timestamp: new Date().toISOString()
      });
      
      logger.info(`Keeta order ${platformOrderId} confirmed successfully`);
      return response;
    } catch (error) {
      logger.error(`Failed to confirm Keeta order ${platformOrderId}:`, error.message);
      throw error;
    }
  }

  async rejectOrder(platformOrderId, reason) {
    try {
      const response = await this.makeRequest('PATCH', `/orders/${platformOrderId}`, {
        status: 'cancelled',
        cancellation_reason: reason,
        timestamp: new Date().toISOString()
      });
      
      logger.info(`Keeta order ${platformOrderId} rejected: ${reason}`);
      return response;
    } catch (error) {
      logger.error(`Failed to reject Keeta order ${platformOrderId}:`, error.message);
      throw error;
    }
  }

  async updateStatus(platformOrderId, newStatus) {
    try {
      const statusMapping = {
        'ready': 'ready_for_pickup',
        'completed': 'completed'
      };

      const keetaStatus = statusMapping[newStatus] || newStatus;
      
      const response = await this.makeRequest('PATCH', `/orders/${platformOrderId}`, {
        status: keetaStatus,
        timestamp: new Date().toISOString()
      });
      
      logger.info(`Keeta order ${platformOrderId} status updated to ${keetaStatus}`);
      return response;
    } catch (error) {
      logger.error(`Failed to update Keeta order ${platformOrderId} status:`, error.message);
      throw error;
    }
  }
}

module.exports = new KeetaAPIClient();