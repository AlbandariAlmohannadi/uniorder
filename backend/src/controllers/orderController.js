const { Order, ConnectedApp, OrderAuditLog } = require('../models');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { API_RESPONSE_CODES, ORDER_STATUS, PAGINATION } = require('../utils/constants');
const orderService = require('../services/orderService');
const InvoiceService = require('../services/InvoiceService');
const fs = require('fs');

const OrderController = {
  // GET /api/orders - Get paginated list of orders with filters
  async getOrders(req, res, next) {
    try {
      const { 
        page = PAGINATION.DEFAULT_PAGE, 
        limit = PAGINATION.DEFAULT_LIMIT, 
        status, 
        platform,
        fromDate, 
        toDate,
        search,
        sortBy = 'created_at',
        sortOrder = 'DESC'
      } = req.query;

      const filters = {};
      if (status) filters.status = status;
      if (platform) filters.platform = platform;
      if (fromDate) filters.fromDate = fromDate;
      if (toDate) filters.toDate = toDate;
      if (search) filters.search = search;

      const result = await orderService.getOrders({
        page: parseInt(page),
        limit: Math.min(parseInt(limit), PAGINATION.MAX_LIMIT),
        filters,
        sortBy,
        sortOrder: sortOrder.toUpperCase()
      });

      res.json({
        success: true,
        data: result.orders,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: result.total,
          totalPages: Math.ceil(result.total / parseInt(limit))
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/orders/:id - Get specific order details
  async getOrderById(req, res, next) {
    try {
      const { id } = req.params;
      const order = await orderService.getOrderById(id);
      
      if (!order) {
        throw new AppError('Order not found', API_RESPONSE_CODES.NOT_FOUND);
      }

      res.json({
        success: true,
        data: order
      });
    } catch (error) {
      next(error);
    }
  },

  // PUT /api/orders/:id/status - Update order status
  async updateOrderStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;
      const userId = req.user.id;

      // Validate status
      if (!Object.values(ORDER_STATUS).includes(status)) {
        throw new AppError('Invalid order status', API_RESPONSE_CODES.BAD_REQUEST);
      }

      const order = await orderService.updateOrderStatus(id, status, userId, notes);
      
      if (!order) {
        throw new AppError('Order not found', API_RESPONSE_CODES.NOT_FOUND);
      }

      // Emit real-time update
      req.app.get('io')?.emitOrderUpdate({
        orderId: order.id,
        newStatus: status,
        updatedBy: req.user.username,
        timestamp: new Date(),
        notes
      });

      res.json({
        success: true,
        message: 'Order status updated successfully',
        data: order
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/orders/stats/daily - Get daily order statistics
  async getDailyStats(req, res, next) {
    try {
      const { date = new Date().toISOString().split('T')[0] } = req.query;
      const stats = await orderService.getDailyOrderStats(date);
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/orders/stats/weekly - Get weekly order statistics
  async getWeeklyStats(req, res, next) {
    try {
      const { startDate } = req.query;
      
      if (startDate && isNaN(Date.parse(startDate))) {
        throw new AppError('Invalid start date format', API_RESPONSE_CODES.BAD_REQUEST);
      }
      
      const stats = await orderService.getWeeklyOrderStats(startDate);
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/orders/stats/monthly - Get monthly order statistics
  async getMonthlyStats(req, res, next) {
    try {
      const { year, month } = req.query;
      
      if (year && (isNaN(year) || year < 2020 || year > 2030)) {
        throw new AppError('Invalid year. Must be between 2020 and 2030', API_RESPONSE_CODES.BAD_REQUEST);
      }
      
      if (month && (isNaN(month) || month < 1 || month > 12)) {
        throw new AppError('Invalid month. Must be between 1 and 12', API_RESPONSE_CODES.BAD_REQUEST);
      }
      
      const stats = await orderService.getMonthlyOrderStats(year, month);
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  },

  // POST /api/orders - Create new order (for testing/manual entry)
  async createOrder(req, res, next) {
    try {
      const orderData = req.body;
      
      // Validate required fields
      const requiredFields = ['platform_order_id', 'connected_app_id', 'customer_name', 'customer_phone', 'customer_address', 'order_items', 'total_amount'];
      for (const field of requiredFields) {
        if (!orderData[field]) {
          throw new AppError(`${field} is required`, API_RESPONSE_CODES.BAD_REQUEST);
        }
      }

      // Validate order items
      if (!Array.isArray(orderData.order_items) || orderData.order_items.length === 0) {
        throw new AppError('Order must contain at least one item', API_RESPONSE_CODES.BAD_REQUEST);
      }

      // Validate total amount
      if (orderData.total_amount <= 0) {
        throw new AppError('Total amount must be greater than 0', API_RESPONSE_CODES.BAD_REQUEST);
      }

      const order = await orderService.createOrder(orderData);

      // Emit real-time update
      req.app.get('io')?.emitNewOrder(order);

      res.status(API_RESPONSE_CODES.CREATED).json({
        success: true,
        message: 'Order created successfully',
        data: order
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/orders/:id/audit - Get order audit trail
  async getOrderAudit(req, res, next) {
    try {
      const { id } = req.params;
      const auditLogs = await orderService.getOrderAuditTrail(id);
      
      res.json({
        success: true,
        data: auditLogs
      });
    } catch (error) {
      next(error);
    }
  },

  // PUT /api/orders/:id/notes - Update order notes
  async updateOrderNotes(req, res, next) {
    try {
      const { id } = req.params;
      const { notes } = req.body;

      const order = await orderService.updateOrderNotes(id, notes);
      
      if (!order) {
        throw new AppError('Order not found', API_RESPONSE_CODES.NOT_FOUND);
      }

      res.json({
        success: true,
        message: 'Order notes updated successfully',
        data: order
      });
    } catch (error) {
      next(error);
    }
  },

  // POST /api/orders/:id/cancel - Cancel order
  async cancelOrder(req, res, next) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const userId = req.user.id;

      const order = await orderService.cancelOrder(id, reason, userId);
      
      if (!order) {
        throw new AppError('Order not found', API_RESPONSE_CODES.NOT_FOUND);
      }

      // Emit real-time update
      req.app.get('io')?.emitOrderUpdate({
        orderId: order.id,
        newStatus: ORDER_STATUS.CANCELLED,
        updatedBy: req.user.username,
        timestamp: new Date(),
        reason
      });

      res.json({
        success: true,
        message: 'Order cancelled successfully',
        data: order
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/orders/dashboard - Get dashboard data
  async getDashboardData(req, res, next) {
    try {
      const dashboardData = await orderService.getDashboardData();
      
      res.json({
        success: true,
        data: dashboardData
      });
    } catch (error) {
      next(error);
    }
  },

  // POST /api/orders/bulk-update - Bulk update orders
  async bulkUpdateOrders(req, res, next) {
    try {
      const { orderIds, status, notes } = req.body;
      const userId = req.user.id;

      if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
        throw new AppError('Order IDs array is required', API_RESPONSE_CODES.BAD_REQUEST);
      }

      if (!Object.values(ORDER_STATUS).includes(status)) {
        throw new AppError('Invalid order status', API_RESPONSE_CODES.BAD_REQUEST);
      }

      const result = await orderService.bulkUpdateOrderStatus(orderIds, status, userId, notes);

      // Emit real-time updates
      orderIds.forEach(orderId => {
        req.app.get('io')?.emitOrderUpdate({
          orderId,
          newStatus: status,
          updatedBy: req.user.username,
          timestamp: new Date(),
          notes
        });
      });

      res.json({
        success: true,
        message: `${result.updated} orders updated successfully`,
        data: result
      });
    } catch (error) {
      next(error);
    }
  },

  // POST /api/orders/:id/accept - Accept order
  async acceptOrder(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const order = await orderService.updateOrderStatus(id, ORDER_STATUS.PREPARING, userId);
      
      if (!order) {
        throw new AppError('Order not found', API_RESPONSE_CODES.NOT_FOUND);
      }

      // Emit real-time update
      req.app.get('io')?.emitOrderUpdate({
        orderId: order.id,
        newStatus: ORDER_STATUS.PREPARING,
        updatedBy: req.user.username,
        timestamp: new Date()
      });

      res.json({
        success: true,
        message: 'Order accepted successfully',
        data: order
      });
    } catch (error) {
      next(error);
    }
  },

  // POST /api/orders/:id/reject - Reject order
  async rejectOrder(req, res, next) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const userId = req.user.id;

      if (!reason) {
        throw new AppError('Rejection reason is required', API_RESPONSE_CODES.BAD_REQUEST);
      }

      const order = await orderService.updateOrderStatus(id, ORDER_STATUS.CANCELLED, userId, reason);
      
      if (!order) {
        throw new AppError('Order not found', API_RESPONSE_CODES.NOT_FOUND);
      }

      // Emit real-time update
      req.app.get('io')?.emitOrderUpdate({
        orderId: order.id,
        newStatus: ORDER_STATUS.CANCELLED,
        updatedBy: req.user.username,
        timestamp: new Date(),
        reason
      });

      res.json({
        success: true,
        message: 'Order rejected successfully',
        data: order
      });
    } catch (error) {
      next(error);
    }
  },

  // POST /api/orders/:id/ready - Mark order as ready
  async markOrderReady(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const order = await orderService.updateOrderStatus(id, ORDER_STATUS.READY, userId);
      
      if (!order) {
        throw new AppError('Order not found', API_RESPONSE_CODES.NOT_FOUND);
      }

      // Emit real-time update
      req.app.get('io')?.emitOrderUpdate({
        orderId: order.id,
        newStatus: ORDER_STATUS.READY,
        updatedBy: req.user.username,
        timestamp: new Date()
      });

      res.json({
        success: true,
        message: 'Order marked as ready successfully',
        data: order
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/orders/:id/invoice - Get order invoice PDF
  async getOrderInvoice(req, res, next) {
    try {
      const { id } = req.params;
      
      // Check if order exists
      const order = await orderService.getOrderById(id);
      if (!order) {
        throw new AppError('Order not found', API_RESPONSE_CODES.NOT_FOUND);
      }

      // Check if invoice exists, if not generate it
      let invoicePath = await InvoiceService.getInvoicePath(id);
      if (!invoicePath) {
        const invoiceResult = await InvoiceService.generateInvoicePDF(id);
        invoicePath = invoiceResult.path;
      }

      // Check if file exists
      if (!fs.existsSync(invoicePath)) {
        throw new AppError('Invoice file not found', API_RESPONSE_CODES.NOT_FOUND);
      }

      // Set headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="invoice_${order.platform_order_id}.pdf"`);
      
      // Stream the PDF file
      const fileStream = fs.createReadStream(invoicePath);
      fileStream.pipe(res);
    } catch (error) {
      next(error);
    }
  }
};

module.exports = OrderController;