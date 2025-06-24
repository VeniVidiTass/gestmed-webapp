<template>
  <div id="app">
    <router-view />
    <AppNotifications />
    <ConfirmDialog />
  </div>
</template>

<script>
import { defineComponent, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import ConfirmDialog from 'primevue/confirmdialog'
import AppNotifications from './components/AppNotifications.vue'
import { useAppStore } from './stores'
import { useAuth } from './composables/useAuth'
import { preloadAppData, setupDataPreloading, setupCacheWarming } from './utils/dataPreloader.js'

export default defineComponent({
  name: 'App',
  components: {
    AppNotifications,
    ConfirmDialog
  },
  setup() {
    const appStore = useAppStore()
    const route = useRoute()
    const { initializeAuth, getAuthUrls } = useAuth()    // Log auth URLs on app start for debugging
    const authConfig = getAuthUrls()
    console.log('🔐 Auth Configuration:', authConfig)

    if (!authConfig.authEnabled) {
      console.log('🔓 Authentication is DISABLED - running in demo mode')
    }

    const shouldPreloadData = (routeName) => {
      return routeName && routeName !== 'Home'
    }

    const handleDataPreload = async (routeName) => {
      if (!shouldPreloadData(routeName)) {
        console.log('🏠 Home page detected - skipping prefetch')
        return
      }

      console.log(`📊 Non-home route detected (${routeName}) - starting prefetch`)

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
      // Initialize authentication
      initializeAuth()

      // Initialize app theme
      appStore.initializeTheme()

      // Setup data preloading strategies solo se non siamo sulla home
      if (shouldPreloadData(route.name)) {
        console.log('🔄 Initializing data preloading and cache warming systems', route.name)
        setupDataPreloading()
        setupCacheWarming()
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
        await handleDataPreload(newRoute.name)
      }
      // Se navighiamo verso una pagina che richiede dati, facciamo il prefetch
      else if (shouldPreloadData(newRoute.name)) {
        await handleDataPreload(newRoute.name)
      }
    })

    return {
      appStore
    }
  }
})
</script>
