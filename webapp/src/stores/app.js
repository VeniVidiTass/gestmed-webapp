/* global localStorage */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAppStore = defineStore('app', () => {
  // State
  const loading = ref(false)
  const error = ref(null)
  const notifications = ref([])
  const theme = ref('light')
  const sidebarVisible = ref(true)

  // Getters
  const isLoading = computed(() => loading.value)
  const hasError = computed(() => error.value !== null)
  const isDarkTheme = computed(() => theme.value === 'dark')

  // Actions
  function setLoading(state) {
    loading.value = state
  }

  function setError(errorMessage) {
    error.value = errorMessage
  }

  function clearError() {
    error.value = null
  }

  function addNotification(notification) {
    const id = Date.now()
    notifications.value.push({
      id,
      ...notification,
      timestamp: new Date()
    })

    // Auto remove after 5 seconds if not persistent
    if (!notification.persistent) {
      window.setTimeout(() => {
        removeNotification(id)
      }, 5000)
    }
  }

  function removeNotification(id) {
    const index = notifications.value.findIndex(n => n.id === id)
    if (index > -1) {
      notifications.value.splice(index, 1)
    }
  }

  function toggleTheme() {
    if (typeof localStorage !== 'undefined') {
      theme.value = theme.value === 'light' ? 'dark' : 'light'
      localStorage.setItem('gestmed-theme', theme.value)
    }
  }

  function toggleSidebar() {
    sidebarVisible.value = !sidebarVisible.value
  }

  function initializeTheme() {
    if (typeof localStorage !== 'undefined') {
      const savedTheme = localStorage.getItem('gestmed-theme')
      if (savedTheme) {
        theme.value = savedTheme
      }
    }
  }

  // Global error handler
  function handleApiError(error) {
    console.error('API Error:', error)

    let message = 'Si è verificato un errore. Riprova più tardi.'

    if (error.response) {
      switch (error.response.status) {
        case 400:
          message = 'Richiesta non valida. Controlla i dati inseriti.'
          break
        case 401:
          message = 'Accesso non autorizzato. Effettua il login.'
          break
        case 403:
          message = 'Non hai i permessi per questa operazione.'
          break
        case 404:
          message = 'Risorsa non trovata.'
          break
        case 500:
          message = 'Errore del server. Riprova più tardi.'
          break
        default:
          message = error.response.data?.message || message
      }
    } else if (error.request) {
      message = 'Errore di connessione. Controlla la tua connessione internet.'
    }

    setError(message)
    addNotification({
      severity: 'error',
      summary: 'Errore',
      detail: message
    })
  }

  return {
    // State
    loading,
    error,
    notifications,
    theme,
    sidebarVisible,

    // Getters
    isLoading,
    hasError,
    isDarkTheme,

    // Actions
    setLoading,
    setError,
    clearError,
    addNotification,
    removeNotification,
    toggleTheme,
    toggleSidebar,
    initializeTheme,
    handleApiError
  }
})
