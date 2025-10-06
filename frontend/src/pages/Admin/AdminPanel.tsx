import React, { useState, useEffect } from 'react'
import { Users, Settings, Zap, Shield, Database, Activity, Plus, Edit, Trash2, LogOut } from 'lucide-react'
import ConnectAppModal from '../../components/admin/ConnectAppModal'
import AddUserModal from '../../components/admin/AddUserModal'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'

const AdminPanel: React.FC = () => {
  const { logout } = useAuth()
  const [activeTab, setActiveTab] = useState('users')
  
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId)
    setShowConnectModal(false)
    setShowAddUserModal(false)
  }
  const [showConnectModal, setShowConnectModal] = useState(false)
  const [selectedPlatform, setSelectedPlatform] = useState('')
  const [showAddUserModal, setShowAddUserModal] = useState(false)
  
  const [users, setUsers] = useState([
    { id: 1, username: 'admin', email: 'admin@uniorder.com', role: 'admin', is_active: true },
    { id: 2, username: 'manager1', email: 'manager@restaurant.com', role: 'manager', is_active: true },
    { id: 3, username: 'employee1', email: 'employee@restaurant.com', role: 'employee', is_active: true }
  ])

  const [integrations, setIntegrations] = useState([
    { name: 'Jahez', status: 'disconnected', orders: 0, lastSync: 'Never' },
    { name: 'HungerStation', status: 'disconnected', orders: 0, lastSync: 'Never' },
    { name: 'Keeta', status: 'disconnected', orders: 0, lastSync: 'Never' }
  ])

  useEffect(() => {
    document.title = 'Admin Panel - UniOrder'
  }, [])

  const tabs = [
    { id: 'users', label: 'Users', icon: Users },
    { id: 'integrations', label: 'Integrations', icon: Zap },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'system', label: 'System', icon: Database }
  ]

  const handleConnectApp = (platform: string) => {
    setSelectedPlatform(platform)
    setShowConnectModal(true)
  }

  const handleConnect = async (platform: string, credentials: any) => {
    try {
      const response = await fetch(`http://localhost:3003/api/integrations/${platform.toLowerCase()}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(credentials)
      })
      
      if (response.ok) {
        setIntegrations(prev => prev.map(int => 
          int.name === platform 
            ? { ...int, status: 'connected', lastSync: 'Just now' }
            : int
        ))
        toast.success(`${platform} connected successfully`)
      } else {
        throw new Error('Connection failed')
      }
    } catch (error) {
      toast.error(`Failed to connect ${platform}`)
      throw error
    }
  }

  const handleAddUser = () => {
    setShowAddUserModal(true)
  }

  const handleCreateUser = (userData: { username: string; email: string; role: string; password: string }) => {
    const newUser = {
      id: Math.max(...users.map(u => u.id)) + 1,
      username: userData.username,
      email: userData.email,
      role: userData.role,
      is_active: true
    }
    setUsers(prev => [...prev, newUser])
    toast.success('User created successfully')
  }

  const handleDeleteUser = (userId: number) => {
    if (confirm('Are you sure you want to delete this user?')) {
      setUsers(prev => prev.filter(user => user.id !== userId))
      toast.success('User deleted successfully')
    }
  }

  const handleToggleUserStatus = (userId: number) => {
    setUsers(prev => prev.map(user => 
      user.id === userId 
        ? { ...user, is_active: !user.is_active }
        : user
    ))
    toast.success('User status updated')
  }

  const systemStats = [
    { label: 'Server Uptime', value: '99.9%', status: 'good' },
    { label: 'Database Size', value: '2.4 GB', status: 'good' },
    { label: 'Active Sessions', value: '12', status: 'good' },
    { label: 'Memory Usage', value: '68%', status: 'warning' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="glass-card mx-8 mt-6 p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-3">Admin Panel</h1>
            <p className="text-white opacity-80 text-lg">System administration and configuration</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="glass-card px-6 py-3">
              <div className="flex items-center space-x-3">
                <Activity className="h-5 w-5 text-green-400" />
                <span className="text-white font-medium">System Healthy</span>
              </div>
            </div>
            <button 
              onClick={logout}
              className="btn btn-outline flex items-center space-x-2 text-black border-black hover:bg-black hover:text-white"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Bar */}
      <div className="mx-8 mt-6">
        <div className="glass-card p-4 border border-white border-opacity-20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`admin-tab-button flex items-center space-x-3 px-6 py-3 rounded-xl group ${
                    activeTab === tab.id 
                      ? 'active bg-gradient-to-r from-blue-500 to-purple-500 text-white' 
                      : 'text-white opacity-90 hover:opacity-100 hover:bg-white hover:bg-opacity-20'
                  }`}
                >
                  <div className={`p-1.5 rounded-lg transition-all ${
                    activeTab === tab.id 
                      ? 'bg-white bg-opacity-20' 
                      : 'bg-white bg-opacity-10 group-hover:bg-opacity-20'
                  }`}>
                    <tab.icon className="h-4 w-4 text-white" />
                  </div>
                  <span className="font-medium text-sm text-white">{tab.label}</span>
                  {activeTab === tab.id && (
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                  )}
                </button>
              ))}
            </div>
            <div className="text-white opacity-60 text-sm">
              {activeTab === 'users' && 'Manage system users and permissions'}
              {activeTab === 'integrations' && 'Configure delivery platform connections'}
              {activeTab === 'settings' && 'System configuration and preferences'}
              {activeTab === 'security' && 'Security settings and access control'}
              {activeTab === 'system' && 'System monitoring and maintenance'}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-8 mt-8 pb-8">
        {activeTab === 'users' && (
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">User Management</h2>
              <button 
                onClick={handleAddUser}
                className="btn btn-primary"
              >
                <Plus className="h-4 w-4" />
                Add User
              </button>
            </div>
            <div className="space-y-4">
              {users.map((user) => (
                <div key={user.id} className="glass-card p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="stats-icon" style={{width: '40px', height: '40px', marginBottom: 0}}>
                        <Users className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-white">{user.username}</h3>
                        <p className="text-sm text-white opacity-70">{user.email}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="badge status-preparing">{user.role}</span>
                          <span className={`badge ${user.is_active ? 'status-ready' : 'status-cancelled'}`}>
                            {user.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => handleToggleUserStatus(user.id)}
                        className="btn btn-secondary"
                      >
                        {user.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button 
                        onClick={() => handleDeleteUser(user.id)}
                        className="btn btn-danger"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'integrations' && (
          <div className="space-y-6">
            {/* Integration Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
              <div className="stats-card scale-in p-8">
                <div className="stats-icon mb-4">
                  <Settings className="h-7 w-7 text-white" />
                </div>
                <p className="text-lg font-medium text-white opacity-90 mb-2">Total Integrations</p>
                <p className="text-5xl font-bold text-white mb-2">{integrations.length}</p>
                <div className="text-sm text-white opacity-70">Configured platforms</div>
              </div>

              <div className="stats-card scale-in p-8" style={{animationDelay: '0.1s'}}>
                <div className="stats-icon mb-4">
                  <Zap className="h-7 w-7 text-white" />
                </div>
                <p className="text-lg font-medium text-white opacity-90 mb-2">Connected</p>
                <p className="text-5xl font-bold text-white mb-2">{integrations.filter(i => i.status === 'connected').length}</p>
                <div className="text-sm text-white opacity-70">Active connections</div>
              </div>

              <div className="stats-card scale-in p-8" style={{animationDelay: '0.2s'}}>
                <div className="stats-icon mb-4">
                  <Activity className="h-7 w-7 text-white" />
                </div>
                <p className="text-lg font-medium text-white opacity-90 mb-2">Total Orders</p>
                <p className="text-5xl font-bold text-white mb-2">{integrations.reduce((sum, i) => sum + i.orders, 0)}</p>
                <div className="text-sm text-white opacity-70">Orders processed</div>
              </div>

              <div className="stats-card scale-in p-8" style={{animationDelay: '0.3s'}}>
                <div className="stats-icon mb-4">
                  <Shield className="h-7 w-7 text-white" />
                </div>
                <p className="text-lg font-medium text-white opacity-90 mb-2">Health Status</p>
                <p className="text-5xl font-bold text-white mb-2">{Math.round((integrations.filter(i => i.status === 'connected').length / integrations.length) * 100)}%</p>
                <div className="text-sm text-white opacity-70">System health</div>
              </div>
            </div>

            {/* Integration Management */}
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-white">Platform Integrations</h2>
                  <p className="text-sm text-white opacity-70">
                    Manage your delivery platform connections
                  </p>
                </div>
                <button 
                  onClick={() => handleConnectApp('Custom')}
                  className="btn btn-primary"
                >
                  <Plus className="h-4 w-4" />
                  Add Integration
                </button>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8 w-full">
                {integrations.map((integration, index) => (
                  <div key={integration.name} className="glass-card scale-in" style={{animationDelay: `${index * 0.1}s`}}>
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                            integration.name === 'Jahez' ? 'bg-gradient-to-r from-orange-400 to-orange-600' :
                            integration.name === 'HungerStation' ? 'bg-gradient-to-r from-red-400 to-red-600' :
                            'bg-gradient-to-r from-green-400 to-green-600'
                          }`}>
                            <span className="text-white font-bold text-lg">{integration.name[0]}</span>
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-white">{integration.name}</h3>
                            <p className="text-sm text-white opacity-70">Food delivery platform</p>
                          </div>
                        </div>
                        <div className={`w-3 h-3 rounded-full ${
                          integration.status === 'connected' ? 'bg-green-400' : 'bg-red-400'
                        }`}></div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-white opacity-70">Status:</span>
                          <span className={`badge ${
                            integration.status === 'connected' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {integration.status}
                          </span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-sm text-white opacity-70">Orders:</span>
                          <span className="text-sm font-medium text-white">{integration.orders}</span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-sm text-white opacity-70">Last Sync:</span>
                          <span className="text-sm font-medium text-white">{integration.lastSync}</span>
                        </div>

                        <div className="pt-3 border-t border-gray-200">
                          <button 
                            onClick={() => integration.status === 'connected' ? null : handleConnectApp(integration.name)}
                            className={`btn btn-sm w-full ${
                              integration.status === 'connected' ? 'btn-warning' : 'btn-success'
                            }`}
                          >
                            <Zap className="h-4 w-4" />
                            {integration.status === 'connected' ? 'Disconnect' : 'Connect'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'system' && (
          <div className="space-y-6">
            <div className="glass-card p-6">
              <h2 className="text-xl font-bold text-white mb-6">System Status</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {systemStats.map((stat) => (
                  <div key={stat.label} className="glass-card p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-white opacity-70">{stat.label}</p>
                        <p className="text-2xl font-bold text-white">{stat.value}</p>
                      </div>
                      <div className={`w-3 h-3 rounded-full ${
                        stat.status === 'good' ? 'bg-green-400' : 
                        stat.status === 'warning' ? 'bg-yellow-400' : 'bg-red-400'
                      }`}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="glass-card p-6">
              <h3 className="text-lg font-bold text-white mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button 
                  onClick={() => toast.success('Database backup initiated')}
                  className="btn btn-primary"
                >
                  <Database className="h-4 w-4" />
                  Backup Database
                </button>
                <button 
                  onClick={() => toast.success('Cache cleared successfully')}
                  className="btn btn-warning"
                >
                  <Activity className="h-4 w-4" />
                  Clear Cache
                </button>
                <button 
                  onClick={() => toast.success('Security scan completed')}
                  className="btn btn-success"
                >
                  <Shield className="h-4 w-4" />
                  Security Scan
                </button>
              </div>
            </div>
          </div>
        )}

        {(activeTab === 'settings' || activeTab === 'security') && (
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold text-white mb-6">
              {activeTab === 'settings' ? 'System Settings' : 'Security Settings'}
            </h2>
            <div className="text-center py-12">
              <div className="stats-icon mx-auto mb-4">
                {activeTab === 'settings' ? 
                  <Settings className="h-8 w-8 text-white" /> : 
                  <Shield className="h-8 w-8 text-white" />
                }
              </div>
              <p className="text-white opacity-70">
                {activeTab === 'settings' ? 'Settings panel' : 'Security configuration'} coming soon
              </p>
            </div>
          </div>
        )}
      </div>
      
      {showConnectModal && (
        <ConnectAppModal
          isOpen={showConnectModal}
          onClose={() => setShowConnectModal(false)}
          platform={selectedPlatform}
          onConnect={handleConnect}
        />
      )}
      
      {showAddUserModal && (
        <AddUserModal
          isOpen={showAddUserModal}
          onClose={() => setShowAddUserModal(false)}
          onAddUser={handleCreateUser}
        />
      )}
    </div>
  )
}

export default AdminPanel