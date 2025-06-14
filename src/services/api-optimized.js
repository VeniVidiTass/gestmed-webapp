import axios from 'axios'

// Cache per le richieste
const requestCache = new Map()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minuti

// Create axios instance with optimizations
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor con cache
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // Add request ID for tracking
    config.metadata = { startTime: Date.now() }

    // Cache key per GET requests
    if (config.method === 'get') {
      const cacheKey = `${config.url}_${JSON.stringify(config.params || {})}`
      
      // Check cache
      const cached = requestCache.get(cacheKey)
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        // Return cached response
        return Promise.resolve({
          data: cached.data,
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
          fromCache: true
        })
      }
      
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
    if (response.config.method === 'get' && response.config.cacheKey && !response.fromCache) {
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
      message: error.message
    })

    // Handle different error types
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('auth_token')
      window.location.href = '/'
      return Promise.reject(error)
    }

    // Retry logic for network errors
    if (!error.response && !originalRequest._retry) {
      originalRequest._retry = true
      
      // Wait 1 second before retry
      await new Promise(resolve => setTimeout(resolve, 1000))
      
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

// Optimized API Service methods
export const apiService = {
  // Dashboard
  getDashboardData: () => api.get('/dashboard'),

  // Patients with optimized queries
  getPatients: (params = {}) => {
    // Optimize query parameters
    const optimizedParams = {
      page: params.page || 1,
      limit: Math.min(params.limit || 10, 50), // Limit max items per page
      ...params
    }
    return api.get('/patients', { params: optimizedParams })
  },

  getPatient: (id) => api.get(`/patients/${id}`),
  
  createPatient: (data) => {
    // Clear patients cache after creation
    clearCacheByPattern('/patients')
    return api.post('/patients', data)
  },
  
  updatePatient: (id, data) => {
    // Clear related cache
    clearCacheByPattern('/patients')
    clearCacheByPattern(`/patients/${id}`)
    return api.put(`/patients/${id}`, data)
  },
  
  deletePatient: (id) => {
    // Clear related cache
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
    clearCacheByPattern('/dashboard') // Dashboard depends on appointments
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

  // Batch operations for better performance
  batchUpdateAppointments: (updates) => {
    clearCacheByPattern('/appointments')
    clearCacheByPattern('/dashboard')
    return api.post('/appointments/batch-update', { updates })
  },

  // Health check
  healthCheck: () => api.get('/health')
}

// Helper function to clear cache by pattern
function clearCacheByPattern(pattern) {
  for (const key of requestCache.keys()) {
    if (key.includes(pattern)) {
      requestCache.delete(key)
    }
  }
}

// Batch request helper
export async function batchRequests(requests, maxConcurrent = 3) {
  const results = []
  
  for (let i = 0; i < requests.length; i += maxConcurrent) {
    const batch = requests.slice(i, i + maxConcurrent)
    const batchResults = await Promise.allSettled(batch.map(req => req()))
    results.push(...batchResults)
  }
  
  return results
}

// Preload commonly used data
export async function preloadCommonData() {
  try {
    await Promise.allSettled([
      apiService.getDashboardData(),
      apiService.getDoctors({ limit: 20 }),
      apiService.getAppointments({ 
        limit: 20,
        dateFrom: new Date().toISOString().split('T')[0] // Today onwards
      })
    ])
    console.debug('Common data preloaded')
  } catch (error) {
    console.warn('Failed to preload common data:', error)
  }
}

export default api
