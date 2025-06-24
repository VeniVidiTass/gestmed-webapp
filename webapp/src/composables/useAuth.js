import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore, useUserStore } from '../stores'

// Configurazione autenticazione da variabili d'ambiente
const AUTH_ENABLED = import.meta.env.VITE_AUTH_ENABLED !== 'false' // Default: true
const LOGIN_URL = import.meta.env.VITE_LOGIN_URL || 'http://localhost:8080/auth/login'
const LOGOUT_URL = import.meta.env.VITE_LOGOUT_URL || 'http://localhost:8080/auth/logout'
const LOGIN_REDIRECT_URL = import.meta.env.VITE_LOGIN_REDIRECT_URL || '/dashboard'
const LOGOUT_REDIRECT_URL = import.meta.env.VITE_LOGOUT_REDIRECT_URL || '/'

export function useAuth() {
  const router = useRouter()
  const appStore = useAppStore()
  const userStore = useUserStore()
  // State
  const isAuthenticated = ref(false)
  const user = ref(null)
  // authToken non è più necessario con oauth2-proxy  // Getters
  const isLoggedIn = computed(() => {
    // Se l'autenticazione è disabilitata, considera sempre l'utente autenticato
    if (!AUTH_ENABLED) return true
    // Con oauth2-proxy, verifichiamo solo se abbiamo le info utente
    return isAuthenticated.value
  })

  const authDisabled = computed(() => !AUTH_ENABLED)

  // Initialize auth state from localStorage
  const initializeAuth = () => {
    // Se l'autenticazione è disabilitata, simula uno stato autenticato
    if (!AUTH_ENABLED) {
      isAuthenticated.value = true
      user.value = {
        name: 'Demo User',
        email: 'demo@gestmed.local',
        role: 'admin'
      }
      // Imposta anche nello store utente
      userStore.setUserInfo({
        name: 'Demo User',
        email: 'demo@gestmed.local',
        role: 'admin',
        displayName: 'Demo User'
      })
      console.log('🔓 Authentication disabled - using demo user')
      return
    }
    if (typeof localStorage !== 'undefined') {
      // Con oauth2-proxy non abbiamo più token, ma carichiamo solo i dati utente salvati
      const userData = localStorage.getItem('user_data')

      if (userData) {
        try {
          user.value = JSON.parse(userData)
          isAuthenticated.value = true
        } catch (error) {
          console.error('Error parsing user data from localStorage:', error)
          localStorage.removeItem('user_data')
        }
      }

      // Carica le informazioni utente dallo storage
      userStore.loadUserInfoFromStorage()

      // Se abbiamo dati utente salvati, consideriamo l'utente autenticato
      if (userStore.userInfo) {
        isAuthenticated.value = true
      }
    }
  }
  // Login function - redirects to external login URL
  const login = (returnUrl = null) => {
    // Se l'autenticazione è disabilitata, non fare nulla
    if (!AUTH_ENABLED) {
      appStore.addNotification({
        severity: 'info',
        summary: 'Autenticazione Disabilitata',
        detail: 'L\'autenticazione è disabilitata in modalità sviluppo',
        life: 3000
      })
      return Promise.resolve()
    }

    const redirectUrl = returnUrl || LOGIN_REDIRECT_URL
    const loginUrlWithRedirect = `${LOGIN_URL}?redirect=${encodeURIComponent(window.location.origin + redirectUrl)}`

    appStore.addNotification({
      severity: 'info',
      summary: 'Reindirizzamento',
      detail: 'Reindirizzamento al sistema di autenticazione...',
      life: 2000
    })

    // Redirect to external login
    window.location.href = loginUrlWithRedirect
  }
  // Logout function - redirects to external logout URL
  const logout = async () => {

    try {      // Clear local auth state - con oauth2-proxy il cookie viene gestito dal proxy
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('user_data')
      }

      isAuthenticated.value = false
      user.value = null

      // Pulisci anche le informazioni utente nello store
      userStore.clearUserInfo()

      appStore.addNotification({
        severity: 'success',
        summary: 'Logout',
        detail: 'Disconnessione in corso...',
        life: 2000
      })

      // Redirect to external logout with return URL
      const logoutUrlWithRedirect = `${LOGOUT_URL}?redirect=${encodeURIComponent(window.location.origin + LOGOUT_REDIRECT_URL)}`
      window.location.href = logoutUrlWithRedirect

    } catch (error) {
      console.error('Logout error:', error)
      appStore.addNotification({
        severity: 'error',
        summary: 'Errore Logout',
        detail: 'Errore durante la disconnessione',
        life: 5000
      })
    }
  }

  // Handle authentication callback (when user returns from external auth)
  const handleAuthCallback = async (userData = null) => {
    // Con oauth2-proxy, non abbiamo più token espliciti
    isAuthenticated.value = true

    if (typeof localStorage !== 'undefined' && userData) {
      localStorage.setItem('user_data', JSON.stringify(userData))
      user.value = userData
    }

    // Se l'autenticazione è abilitata, fai la chiamata all'endpoint userinfo
    if (AUTH_ENABLED) {
      try {
        await userStore.fetchUserInfo()

        appStore.addNotification({
          severity: 'success',
          summary: 'Accesso Effettuato',
          detail: `Benvenuto ${userStore.userName}!`,
          life: 3000
        })
      } catch (error) {
        console.error('Error fetching user info:', error)
        appStore.addNotification({
          severity: 'warning',
          summary: 'Accesso Effettuato',
          detail: 'Benvenuto! (Impossibile recuperare informazioni utente)',
          life: 3000
        })
      }
    } else {
      appStore.addNotification({
        severity: 'success',
        summary: 'Accesso Effettuato',
        detail: 'Benvenuto in GestMed!',
        life: 3000
      })
    }

    // Redirect to dashboard or intended page
    router.push(LOGIN_REDIRECT_URL)
  }
  // Check if current route requires authentication
  const requiresAuth = (routeName) => {
    // Se l'autenticazione è disabilitata, nessuna route richiede autenticazione
    if (!AUTH_ENABLED) return false

    const publicRoutes = ['Home', 'Login', 'Callback']
    return !publicRoutes.includes(routeName)
  }

  // Auth guard function for router
  const authGuard = (to, from, next) => {
    if (requiresAuth(to.name) && !isLoggedIn.value) {      // Store intended destination
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem('intended_route', to.fullPath)
      }
      login(to.fullPath)
    } else {
      next()
    }
  }

  // Get auth URLs for external use
  const getAuthUrls = () => ({
    authEnabled: AUTH_ENABLED,
    loginUrl: LOGIN_URL,
    logoutUrl: LOGOUT_URL,
    loginRedirectUrl: LOGIN_REDIRECT_URL,
    logoutRedirectUrl: LOGOUT_REDIRECT_URL
  })

  return {
    // State
    isAuthenticated,
    user,
    // authToken non più necessario con oauth2-proxy

    // Getters
    isLoggedIn,
    authDisabled,

    // Methods
    initializeAuth,
    login,
    logout,
    handleAuthCallback,
    requiresAuth,
    authGuard,
    getAuthUrls,

    // User store access
    userStore
  }
}
