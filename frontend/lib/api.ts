import axios from 'axios'

// API base URL from env or default local Django server
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to append authorization header
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken')
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // If 401 error and not already retried
    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry &&
      typeof window !== 'undefined'
    ) {
      originalRequest._retry = true
      const refreshToken = localStorage.getItem('refreshToken')

      if (refreshToken) {
        try {
          // Request refresh from backend
          const response = await axios.post(`${API_URL}/api/auth/refresh`, {
            refresh: refreshToken,
          })

          const { access, refresh } = response.data

          // Save new access token
          localStorage.setItem('accessToken', access)
          if (refresh) {
            localStorage.setItem('refreshToken', refresh)
          }

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${access}`
          return api(originalRequest)
        } catch (refreshError) {
          // If refresh fails, clear auth state and redirect
          localStorage.removeItem('accessToken')
          localStorage.removeItem('refreshToken')
          localStorage.removeItem('user')
          
          if (window.location.pathname !== '/login') {
            window.location.href = '/login?session_expired=true'
          }
          return Promise.reject(refreshError)
        }
      }
    }

    return Promise.reject(error)
  }
)

// Helper methods for Auth
export const authService = {
  async login(email: string, password: string) {
    const response = await api.post('/api/auth/login', { email, password })
    const { access, refresh, user } = response.data
    localStorage.setItem('accessToken', access)
    localStorage.setItem('refreshToken', refresh)
    localStorage.setItem('user', JSON.stringify(user))
    return response.data
  },

  async register(data: Record<string, unknown>) {
    const response = await api.post('/api/auth/register', data)
    const { tokens, user } = response.data
    if (tokens) {
      localStorage.setItem('accessToken', tokens.access)
      localStorage.setItem('refreshToken', tokens.refresh)
    }
    if (user) {
      localStorage.setItem('user', JSON.stringify(user))
    }
    return response.data
  },

  logout() {
    const refreshToken = localStorage.getItem('refreshToken')
    if (refreshToken) {
      api.post('/api/auth/logout', { refresh: refreshToken }).catch(err => {
        console.error("Logout API request error:", err)
      })
    }
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
  },

  getCurrentUser() {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user')
      if (userStr) {
        return JSON.parse(userStr)
      }
    }
    return null
  },

  async fetchProfile() {
    const response = await api.get('/api/auth/profile')
    if (response.data && typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(response.data))
    }
    return response.data
  }
}

// Vehicle CRUD API Service
export const vehicleService = {
  async getAll(params?: Record<string, string | number | boolean>) {
    const response = await api.get('/api/vehicles/', { params })
    return response.data
  },

  async getById(id: number | string) {
    const response = await api.get(`/api/vehicles/${id}/`)
    return response.data
  },

  async create(data: FormData) {
    const response = await api.post('/api/vehicles/', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  async update(id: number | string, data: FormData) {
    const response = await api.put(`/api/vehicles/${id}/`, data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  async delete(id: number | string) {
    const response = await api.delete(`/api/vehicles/${id}/`)
    return response.data
  },
}

// Driver CRUD API Service
export const driverService = {
  async getAll(params?: Record<string, string | number | boolean>) {
    const response = await api.get('/api/drivers/', { params })
    return response.data
  },

  async getById(id: number | string) {
    const response = await api.get(`/api/drivers/${id}/`)
    return response.data
  },

  async create(data: FormData) {
    const response = await api.post('/api/drivers/', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  async update(id: number | string, data: FormData) {
    const response = await api.put(`/api/drivers/${id}/`, data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  async delete(id: number | string) {
    const response = await api.delete(`/api/drivers/${id}/`)
    return response.data
  },
}

// Global Telemetry Search Service
export const globalSearchService = {
  async search(query: string) {
    const response = await api.get('/api/global-search/', {
      params: { q: query },
    })
    return response.data
  },
}

// Trip CRUD API Service
export const tripService = {
  async getAll(params?: Record<string, string | number | boolean>) {
    const response = await api.get('/api/trips/', { params })
    return response.data
  },

  async getById(id: number | string) {
    const response = await api.get(`/api/trips/${id}/`)
    return response.data
  },

  async create(data: Record<string, any>) {
    const response = await api.post('/api/trips/', data)
    return response.data
  },

  async update(id: number | string, data: Record<string, any>) {
    const response = await api.put(`/api/trips/${id}/`, data)
    return response.data
  },

  async delete(id: number | string) {
    const response = await api.delete(`/api/trips/${id}/`)
    return response.data
  },
}

// Fuel Log CRUD API Service
export const fuelService = {
  async getAll(params?: Record<string, string | number | boolean>) {
    const response = await api.get('/api/fuel/', { params })
    return response.data
  },

  async getById(id: number | string) {
    const response = await api.get(`/api/fuel/${id}/`)
    return response.data
  },

  async create(data: FormData) {
    const response = await api.post('/api/fuel/', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  async update(id: number | string, data: FormData) {
    const response = await api.put(`/api/fuel/${id}/`, data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  async delete(id: number | string) {
    const response = await api.delete(`/api/fuel/${id}/`)
    return response.data
  },
}

// Maintenance CRUD API Service
export const maintenanceService = {
  async getAll(params?: Record<string, string | number | boolean>) {
    const response = await api.get('/api/maintenance/', { params })
    return response.data
  },

  async getById(id: number | string) {
    const response = await api.get(`/api/maintenance/${id}/`)
    return response.data
  },

  async create(data: FormData) {
    const response = await api.post('/api/maintenance/', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  async update(id: number | string, data: FormData) {
    const response = await api.put(`/api/maintenance/${id}/`, data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  async delete(id: number | string) {
    const response = await api.delete(`/api/maintenance/${id}/`)
    return response.data
  },
}

// Analytics and KPI Dashboard API Service
export const analyticsService = {
  async getStats(params?: Record<string, string | number | boolean>) {
    const response = await api.get('/api/dashboard/', { params })
    return response.data
  },
  async getKPIs() {
    const response = await api.get('/api/dashboard/kpi/')
    return response.data
  },
  async getCharts() {
    const response = await api.get('/api/dashboard/charts/')
    return response.data
  },
  async getRecentActivities() {
    const response = await api.get('/api/dashboard/recent-activities/')
    return response.data
  },
  async getNotifications() {
    const response = await api.get('/api/dashboard/notifications/')
    return response.data
  }
}

// Business Intelligence Reports API Service
export const reportsService = {
  async getFleetReport(params?: Record<string, string | number | boolean>) {
    const response = await api.get('/api/reports/fleet/', { params })
    return response.data
  },
  async getVehicleReport(params?: Record<string, string | number | boolean>) {
    const response = await api.get('/api/reports/vehicle/', { params })
    return response.data
  },
  async getDriverReport(params?: Record<string, string | number | boolean>) {
    const response = await api.get('/api/reports/driver/', { params })
    return response.data
  },
  async getTripsReport(params?: Record<string, string | number | boolean>) {
    const response = await api.get('/api/reports/trips/', { params })
    return response.data
  },
  async getFuelReport(params?: Record<string, string | number | boolean>) {
    const response = await api.get('/api/reports/fuel/', { params })
    return response.data
  },
  async getMaintenanceReport(params?: Record<string, string | number | boolean>) {
    const response = await api.get('/api/reports/maintenance/', { params })
    return response.data
  }
}

