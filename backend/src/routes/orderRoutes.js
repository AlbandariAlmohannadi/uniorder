const express = require('express');
const OrderController = require('../controllers/orderController');
const { requireEmployee, requireManager } = require('../middleware/roleCheck');
const { authenticateToken } = require('../middleware/auth');
const { validateUpdateOrderStatus, validateCreateOrder, validateUpdateOrderNotes, validateCancelOrder, validateBulkUpdateOrders } = require('../middleware/validation/orderValidation');

const router = express.Router();

// All order routes require authentication
router.use(authenticateToken);

// GET /api/orders - Get all orders with pagination and filters (All authenticated users)
router.get('/', requireEmployee, OrderController.getOrders);

// GET /api/orders/dashboard - Get dashboard data (All authenticated users)
router.get('/dashboard', requireEmployee, OrderController.getDashboardData);

// GET /api/orders/stats/daily - Get daily order statistics (Manager+)
router.get('/stats/daily', requireManager, OrderController.getDailyStats);

// GET /api/orders/stats/weekly - Get weekly order statistics (Manager+)
router.get('/stats/weekly', requireManager, OrderController.getWeeklyStats);

// GET /api/orders/stats/monthly - Get monthly order statistics (Manager+)
router.get('/stats/monthly', requireManager, OrderController.getMonthlyStats);

// GET /api/orders/:id - Get specific order details (All authenticated users)
router.get('/:id', requireEmployee, OrderController.getOrderById);

// GET /api/orders/:id/audit - Get order audit trail (Manager+)
router.get('/:id/audit', requireManager, OrderController.getOrderAudit);

// POST /api/orders - Create new order (Manager+)
router.post('/', requireManager, validateCreateOrder, OrderController.createOrder);

// POST /api/orders/bulk-update - Bulk update orders (Manager+)
router.post('/bulk-update', requireManager, validateBulkUpdateOrders, OrderController.bulkUpdateOrders);

// POST /api/orders/:id/cancel - Cancel order (Manager+)
router.post('/:id/cancel', requireManager, validateCancelOrder, OrderController.cancelOrder);

// POST /api/orders/:id/accept - Accept order (All authenticated users)
router.post('/:id/accept', requireEmployee, OrderController.acceptOrder);

// POST /api/orders/:id/reject - Reject order (All authenticated users)
router.post('/:id/reject', requireEmployee, OrderController.rejectOrder);

// POST /api/orders/:id/ready - Mark order as ready (All authenticated users)
router.post('/:id/ready', requireEmployee, OrderController.markOrderReady);

// GET /api/orders/:id/invoice - Get order invoice PDF (All authenticated users)
router.get('/:id/invoice', requireEmployee, OrderController.getOrderInvoice);

// PUT /api/orders/:id/status - Update order status (All authenticated users)
router.put('/:id/status', requireEmployee, validateUpdateOrderStatus, OrderController.updateOrderStatus);

// PUT /api/orders/:id/notes - Update order notes (All authenticated users)
router.put('/:id/notes', requireEmployee, validateUpdateOrderNotes, OrderController.updateOrderNotes);

module.exports = router;