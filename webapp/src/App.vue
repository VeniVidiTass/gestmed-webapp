<template>
  <div id="app">
    <router-view />
    <AppNotifications />
    <ConfirmDialog />
  </div>
</template>

<script>
import { defineComponent, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import ConfirmDialog from 'primevue/confirmdialog'
import AppNotifications from './components/AppNotifications.vue'
import { useAppStore, useUserStore } from './stores'
import { useAuth } from './composables/useAuth'
import { usePrefetchCache } from './composables/usePrefetchCache'
import { preloadAppData, setupDataPreloading, setupCacheWarming, areDataFresh } from './utils/dataPreloader.js'

export default defineComponent({
  name: 'App',
  components: {
    AppNotifications,
    ConfirmDialog
  },
  setup() {
    const appStore = useAppStore()
    const userStore = useUserStore()
    const route = useRoute()
    const { getAuthUrls } = useAuth()
    const { shouldSkipPrefetch, markRouteVisited, clearCache } = usePrefetchCache()


    // Log auth URLs on app start for debugging
    const authConfig = getAuthUrls()
    console.log('🔐 Auth Configuration:', authConfig)

    const shouldPreloadData = (routeName) => {
      return routeName && routeName !== 'Home'
    }

    const handleDataPreload = async (routeName) => {
      if (!shouldPreloadData(routeName)) {
        console.log('🏠 Home page detected - skipping prefetch')
        return
      }

      if (shouldSkipPrefetch(routeName)) {
        return
      }

      console.log(`📊 Non-home route detected (${routeName}) - starting prefetch`)

      // Marca la route come visitata PRIMA del prefetch
      markRouteVisited(routeName)

      // Initial data preload
      const preloadSuccess = await preloadAppData()

      if (preloadSuccess) {
        appStore.addNotification({
          severity: 'success',
          summary: 'GestMed Pronto',
          detail: 'Sistema caricato e dati sincronizzati',
          life: 3000
        })
      } else if (!preloadSuccess) {
        appStore.addNotification({
          severity: 'warn',
          summary: 'Connessione Limitata',
          detail: 'Alcuni dati potrebbero richiedere più tempo per caricare',
          life: 4000
        })
      }
    }

    onMounted(async () => {
      // Initialize authentication (only load from storage, no fetch)
      userStore.loadUserInfoFromStorage()

      // Initialize app theme
      appStore.initializeTheme()

      // Setup data preloading strategies solo se non siamo sulla home
      if (shouldPreloadData(route.name)) {
        console.log('🔄 Initializing data preloading and cache warming systems', route.name)
        setupDataPreloading()
        setupCacheWarming()

        // Se non siamo sulla home e non abbiamo userinfo, li fetchamo
        if (!userStore.userInfo) {
          console.log('🔐 Fetching user info for non-home route')
          try {
            await userStore.fetchUserInfo()
          } catch (error) {
            console.log('User not authenticated or session expired')
          }
        }
      }

      // Prefetch iniziale basato sulla route corrente
      await handleDataPreload(route.name)
    })

    // Watch route changes per gestire il prefetch quando l'utente naviga
    watch(route, async (newRoute, oldRoute) => {
      // Se navighiamo dalla home a un'altra pagina, inizializziamo il prefetch
      if (oldRoute?.name === 'Home' && shouldPreloadData(newRoute.name)) {
        console.log('🔄 Moving from Home to data page - initializing prefetch systems')
        setupDataPreloading()
        setupCacheWarming()

        // Fetch userinfo solo quando navighiamo dalla home se non li abbiamo già
        if (!userStore.userInfo) {
          console.log('🔐 Fetching user info on navigation from Home')
          try {
            await userStore.fetchUserInfo()
          } catch (error) {
            console.log('User not authenticated or session expired')
            appStore.addNotification({
              severity: 'warn',
              summary: 'Autenticazione',
              detail: 'Impossibile recuperare le informazioni utente',
              life: 4000
            })
          }
        }

        await handleDataPreload(newRoute.name)
      }
      // Se navighiamo verso una pagina che richiede dati, facciamo il prefetch intelligente
      else if (shouldPreloadData(newRoute.name)) {
        await handleDataPreload(newRoute.name)
      }
    })

    // Reset cache quando l'utente si disconnette o all'inizio di una nuova sessione
    watch(() => userStore.isLoggedIn, (isLoggedIn) => {
      if (!isLoggedIn) {
        clearCache()
        console.log('🧹 Prefetch cache cleared due to logout')
      }
    })

    return {
      appStore
    }
  }
})
</script>
