const { Order, MenuItem, User, ConnectedApp, OrderAuditLog } = require('../models');
const { ORDER_STATUS } = require('../utils/constants');
const { Op } = require('sequelize');

const reportService = {
  // Get dashboard overview report
  async getDashboardReport(period = 'today') {
    const dateRange = reportService.getDateRange(period);
    
    const orders = await Order.findAll({
      where: {
        created_at: {
          [Op.between]: [dateRange.start, dateRange.end]
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

    const completedOrders = orders.filter(o => o.status === ORDER_STATUS.COMPLETED);
    const totalRevenue = completedOrders.reduce((sum, o) => sum + parseFloat(o.total_amount), 0);

    return {
      period,
      date_range: dateRange,
      summary: {
        total_orders: orders.length,
        completed_orders: completedOrders.length,
        cancelled_orders: orders.filter(o => o.status === ORDER_STATUS.CANCELLED).length,
        pending_orders: orders.filter(o => [ORDER_STATUS.RECEIVED, ORDER_STATUS.PREPARING, ORDER_STATUS.READY].includes(o.status)).length,
        total_revenue: totalRevenue,
        average_order_value: completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0,
        completion_rate: orders.length > 0 ? (completedOrders.length / orders.length * 100) : 0
      },
      orders_by_hour: reportService.groupOrdersByHour(orders),
      orders_by_platform: reportService.groupOrdersByPlatform(orders),
      orders_by_status: reportService.groupOrdersByStatus(orders)
    };
  },

  // Get sales report
  async getSalesReport({ startDate, endDate, groupBy = 'day', platform = null, includeDetails = false }) {
    const where = {
      created_at: {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      },
      status: ORDER_STATUS.COMPLETED
    };

    const include = [
      {
        model: ConnectedApp,
        as: 'platform',
        attributes: ['app_name']
      }
    ];

    if (platform) {
      include[0].where = { app_name: platform };
    }

    const orders = await Order.findAll({
      where,
      include,
      order: [['created_at', 'ASC']]
    });

    const totalRevenue = orders.reduce((sum, o) => sum + parseFloat(o.total_amount), 0);
    const totalOrders = orders.length;

    const groupedData = reportService.groupOrdersByPeriod(orders, groupBy);

    const report = {
      period: { start: startDate, end: endDate },
      group_by: groupBy,
      platform: platform || 'all',
      summary: {
        total_orders: totalOrders,
        total_revenue: totalRevenue,
        average_order_value: totalOrders > 0 ? totalRevenue / totalOrders : 0,
        highest_day: reportService.getHighestRevenueDay(groupedData),
        lowest_day: reportService.getLowestRevenueDay(groupedData)
      },
      data: groupedData
    };

    if (includeDetails) {
      report.orders = orders.map(order => ({
        id: order.id,
        platform_order_id: order.platform_order_id,
        platform: order.platform?.app_name,
        total_amount: parseFloat(order.total_amount),
        created_at: order.created_at,
        customer_name: order.customer_name
      }));
    }

    return report;
  },

  // Get orders report
  async getOrdersReport({ startDate, endDate, status = null, platform = null, groupBy = 'day' }) {
    const where = {
      created_at: {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      }
    };

    if (status) {
      where.status = status;
    }

    const include = [
      {
        model: ConnectedApp,
        as: 'platform',
        attributes: ['app_name']
      }
    ];

    if (platform) {
      include[0].where = { app_name: platform };
    }

    const orders = await Order.findAll({
      where,
      include,
      order: [['created_at', 'ASC']]
    });

    const groupedData = reportService.groupOrdersByPeriod(orders, groupBy);

    return {
      period: { start: startDate, end: endDate },
      filters: { status, platform },
      group_by: groupBy,
      summary: {
        total_orders: orders.length,
        orders_by_status: reportService.groupOrdersByStatus(orders),
        orders_by_platform: reportService.groupOrdersByPlatform(orders)
      },
      data: groupedData
    };
  },

  // Get menu performance report
  async getMenuPerformanceReport({ startDate, endDate, category = null, limit = 50, sortBy = 'quantity' }) {
    const orders = await Order.findAll({
      where: {
        created_at: {
          [Op.between]: [new Date(startDate), new Date(endDate)]
        },
        status: ORDER_STATUS.COMPLETED
      }
    });

    // Extract and analyze order items
    const itemStats = {};
    
    orders.forEach(order => {
      order.order_items.forEach(item => {
        const itemName = item.name;
        
        if (!itemStats[itemName]) {
          itemStats[itemName] = {
            name: itemName,
            quantity: 0,
            revenue: 0,
            orders: 0,
            category: item.category || 'Unknown'
          };
        }
        
        itemStats[itemName].quantity += parseInt(item.quantity);
        itemStats[itemName].revenue += parseFloat(item.price) * parseInt(item.quantity);
        itemStats[itemName].orders += 1;
      });
    });

    let items = Object.values(itemStats);

    // Filter by category if specified
    if (category) {
      items = items.filter(item => item.category === category);
    }

    // Sort items
    const sortField = sortBy === 'revenue' ? 'revenue' : 'quantity';
    items.sort((a, b) => b[sortField] - a[sortField]);

    // Limit results
    items = items.slice(0, limit);

    // Calculate additional metrics
    items.forEach(item => {
      item.average_price = item.revenue / item.quantity;
      item.orders_percentage = (item.orders / orders.length * 100).toFixed(2);
    });

    return {
      period: { start: startDate, end: endDate },
      filters: { category },
      sort_by: sortBy,
      summary: {
        total_items: Object.keys(itemStats).length,
        total_quantity_sold: items.reduce((sum, item) => sum + item.quantity, 0),
        total_revenue: items.reduce((sum, item) => sum + item.revenue, 0)
      },
      items
    };
  },

  // Get platform performance report
  async getPlatformPerformanceReport({ startDate, endDate, includeHourly = false }) {
    const orders = await Order.findAll({
      where: {
        created_at: {
          [Op.between]: [new Date(startDate), new Date(endDate)]
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

    const platformStats = {};
    
    orders.forEach(order => {
      const platform = order.platform?.app_name || 'Unknown';
      
      if (!platformStats[platform]) {
        platformStats[platform] = {
          platform,
          total_orders: 0,
          completed_orders: 0,
          cancelled_orders: 0,
          total_revenue: 0,
          average_order_value: 0,
          completion_rate: 0
        };
      }
      
      const stats = platformStats[platform];
      stats.total_orders++;
      
      if (order.status === ORDER_STATUS.COMPLETED) {
        stats.completed_orders++;
        stats.total_revenue += parseFloat(order.total_amount);
      } else if (order.status === ORDER_STATUS.CANCELLED) {
        stats.cancelled_orders++;
      }
    });

    // Calculate derived metrics
    Object.values(platformStats).forEach(stats => {
      stats.average_order_value = stats.completed_orders > 0 ? 
        stats.total_revenue / stats.completed_orders : 0;
      stats.completion_rate = stats.total_orders > 0 ? 
        (stats.completed_orders / stats.total_orders * 100) : 0;
    });

    const report = {
      period: { start: startDate, end: endDate },
      platforms: Object.values(platformStats).sort((a, b) => b.total_revenue - a.total_revenue)
    };

    if (includeHourly) {
      report.hourly_breakdown = reportService.getHourlyBreakdownByPlatform(orders);
    }

    return report;
  },

  // Get customer insights report
  async getCustomerInsightsReport({ startDate, endDate, limit = 100 }) {
    const orders = await Order.findAll({
      where: {
        created_at: {
          [Op.between]: [new Date(startDate), new Date(endDate)]
        },
        status: ORDER_STATUS.COMPLETED
      },
      order: [['created_at', 'DESC']]
    });

    const customerStats = {};
    
    orders.forEach(order => {
      const phone = order.customer_phone;
      
      if (!customerStats[phone]) {
        customerStats[phone] = {
          phone,
          name: order.customer_name,
          total_orders: 0,
          total_spent: 0,
          average_order_value: 0,
          first_order: order.created_at,
          last_order: order.created_at,
          favorite_items: {}
        };
      }
      
      const customer = customerStats[phone];
      customer.total_orders++;
      customer.total_spent += parseFloat(order.total_amount);
      
      if (new Date(order.created_at) > new Date(customer.last_order)) {
        customer.last_order = order.created_at;
        customer.name = order.customer_name; // Update to latest name
      }
      
      if (new Date(order.created_at) < new Date(customer.first_order)) {
        customer.first_order = order.created_at;
      }
      
      // Track favorite items
      order.order_items.forEach(item => {
        const itemName = item.name;
        customer.favorite_items[itemName] = (customer.favorite_items[itemName] || 0) + parseInt(item.quantity);
      });
    });

    // Calculate derived metrics and get top favorite item
    const customers = Object.values(customerStats).map(customer => {
      customer.average_order_value = customer.total_spent / customer.total_orders;
      
      // Get favorite item
      const favoriteItem = Object.entries(customer.favorite_items)
        .sort(([,a], [,b]) => b - a)[0];
      customer.favorite_item = favoriteItem ? favoriteItem[0] : null;
      customer.favorite_item_count = favoriteItem ? favoriteItem[1] : 0;
      
      delete customer.favorite_items; // Remove detailed breakdown
      
      return customer;
    });

    // Sort by total spent and limit
    customers.sort((a, b) => b.total_spent - a.total_spent);
    const topCustomers = customers.slice(0, limit);

    return {
      period: { start: startDate, end: endDate },
      summary: {
        total_customers: customers.length,
        repeat_customers: customers.filter(c => c.total_orders > 1).length,
        average_orders_per_customer: customers.length > 0 ? 
          customers.reduce((sum, c) => sum + c.total_orders, 0) / customers.length : 0,
        average_spent_per_customer: customers.length > 0 ? 
          customers.reduce((sum, c) => sum + c.total_spent, 0) / customers.length : 0
      },
      customers: topCustomers
    };
  },

  // Get peak hours analysis
  async getPeakHoursReport({ startDate, endDate, dayOfWeek = null }) {
    const where = {
      created_at: {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      }
    };

    if (dayOfWeek !== null) {
      // Filter by day of week (0 = Sunday, 6 = Saturday)
      where[Op.and] = Order.sequelize.where(
        Order.sequelize.fn('EXTRACT', Order.sequelize.literal('DOW FROM created_at')),
        dayOfWeek
      );
    }

    const orders = await Order.findAll({ where });

    const hourlyStats = {};
    const dailyStats = {};

    orders.forEach(order => {
      const date = new Date(order.created_at);
      const hour = date.getHours();
      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
      
      // Hourly stats
      if (!hourlyStats[hour]) {
        hourlyStats[hour] = {
          hour,
          total_orders: 0,
          completed_orders: 0,
          total_revenue: 0
        };
      }
      
      hourlyStats[hour].total_orders++;
      if (order.status === ORDER_STATUS.COMPLETED) {
        hourlyStats[hour].completed_orders++;
        hourlyStats[hour].total_revenue += parseFloat(order.total_amount);
      }
      
      // Daily stats
      if (!dailyStats[dayName]) {
        dailyStats[dayName] = {
          day: dayName,
          total_orders: 0,
          completed_orders: 0,
          total_revenue: 0
        };
      }
      
      dailyStats[dayName].total_orders++;
      if (order.status === ORDER_STATUS.COMPLETED) {
        dailyStats[dayName].completed_orders++;
        dailyStats[dayName].total_revenue += parseFloat(order.total_amount);
      }
    });

    const hourlyData = Object.values(hourlyStats).sort((a, b) => a.hour - b.hour);
    const dailyData = Object.values(dailyStats);

    // Find peak hours and days
    const peakHour = hourlyData.reduce((max, current) => 
      current.total_orders > max.total_orders ? current : max, hourlyData[0] || { hour: 0, total_orders: 0 });
    
    const peakDay = dailyData.reduce((max, current) => 
      current.total_orders > max.total_orders ? current : max, dailyData[0] || { day: 'Unknown', total_orders: 0 });

    return {
      period: { start: startDate, end: endDate },
      filters: { day_of_week: dayOfWeek },
      peak_hour: peakHour,
      peak_day: peakDay,
      hourly_data: hourlyData,
      daily_data: dailyData
    };
  },

  // Get revenue trends report
  async getRevenueTrendsReport({ startDate, endDate, granularity = 'daily', compareWith = null }) {
    const currentPeriodOrders = await Order.findAll({
      where: {
        created_at: {
          [Op.between]: [new Date(startDate), new Date(endDate)]
        },
        status: ORDER_STATUS.COMPLETED
      },
      order: [['created_at', 'ASC']]
    });

    const currentData = this.groupOrdersByPeriod(currentPeriodOrders, granularity);
    const currentRevenue = currentPeriodOrders.reduce((sum, o) => sum + parseFloat(o.total_amount), 0);

    const report = {
      period: { start: startDate, end: endDate },
      granularity,
      current_period: {
        total_revenue: currentRevenue,
        total_orders: currentPeriodOrders.length,
        average_order_value: currentPeriodOrders.length > 0 ? currentRevenue / currentPeriodOrders.length : 0,
        data: currentData
      }
    };

    // Add comparison period if requested
    if (compareWith) {
      const comparisonOrders = await Order.findAll({
        where: {
          created_at: {
            [Op.between]: [new Date(compareWith.start), new Date(compareWith.end)]
          },
          status: ORDER_STATUS.COMPLETED
        },
        order: [['created_at', 'ASC']]
      });

      const comparisonRevenue = comparisonOrders.reduce((sum, o) => sum + parseFloat(o.total_amount), 0);
      const revenueChange = currentRevenue - comparisonRevenue;
      const revenueChangePercent = comparisonRevenue > 0 ? (revenueChange / comparisonRevenue * 100) : 0;

      report.comparison_period = {
        period: compareWith,
        total_revenue: comparisonRevenue,
        total_orders: comparisonOrders.length,
        average_order_value: comparisonOrders.length > 0 ? comparisonRevenue / comparisonOrders.length : 0
      };

      report.comparison = {
        revenue_change: revenueChange,
        revenue_change_percent: revenueChangePercent,
        orders_change: currentPeriodOrders.length - comparisonOrders.length,
        orders_change_percent: comparisonOrders.length > 0 ? 
          ((currentPeriodOrders.length - comparisonOrders.length) / comparisonOrders.length * 100) : 0
      };
    }

    return report;
  },

  // Get operational efficiency report
  async getOperationalEfficiencyReport({ startDate, endDate, includeStaffMetrics = false }) {
    const orders = await Order.findAll({
      where: {
        created_at: {
          [Op.between]: [new Date(startDate), new Date(endDate)]
        }
      },
      include: [
        {
          model: OrderAuditLog,
          as: 'audit_logs',
          include: [
            {
              model: User,
              as: 'changed_by_user',
              attributes: ['username', 'role']
            }
          ]
        }
      ]
    });

    // Calculate processing times
    const processingTimes = [];
    const statusTransitionTimes = {
      received_to_preparing: [],
      preparing_to_ready: [],
      ready_to_completed: []
    };

    orders.forEach(order => {
      if (order.audit_logs && order.audit_logs.length > 0) {
        const logs = order.audit_logs.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        
        for (let i = 1; i < logs.length; i++) {
          const prevLog = logs[i - 1];
          const currentLog = logs[i];
          const timeDiff = (new Date(currentLog.timestamp) - new Date(prevLog.timestamp)) / (1000 * 60); // minutes
          
          const transition = `${prevLog.new_status}_to_${currentLog.new_status}`;
          if (statusTransitionTimes[transition]) {
            statusTransitionTimes[transition].push(timeDiff);
          }
        }
        
        // Total processing time (from received to completed)
        if (order.status === ORDER_STATUS.COMPLETED && order.completed_at) {
          const totalTime = (new Date(order.completed_at) - new Date(order.created_at)) / (1000 * 60);
          processingTimes.push(totalTime);
        }
      }
    });

    const report = {
      period: { start: startDate, end: endDate },
      summary: {
        total_orders: orders.length,
        completed_orders: orders.filter(o => o.status === ORDER_STATUS.COMPLETED).length,
        cancelled_orders: orders.filter(o => o.status === ORDER_STATUS.CANCELLED).length,
        completion_rate: orders.length > 0 ? 
          (orders.filter(o => o.status === ORDER_STATUS.COMPLETED).length / orders.length * 100) : 0
      },
      processing_times: {
        average_total_time: reportService.calculateAverage(processingTimes),
        median_total_time: reportService.calculateMedian(processingTimes),
        average_received_to_preparing: reportService.calculateAverage(statusTransitionTimes.received_to_preparing),
        average_preparing_to_ready: reportService.calculateAverage(statusTransitionTimes.preparing_to_ready),
        average_ready_to_completed: reportService.calculateAverage(statusTransitionTimes.ready_to_completed)
      }
    };

    if (includeStaffMetrics) {
      const staffMetrics = {};
      
      orders.forEach(order => {
        if (order.audit_logs) {
          order.audit_logs.forEach(log => {
            if (log.changed_by_user) {
              const username = log.changed_by_user.username;
              if (!staffMetrics[username]) {
                staffMetrics[username] = {
                  username,
                  role: log.changed_by_user.role,
                  orders_processed: 0,
                  status_changes: 0
                };
              }
              staffMetrics[username].status_changes++;
            }
          });
        }
      });

      report.staff_metrics = Object.values(staffMetrics);
    }

    return report;
  },

  // Export report data
  async exportReport({ reportType, format, filters, email, userId }) {
    // This would typically generate files and optionally email them
    // For now, return a placeholder response
    return {
      report_type: reportType,
      format,
      filters,
      generated_at: new Date(),
      download_url: `/api/reports/download/${reportType}-${Date.now()}.${format}`,
      email_sent: !!email
    };
  },

  // Helper methods
  getDateRange(period) {
    const now = new Date();
    const start = new Date();
    const end = new Date();

    switch (period) {
      case 'today':
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'yesterday':
        start.setDate(now.getDate() - 1);
        start.setHours(0, 0, 0, 0);
        end.setDate(now.getDate() - 1);
        end.setHours(23, 59, 59, 999);
        break;
      case 'week':
        start.setDate(now.getDate() - 7);
        break;
      case 'month':
        start.setMonth(now.getMonth() - 1);
        break;
      default:
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
    }

    return { start, end };
  },

  groupOrdersByHour(orders) {
    const hourlyStats = {};
    
    orders.forEach(order => {
      const hour = new Date(order.created_at).getHours();
      if (!hourlyStats[hour]) {
        hourlyStats[hour] = { hour, count: 0, revenue: 0 };
      }
      hourlyStats[hour].count++;
      if (order.status === ORDER_STATUS.COMPLETED) {
        hourlyStats[hour].revenue += parseFloat(order.total_amount);
      }
    });

    return Array.from({ length: 24 }, (_, hour) => 
      hourlyStats[hour] || { hour, count: 0, revenue: 0 }
    );
  },

  groupOrdersByPlatform(orders) {
    const platformStats = {};
    
    orders.forEach(order => {
      const platform = order.platform?.app_name || 'Unknown';
      if (!platformStats[platform]) {
        platformStats[platform] = { platform, count: 0, revenue: 0 };
      }
      platformStats[platform].count++;
      if (order.status === ORDER_STATUS.COMPLETED) {
        platformStats[platform].revenue += parseFloat(order.total_amount);
      }
    });

    return Object.values(platformStats);
  },

  groupOrdersByStatus(orders) {
    const statusStats = {};
    
    orders.forEach(order => {
      const status = order.status;
      statusStats[status] = (statusStats[status] || 0) + 1;
    });

    return Object.entries(statusStats).map(([status, count]) => ({ status, count }));
  },

  groupOrdersByPeriod(orders, granularity) {
    const grouped = {};
    
    orders.forEach(order => {
      let key;
      const date = new Date(order.created_at);
      
      switch (granularity) {
        case 'hour':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:00`;
          break;
        case 'day':
          key = date.toISOString().split('T')[0];
          break;
        case 'week':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split('T')[0];
          break;
        case 'month':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        default:
          key = date.toISOString().split('T')[0];
      }
      
      if (!grouped[key]) {
        grouped[key] = {
          period: key,
          total_orders: 0,
          completed_orders: 0,
          total_revenue: 0,
          average_order_value: 0
        };
      }
      
      grouped[key].total_orders++;
      if (order.status === ORDER_STATUS.COMPLETED) {
        grouped[key].completed_orders++;
        grouped[key].total_revenue += parseFloat(order.total_amount);
      }
    });

    // Calculate average order value
    Object.values(grouped).forEach(period => {
      period.average_order_value = period.completed_orders > 0 ? 
        period.total_revenue / period.completed_orders : 0;
    });

    return Object.values(grouped).sort((a, b) => a.period.localeCompare(b.period));
  },

  getHighestRevenueDay(groupedData) {
    return groupedData.reduce((max, current) => 
      current.total_revenue > max.total_revenue ? current : max, 
      groupedData[0] || { period: 'N/A', total_revenue: 0 }
    );
  },

  getLowestRevenueDay(groupedData) {
    return groupedData.reduce((min, current) => 
      current.total_revenue < min.total_revenue ? current : min, 
      groupedData[0] || { period: 'N/A', total_revenue: 0 }
    );
  },

  calculateAverage(numbers) {
    return numbers.length > 0 ? numbers.reduce((sum, n) => sum + n, 0) / numbers.length : 0;
  },

  calculateMedian(numbers) {
    if (numbers.length === 0) return 0;
    const sorted = [...numbers].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  },

  getHourlyBreakdownByPlatform(orders) {
    const breakdown = {};
    
    orders.forEach(order => {
      const hour = new Date(order.created_at).getHours();
      const platform = order.platform?.app_name || 'Unknown';
      
      if (!breakdown[hour]) {
        breakdown[hour] = { hour };
      }
      
      if (!breakdown[hour][platform]) {
        breakdown[hour][platform] = 0;
      }
      
      breakdown[hour][platform]++;
    });

    return Object.values(breakdown).sort((a, b) => a.hour - b.hour);
  }
};

module.exports = reportService;