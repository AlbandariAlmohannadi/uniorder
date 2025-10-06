import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { authAPI } from '../services/authAPI'
import toast from 'react-hot-toast'

interface User {
  id: number
  username: string
  email: string
  role: 'admin' | 'manager' | 'employee'
  last_login?: string
}

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
}

type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'LOGIN_FAILURE' }
  | { type: 'LOGOUT' }
  | { type: 'SET_LOADING'; payload: boolean }

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('token'),
  isLoading: true,
  isAuthenticated: false,
}

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, isLoading: true }
    
    case 'LOGIN_SUCCESS':
      localStorage.setItem('token', action.payload.token)
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isLoading: false,
        isAuthenticated: true,
      }
    
    case 'LOGIN_FAILURE':
      localStorage.removeItem('token')
      return {
        ...state,
        user: null,
        token: null,
        isLoading: false,
        isAuthenticated: false,
      }
    
    case 'LOGOUT':
      localStorage.removeItem('token')
      return {
        ...state,
        user: null,
        token: null,
        isLoading: false,
        isAuthenticated: false,
      }
    
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }
    
    default:
      return state
  }
}

interface AuthContextType extends AuthState {
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
  checkAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState)

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      dispatch({ type: 'LOGIN_START' })
      
      const response = await authAPI.login(username, password)
      
      if (response.success) {
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: {
            user: response.data.user,
            token: response.data.token,
          },
        })
        toast.success('Login successful!')
        
        // Redirect admin users to admin panel
        if (response.data.user.role === 'admin') {
          window.location.href = '/admin'
        }
        
        return true
      } else {
        dispatch({ type: 'LOGIN_FAILURE' })
        toast.error(response.message || 'Login failed')
        return false
      }
    } catch (error: any) {
      dispatch({ type: 'LOGIN_FAILURE' })
      toast.error(error.response?.data?.message || 'Login failed')
      return false
    }
  }

  const logout = async () => {
    try {
      if (state.token) {
        await authAPI.logout()
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      dispatch({ type: 'LOGOUT' })
      toast.success('Logged out successfully')
    }
  }

  const checkAuth = async () => {
    if (!state.token) {
      dispatch({ type: 'SET_LOADING', payload: false })
      return
    }

    try {
      const response = await authAPI.getProfile()
      
      if (response.success) {
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: {
            user: response.data.user,
            token: state.token,
          },
        })
      } else {
        dispatch({ type: 'LOGIN_FAILURE' })
      }
    } catch (error) {
      dispatch({ type: 'LOGIN_FAILURE' })
    }
  }

  useEffect(() => {
    checkAuth()
  }, [])

  const value: AuthContextType = {
    ...state,
    login,
    logout,
    checkAuth,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}