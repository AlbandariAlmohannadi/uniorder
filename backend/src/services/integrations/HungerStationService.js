const BaseIntegrationService = require('./BaseIntegrationService');
const { ORDER_STATUS, DELIVERY_PLATFORMS } = require('../../utils/constants');

class HungerStationService extends BaseIntegrationService {
  constructor() {
    super(DELIVERY_PLATFORMS.HUNGERSTATION);
    this.apiBaseUrl = process.env.HUNGERSTATION_API_BASE_URL || 'https://api.hungerstation.com/v1';
  }

  // Normalize HungerStation order format to UniOrder schema
  normalizeOrder(hungerStationOrder) {
    try {
      this.validateHungerStationPayload(hungerStationOrder);

      const customer = this.extractCustomerInfo(hungerStationOrder);
      const orderItems = this.extractOrderItems(hungerStationOrder);
      const totalAmount = hungerStationOrder.total || this.calculateTotalAmount(orderItems);

      return {
        platform_order_id: hungerStationOrder.order_id || hungerStationOrder.id,
        customer_name: customer.name,
        customer_phone: customer.phone,
        customer_address: customer.address,
        order_items: orderItems,
        total_amount: parseFloat(totalAmount),
        status: ORDER_STATUS.RECEIVED,
        notes: hungerStationOrder.notes || hungerStationOrder.special_requests || null,
        estimated_delivery_time: hungerStationOrder.delivery_time ? new Date(hungerStationOrder.delivery_time) : null,
        platform_metadata: {
          original_payload: hungerStationOrder,
          platform: DELIVERY_PLATFORMS.HUNGERSTATION,
          order_type: hungerStationOrder.type || 'delivery',
          payment_method: hungerStationOrder.payment_type || 'unknown',
          delivery_fee: hungerStationOrder.delivery_charge || 0,
          tax_amount: hungerStationOrder.tax || 0,
          discount_amount: hungerStationOrder.discount || 0,
          restaurant_id: hungerStationOrder.restaurant?.id,
          branch_id: hungerStationOrder.branch?.id
        }
      };
    } catch (error) {
      console.error('HungerStation order normalization failed:', error.message);
      throw new Error(`Failed to normalize HungerStation order: ${error.message}`);
    }
  }

  // Validate HungerStation-specific payload structure
  validateHungerStationPayload(payload) {
    const requiredFields = ['order_id', 'customer', 'items'];
    
    for (const field of requiredFields) {
      if (!payload[field]) {
        throw new Error(`Missing required HungerStation field: ${field}`);
      }
    }

    if (!payload.customer.name && !payload.customer.first_name) {
      throw new Error('Customer name is required');
    }

    if (!payload.customer.phone && !payload.customer.mobile) {
      throw new Error('Customer phone is required');
    }

    if (!Array.isArray(payload.items) || payload.items.length === 0) {
      throw new Error('Order must contain at least one item');
    }

    return true;
  }

  // Extract customer information from HungerStation order
  extractCustomerInfo(hungerStationOrder) {
    const customer = hungerStationOrder.customer || {};
    
    let customerName = customer.name;
    if (!customerName && customer.first_name) {
      customerName = `${customer.first_name} ${customer.last_name || ''}`.trim();
    }

    let customerAddress = 'Address not provided';
    if (hungerStationOrder.address) {
      if (typeof hungerStationOrder.address === 'string') {
        customerAddress = hungerStationOrder.address;
      } else if (hungerStationOrder.address.full_address) {
        customerAddress = hungerStationOrder.address.full_address;
      } else {
        const addr = hungerStationOrder.address;
        const addressParts = [
          addr.street_name,
          addr.building_number,
          addr.floor,
          addr.apartment,
          addr.area,
          addr.city
        ].filter(Boolean);
        
        if (addressParts.length > 0) {
          customerAddress = addressParts.join(', ');
        }
      }
    }

    return {
      name: customerName || 'Unknown Customer',
      phone: customer.phone || customer.mobile || 'Unknown',
      address: customerAddress
    };
  }

  // Extract order items from HungerStation order
  extractOrderItems(hungerStationOrder) {
    const items = hungerStationOrder.items || [];
    
    return items.map(item => ({
      name: item.name || item.product_name || 'Unknown Item',
      quantity: parseInt(item.quantity) || parseInt(item.qty) || 1,
      price: parseFloat(item.price) || parseFloat(item.amount) || 0,
      notes: item.notes || item.special_instructions || null,
      modifiers: item.addons || item.modifiers || [],
      category: item.category || null,
      sku: item.sku || item.product_id || null,
      image_url: item.image || null
    }));
  }

