import React, { useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import OrderList from '../../components/orders/OrderList'
import OrderFilters from '../../components/orders/OrderFilters'
import RestaurantControls from '../../components/RestaurantControls'
import AdvancedAnalytics from '../../components/AdvancedAnalytics'
import FloatingActionButton from '../../components/FloatingActionButton'
import { Clock, Package, CheckCircle, XCircle, Zap, TestTube } from 'lucide-react'

// Mock order data for testing
const mockOrders = [
  {
    id: 1001,
    platform_order_id: 'JHZ-2024-001',
    customer_name: 'Ahmed Al-Rashid',
    customer_phone: '+966501234567',
    customer_address: 'King Fahd Road, Al-Olaya District, Riyadh 12211',
    order_items: [
      { name: 'Chicken Shawarma', quantity: 2, price: 25.00, notes: 'Extra garlic sauce' },
      { name: 'French Fries', quantity: 1, price: 15.00 },
      { name: 'Coca Cola', quantity: 2, price: 8.00 }
    ],
    total_amount: 81.00,
    status: 'received',
    created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
    platform: { app_name: 'Jahez' }
  },
  {
    id: 1002,
    platform_order_id: 'HS-2024-002',
    customer_name: 'Fatima Al-Zahra',
    customer_phone: '+966507654321',
    customer_address: 'Prince Mohammed Bin Abdulaziz Road, Al-Faisaliyah, Jeddah 23441',
    order_items: [
      { name: 'Margherita Pizza', quantity: 1, price: 45.00 },
      { name: 'Caesar Salad', quantity: 1, price: 28.00, notes: 'No croutons' },
      { name: 'Orange Juice', quantity: 1, price: 12.00 }
    ],
    total_amount: 85.00,
    status: 'preparing',
    created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 minutes ago
    platform: { app_name: 'HungerStation' }
  },
  {
    id: 1003,
    platform_order_id: 'KTA-2024-003',
    customer_name: 'Mohammed Al-Saud',
    customer_phone: '+966512345678',
    customer_address: 'Al-Tahlia Street, Al-Sahafa District, Riyadh 13315',
    order_items: [
      { name: 'Beef Burger', quantity: 1, price: 35.00, notes: 'Medium rare' },
      { name: 'Onion Rings', quantity: 1, price: 18.00 },
      { name: 'Milkshake Vanilla', quantity: 1, price: 20.00 }
    ],
    total_amount: 73.00,
    status: 'ready',
    created_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(), // 25 minutes ago
    platform: { app_name: 'Keeta' }
  },
  {
    id: 1004,
    platform_order_id: 'JHZ-2024-004',
    customer_name: 'Sara Al-Mansouri',
    customer_phone: '+966598765432',
    customer_address: 'Corniche Road, Al-Hamra District, Jeddah 23323',
    order_items: [
      { name: 'Grilled Chicken', quantity: 1, price: 42.00 },
      { name: 'Rice Pilaf', quantity: 1, price: 15.00 },
      { name: 'Mixed Vegetables', quantity: 1, price: 12.00 },
      { name: 'Lemon Mint Juice', quantity: 2, price: 10.00 }
    ],
    total_amount: 89.00,
    status: 'completed',
    created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // 45 minutes ago
    platform: { app_name: 'Jahez' }
  },
  {
    id: 1005,
    platform_order_id: 'HS-2024-005',
    customer_name: 'Omar Al-Khalil',
    customer_phone: '+966523456789',
    customer_address: 'King Abdul Aziz Road, Al-Malaz District, Riyadh 12837',
    order_items: [
      { name: 'Fish and Chips', quantity: 1, price: 38.00 },
      { name: 'Coleslaw', quantity: 1, price: 8.00 }
    ],
    total_amount: 46.00,
    status: 'cancelled',
    created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1 hour ago
    platform: { app_name: 'HungerStation' }
  },
  {
    id: 1006,
    platform_order_id: 'KTA-2024-006',
    customer_name: 'Layla Al-Harbi',
    customer_phone: '+966534567890',
    customer_address: 'Al-Madinah Road, Al-Naseem District, Riyadh 14321',
    order_items: [
      { name: 'Chicken Tikka', quantity: 2, price: 32.00, notes: 'Spicy level: Medium' },
      { name: 'Basmati Rice', quantity: 2, price: 12.00 },
      { name: 'Naan Bread', quantity: 3, price: 6.00 },
      { name: 'Mango Lassi', quantity: 2, price: 15.00 }
    ],
    total_amount: 113.00,
    status: 'received',
    created_at: new Date(Date.now() - 2 * 60 * 1000).toISOString(), // 2 minutes ago
    platform: { app_name: 'Keeta' }
  }
]

const TestDashboard: React.FC = () => {
  const { user } = useAuth()
  const [orders, setOrders] = useState(mockOrders)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    document.title = 'Test Dashboard - UniOrder'
    
    // Simulate real-time updates by adding new orders periodically
    const interval = setInterval(() => {
      const newOrderId = Math.max(...orders.map(o => o.id)) + 1
      const platforms = ['Jahez', 'HungerStation', 'Keeta']
      const randomPlatform = platforms[Math.floor(Math.random() * platforms.length)]
      const customerNames = ['Ali Al-Ahmad', 'Nora Al-Fahad', 'Khalid Al-Otaibi', 'Maryam Al-Qasimi']
      const randomCustomer = customerNames[Math.floor(Math.random() * customerNames.length)]
      
      const newOrder = {
        id: newOrderId,
        platform_order_id: `${randomPlatform.substring(0, 3).toUpperCase()}-2024-${String(newOrderId).padStart(3, '0')}`,
        customer_name: randomCustomer,
        customer_phone: `+96650${Math.floor(Math.random() * 9000000) + 1000000}`,
        customer_address: 'Test Address, Test District, Test City 12345',
        order_items: [
          { name: 'Test Item', quantity: 1, price: 25.00, notes: 'Test order from mock data' }
        ],
        total_amount: 25.00,
        status: 'received',
        created_at: new Date().toISOString(),
        platform: { app_name: randomPlatform }
      }
      
      setOrders(prevOrders => [newOrder, ...prevOrders])
    }, 30000) // Add new order every 30 seconds

    return () => clearInterval(interval)
  }, [orders])

  const stats = orders.reduce((acc, order) => {
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
      {/* Test Mode Banner */}
      <div className="glass-card p-4 mb-6 border-2 border-yellow-400">
        <div className="flex items-center justify-center space-x-3">
          <TestTube className="h-6 w-6 text-yellow-400" />
          <div className="text-center">
            <h2 className="text-lg font-bold text-yellow-400">TEST MODE DASHBOARD</h2>
            <p className="text-sm text-white opacity-80">
              This dashboard contains mock order data for testing purposes. New orders are automatically generated every 30 seconds.
            </p>
          </div>
          <TestTube className="h-6 w-6 text-yellow-400" />
        </div>
      </div>

      {/* Header */}
      <div className="glass-card p-6 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Test Dashboard - Welcome, {user?.username}! 🧪
            </h1>
            <p className="text-white opacity-80">
              Testing environment with mock order data for employee training
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
            <h2 className="text-xl font-bold text-white">Test Orders (Mock Data)</h2>
            <p className="text-sm text-white opacity-70">
              {stats.total} test orders found - Use these to practice order management
            </p>
          </div>
          <div className="glass-card px-4 py-2">
            <span className="text-sm font-medium text-white">Mock Live Updates</span>
          </div>
        </div>
        <div>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="loading-spinner"></div>
            </div>
          ) : (
            <OrderList orders={orders} />
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
        onClick={() => console.log('Test quick action clicked')}
      />
    </div>
  )
}

export default TestDashboard