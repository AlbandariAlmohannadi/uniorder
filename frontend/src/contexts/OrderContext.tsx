import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { useSocket } from './SocketContext'
import { orderAPI } from '../services/orderAPI'

interface Order {
  id: number
  platform_order_id: string
  customer_name: string
  customer_phone: string
  customer_address: string
  order_items: Array<{
    name: string
    quantity: number
    price: number
    notes?: string
  }>
  total_amount: number
  status: 'received' | 'preparing' | 'ready' | 'completed' | 'cancelled'
  notes?: string
  created_at: string
  updated_at: string
  platform: {
    app_name: string
  }
}

interface OrderState {
  orders: Order[]
  isLoading: boolean
  error: string | null
  filters: {
    status?: string
    platform?: string
    fromDate?: string
    toDate?: string
    search?: string
  }
  pagination: {
    page: number
    limit: number
    total: number
  }
}

type OrderAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ORDERS'; payload: Order[] }
  | { type: 'ADD_ORDER'; payload: Order }
  | { type: 'UPDATE_ORDER'; payload: { id: number; updates: Partial<Order> } }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_FILTERS'; payload: Partial<OrderState['filters']> }
  | { type: 'SET_PAGINATION'; payload: Partial<OrderState['pagination']> }

const initialState: OrderState = {
  orders: [],
  isLoading: false,
  error: null,
  filters: {},
  pagination: {
    page: 1,
    limit: 50,
    total: 0
  }
}

const orderReducer = (state: OrderState, action: OrderAction): OrderState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }
    
    case 'SET_ORDERS':
      return { ...state, orders: action.payload, error: null }
    
    case 'ADD_ORDER':
      return { 
        ...state, 
        orders: [action.payload, ...state.orders],
        pagination: {
          ...state.pagination,
          total: state.pagination.total + 1
        }
      }
    
    case 'UPDATE_ORDER':
      return {
        ...state,
        orders: state.orders.map(order =>
          order.id === action.payload.id
            ? { ...order, ...action.payload.updates }
            : order
        )
      }
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false }
    
    case 'SET_FILTERS':
      return { 
        ...state, 
        filters: { ...state.filters, ...action.payload },
        pagination: { ...state.pagination, page: 1 }
      }
    
    case 'SET_PAGINATION':
      return {
        ...state,
        pagination: { ...state.pagination, ...action.payload }
      }
    
    default:
      return state
  }
}

interface OrderContextType extends OrderState {
  fetchOrders: () => Promise<void>
  updateOrderStatus: (orderId: number, status: string) => Promise<void>
  setFilters: (filters: Partial<OrderState['filters']>) => void
  setPage: (page: number) => void
}

const OrderContext = createContext<OrderContextType | undefined>(undefined)

export const useOrders = () => {
  const context = useContext(OrderContext)
  if (context === undefined) {
    throw new Error('useOrders must be used within an OrderProvider')
  }
  return context
}

interface OrderProviderProps {
  children: React.ReactNode
}

export const OrderProvider: React.FC<OrderProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(orderReducer, initialState)
  const { socket } = useSocket()

  const fetchOrders = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      
      const response = await orderAPI.getOrders({
        page: state.pagination.page,
        limit: state.pagination.limit,
        ...state.filters
      })

      if (response.success) {
        dispatch({ type: 'SET_ORDERS', payload: response.data.orders })
        dispatch({ 
          type: 'SET_PAGINATION', 
          payload: { total: response.data.total }
        })
      } else {
        dispatch({ type: 'SET_ERROR', payload: response.message })
      }
    } catch (error: any) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: error.response?.data?.message || 'Failed to fetch orders'
      })
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }

  const updateOrderStatus = async (orderId: number, status: string) => {
    try {
      const response = await orderAPI.updateOrderStatus(orderId, status)
      
      if (response.success) {
        dispatch({
          type: 'UPDATE_ORDER',
          payload: {
            id: orderId,
            updates: { status: status as any, updated_at: new Date().toISOString() }
          }
        })
      } else {
        throw new Error(response.message)
      }
    } catch (error: any) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: error.response?.data?.message || 'Failed to update order status'
      })
      throw error
    }
  }

  const setFilters = (filters: Partial<OrderState['filters']>) => {
    dispatch({ type: 'SET_FILTERS', payload: filters })
  }

  const setPage = (page: number) => {
    dispatch({ type: 'SET_PAGINATION', payload: { page } })
  }

  // Socket event listeners
  useEffect(() => {
    if (socket) {
      socket.on('new_order', (order: Order) => {
        dispatch({ type: 'ADD_ORDER', payload: order })
      })

      socket.on('order_updated', (update: { orderId: number; newStatus: string }) => {
        dispatch({
          type: 'UPDATE_ORDER',
          payload: {
            id: update.orderId,
            updates: { 
              status: update.newStatus as any,
              updated_at: new Date().toISOString()
            }
          }
        })
      })

      return () => {
        socket.off('new_order')
        socket.off('order_updated')
      }
    }
  }, [socket])

  // Fetch orders when filters or pagination change
  useEffect(() => {
    // Only fetch if we have a token in localStorage
    const token = localStorage.getItem('token')
    if (token) {
      fetchOrders()
    }
  }, [state.filters, state.pagination.page])

  const value: OrderContextType = {
    ...state,
    fetchOrders,
    updateOrderStatus,
    setFilters,
    setPage
  }

  return (
    <OrderContext.Provider value={value}>
      {children}
    </OrderContext.Provider>
  )
}