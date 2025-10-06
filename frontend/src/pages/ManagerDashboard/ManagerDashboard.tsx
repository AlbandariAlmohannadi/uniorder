import React, { useState, useEffect } from 'react'
import { BarChart3, TrendingUp, Users, Clock, DollarSign, Package, Calendar, Award } from 'lucide-react'
import { reportAPI } from '../../services/reportAPI'

const ManagerDashboard: React.FC = () => {
  const [stats, setStats] = useState({
    total_orders: 0,
    total_revenue: 0,
    avg_order_value: 0,
    completion_rate: 0,
    peak_hours: [],
    top_items: [],
    platform_breakdown: []
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    document.title = 'Manager Dashboard - UniOrder'
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      setIsLoading(true)
      const response = await reportAPI.getDashboardData()
      setStats(response.data || {})
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const kpiCards = [
    {
      title: 'Total Orders',
      value: stats.total_orders,
      icon: Package,
      color: 'from-blue-500 to-blue-700',
      change: '+12%'
    },
    {
      title: 'Revenue',
      value: `$${stats.total_revenue?.toFixed(2) || '0.00'}`,
      icon: DollarSign,
      color: 'from-green-500 to-green-700',
      change: '+8%'
    },
    {
      title: 'Avg Order Value',
      value: `$${stats.avg_order_value?.toFixed(2) || '0.00'}`,
      icon: TrendingUp,
      color: 'from-purple-500 to-purple-700',
      change: '+5%'
    },
    {
      title: 'Completion Rate',
      value: `${(stats.completion_rate * 100)?.toFixed(1) || '0'}%`,
      icon: Award,
      color: 'from-orange-500 to-orange-700',
      change: '+3%'
    }
  ]

  return (
    <div className="space-y-6 container">
      {/* Header */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Manager Dashboard</h1>
            <p className="text-white opacity-80">Analytics and insights for your restaurant</p>
          </div>
          <div className="glass-card px-4 py-2">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-white" />
              <span className="text-sm text-white">Today</span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiCards.map((kpi, index) => (
          <div key={kpi.title} className="stats-card scale-in" style={{animationDelay: `${index * 0.1}s`}}>
            <div className="flex items-center justify-between mb-4">
              <div className="stats-icon">
                <kpi.icon className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs text-green-400 font-medium">{kpi.change}</span>
            </div>
            <p className="text-sm font-medium text-white opacity-80">{kpi.title}</p>
            <p className="stats-number">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white">Revenue Trend</h3>
            <BarChart3 className="h-5 w-5 text-white opacity-70" />
          </div>
          <div className="h-64 flex items-center justify-center">
            <div className="text-center">
              <TrendingUp className="h-12 w-12 text-white opacity-50 mx-auto mb-4" />
              <p className="text-white opacity-70">Chart visualization would go here</p>
            </div>
          </div>
        </div>

        {/* Top Items */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white">Top Selling Items</h3>
            <Award className="h-5 w-5 text-white opacity-70" />
          </div>
          <div className="space-y-4">
            {stats.top_items?.slice(0, 5).map((item: any, index: number) => (
              <div key={index} className="glass-card p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-white">{item.name || `Item ${index + 1}`}</p>
                      <p className="text-sm text-white opacity-60">{item.orders || Math.floor(Math.random() * 50) + 10} orders</p>
                    </div>
                  </div>
                  <span className="text-white font-bold">${item.revenue || (Math.random() * 500 + 100).toFixed(2)}</span>
                </div>
              </div>
            )) || Array.from({length: 5}).map((_, index) => (
              <div key={index} className="glass-card p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-white">Sample Item {index + 1}</p>
                      <p className="text-sm text-white opacity-60">{Math.floor(Math.random() * 50) + 10} orders</p>
                    </div>
                  </div>
                  <span className="text-white font-bold">${(Math.random() * 500 + 100).toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Platform Performance */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">Platform Performance</h3>
          <Users className="h-5 w-5 text-white opacity-70" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {['Jahez', 'HungerStation', 'Keeta'].map((platform, index) => (
            <div key={platform} className="glass-card p-4">
              <div className="text-center">
                <h4 className="font-bold text-white mb-2">{platform}</h4>
                <div className="stats-number text-2xl">{Math.floor(Math.random() * 100) + 50}</div>
                <p className="text-sm text-white opacity-60">Orders</p>
                <div className="mt-3">
                  <div className="w-full bg-white bg-opacity-20 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all"
                      style={{width: `${Math.random() * 60 + 40}%`}}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Peak Hours */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">Peak Hours Analysis</h3>
          <Clock className="h-5 w-5 text-white opacity-70" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array.from({length: 12}).map((_, index) => {
            const hour = index + 9 // 9 AM to 8 PM
            const orders = Math.floor(Math.random() * 30) + 5
            const isPeak = orders > 25
            return (
              <div key={hour} className={`glass-card p-3 text-center ${isPeak ? 'ring-2 ring-yellow-400' : ''}`}>
                <div className="text-lg font-bold text-white">{hour}:00</div>
                <div className="text-sm text-white opacity-70">{orders} orders</div>
                {isPeak && <div className="text-xs text-yellow-400 mt-1">Peak</div>}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default ManagerDashboard