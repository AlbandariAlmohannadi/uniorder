const BaseIntegrationService = require('./BaseIntegrationService');
const { ORDER_STATUS, DELIVERY_PLATFORMS } = require('../../utils/constants');

class JahezService extends BaseIntegrationService {
  constructor() {
    super(DELIVERY_PLATFORMS.JAHEZ);
    this.apiBaseUrl = process.env.JAHEZ_API_BASE_URL || 'https://api.jahez.net/v1';
  }

  // Normalize Jahez order format to UniOrder schema
  normalizeOrder(jahezOrder) {
    try {
      // Validate Jahez payload structure
      this.validateJahezPayload(jahezOrder);

      const customer = this.extractCustomerInfo(jahezOrder);
      const orderItems = this.extractOrderItems(jahezOrder);
      const totalAmount = jahezOrder.total_amount || this.calculateTotalAmount(orderItems);

      const normalizedOrder = {
        platform_order_id: jahezOrder.id || jahezOrder.order_id,
        customer_name: customer.name,
        customer_phone: customer.phone,
        customer_address: customer.address,
        order_items: orderItems,
        total_amount: parseFloat(totalAmount),
        status: ORDER_STATUS.RECEIVED,
        notes: jahezOrder.special_instructions || jahezOrder.notes || null,
        estimated_delivery_time: jahezOrder.estimated_delivery_time ? new Date(jahezOrder.estimated_delivery_time) : null,
        platform_metadata: {
          original_payload: jahezOrder,
          platform: DELIVERY_PLATFORMS.JAHEZ,
          order_type: jahezOrder.order_type || 'delivery',
          payment_method: jahezOrder.payment_method || 'unknown',
          delivery_fee: jahezOrder.delivery_fee || 0,
          tax_amount: jahezOrder.tax_amount || 0,
          discount_amount: jahezOrder.discount_amount || 0,
          restaurant_id: jahezOrder.restaurant_id,
          branch_id: jahezOrder.branch_id
        }
      };

      return normalizedOrder;
    } catch (error) {
      console.error('Jahez order normalization failed:', error.message);
      throw new Error(`Failed to normalize Jahez order: ${error.message}`);
    }
  }

  // Validate Jahez-specific payload structure
  validateJahezPayload(payload) {
    const requiredFields = ['id', 'customer', 'items'];
    
    for (const field of requiredFields) {
      if (!payload[field]) {
        throw new Error(`Missing required Jahez field: ${field}`);
      }
    }

    if (!payload.customer.name && !payload.customer.first_name) {
      throw new Error('Customer name is required');
    }

    if (!payload.customer.phone) {
      throw new Error('Customer phone is required');
    }

    if (!Array.isArray(payload.items) || payload.items.length === 0) {
      throw new Error('Order must contain at least one item');
    }

    return true;
  }

