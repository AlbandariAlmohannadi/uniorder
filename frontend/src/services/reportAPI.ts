import { api } from './api';

export interface DailyStats {
  total_orders: number;
  completed_orders: number;
  cancelled_orders: number;
  pending_orders: number;
  total_revenue: number;
  average_order_value: number;
  orders_by_hour: Array<{ hour: number; count: number }>;
  orders_by_status: Array<{ status: string; count: number }>;
  orders_by_platform: Array<{ platform: string; count: number }>;
}

export interface WeeklyStats {
  period: { start: string; end: string };
  daily_stats: Array<{
    date: string;
    total: number;
    completed: number;
    cancelled: number;
    revenue: number;
  }>;
  total_orders: number;
  total_revenue: number;
}

export interface MonthlyStats {
  year: number;
  month: number;
  daily_stats: Array<{
    day: number;
    total: number;
    completed: number;
    revenue: number;
  }>;
  total_orders: number;
  total_revenue: number;
}

export interface RevenueReport {
  period: string;
  total_revenue: number;
  orders_count: number;
  average_order_value: number;
  revenue_by_platform: Array<{
    platform: string;
    revenue: number;
    orders: number;
    percentage: number;
  }>;
  revenue_trend: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
}

export interface PerformanceReport {
  period: string;
  average_preparation_time: number;
  completion_rate: number;
  cancellation_rate: number;
  peak_hours: Array<{ hour: number; orders: number }>;
  platform_performance: Array<{
    platform: string;
    orders: number;
    completion_rate: number;
    average_value: number;
  }>;
}

export const reportAPI = {
  // Get daily statistics
  async getDailyStats(date?: string): Promise<{ success: boolean; data: DailyStats }> {
    const params = date ? `?date=${date}` : '';
    const response = await api.get(`/orders/stats/daily${params}`);
    return response.data;
  },

  // Get weekly statistics
  async getWeeklyStats(startDate?: string): Promise<{ success: boolean; data: WeeklyStats }> {
    const params = startDate ? `?startDate=${startDate}` : '';
    const response = await api.get(`/orders/stats/weekly${params}`);
    return response.data;
  },

  // Get monthly statistics
  async getMonthlyStats(year?: number, month?: number): Promise<{ success: boolean; data: MonthlyStats }> {
    const params = new URLSearchParams();
    if (year) params.append('year', year.toString());
    if (month) params.append('month', month.toString());
    
    const queryString = params.toString();
    const response = await api.get(`/orders/stats/monthly${queryString ? `?${queryString}` : ''}`);
    return response.data;
  },

  // Get revenue report
  async getRevenueReport(startDate: string, endDate: string): Promise<{ success: boolean; data: RevenueReport }> {
    const response = await api.get(`/reports/revenue?startDate=${startDate}&endDate=${endDate}`);
    return response.data;
  },

  // Get performance report
  async getPerformanceReport(startDate: string, endDate: string): Promise<{ success: boolean; data: PerformanceReport }> {
    const response = await api.get(`/reports/performance?startDate=${startDate}&endDate=${endDate}`);
    return response.data;
  },

  // Get platform comparison report
  async getPlatformComparison(startDate: string, endDate: string) {
    const response = await api.get(`/reports/platforms?startDate=${startDate}&endDate=${endDate}`);
    return response.data;
  },

  // Get customer insights
  async getCustomerInsights(startDate: string, endDate: string) {
    const response = await api.get(`/reports/customers?startDate=${startDate}&endDate=${endDate}`);
    return response.data;
  },

  // Get menu performance report
  async getMenuPerformance(startDate: string, endDate: string) {
    const response = await api.get(`/reports/menu?startDate=${startDate}&endDate=${endDate}`);
    return response.data;
  },

  // Get order trends
  async getOrderTrends(period: 'daily' | 'weekly' | 'monthly', days: number = 30) {
    const response = await api.get(`/reports/trends?period=${period}&days=${days}`);
    return response.data;
  },

  // Export report to PDF
  async exportReportPDF(reportType: string, startDate: string, endDate: string) {
    const response = await api.get(`/reports/export/pdf`, {
      params: { reportType, startDate, endDate },
      responseType: 'blob',
    });
    
    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${reportType}-report-${startDate}-to-${endDate}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    
    return { success: true, message: 'Report exported successfully' };
  },

  // Export report to Excel
  async exportReportExcel(reportType: string, startDate: string, endDate: string) {
    const response = await api.get(`/reports/export/excel`, {
      params: { reportType, startDate, endDate },
      responseType: 'blob',
    });
    
    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${reportType}-report-${startDate}-to-${endDate}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    
    return { success: true, message: 'Report exported successfully' };
  },

  // Get real-time dashboard data
  async getDashboardData() {
    const response = await api.get('/orders/dashboard');
    return response.data;
  },

  // Get custom report
  async getCustomReport(config: {
    metrics: string[];
    groupBy: string;
    startDate: string;
    endDate: string;
    filters?: Record<string, any>;
  }) {
    const response = await api.post('/reports/custom', config);
    return response.data;
  }
};