import React, { createContext, useContext, useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuth } from './AuthContext'
import toast from 'react-hot-toast'

interface SocketContextType {
  socket: Socket | null
  isConnected: boolean
}

const SocketContext = createContext<SocketContextType | undefined>(undefined)

export const useSocket = () => {
  const context = useContext(SocketContext)
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider')
  }
  return context
}

interface SocketProviderProps {
  children: React.ReactNode
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const { isAuthenticated, token, user } = useAuth()

  useEffect(() => {
    if (isAuthenticated && token && user) {
      const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001'
      
      const newSocket = io(socketUrl, {
        auth: {
          token: token
        },
        transports: ['websocket', 'polling']
      })

      newSocket.on('connect', () => {
        console.log('Socket connected:', newSocket.id)
        setIsConnected(true)
        toast.success('Connected to real-time updates')
      })

      newSocket.on('disconnect', () => {
        console.log('Socket disconnected')
        setIsConnected(false)
        toast.error('Disconnected from real-time updates')
      })

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error.message || 'Unknown error')
        setIsConnected(false)
        toast.error('Failed to connect to real-time updates')
      })

      newSocket.on('new_order', (order) => {
        toast.success(`New order received: #${order.id}`)
        // Play notification sound
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('New Order', {
            body: `Order #${order.id} from ${order.customer_name}`,
            icon: '/favicon.ico'
          })
        }
      })

      newSocket.on('order_updated', (update) => {
        toast.success(`Order #${update.orderId} status updated to ${update.newStatus}`)
      })

      newSocket.on('item_availability_changed', (update) => {
        toast.info(`${update.itemName} is now ${update.isAvailable ? 'available' : 'unavailable'}`)
      })

      setSocket(newSocket)

      return () => {
        newSocket.close()
        setSocket(null)
        setIsConnected(false)
      }
    } else {
      if (socket) {
        socket.close()
        setSocket(null)
        setIsConnected(false)
      }
    }
  }, [isAuthenticated, token, user])

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  const value: SocketContextType = {
    socket,
    isConnected
  }

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  )
}