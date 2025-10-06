import React from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { 
  Home, 
  ShoppingBag, 
  BarChart3, 
  Users, 
  Settings, 
  Zap,
  FileText,
  TestTube
} from 'lucide-react'

const Sidebar: React.FC = () => {
  const { user } = useAuth()

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home, roles: ['admin', 'manager', 'employee'] },
    { name: 'Test Dashboard', href: '/test-dashboard', icon: TestTube, roles: ['admin', 'manager', 'employee'] },
    { name: 'Menu', href: '/menu', icon: ShoppingBag, roles: ['admin', 'manager'] },
    { name: 'Reports', href: '/reports', icon: FileText, roles: ['admin', 'manager'] },
    { name: 'Admin Panel', href: '/admin', icon: Settings, roles: ['admin'] }
  ]

  const filteredNavigation = navigation.filter(item => 
    item.roles.includes(user?.role || 'employee')
  )

  return (
    <div className="sidebar">
        <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
          <nav className="mt-5 flex-1 px-2 space-y-2">
            {filteredNavigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  `sidebar-nav-item group flex items-center px-4 py-3 text-sm font-medium transition-all text-white ${
                    isActive ? 'active' : 'hover:text-gray-200'
                  }`
                }
              >
                <item.icon
                  className="mr-3 flex-shrink-0 h-5 w-5"
                  aria-hidden="true"
                />
                {item.name}
              </NavLink>
            ))}
          </nav>
        </div>
        
        {/* Footer */}
        <div className="glass-card m-4 p-4 text-center">
          <div className="text-xs font-medium" style={{background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>
            UniOrder v1.0.0
          </div>
        </div>
    </div>
  )
}

export default Sidebar