  // Update order status on HungerStation platform
  async updateOrderStatus(platformOrderId, status, notes = null) {
    try {
      const hungerStationStatus = this.mapStatusToHungerStation(status);
      
      const payload = {
        status: hungerStationStatus,
        notes: notes,
        timestamp: new Date().toISOString()
      };

      const response = await this.makeApiRequest(
        'PUT',
        `/orders/${platformOrderId}/status`,
        payload
      );

      return {
        success: true,
        platform_response: response,
        updated_status: hungerStationStatus
      };
    } catch (error) {
      console.error(`Failed to update HungerStation order ${platformOrderId}:`, error.message);
      throw error;
    }
  }

  // Map UniOrder status to HungerStation status
  mapStatusToHungerStation(uniOrderStatus) {
    const mapping = {
      [ORDER_STATUS.RECEIVED]: 'accepted',
      [ORDER_STATUS.PREPARING]: 'preparing',
      [ORDER_STATUS.READY]: 'ready',
      [ORDER_STATUS.COMPLETED]: 'delivered',
      [ORDER_STATUS.CANCELLED]: 'cancelled'
    };

    return mapping[uniOrderStatus] || 'accepted';
  }

  // Get HungerStation-specific status mapping
  getStatusMapping() {
    return {
      'new': ORDER_STATUS.RECEIVED,
      'accepted': ORDER_STATUS.RECEIVED,
      'preparing': ORDER_STATUS.PREPARING,
      'ready': ORDER_STATUS.READY,
      'picked_up': ORDER_STATUS.READY,
      'delivered': ORDER_STATUS.COMPLETED,
      'cancelled': ORDER_STATUS.CANCELLED,
      'rejected': ORDER_STATUS.CANCELLED
    };
  }

  // Handle HungerStation webhook events
  async handleWebhookEvent(eventType, payload) {
    try {
      switch (eventType) {
        case 'order.created':
        case 'order.new':
          return await this.handleOrderCreated(payload);
        
        case 'order.updated':
        case 'order.status_changed':
          return await this.handleOrderUpdated(payload);
        
        case 'order.cancelled':
          return await this.handleOrderCancelled(payload);
        
        default:
          console.warn(`Unhandled HungerStation webhook event: ${eventType}`);
          return this.generateWebhookResponse(true, `Event ${eventType} acknowledged but not processed`);
      }
    } catch (error) {
      console.error(`HungerStation webhook event ${eventType} processing failed:`, error.message);
      return this.generateWebhookResponse(false, error.message);
    }
  }

  // Handle order created event
  async handleOrderCreated(payload) {
    const normalizedOrder = this.normalizeOrder(payload);
    normalizedOrder.status = ORDER_STATUS.RECEIVED;
    
    return this.generateWebhookResponse(true, 'Order created successfully', normalizedOrder);
  }

  // Handle order updated event
  async handleOrderUpdated(payload) {
    const normalizedOrder = this.normalizeOrder(payload);
    
    const statusMapping = this.getStatusMapping();
    const hungerStationStatus = payload.status || 'accepted';
    normalizedOrder.status = statusMapping[hungerStationStatus] || ORDER_STATUS.RECEIVED;
    
    return this.generateWebhookResponse(true, 'Order updated successfully', normalizedOrder);
  }

  // Handle order cancelled event
  async handleOrderCancelled(payload) {
    const normalizedOrder = this.normalizeOrder(payload);
    normalizedOrder.status = ORDER_STATUS.CANCELLED;
    normalizedOrder.cancellation_reason = payload.cancellation_reason || 'Cancelled by platform';
    
    return this.generateWebhookResponse(true, 'Order cancelled successfully', normalizedOrder);
  }

  // Test connection to HungerStation API
  async testConnection(apiKey = null, apiSecret = null) {
    try {
      const testApiKey = apiKey || this.apiKey;
      
      if (!testApiKey) {
        return false;
      }

      const response = await this.makeApiRequest('GET', '/health', null, {
        headers: {
          'Authorization': `Bearer ${testApiKey}`
        }
      });

      return response && response.status === 'ok';
    } catch (error) {
      console.error('HungerStation connection test failed:', error.message);
      return false;
    }
  }
}

module.exports = new HungerStationService();