import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore, useUserStore } from '../stores'

// Configurazione autenticazione da variabili d'ambiente
const LOGIN_URL = import.meta.env.VITE_LOGIN_URL || 'http://localhost:8080/auth/login'
const LOGOUT_URL = import.meta.env.VITE_LOGOUT_URL || 'http://localhost:8080/auth/logout'
const LOGIN_REDIRECT_URL = import.meta.env.VITE_LOGIN_REDIRECT_URL || '/dashboard'
const LOGOUT_REDIRECT_URL = import.meta.env.VITE_LOGOUT_REDIRECT_URL || '/'

export function useAuth() {
  const router = useRouter()
  const appStore = useAppStore()
  const userStore = useUserStore()

  // Getters
  const isLoggedIn = computed(() => {
    // Con oauth2-proxy e gestione cookie automatica, verifichiamo solo se abbiamo le info utente
    return !!userStore.userInfo
  })

  // Initialize auth state (optimized - no automatic fetch)
  const initializeAuth = async () => {
    // Carica le informazioni utente dallo storage
    userStore.loadUserInfoFromStorage()
    // Non facciamo più il fetch automatico qui
  }

  // Initialize auth state with fetch (for backwards compatibility)
  const initializeAuthWithFetch = async () => {
    // Carica le informazioni utente dallo storage
    userStore.loadUserInfoFromStorage()

    // Se non abbiamo info utente salvate, prova a recuperarle dal server
    if (!userStore.userInfo) {
      try {
        await userStore.fetchUserInfo()
      } catch (error) {
        console.log('User not authenticated or session expired')
      }
    }
  }
  // Login function - redirect to external OAuth provider
  const login = () => {
    // Se siamo già loggati, andiamo direttamente al dashboard
    if (isLoggedIn.value) {
      router.push(LOGIN_REDIRECT_URL)
      return
    }

    appStore.addNotification({
      severity: 'info',
      summary: 'Login',
      detail: 'Reindirizzamento al provider di autenticazione...',
      life: 2000
    })

    // Redirect alla pagina di destinazione
    router.push(LOGIN_REDIRECT_URL)
  }

  // Logout function - redirect to external OAuth logout
  const logout = () => {
    // Pulisci le informazioni utente locali
    userStore.clearUserInfo()

    appStore.addNotification({
      severity: 'success',
      summary: 'Logout',
      detail: 'Disconnessione in corso...',
      life: 2000
    })

    // Redirect alla pagina di logout
    router.push(LOGOUT_REDIRECT_URL)
  }

  // Check if current route requires authentication
  const requiresAuth = (routeName) => {
    const publicRoutes = ['Home', 'Login', 'AuthCallback']
    return !publicRoutes.includes(routeName)
  }

  // Auth guard function for router
  const authGuard = (to, from, next) => {
    if (requiresAuth(to.name) && !isLoggedIn.value) {
      // Store intended destination
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem('intended_route', to.fullPath)
      }
      login()
    } else {
      next()
    }
  }

  // Get auth URLs for external use
  const getAuthUrls = () => ({
    loginUrl: LOGIN_URL,
    logoutUrl: LOGOUT_URL,
    loginRedirectUrl: LOGIN_REDIRECT_URL,
    logoutRedirectUrl: LOGOUT_REDIRECT_URL
  })

  return {
    // Getters
    isLoggedIn,

    // Methods
    initializeAuth,
    initializeAuthWithFetch,
    login,
    logout,
    requiresAuth,
    authGuard,
    getAuthUrls,

    // User store access
    userStore
  }
}
