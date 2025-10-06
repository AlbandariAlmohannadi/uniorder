import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'

// Context Providers
import { AuthProvider } from './contexts/AuthContext'
import { SocketProvider } from './contexts/SocketContext'
import { OrderProvider } from './contexts/OrderContext'

// Components
import ProtectedRoute from './components/ProtectedRoute'
import DashboardLayout from './components/layout/DashboardLayout'

// Pages
import Login from './pages/Login/Login'
import Dashboard from './pages/Dashboard/Dashboard'
import TestDashboard from './pages/TestDashboard/TestDashboard'
import ManagerDashboard from './pages/ManagerDashboard/ManagerDashboard'
import AdminPanel from './pages/Admin/AdminPanel'
import MenuManagement from './pages/MenuManagement/MenuManagement'

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <OrderProvider>
          <Router>
            <div className="min-h-screen bg-gray-50">
              <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<Login />} />
                
                {/* Protected Routes */}
                <Route path="/" element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <Dashboard />
                    </DashboardLayout>
                  </ProtectedRoute>
                } />
                
                <Route path="/test-dashboard" element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <TestDashboard />
                    </DashboardLayout>
                  </ProtectedRoute>
                } />
                
                <Route path="/manager" element={
                  <ProtectedRoute requiredRole={['admin', 'manager']}>
                    <DashboardLayout>
                      <ManagerDashboard />
                    </DashboardLayout>
                  </ProtectedRoute>
                } />
                
                <Route path="/admin" element={
                  <ProtectedRoute requiredRole={['admin']}>
                    <AdminPanel />
                  </ProtectedRoute>
                } />
                
                <Route path="/menu" element={
                  <ProtectedRoute requiredRole={['admin', 'manager']}>
                    <DashboardLayout>
                      <MenuManagement />
                    </DashboardLayout>
                  </ProtectedRoute>
                } />
                
                <Route path="/reports" element={
                  <ProtectedRoute requiredRole={['admin', 'manager']}>
                    <DashboardLayout>
                      <ManagerDashboard />
                    </DashboardLayout>
                  </ProtectedRoute>
                } />
                
                {/* Redirect unknown routes */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
              
              {/* Toast notifications */}
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#363636',
                    color: '#fff',
                  },
                  success: {
                    duration: 3000,
                    iconTheme: {
                      primary: '#22c55e',
                      secondary: '#fff',
                    },
                  },
                  error: {
                    duration: 5000,
                    iconTheme: {
                      primary: '#ef4444',
                      secondary: '#fff',
                    },
                  },
                }}
              />
            </div>
          </Router>
        </OrderProvider>
      </SocketProvider>
    </AuthProvider>
  )
}

export default App