import api from './api'

interface LoginResponse {
  success: boolean
  message: string
  data: {
    token: string
    user: {
      id: number
      username: string
      email: string
      role: string
      last_login?: string
    }
  }
}

interface ProfileResponse {
  success: boolean
  data: {
    user: {
      id: number
      username: string
      email: string
      role: string
      last_login?: string
    }
  }
}

interface ApiResponse {
  success: boolean
  message: string
}

export const authAPI = {
  async login(username: string, password: string): Promise<LoginResponse> {
    // Check for demo mode
    const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true' || import.meta.env.VITE_API_URL === 'demo'
    
    if (isDemoMode) {
      // Return demo response without API call
      const demoUsers = {
        'admin': { id: 1, username: 'admin', email: 'admin@demo.com', role: 'admin' },
        'manager1': { id: 2, username: 'manager1', email: 'manager@demo.com', role: 'manager' },
        'employee1': { id: 3, username: 'employee1', email: 'employee@demo.com', role: 'employee' }
      }
      
      const demoUser = demoUsers[username as keyof typeof demoUsers]
      
      if (demoUser && password === 'password123') {
        return {
          success: true,
          message: 'Demo login successful',
          data: {
            token: 'demo-token-' + username,
            user: demoUser
          }
        }
      } else {
        return {
          success: false,
          message: 'Invalid demo credentials. Use: admin/manager1/employee1 with password123',
          data: null as any
        }
      }
    }
    
    const response = await api.post('/auth/login', { username, password })
    return response.data
  },

  async logout(): Promise<ApiResponse> {
    const response = await api.post('/auth/logout')
    return response.data
  },

  async getProfile(): Promise<ProfileResponse> {
    // Check for demo mode
    const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true' || import.meta.env.VITE_API_URL === 'demo'
    
    if (isDemoMode) {
      const token = localStorage.getItem('token')
      if (token?.startsWith('demo-token-')) {
        const username = token.replace('demo-token-', '')
        const demoUsers = {
          'admin': { id: 1, username: 'admin', email: 'admin@demo.com', role: 'admin' },
          'manager1': { id: 2, username: 'manager1', email: 'manager@demo.com', role: 'manager' },
          'employee1': { id: 3, username: 'employee1', email: 'employee@demo.com', role: 'employee' }
        }
        
        const demoUser = demoUsers[username as keyof typeof demoUsers]
        if (demoUser) {
          return {
            success: true,
            data: { user: demoUser }
          }
        }
      }
      
      return {
        success: false,
        data: null as any
      }
    }
    
    const response = await api.get('/auth/me')
    return response.data
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<ApiResponse> {
    const response = await api.put('/auth/change-password', {
      currentPassword,
      newPassword,
    })
    return response.data
  },
}