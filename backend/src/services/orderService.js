const { Order, ConnectedApp, OrderAuditLog, User } = require('../models');
const { ORDER_STATUS } = require('../utils/constants');
const { Op } = require('sequelize');
const { getClientForPlatform } = require('./external');
const InvoiceService = require('./InvoiceService');
const logger = require('../utils/logger');

const orderService = {
  // Get orders with pagination and filters
  async getOrders({ page = 1, limit = 50, filters = {}, sortBy = 'created_at', sortOrder = 'DESC' }) {
    const offset = (page - 1) * limit;
    const where = {};
    const include = [
      {
        model: ConnectedApp,
        as: 'platform',
        attributes: ['app_name', 'is_active']
      }
    ];

    // Apply filters
    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.platform) {
      include[0].where = { app_name: filters.platform };
    }

    if (filters.fromDate && filters.toDate) {
      where.created_at = {
        [Op.between]: [new Date(filters.fromDate), new Date(filters.toDate)]
      };
    } else if (filters.fromDate) {
      where.created_at = { [Op.gte]: new Date(filters.fromDate) };
    } else if (filters.toDate) {
      where.created_at = { [Op.lte]: new Date(filters.toDate) };
    }

    if (filters.search) {
      where[Op.or] = [
        { platform_order_id: { [Op.iLike]: `%${filters.search}%` } },
        { customer_name: { [Op.iLike]: `%${filters.search}%` } },
        { customer_phone: { [Op.iLike]: `%${filters.search}%` } }
      ];
    }

    const order = [[sortBy, sortOrder]];

    const { count, rows } = await Order.findAndCountAll({
      where,
      include,
      order,
      limit,
      offset
    });

    return {
      orders: rows,
      total: count
    };
  },

  // Get order by ID with full details
  async getOrderById(id) {
    return await Order.findByPk(id, {
      include: [
        {
          model: ConnectedApp,
          as: 'platform',
          attributes: ['app_name', 'is_active']
        },
        {
          model: OrderAuditLog,
          as: 'audit_logs',
          include: [
            {
              model: User,
              as: 'changed_by_user',
              attributes: ['username', 'role']
            }
          ],
          order: [['timestamp', 'DESC']]
        }
      ]
    });
  },

  // Create new order
  async createOrder(orderData) {
    // Validate connected app exists
    const connectedApp = await ConnectedApp.findByPk(orderData.connected_app_id);
    if (!connectedApp) {
      throw new Error('Connected app not found');
    }

    // Check for duplicate platform order ID
    const existingOrder = await Order.findOne({
      where: {
        platform_order_id: orderData.platform_order_id,
        connected_app_id: orderData.connected_app_id
      }
    });

    if (existingOrder) {
      throw new Error('Order with this platform ID already exists');
    }

    // Create order
    const order = await Order.create({
      ...orderData,
      status: ORDER_STATUS.RECEIVED
    });

    // Create initial audit log
    await OrderAuditLog.create({
      order_id: order.id,
      old_status: null,
      new_status: ORDER_STATUS.RECEIVED,
      changed_by_system: 'webhook',
      timestamp: new Date()
    });

    // Return order with platform info
    return await this.getOrderById(order.id);
  },

  // Update order status with external API notification
  async updateOrderStatus(orderId, newStatus, userId, reason = null) {
    const order = await Order.findByPk(orderId, { include: ['platform'] });
    if (!order) {
      return null;
    }

    const oldStatus = order.status;

    // Update order in database
    const updateData = { status: newStatus };
    if (newStatus === ORDER_STATUS.COMPLETED) {
      updateData.completed_at = new Date();
    } else if (newStatus === ORDER_STATUS.CANCELLED) {
      updateData.cancelled_at = new Date();
      if (reason) {
        updateData.cancellation_reason = reason;
      }
    }

    if (reason) {
      updateData.notes = reason;
    }

    await order.update(updateData);

    // Create audit log
    await OrderAuditLog.create({
      order_id: orderId,
      old_status: oldStatus,
      new_status: newStatus,
      changed_by_user_id: userId,
      change_reason: reason,
      timestamp: new Date()
    });

    // Notify external platform
    try {
      const externalClient = getClientForPlatform(order.platform.app_name);
      
      switch(newStatus) {
        case ORDER_STATUS.PREPARING:
          await externalClient.confirmOrder(order.platform_order_id);
          break;
        case ORDER_STATUS.CANCELLED:
          await externalClient.rejectOrder(order.platform_order_id, reason);
          break;
        case ORDER_STATUS.READY:
          await externalClient.updateStatus(order.platform_order_id, 'ready');
          // Generate Invoice
          await InvoiceService.generateInvoicePDF(orderId);
          break;
        case ORDER_STATUS.COMPLETED:
          await externalClient.updateStatus(order.platform_order_id, 'completed');
          break;
      }
    } catch (error) {
      // Log error but don't crash - the order status was updated internally
      logger.error('Failed to notify external platform', {
        orderId,
        platform: order.platform?.app_name,
        newStatus,
        error: error.message
      });
    }

    return await this.getOrderById(orderId);
  },

  // Get daily order statistics
  async getDailyOrderStats(date) {
    const startDate = new Date(date);
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 1);

    const orders = await Order.findAll({
      where: {
        created_at: {
          [Op.gte]: startDate,
          [Op.lt]: endDate
        }
      },
      include: [
        {
          model: ConnectedApp,
          as: 'platform',
          attributes: ['app_name']
        }
      ]
    });

    const stats = {
      total_orders: orders.length,
      completed_orders: orders.filter(o => o.status === ORDER_STATUS.COMPLETED).length,
      cancelled_orders: orders.filter(o => o.status === ORDER_STATUS.CANCELLED).length,
      pending_orders: orders.filter(o => [ORDER_STATUS.RECEIVED, ORDER_STATUS.PREPARING, ORDER_STATUS.READY].includes(o.status)).length,
      total_revenue: orders
        .filter(o => o.status === ORDER_STATUS.COMPLETED)
        .reduce((sum, o) => sum + parseFloat(o.total_amount), 0),
      average_order_value: 0,
      orders_by_hour: [],
      orders_by_status: [],
      orders_by_platform: []
    };

    // Calculate average order value
    if (stats.completed_orders > 0) {
      stats.average_order_value = stats.total_revenue / stats.completed_orders;
    }

    // Orders by hour
    const hourlyStats = {};
    orders.forEach(order => {
      const hour = new Date(order.created_at).getHours();
      hourlyStats[hour] = (hourlyStats[hour] || 0) + 1;
    });

    stats.orders_by_hour = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      count: hourlyStats[hour] || 0
    }));

    // Orders by status
    const statusStats = {};
    orders.forEach(order => {
      statusStats[order.status] = (statusStats[order.status] || 0) + 1;
    });

    stats.orders_by_status = Object.entries(statusStats).map(([status, count]) => ({
      status,
      count
    }));

    // Orders by platform
    const platformStats = {};
    orders.forEach(order => {
      const platform = order.platform?.app_name || 'unknown';
      platformStats[platform] = (platformStats[platform] || 0) + 1;
    });

    stats.orders_by_platform = Object.entries(platformStats).map(([platform, count]) => ({
      platform,
      count
    }));

    return stats;
  },

  // Get weekly order statistics
  async getWeeklyOrderStats(startDate) {
    const start = startDate ? new Date(startDate) : new Date();
    start.setDate(start.getDate() - start.getDay()); // Start of week (Sunday)
    
    const end = new Date(start);
    end.setDate(end.getDate() + 7);

    const orders = await Order.findAll({
      where: {
        created_at: {
          [Op.gte]: start,
          [Op.lt]: end
        }
      },
      include: [
        {
          model: ConnectedApp,
          as: 'platform',
          attributes: ['app_name']
        }
      ]
    });

    // Group by day
    const dailyStats = {};
    orders.forEach(order => {
      const day = new Date(order.created_at).toISOString().split('T')[0];
      if (!dailyStats[day]) {
        dailyStats[day] = {
          date: day,
          total: 0,
          completed: 0,
          cancelled: 0,
          revenue: 0
        };
      }
      
      dailyStats[day].total++;
      if (order.status === ORDER_STATUS.COMPLETED) {
        dailyStats[day].completed++;
        dailyStats[day].revenue += parseFloat(order.total_amount);
      } else if (order.status === ORDER_STATUS.CANCELLED) {
        dailyStats[day].cancelled++;
      }
    });

    return {
      period: { start, end },
      daily_stats: Object.values(dailyStats),
      total_orders: orders.length,
      total_revenue: orders
        .filter(o => o.status === ORDER_STATUS.COMPLETED)
        .reduce((sum, o) => sum + parseFloat(o.total_amount), 0)
    };
  },

  // Get monthly order statistics
  async getMonthlyOrderStats(year, month) {
    const currentDate = new Date();
    const targetYear = year || currentDate.getFullYear();
    const targetMonth = month || currentDate.getMonth() + 1;

    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 1);

    const orders = await Order.findAll({
      where: {
        created_at: {
          [Op.gte]: startDate,
          [Op.lt]: endDate
        }
      }
    });

    // Group by day
    const dailyStats = {};
    orders.forEach(order => {
      const day = new Date(order.created_at).getDate();
      if (!dailyStats[day]) {
        dailyStats[day] = {
          day,
          total: 0,
          completed: 0,
          revenue: 0
        };
      }
      
      dailyStats[day].total++;
      if (order.status === ORDER_STATUS.COMPLETED) {
        dailyStats[day].completed++;
        dailyStats[day].revenue += parseFloat(order.total_amount);
      }
    });

    return {
      year: targetYear,
      month: targetMonth,
      daily_stats: Object.values(dailyStats),
      total_orders: orders.length,
      total_revenue: orders
        .filter(o => o.status === ORDER_STATUS.COMPLETED)
        .reduce((sum, o) => sum + parseFloat(o.total_amount), 0)
    };
  },

  // Get order audit trail
  async getOrderAuditTrail(orderId) {
    return await OrderAuditLog.findAll({
      where: { order_id: orderId },
      include: [
        {
          model: User,
          as: 'changed_by_user',
          attributes: ['username', 'role']
        }
      ],
      order: [['timestamp', 'DESC']]
    });
  },

  // Update order notes
  async updateOrderNotes(orderId, notes) {
    const order = await Order.findByPk(orderId);
    if (!order) {
      return null;
    }

    await order.update({ notes });
    return order;
  },

  // Cancel order
  async cancelOrder(orderId, reason, userId) {
    const order = await Order.findByPk(orderId);
    if (!order) {
      return null;
    }

    await order.update({
      status: ORDER_STATUS.CANCELLED,
      cancelled_at: new Date(),
      cancellation_reason: reason
    });

    // Create audit log
    await OrderAuditLog.create({
      order_id: orderId,
      old_status: order.status,
      new_status: ORDER_STATUS.CANCELLED,
      changed_by_user_id: userId,
      change_reason: reason,
      timestamp: new Date()
    });

    return await this.getOrderById(orderId);
  },

  // Get dashboard data
  async getDashboardData() {
    const today = new Date().toISOString().split('T')[0];
    const dailyStats = await this.getDailyOrderStats(today);

    const recentOrders = await Order.findAll({
      include: [
        {
          model: ConnectedApp,
          as: 'platform',
          attributes: ['app_name']
        }
      ],
      order: [['created_at', 'DESC']],
      limit: 10
    });

    const activeOrders = await Order.findAll({
      where: {
        status: {
          [Op.in]: [ORDER_STATUS.RECEIVED, ORDER_STATUS.PREPARING, ORDER_STATUS.READY]
        }
      },
      include: [
        {
          model: ConnectedApp,
          as: 'platform',
          attributes: ['app_name']
        }
      ],
      order: [['created_at', 'ASC']]
    });

    return {
      daily_stats: dailyStats,
      recent_orders: recentOrders,
      active_orders: activeOrders,
      summary: {
        total_today: dailyStats.total_orders,
        revenue_today: dailyStats.total_revenue,
        active_orders: activeOrders.length,
        completion_rate: dailyStats.total_orders > 0 
          ? (dailyStats.completed_orders / dailyStats.total_orders * 100).toFixed(1)
          : 0
      }
    };
  },

  // Bulk update order status
  async bulkUpdateOrderStatus(orderIds, status, userId, notes = null) {
    const orders = await Order.findAll({
      where: { id: { [Op.in]: orderIds } }
    });

    if (orders.length === 0) {
      return { updated: 0, errors: [] };
    }

    const updateData = { status };
    if (status === ORDER_STATUS.COMPLETED) {
      updateData.completed_at = new Date();
    } else if (status === ORDER_STATUS.CANCELLED) {
      updateData.cancelled_at = new Date();
    }

    if (notes) {
      updateData.notes = notes;
    }

    // Update all orders
    await Order.update(updateData, {
      where: { id: { [Op.in]: orderIds } }
    });

    // Create audit logs
    const auditLogs = orders.map(order => ({
      order_id: order.id,
      old_status: order.status,
      new_status: status,
      changed_by_user_id: userId,
      change_reason: notes,
      timestamp: new Date()
    }));

    await OrderAuditLog.bulkCreate(auditLogs);

    return {
      updated: orders.length,
      orders: orderIds
    };
  }
};

module.exports = orderService;