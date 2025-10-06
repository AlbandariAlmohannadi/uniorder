import React from 'react'
import Header from './Header'
import Sidebar from './Sidebar'

interface DashboardLayoutProps {
  children: React.ReactNode
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen">
      <Header />
      <Sidebar />
      <main className="main-content">
        {children}
      </main>
    </div>
  )
}

export default DashboardLayout