  // Extract customer information from Jahez order
  extractCustomerInfo(jahezOrder) {
    const customer = jahezOrder.customer || {};
    
    let customerName = customer.name;
    if (!customerName && customer.first_name) {
      customerName = `${customer.first_name} ${customer.last_name || ''}`.trim();
    }

    let customerAddress = 'Address not provided';
    if (jahezOrder.delivery_address) {
      if (typeof jahezOrder.delivery_address === 'string') {
        customerAddress = jahezOrder.delivery_address;
      } else if (jahezOrder.delivery_address.formatted_address) {
        customerAddress = jahezOrder.delivery_address.formatted_address;
      } else {
        // Build address from components
        const addr = jahezOrder.delivery_address;
        const addressParts = [
          addr.street,
          addr.building,
          addr.floor,
          addr.apartment,
          addr.district,
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

  // Extract order items from Jahez order
  extractOrderItems(jahezOrder) {
    const items = jahezOrder.items || [];
    
    return items.map(item => ({
      name: item.name || item.item_name || 'Unknown Item',
      quantity: parseInt(item.quantity) || 1,
      price: parseFloat(item.price) || parseFloat(item.unit_price) || 0,
      notes: item.special_instructions || item.notes || null,
      modifiers: item.modifiers || [],
      category: item.category || null,
      sku: item.sku || item.item_id || null,
      image_url: item.image_url || null
    }));
  }

  // Update order status on Jahez platform
  async updateOrderStatus(platformOrderId, status, notes = null) {
    try {
      const jahezStatus = this.mapStatusToJahez(status);
      
      const payload = {
        status: jahezStatus,
        notes: notes,
        updated_at: new Date().toISOString()
      };

      const response = await this.makeApiRequest(
        'PUT',
        `/orders/${platformOrderId}/status`,
        payload
      );

      return {
        success: true,
        platform_response: response,
        updated_status: jahezStatus
      };
    } catch (error) {
      console.error(`Failed to update Jahez order ${platformOrderId}:`, error.message);
      throw error;
    }
  }

  // Get order from Jahez platform
  async getOrder(platformOrderId) {
    try {
      const response = await this.makeApiRequest('GET', `/orders/${platformOrderId}`);
      return this.normalizeOrder(response);
    } catch (error) {
      console.error(`Failed to get Jahez order ${platformOrderId}:`, error.message);
      throw error;
    }
  }

  // Map UniOrder status to Jahez status
  mapStatusToJahez(uniOrderStatus) {
    const mapping = {
      [ORDER_STATUS.RECEIVED]: 'confirmed',
      [ORDER_STATUS.PREPARING]: 'preparing',
      [ORDER_STATUS.READY]: 'ready_for_pickup',
      [ORDER_STATUS.COMPLETED]: 'delivered',
      [ORDER_STATUS.CANCELLED]: 'cancelled'
    };

    return mapping[uniOrderStatus] || 'confirmed';
  }

  // Get Jahez-specific status mapping
  getStatusMapping() {
    return {
      'pending': ORDER_STATUS.RECEIVED,
      'confirmed': ORDER_STATUS.RECEIVED,
      'preparing': ORDER_STATUS.PREPARING,
      'ready_for_pickup': ORDER_STATUS.READY,
      'out_for_delivery': ORDER_STATUS.READY,
      'delivered': ORDER_STATUS.COMPLETED,
      'cancelled': ORDER_STATUS.CANCELLED,
      'rejected': ORDER_STATUS.CANCELLED
    };
  }

  // Handle Jahez webhook events
  async handleWebhookEvent(eventType, payload) {
    try {
      switch (eventType) {
        case 'order.created':
          return await this.handleOrderCreated(payload);
        
        case 'order.updated':
          return await this.handleOrderUpdated(payload);
        
        case 'order.cancelled':
          return await this.handleOrderCancelled(payload);
        
        default:
          console.warn(`Unhandled Jahez webhook event: ${eventType}`);
          return this.generateWebhookResponse(true, `Event ${eventType} acknowledged but not processed`);
      }
    } catch (error) {
      console.error(`Jahez webhook event ${eventType} processing failed:`, error.message);
      return this.generateWebhookResponse(false, error.message);
    }
  }

  // Handle order created event
  async handleOrderCreated(payload) {
    const normalizedOrder = this.normalizeOrder(payload);
    
    // Additional processing for new orders
    normalizedOrder.status = ORDER_STATUS.RECEIVED;
    
    return this.generateWebhookResponse(true, 'Order created successfully', normalizedOrder);
  }

  // Handle order updated event
  async handleOrderUpdated(payload) {
    const normalizedOrder = this.normalizeOrder(payload);
    
    // Map Jahez status to UniOrder status
    const statusMapping = this.getStatusMapping();
    const jahezStatus = payload.status || 'confirmed';
    normalizedOrder.status = statusMapping[jahezStatus] || ORDER_STATUS.RECEIVED;
    
    return this.generateWebhookResponse(true, 'Order updated successfully', normalizedOrder);
  }

  // Handle order cancelled event
  async handleOrderCancelled(payload) {
    const normalizedOrder = this.normalizeOrder(payload);
    normalizedOrder.status = ORDER_STATUS.CANCELLED;
    normalizedOrder.cancellation_reason = payload.cancellation_reason || 'Cancelled by platform';
    
    return this.generateWebhookResponse(true, 'Order cancelled successfully', normalizedOrder);
  }

  // Test connection to Jahez API
  async testConnection(apiKey = null, apiSecret = null) {
    try {
      const testApiKey = apiKey || this.apiKey;
      
      if (!testApiKey) {
        return false;
      }

      // Try to authenticate with Jahez API
      const response = await this.makeApiRequest('GET', '/auth/verify', null, {
        headers: {
          'Authorization': `Bearer ${testApiKey}`
        }
      });

      return response && response.authenticated === true;
    } catch (error) {
      console.error('Jahez connection test failed:', error.message);
      return false;
    }
  }

  // Get restaurant menu from Jahez
  async getRestaurantMenu(restaurantId) {
    try {
      const response = await this.makeApiRequest('GET', `/restaurants/${restaurantId}/menu`);
      return response;
    } catch (error) {
      console.error(`Failed to get Jahez menu for restaurant ${restaurantId}:`, error.message);
      throw error;
    }
  }

  // Update menu item availability on Jahez
  async updateMenuItemAvailability(itemId, isAvailable) {
    try {
      const response = await this.makeApiRequest('PUT', `/menu/items/${itemId}/availability`, {
        available: isAvailable
      });

      return response;
    } catch (error) {
      console.error(`Failed to update Jahez menu item ${itemId} availability:`, error.message);
      throw error;
    }
  }

  // Get order statistics from Jahez
  async getOrderStatistics(startDate, endDate) {
    try {
      const response = await this.makeApiRequest('GET', '/orders/statistics', null, {
        params: {
          start_date: startDate,
          end_date: endDate
        }
      });

      return response;
    } catch (error) {
      console.error('Failed to get Jahez order statistics:', error.message);
      throw error;
    }
  }
}

module.exports = new JahezService();