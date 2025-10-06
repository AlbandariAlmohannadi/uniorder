const BaseIntegrationService = require('./BaseIntegrationService');
const { ORDER_STATUS, DELIVERY_PLATFORMS } = require('../../utils/constants');

class KeetaService extends BaseIntegrationService {
  constructor() {
    super(DELIVERY_PLATFORMS.KEETA);
    this.apiBaseUrl = process.env.KEETA_API_BASE_URL || 'https://api.keeta.com/v1';
  }

  // Normalize Keeta order format to UniOrder schema
  normalizeOrder(keetaOrder) {
    try {
      this.validateKeetaPayload(keetaOrder);

      const customer = this.extractCustomerInfo(keetaOrder);
      const orderItems = this.extractOrderItems(keetaOrder);
      const totalAmount = keetaOrder.order_total || this.calculateTotalAmount(orderItems);

      return {
        platform_order_id: keetaOrder.order_number || keetaOrder.id,
        customer_name: customer.name,
        customer_phone: customer.phone,
        customer_address: customer.address,
        order_items: orderItems,
        total_amount: parseFloat(totalAmount),
        status: ORDER_STATUS.RECEIVED,
        notes: keetaOrder.customer_notes || keetaOrder.instructions || null,
        estimated_delivery_time: keetaOrder.estimated_delivery ? new Date(keetaOrder.estimated_delivery) : null,
        platform_metadata: {
          original_payload: keetaOrder,
          platform: DELIVERY_PLATFORMS.KEETA,
          order_type: keetaOrder.service_type || 'delivery',
          payment_method: keetaOrder.payment_method || 'unknown',
          delivery_fee: keetaOrder.delivery_fee || 0,
          tax_amount: keetaOrder.tax_total || 0,
          discount_amount: keetaOrder.discount_total || 0,
          restaurant_id: keetaOrder.merchant?.id,
          branch_id: keetaOrder.store?.id
        }
      };
    } catch (error) {
      console.error('Keeta order normalization failed:', error.message);
      throw new Error(`Failed to normalize Keeta order: ${error.message}`);
    }
  }

  // Validate Keeta-specific payload structure
  validateKeetaPayload(payload) {
    const requiredFields = ['order_number', 'customer_info', 'order_items'];
    
    for (const field of requiredFields) {
      if (!payload[field]) {
        throw new Error(`Missing required Keeta field: ${field}`);
      }
    }

    const customer = payload.customer_info || {};
    if (!customer.name && !customer.first_name) {
      throw new Error('Customer name is required');
    }

    if (!customer.phone_number && !customer.mobile) {
      throw new Error('Customer phone is required');
    }

    if (!Array.isArray(payload.order_items) || payload.order_items.length === 0) {
      throw new Error('Order must contain at least one item');
    }

    return true;
  }

  // Extract customer information from Keeta order
  extractCustomerInfo(keetaOrder) {
    const customer = keetaOrder.customer_info || {};
    
    let customerName = customer.name;
    if (!customerName && customer.first_name) {
      customerName = `${customer.first_name} ${customer.last_name || ''}`.trim();
    }

    let customerAddress = 'Address not provided';
    if (keetaOrder.delivery_info) {
      const delivery = keetaOrder.delivery_info;
      if (delivery.address) {
        customerAddress = delivery.address;
      } else {
        const addressParts = [
          delivery.street,
          delivery.building,
          delivery.floor,
          delivery.unit,
          delivery.district,
          delivery.city
        ].filter(Boolean);
        
        if (addressParts.length > 0) {
          customerAddress = addressParts.join(', ');
        }
      }
    }

    return {
      name: customerName || 'Unknown Customer',
      phone: customer.phone_number || customer.mobile || 'Unknown',
      address: customerAddress
    };
  }

  // Extract order items from Keeta order
  extractOrderItems(keetaOrder) {
    const items = keetaOrder.order_items || [];
    
    return items.map(item => ({
      name: item.item_name || item.name || 'Unknown Item',
      quantity: parseInt(item.quantity) || 1,
      price: parseFloat(item.unit_price) || parseFloat(item.price) || 0,
      notes: item.customer_notes || item.special_instructions || null,
      modifiers: item.customizations || item.add_ons || [],
      category: item.category_name || null,
      sku: item.item_id || item.sku || null,
      image_url: item.image_url || null
    }));
  }

