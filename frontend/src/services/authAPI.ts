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
    const response = await api.post('/auth/login', { username, password })
    return response.data
  },

  async logout(): Promise<ApiResponse> {
    const response = await api.post('/auth/logout')
    return response.data
  },

  async getProfile(): Promise<ProfileResponse> {
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