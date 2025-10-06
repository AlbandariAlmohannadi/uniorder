import React, { useEffect } from 'react'
import { useOrders } from '../../contexts/OrderContext'
import { useAuth } from '../../contexts/AuthContext'
import OrderList from '../../components/orders/OrderList'
import OrderFilters from '../../components/orders/OrderFilters'
import RestaurantControls from '../../components/RestaurantControls'
import AdvancedAnalytics from '../../components/AdvancedAnalytics'
import FloatingActionButton from '../../components/FloatingActionButton'
import { Clock, Package, CheckCircle, XCircle, Zap } from 'lucide-react'

const Dashboard: React.FC = () => {
  const { orders, isLoading, fetchOrders } = useOrders()
  const { user } = useAuth()

  useEffect(() => {
    document.title = 'Dashboard - UniOrder'
    fetchOrders()
  }, [])

  const stats = (orders || []).reduce((acc, order) => {
    acc.total++
    acc[order.status] = (acc[order.status] || 0) + 1
    return acc
  }, {
    total: 0,
    received: 0,
    preparing: 0,
    ready: 0,
    completed: 0,
    cancelled: 0
  })

  return (
    <div className="space-y-6 container">
      {/* Header */}
      <div className="glass-card p-6 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Welcome back, {user?.username}! ✨
            </h1>
            <p className="text-white opacity-80">
              Manage your restaurant orders in real-time
            </p>
          </div>
          <RestaurantControls />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="stats-card scale-in">
          <div className="stats-icon">
            <Clock className="h-6 w-6 text-white" />
          </div>
          <p className="text-sm font-medium text-white opacity-80">New Orders</p>
          <p className="stats-number">{stats.received}</p>
          <div className="text-xs text-white opacity-60">Awaiting confirmation</div>
        </div>

        <div className="stats-card scale-in" style={{animationDelay: '0.1s'}}>
          <div className="stats-icon">
            <Package className="h-6 w-6 text-white" />
          </div>
          <p className="text-sm font-medium text-white opacity-80">Preparing</p>
          <p className="stats-number">{stats.preparing}</p>
          <div className="text-xs text-white opacity-60">In kitchen</div>
        </div>

        <div className="stats-card scale-in" style={{animationDelay: '0.2s'}}>
          <div className="stats-icon">
            <CheckCircle className="h-6 w-6 text-white" />
          </div>
          <p className="text-sm font-medium text-white opacity-80">Completed</p>
          <p className="stats-number">{stats.completed}</p>
          <div className="text-xs text-white opacity-60">Successfully delivered</div>
        </div>

        <div className="stats-card scale-in" style={{animationDelay: '0.3s'}}>
          <div className="stats-icon">
            <XCircle className="h-6 w-6 text-white" />
          </div>
          <p className="text-sm font-medium text-white opacity-80">Cancelled</p>
          <p className="stats-number">{stats.cancelled}</p>
          <div className="text-xs text-white opacity-60">Refunded orders</div>
        </div>
      </div>

      {/* Filters */}
      <OrderFilters />

      {/* Orders List */}
      <div className="glass-card p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold text-white">Recent Orders</h2>
            <p className="text-sm text-white opacity-70">
              {stats.total} orders found
            </p>
          </div>
          <div className="glass-card px-4 py-2">
            <span className="text-sm font-medium text-white">Live Updates</span>
          </div>
        </div>
        <div>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="loading-spinner"></div>
            </div>
          ) : orders && orders.length > 0 ? (
            <OrderList orders={orders} />
          ) : (
            <div className="text-center py-12">
              <div className="text-white text-lg mb-4">No orders found</div>
              <div className="text-white opacity-70 text-sm mb-6">
                Orders will appear here when they are received from delivery platforms
              </div>
              <div className="glass-card p-4 max-w-md mx-auto">
                <p className="text-white text-sm mb-3">
                  Want to test the system? Try our Test Dashboard with mock order data!
                </p>
                <a 
                  href="/test-dashboard" 
                  className="btn btn-primary inline-flex items-center space-x-2"
                >
                  <span>🧪</span>
                  <span>Go to Test Dashboard</span>
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Advanced Analytics */}
      {(user?.role === 'admin' || user?.role === 'manager') && (
        <AdvancedAnalytics />
      )}
      
      {/* Floating Action Button */}
      <FloatingActionButton 
        icon={<Zap className="h-6 w-6" />}
        onClick={() => console.log('Quick action clicked')}
      />
    </div>
  )
}

export default Dashboard