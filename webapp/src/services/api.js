/* global localStorage */
import axios from 'axios'

// Configurazione URL da variabili d'ambiente
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'
const LOGIN_URL = import.meta.env.VITE_LOGIN_URL || 'http://localhost:8080/auth/login'
const LOGOUT_URL = import.meta.env.VITE_LOGOUT_URL || 'http://localhost:8080/auth/logout'
const USERINFO_URL = import.meta.env.VITE_USERINFO_URL

// Cache per le richieste
const requestCache = new Map()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minuti

// Create axios instance with optimizations
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true // Importante per inviare i cookie automaticamente
})

// Request interceptor con cache
api.interceptors.request.use(
  (config) => {
    // I cookie vengono inviati automaticamente con withCredentials: true
    // Non è più necessario aggiungere manualmente l'header Authorization

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
    })    // Handle different error types
    if (error.response?.status === 401) {
      // Handle unauthorized access - con oauth2-proxy il cookie viene gestito automaticamente
      // Se riceviamo 401, probabilmente il cookie è scaduto o non valido
      console.warn('Cookie di sessione non valido o scaduto, reindirizzamento alla pagina di login')
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

// Helper function to clean empty parameters
function cleanParams(params, preserveKeys = []) {
  const cleaned = {}

  // Add preserved keys with their values or defaults
  preserveKeys.forEach(key => {
    if (params[key] !== undefined) {
      cleaned[key] = params[key]
    }
  })

  // Add other parameters, filtering out empty values
  Object.keys(params).forEach(key => {
    if (!preserveKeys.includes(key)) {
      const value = params[key]
      // Allow boolean false values and 0, but filter out empty strings, null, undefined
      if (value !== undefined && value !== null && value !== '') {
        cleaned[key] = value
      }
    }
  })

  return cleaned
}

// API Service methods with optimizations
export const apiService = {
  // Auth
  login: (data) => api.post(LOGIN_URL, data),
  logout: () => api.post(LOGOUT_URL),

  // Dashboard
  getDashboardData: () => api.get('/dashboard'),  // Patients with optimized queries
  getPatients: (params = {}) => {
    const optimizedParams = {
      page: params.page || 1,
      limit: Math.min(params.limit || 10, 50)
    }

    // Add cleaned parameters
    const cleanedParams = cleanParams(params, ['page', 'limit'])
    Object.assign(optimizedParams, cleanedParams)

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
  },  // Doctors with optimized queries
  getDoctors: (params = {}) => {
    const optimizedParams = {
      page: params.page || 1,
      limit: Math.min(params.limit || 10, 50)
    }

    // Add cleaned parameters
    const cleanedParams = cleanParams(params, ['page', 'limit'])
    Object.assign(optimizedParams, cleanedParams)

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
  },  // Services
  getServices: (params = {}) => {
    // Use helper function to clean parameters
    const optimizedParams = cleanParams(params)

    return api.get('/appointments/services', { params: optimizedParams })
  },

  getServicesByDoctor: (doctorId, isActive = true) => {
    const params = { is_active: isActive }
    return api.get(`/appointments/services/doctor/${doctorId}`, { params })
  },

  getExternalBookableServices: (doctorId = null) => {
    const params = {}
    if (doctorId) {
      params.doctor_id = doctorId
    }
    return api.get('/appointments/services/external', { params })
  },

  getService: (id) => api.get(`/appointments/services/${id}`),

  createService: (data) => {
    clearCacheByPattern('/appointments/services')
    return api.post('/appointments/services', data)
  },

  updateService: (id, data) => {
    clearCacheByPattern('/appointments/services')
    clearCacheByPattern(`/appointments/services/${id}`)
    return api.put(`/appointments/services/${id}`, data)
  },

  deleteService: (id) => {
    clearCacheByPattern('/appointments/services')
    clearCacheByPattern(`/appointments/services/${id}`)
    return api.delete(`/appointments/services/${id}`)
  },  // Appointments with optimized queries
  getAppointments: (params = {}) => {
    const optimizedParams = {
      page: params.page || 1,
      limit: Math.min(params.limit || 20, 100)
    }

    // Add cleaned parameters
    const cleanedParams = cleanParams(params, ['page', 'limit'])
    Object.assign(optimizedParams, cleanedParams)

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

  updateAppointmentStatus: (appointmentId, status) => api.put(`/appointments/${appointmentId}/status`, { status }),

  // Authentication functions
  auth: {
    // Get authentication URLs (for external components or debugging)
    getUrls: () => ({
      loginUrl: LOGIN_URL,
      logoutUrl: LOGOUT_URL,
      apiBaseUrl: API_BASE_URL
    }),

    // Check token validity
    validateToken: (token) => {
      const headers = token ? { Authorization: `Bearer ${token}` } : {}
      return api.get('/auth/validate', { headers })
    },

    // Refresh token if supported by backend
    refreshToken: (refreshToken) => {
      return api.post('/auth/refresh', { refreshToken })
    },    // Get user profile
    getProfile: () => api.get('/auth/profile'),    // Get user info from external endpoint
    getUserInfo: async () => {
      if (!USERINFO_URL) {
        throw new Error('VITE_USERINFO_URL non configurato')
      }

      // Con oauth2-proxy, i cookie vengono inviati automaticamente
      const response = await fetch(USERINFO_URL, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include' // Importante per includere i cookie
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return response.json()
    },

    // Update user profile
    updateProfile: (data) => api.put('/auth/profile', data)
  }
}

export default api
