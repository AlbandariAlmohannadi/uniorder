const { Order, MenuItem, User, ConnectedApp } = require('../models');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { API_RESPONSE_CODES } = require('../utils/constants');
const reportService = require('../services/reportService');

const ReportController = {
  // GET /api/reports/dashboard - Get dashboard overview
  async getDashboardReport(req, res, next) {
    try {
      const { period = 'today' } = req.query;
      const report = await reportService.getDashboardReport(period);
      
      res.json({
        success: true,
        data: report
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/reports/sales - Get sales report
  async getSalesReport(req, res, next) {
    try {
      const { 
        startDate, 
        endDate, 
        groupBy = 'day',
        platform,
        includeDetails = false
      } = req.query;

      if (!startDate || !endDate) {
        throw new AppError('Start date and end date are required', API_RESPONSE_CODES.BAD_REQUEST);
      }

      const report = await reportService.getSalesReport({
        startDate,
        endDate,
        groupBy,
        platform,
        includeDetails: includeDetails === 'true'
      });
      
      res.json({
        success: true,
        data: report
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/reports/orders - Get orders report
  async getOrdersReport(req, res, next) {
    try {
      const { 
        startDate, 
        endDate, 
        status,
        platform,
        groupBy = 'day'
      } = req.query;

      if (!startDate || !endDate) {
        throw new AppError('Start date and end date are required', API_RESPONSE_CODES.BAD_REQUEST);
      }

      const report = await reportService.getOrdersReport({
        startDate,
        endDate,
        status,
        platform,
        groupBy
      });
      
      res.json({
        success: true,
        data: report
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/reports/menu-performance - Get menu performance report
  async getMenuPerformanceReport(req, res, next) {
    try {
      const { 
        startDate, 
        endDate, 
        category,
        limit = 50,
        sortBy = 'quantity'
      } = req.query;

      if (!startDate || !endDate) {
        throw new AppError('Start date and end date are required', API_RESPONSE_CODES.BAD_REQUEST);
      }

      const report = await reportService.getMenuPerformanceReport({
        startDate,
        endDate,
        category,
        limit: parseInt(limit),
        sortBy
      });
      
      res.json({
        success: true,
        data: report
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/reports/platform-performance - Get platform performance report
  async getPlatformPerformanceReport(req, res, next) {
    try {
      const { 
        startDate, 
        endDate,
        includeHourly = false
      } = req.query;

      if (!startDate || !endDate) {
        throw new AppError('Start date and end date are required', API_RESPONSE_CODES.BAD_REQUEST);
      }

      const report = await reportService.getPlatformPerformanceReport({
        startDate,
        endDate,
        includeHourly: includeHourly === 'true'
      });
      
      res.json({
        success: true,
        data: report
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/reports/customer-insights - Get customer insights report
  async getCustomerInsightsReport(req, res, next) {
    try {
      const { 
        startDate, 
        endDate,
        limit = 100
      } = req.query;

      if (!startDate || !endDate) {
        throw new AppError('Start date and end date are required', API_RESPONSE_CODES.BAD_REQUEST);
      }

      const report = await reportService.getCustomerInsightsReport({
        startDate,
        endDate,
        limit: parseInt(limit)
      });
      
      res.json({
        success: true,
        data: report
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/reports/peak-hours - Get peak hours analysis
  async getPeakHoursReport(req, res, next) {
    try {
      const { 
        startDate, 
        endDate,
        dayOfWeek
      } = req.query;

      if (!startDate || !endDate) {
        throw new AppError('Start date and end date are required', API_RESPONSE_CODES.BAD_REQUEST);
      }

      const report = await reportService.getPeakHoursReport({
        startDate,
        endDate,
        dayOfWeek: dayOfWeek ? parseInt(dayOfWeek) : null
      });
      
      res.json({
        success: true,
        data: report
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/reports/revenue-trends - Get revenue trends
  async getRevenueTrendsReport(req, res, next) {
    try {
      const { 
        startDate, 
        endDate,
        granularity = 'daily',
        compareWith
      } = req.query;

      if (!startDate || !endDate) {
        throw new AppError('Start date and end date are required', API_RESPONSE_CODES.BAD_REQUEST);
      }

      const report = await reportService.getRevenueTrendsReport({
        startDate,
        endDate,
        granularity,
        compareWith
      });
      
      res.json({
        success: true,
        data: report
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/reports/operational-efficiency - Get operational efficiency report
  async getOperationalEfficiencyReport(req, res, next) {
    try {
      const { 
        startDate, 
        endDate,
        includeStaffMetrics = false
      } = req.query;

      if (!startDate || !endDate) {
        throw new AppError('Start date and end date are required', API_RESPONSE_CODES.BAD_REQUEST);
      }

      const report = await reportService.getOperationalEfficiencyReport({
        startDate,
        endDate,
        includeStaffMetrics: includeStaffMetrics === 'true'
      });
      
      res.json({
        success: true,
        data: report
      });
    } catch (error) {
      next(error);
    }
  },

  // POST /api/reports/export - Export report data
  async exportReport(req, res, next) {
    try {
      const { 
        reportType,
        format = 'csv',
        filters = {},
        email
      } = req.body;

      if (!reportType) {
        throw new AppError('Report type is required', API_RESPONSE_CODES.BAD_REQUEST);
      }

      const validFormats = ['csv', 'excel', 'pdf'];
      if (!validFormats.includes(format)) {
        throw new AppError('Invalid format. Must be csv, excel, or pdf', API_RESPONSE_CODES.BAD_REQUEST);
      }

      const exportResult = await reportService.exportReport({
        reportType,
        format,
        filters,
        email,
        userId: req.user.id
      });
      
      res.json({
        success: true,
        message: email ? 'Report will be sent to your email' : 'Report generated successfully',
        data: exportResult
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/reports/scheduled - Get scheduled reports
  async getScheduledReports(req, res, next) {
    try {
      const reports = await reportService.getScheduledReports(req.user.id);
      
      res.json({
        success: true,
        data: reports
      });
    } catch (error) {
      next(error);
    }
  },

  // POST /api/reports/schedule - Schedule a report
  async scheduleReport(req, res, next) {
    try {
      const { 
        reportType,
        frequency,
        filters = {},
        email,
        name
      } = req.body;

      if (!reportType || !frequency || !email || !name) {
        throw new AppError('Report type, frequency, email, and name are required', API_RESPONSE_CODES.BAD_REQUEST);
      }

      const validFrequencies = ['daily', 'weekly', 'monthly'];
      if (!validFrequencies.includes(frequency)) {
        throw new AppError('Invalid frequency. Must be daily, weekly, or monthly', API_RESPONSE_CODES.BAD_REQUEST);
      }

      const scheduledReport = await reportService.scheduleReport({
        reportType,
        frequency,
        filters,
        email,
        name,
        userId: req.user.id
      });
      
      res.status(API_RESPONSE_CODES.CREATED).json({
        success: true,
        message: 'Report scheduled successfully',
        data: scheduledReport
      });
    } catch (error) {
      next(error);
    }
  },

  // DELETE /api/reports/scheduled/:id - Delete scheduled report
  async deleteScheduledReport(req, res, next) {
    try {
      const { id } = req.params;
      
      const deleted = await reportService.deleteScheduledReport(id, req.user.id);
      
      if (!deleted) {
        throw new AppError('Scheduled report not found', API_RESPONSE_CODES.NOT_FOUND);
      }

      res.json({
        success: true,
        message: 'Scheduled report deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = ReportController;