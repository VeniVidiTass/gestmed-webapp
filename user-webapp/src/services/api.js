import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true // Importante per inviare i cookie automaticamente
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Qui potresti aggiungere token di autenticazione se necessario
    // config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Gestione logout automatico se non autenticato
      console.warn('Unauthorized access')
    }
    return Promise.reject(error)
  }
)

export default api
