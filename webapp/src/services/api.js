/* global localStorage */
import axios from 'axios'

// Cache per le richieste
const requestCache = new Map()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minuti

// Create axios instance with optimizations
const api = axios.create({
  baseURL: import.meta.env.API_BASE_URL || 'http://api-gateway:3000/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor con cache
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    if (typeof localStorage !== 'undefined') {
      const token = localStorage.getItem('auth_token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }

    // Add request ID for tracking
    config.metadata = { startTime: Date.now() }

    // Cache key per GET requests
    if (config.method === 'get') {
      const cacheKey = `${config.url}_${JSON.stringify(config.params || {})}`
      config.cacheKey = cacheKey
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor con cache e retry logic
api.interceptors.response.use(
  (response) => {
    // Log response time
    const responseTime = Date.now() - response.config.metadata.startTime
    console.debug(`API ${response.config.method?.toUpperCase()} ${response.config.url}: ${responseTime}ms`)

    // Cache GET responses
    if (response.config.method === 'get' && response.config.cacheKey) {
      // Check if response is from cache first
      const cached = requestCache.get(response.config.cacheKey)
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data
      }

      // Cache new response
      requestCache.set(response.config.cacheKey, {
        data: response.data,
        timestamp: Date.now()
      })

      // Clean old cache entries
      cleanCache()
    }

    return response.data
  },
  async (error) => {
    const originalRequest = error.config

    // Log error
    console.error('API Error:', {
      url: originalRequest?.url,
      method: originalRequest?.method,
      status: error.response?.status,
      message: error.message,
      data: error.response?.data
    })

    // Handle different error types
    if (error.response?.status === 401) {
      // Handle unauthorized access
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('auth_token')
      }
      window.location.href = '/'
      return Promise.reject(error)
    }

    // Retry logic for network errors
    if (!error.response && !originalRequest._retry) {
      originalRequest._retry = true

      // Wait 1 second before retry
      await new Promise(resolve => globalThis.setTimeout(resolve, 1000))

      return api(originalRequest)
    }

    return Promise.reject(error)
  }
)

// Clean old cache entries
function cleanCache() {
  const now = Date.now()
  for (const [key, value] of requestCache.entries()) {
    if (now - value.timestamp > CACHE_DURATION) {
      requestCache.delete(key)
    }
  }
}

// Clear all cache
export function clearApiCache() {
  requestCache.clear()
}

// Helper function to clear cache by pattern
function clearCacheByPattern(pattern) {
  for (const key of requestCache.keys()) {
    if (key.includes(pattern)) {
      requestCache.delete(key)
    }
  }
}

// API Service methods with optimizations
export const apiService = {
  // Dashboard
  getDashboardData: () => api.get('/dashboard'),

  // Patients with optimized queries
  getPatients: (params = {}) => {
    const optimizedParams = {
      page: params.page || 1,
      limit: Math.min(params.limit || 10, 50), // Limit max items per page
      ...params
    }
    return api.get('/patients', { params: optimizedParams })
  },

  getPatient: (id) => api.get(`/patients/${id}`),

  createPatient: (data) => {
    clearCacheByPattern('/patients')
    return api.post('/patients', data)
  },

  updatePatient: (id, data) => {
    clearCacheByPattern('/patients')
    clearCacheByPattern(`/patients/${id}`)
    return api.put(`/patients/${id}`, data)
  },

  deletePatient: (id) => {
    clearCacheByPattern('/patients')
    clearCacheByPattern(`/patients/${id}`)
    return api.delete(`/patients/${id}`)
  },

  // Doctors with optimized queries
  getDoctors: (params = {}) => {
    const optimizedParams = {
      page: params.page || 1,
      limit: Math.min(params.limit || 10, 50),
      ...params
    }
    return api.get('/doctors', { params: optimizedParams })
  },

  getDoctor: (id) => api.get(`/doctors/${id}`),

  createDoctor: (data) => {
    clearCacheByPattern('/doctors')
    return api.post('/doctors', data)
  },

  updateDoctor: (id, data) => {
    clearCacheByPattern('/doctors')
    clearCacheByPattern(`/doctors/${id}`)
    return api.put(`/doctors/${id}`, data)
  },

  deleteDoctor: (id) => {
    clearCacheByPattern('/doctors')
    clearCacheByPattern(`/doctors/${id}`)
    return api.delete(`/doctors/${id}`)
  },

  // Appointments with optimized queries
  getAppointments: (params = {}) => {
    const optimizedParams = {
      page: params.page || 1,
      limit: Math.min(params.limit || 20, 100),
      ...params
    }
    return api.get('/appointments', { params: optimizedParams })
  },

  getAppointment: (id) => api.get(`/appointments/${id}`),

  createAppointment: (data) => {
    clearCacheByPattern('/appointments')
    clearCacheByPattern('/dashboard')
    return api.post('/appointments', data)
  },

  updateAppointment: (id, data) => {
    clearCacheByPattern('/appointments')
    clearCacheByPattern(`/appointments/${id}`)
    clearCacheByPattern('/dashboard')
    return api.put(`/appointments/${id}`, data)
  },

  deleteAppointment: (id) => {
    clearCacheByPattern('/appointments')
    clearCacheByPattern(`/appointments/${id}`)
    clearCacheByPattern('/dashboard')
    return api.delete(`/appointments/${id}`)
  },
  // Health check
  healthCheck: () => api.get('/health'),

  getAppointmentLogs: (appointmentId) => api.get(`/alive/${appointmentId}/logs`),

  addAppointmentLog: (appointmentId, data) => api.post(`/alive/${appointmentId}/logs`, data),

  updateAppointmentStatus: (appointmentId, status) => api.put(`/appointments/${appointmentId}/status`, { status })
}

export default api
