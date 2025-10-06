const axios = require('axios');
const logger = require('../../utils/logger');

class HungerStationAPIClient {
  constructor() {
    this.baseURL = process.env.HUNGERSTATION_API_BASE_URL || 'https://api.hungerstation.com/v1';
    this.apiKey = process.env.HUNGERSTATION_API_KEY;
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

    logger.error(`HungerStation API request failed after ${this.retryAttempts} attempts:`, lastError.message);
    throw lastError;
  }

  async confirmOrder(platformOrderId) {
    try {
      const response = await this.makeRequest('PUT', `/orders/${platformOrderId}/status`, {
        status: 'accepted',
        updated_at: new Date().toISOString()
      });
      
      logger.info(`HungerStation order ${platformOrderId} confirmed successfully`);
      return response;
    } catch (error) {
      logger.error(`Failed to confirm HungerStation order ${platformOrderId}:`, error.message);
      throw error;
    }
  }

  async rejectOrder(platformOrderId, reason) {
    try {
      const response = await this.makeRequest('PUT', `/orders/${platformOrderId}/status`, {
        status: 'rejected',
        rejection_reason: reason,
        updated_at: new Date().toISOString()
      });
      
      logger.info(`HungerStation order ${platformOrderId} rejected: ${reason}`);
      return response;
    } catch (error) {
      logger.error(`Failed to reject HungerStation order ${platformOrderId}:`, error.message);
      throw error;
    }
  }

  async updateStatus(platformOrderId, newStatus) {
    try {
      const statusMapping = {
        'ready': 'ready_for_delivery',
        'completed': 'delivered'
      };

      const hungerStationStatus = statusMapping[newStatus] || newStatus;
      
      const response = await this.makeRequest('PUT', `/orders/${platformOrderId}/status`, {
        status: hungerStationStatus,
        updated_at: new Date().toISOString()
      });
      
      logger.info(`HungerStation order ${platformOrderId} status updated to ${hungerStationStatus}`);
      return response;
    } catch (error) {
      logger.error(`Failed to update HungerStation order ${platformOrderId} status:`, error.message);
      throw error;
    }
  }
}

module.exports = new HungerStationAPIClient();