import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useSocket } from '../../contexts/SocketContext'
import { Bell, User, LogOut, Settings, Wifi, WifiOff, Sparkles } from 'lucide-react'

const Header: React.FC = () => {
  const { user, logout } = useAuth()
  const { isConnected } = useSocket()

  const handleLogout = () => {
    logout()
  }

  return (
    <header className="app-header">
      <div className="flex items-center justify-between px-6 py-4">
          {/* Logo Section */}
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl flex items-center justify-center shadow-lg">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">UniOrder</h1>
              <p className="text-xs text-white">Order Management System</p>
            </div>
          </div>

          {/* Center Section - Current Time */}
          <div className="hidden lg:flex items-center space-x-2 bg-gradient-to-br from-slate-800 to-slate-900 px-4 py-2 rounded-lg">
            <div className="text-sm text-white font-medium">
              {new Date().toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: true 
              })}
            </div>
            <div className="w-1 h-1 bg-white/60 rounded-full"></div>
            <div className="text-xs text-gray-300">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'short',
                month: 'short',
                day: 'numeric'
              })}
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-3">
            {/* Connection Status */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 px-3 py-2 rounded-lg">
              {isConnected ? (
                <div className="flex items-center text-green-400 space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <Wifi className="h-4 w-4" />
                  <span className="text-xs font-medium text-white hidden sm:block">Online</span>
                </div>
              ) : (
                <div className="flex items-center text-red-400 space-x-2">
                  <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                  <WifiOff className="h-4 w-4" />
                  <span className="text-xs font-medium text-white hidden sm:block">Offline</span>
                </div>
              )}
            </div>

            {/* Notifications */}
            <button className="relative p-3 transition-all duration-200 group">
              <Bell className="h-5 w-5 text-white group-hover:scale-110 transition-transform" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
            </button>

            {/* User Menu */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 px-4 py-2 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
                <div className="hidden md:block">
                  <div className="text-sm font-medium text-white">{user?.username}</div>
                  <div className="text-xs text-gray-300 capitalize flex items-center space-x-1">
                    <span>{user?.role}</span>
                    <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                    <span className="text-green-400">Active</span>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <button className="text-white hover:text-gray-300 transition-all">
                    <Settings className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={handleLogout}
                    className="text-white hover:text-red-400 transition-all"
                    title="Logout"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
      </div>
    </header>
  )
}

export default Header