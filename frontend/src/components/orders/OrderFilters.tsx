import React from 'react'
import { useOrders } from '../../contexts/OrderContext'
import { Filter, X, Search, Calendar, Zap, CheckCircle } from 'lucide-react'

const OrderFilters: React.FC = () => {
  const { filters, setFilters } = useOrders()

  const statusOptions = [
    { value: '', label: 'All Status', icon: Filter, color: 'from-gray-400 to-gray-600' },
    { value: 'received', label: 'Received', icon: CheckCircle, color: 'from-blue-400 to-blue-600' },
    { value: 'preparing', label: 'Preparing', icon: Zap, color: 'from-yellow-400 to-yellow-600' },
    { value: 'ready', label: 'Ready', icon: CheckCircle, color: 'from-green-400 to-green-600' },
    { value: 'completed', label: 'Completed', icon: CheckCircle, color: 'from-emerald-400 to-emerald-600' },
    { value: 'cancelled', label: 'Cancelled', icon: X, color: 'from-red-400 to-red-600' }
  ]

  const platformOptions = [
    { value: '', label: 'All Platforms', color: 'from-gray-400 to-gray-600' },
    { value: 'jahez', label: 'Jahez', color: 'from-orange-400 to-orange-600' },
    { value: 'hungerstation', label: 'HungerStation', color: 'from-red-400 to-red-600' },
    { value: 'keeta', label: 'Keeta', color: 'from-green-400 to-green-600' }
  ]

  const handleFilterChange = (key: string, value: string) => {
    setFilters({ ...filters, [key]: value || undefined })
  }

  const clearFilters = () => {
    setFilters({})
  }

  const hasActiveFilters = Object.values(filters).some(value => value)

  return (
    <div className="glass-card p-6 border border-white border-opacity-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500">
            <Filter className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Smart Filters</h3>
            <p className="text-sm text-white opacity-70">Refine your order search</p>
          </div>
        </div>
        
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-white bg-opacity-10 hover:bg-opacity-20 text-white transition-all duration-200 hover:scale-105"
          >
            <X className="h-4 w-4" />
            <span className="text-sm font-medium">Clear All</span>
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white opacity-50" />
          <input
            type="text"
            placeholder="Search orders..."
            value={filters.search || ''}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="form-input pl-10"
          />
        </div>
        <div className="relative">
          <CheckCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white opacity-50" />
          <select
            value={filters.status || ''}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="form-input pl-10"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="relative">
          <Zap className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white opacity-50" />
          <select
            value={filters.platform || ''}
            onChange={(e) => handleFilterChange('platform', e.target.value)}
            className="form-input pl-10"
          >
            {platformOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white opacity-50" />
          <input
            type="date"
            value={filters.fromDate || ''}
            onChange={(e) => handleFilterChange('fromDate', e.target.value)}
            className="form-input pl-10"
            placeholder="From Date"
          />
        </div>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white opacity-50" />
          <input
            type="date"
            value={filters.toDate || ''}
            onChange={(e) => handleFilterChange('toDate', e.target.value)}
            className="form-input pl-10"
            placeholder="To Date"
          />
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="mt-6 pt-6 border-t border-white border-opacity-20">
          <div className="flex items-center space-x-2 mb-3">
            <Filter className="h-4 w-4 text-white opacity-70" />
            <span className="text-sm font-medium text-white opacity-70">Active Filters:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {filters.status && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-500 bg-opacity-20 text-blue-300 border border-blue-500 border-opacity-30">
                Status: {statusOptions.find(s => s.value === filters.status)?.label}
              </span>
            )}
            {filters.platform && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-500 bg-opacity-20 text-purple-300 border border-purple-500 border-opacity-30">
                Platform: {platformOptions.find(p => p.value === filters.platform)?.label}
              </span>
            )}
            {filters.fromDate && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-500 bg-opacity-20 text-green-300 border border-green-500 border-opacity-30">
                From: {filters.fromDate}
              </span>
            )}
            {filters.toDate && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-500 bg-opacity-20 text-green-300 border border-green-500 border-opacity-30">
                To: {filters.toDate}
              </span>
            )}
            {filters.search && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-500 bg-opacity-20 text-yellow-300 border border-yellow-500 border-opacity-30">
                Search: "{filters.search}"
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default OrderFilters