  // Update order status on Keeta platform
  async updateOrderStatus(platformOrderId, status, notes = null) {
    try {
      const keetaStatus = this.mapStatusToKeeta(status);
      
      const payload = {
        order_status: keetaStatus,
        status_notes: notes,
        updated_time: new Date().toISOString()
      };

      const response = await this.makeApiRequest(
        'PATCH',
        `/orders/${platformOrderId}/status`,
        payload
      );

      return {
        success: true,
        platform_response: response,
        updated_status: keetaStatus
      };
    } catch (error) {
      console.error(`Failed to update Keeta order ${platformOrderId}:`, error.message);
      throw error;
    }
  }

  // Map UniOrder status to Keeta status
  mapStatusToKeeta(uniOrderStatus) {
    const mapping = {
      [ORDER_STATUS.RECEIVED]: 'confirmed',
      [ORDER_STATUS.PREPARING]: 'in_preparation',
      [ORDER_STATUS.READY]: 'ready_for_pickup',
      [ORDER_STATUS.COMPLETED]: 'completed',
      [ORDER_STATUS.CANCELLED]: 'cancelled'
    };

    return mapping[uniOrderStatus] || 'confirmed';
  }

  // Get Keeta-specific status mapping
  getStatusMapping() {
    return {
      'placed': ORDER_STATUS.RECEIVED,
      'confirmed': ORDER_STATUS.RECEIVED,
      'in_preparation': ORDER_STATUS.PREPARING,
      'ready_for_pickup': ORDER_STATUS.READY,
      'out_for_delivery': ORDER_STATUS.READY,
      'completed': ORDER_STATUS.COMPLETED,
      'delivered': ORDER_STATUS.COMPLETED,
      'cancelled': ORDER_STATUS.CANCELLED,
      'rejected': ORDER_STATUS.CANCELLED
    };
  }

  // Handle Keeta webhook events
  async handleWebhookEvent(eventType, payload) {
    try {
      switch (eventType) {
        case 'order.placed':
        case 'order.created':
          return await this.handleOrderCreated(payload);
        
        case 'order.status_updated':
        case 'order.updated':
          return await this.handleOrderUpdated(payload);
        
        case 'order.cancelled':
          return await this.handleOrderCancelled(payload);
        
        default:
          console.warn(`Unhandled Keeta webhook event: ${eventType}`);
          return this.generateWebhookResponse(true, `Event ${eventType} acknowledged but not processed`);
      }
    } catch (error) {
      console.error(`Keeta webhook event ${eventType} processing failed:`, error.message);
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
    const keetaStatus = payload.order_status || payload.status || 'confirmed';
    normalizedOrder.status = statusMapping[keetaStatus] || ORDER_STATUS.RECEIVED;
    
    return this.generateWebhookResponse(true, 'Order updated successfully', normalizedOrder);
  }

  // Handle order cancelled event
  async handleOrderCancelled(payload) {
    const normalizedOrder = this.normalizeOrder(payload);
    normalizedOrder.status = ORDER_STATUS.CANCELLED;
    normalizedOrder.cancellation_reason = payload.cancellation_reason || payload.cancel_reason || 'Cancelled by platform';
    
    return this.generateWebhookResponse(true, 'Order cancelled successfully', normalizedOrder);
  }

  // Test connection to Keeta API
  async testConnection(apiKey = null, apiSecret = null) {
    try {
      const testApiKey = apiKey || this.apiKey;
      
      if (!testApiKey) {
        return false;
      }

      const response = await this.makeApiRequest('GET', '/ping', null, {
        headers: {
          'Authorization': `Bearer ${testApiKey}`,
          'Content-Type': 'application/json'
        }
      });

      return response && (response.status === 'success' || response.pong === true);
    } catch (error) {
      console.error('Keeta connection test failed:', error.message);
      return false;
    }
  }

  // Get restaurant info from Keeta
  async getRestaurantInfo(restaurantId) {
    try {
      const response = await this.makeApiRequest('GET', `/merchants/${restaurantId}`);
      return response;
    } catch (error) {
      console.error(`Failed to get Keeta restaurant info for ${restaurantId}:`, error.message);
      throw error;
    }
  }

  // Update menu item availability on Keeta
  async updateMenuItemAvailability(itemId, isAvailable) {
    try {
      const response = await this.makeApiRequest('PUT', `/menu-items/${itemId}`, {
        is_available: isAvailable
      });

      return response;
    } catch (error) {
      console.error(`Failed to update Keeta menu item ${itemId} availability:`, error.message);
      throw error;
    }
  }
}

module.exports = new KeetaService();