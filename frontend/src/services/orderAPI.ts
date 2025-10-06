import api from './api'

interface Order {
  id: number
  platform_order_id: string
  customer_name: string
  customer_phone: string
  customer_address: string
  order_items: Array<{
    name: string
    quantity: number
    price: number
    notes?: string
  }>
  total_amount: number
  status: string
  notes?: string
  created_at: string
  updated_at: string
  platform: {
    app_name: string
  }
}

interface OrdersResponse {
  success: boolean
  data: {
    orders: Order[]
    total: number
  }
  pagination: {
    page: number
    limit: number
    total: number
  }
}

interface OrderResponse {
  success: boolean
  data: Order
}

interface ApiResponse {
  success: boolean
  message: string
}

interface OrderFilters {
  page?: number
  limit?: number
  status?: string
  fromDate?: string
  toDate?: string
}

interface DailyStats {
  total_orders: number
  completed_orders: number
  cancelled_orders: number
  pending_orders: number
  total_revenue: number
  average_order_value: number
  orders_by_hour: Array<{
    hour: number
    count: number
  }>
  orders_by_status: Array<{
    status: string
    count: number
  }>
}

interface StatsResponse {
  success: boolean
  data: DailyStats
}

export const orderAPI = {
  async getOrders(filters: OrderFilters = {}): Promise<OrdersResponse> {
    const params = new URLSearchParams()
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString())
      }
    })

    const response = await api.get(`/orders?${params.toString()}`)
    return response.data
  },

  async getOrderById(id: number): Promise<OrderResponse> {
    const response = await api.get(`/orders/${id}`)
    return response.data
  },

  async updateOrderStatus(id: number, status: string): Promise<ApiResponse> {
    const response = await api.put(`/orders/${id}/status`, { status })
    return response.data
  },

  async getDailyStats(date?: string): Promise<StatsResponse> {
    const params = date ? `?date=${date}` : ''
    const response = await api.get(`/orders/stats/daily${params}`)
    return response.data
  },

  async getWeeklyStats(): Promise<StatsResponse> {
    const response = await api.get('/orders/stats/weekly')
    return response.data
  },

  async acceptOrder(id: number): Promise<ApiResponse> {
    const response = await api.post(`/orders/${id}/accept`)
    return response.data
  },

  async rejectOrder(id: number, reason: string): Promise<ApiResponse> {
    const response = await api.post(`/orders/${id}/reject`, { reason })
    return response.data
  },

  async markOrderReady(id: number): Promise<ApiResponse> {
    const response = await api.post(`/orders/${id}/ready`)
    return response.data
  },

  async downloadInvoice(id: number): Promise<Blob> {
    const response = await api.get(`/orders/${id}/invoice`, {
      responseType: 'blob'
    })
    return response.data
  }
}