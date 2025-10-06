const express = require('express');
const ReportController = require('../controllers/reportController');
const { requireManager } = require('../middleware/roleCheck');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// All report routes require authentication and manager+ access
router.use(authenticateToken);
router.use(requireManager);

// GET /api/reports/dashboard - Get dashboard overview
router.get('/dashboard', ReportController.getDashboardReport);

// GET /api/reports/sales - Get sales report
router.get('/sales', ReportController.getSalesReport);

// GET /api/reports/orders - Get orders report
router.get('/orders', ReportController.getOrdersReport);

// GET /api/reports/menu-performance - Get menu performance report
router.get('/menu-performance', ReportController.getMenuPerformanceReport);

// GET /api/reports/platform-performance - Get platform performance report
router.get('/platform-performance', ReportController.getPlatformPerformanceReport);

// GET /api/reports/customer-insights - Get customer insights report
router.get('/customer-insights', ReportController.getCustomerInsightsReport);

// GET /api/reports/peak-hours - Get peak hours analysis
router.get('/peak-hours', ReportController.getPeakHoursReport);

// GET /api/reports/revenue-trends - Get revenue trends
router.get('/revenue-trends', ReportController.getRevenueTrendsReport);

// GET /api/reports/operational-efficiency - Get operational efficiency report
router.get('/operational-efficiency', ReportController.getOperationalEfficiencyReport);

// GET /api/reports/scheduled - Get scheduled reports
router.get('/scheduled', ReportController.getScheduledReports);

// POST /api/reports/export - Export report data
router.post('/export', ReportController.exportReport);

// POST /api/reports/schedule - Schedule a report
router.post('/schedule', ReportController.scheduleReport);

// DELETE /api/reports/scheduled/:id - Delete scheduled report
router.delete('/scheduled/:id', ReportController.deleteScheduledReport);

module.exports = router;