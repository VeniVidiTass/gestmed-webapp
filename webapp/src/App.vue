<template>
  <div id="app">
    <router-view />
    <AppNotifications />
    <ConfirmDialog />
  </div>
</template>

<script>
import { defineComponent, onMounted } from 'vue'
import ConfirmDialog from 'primevue/confirmdialog'
import AppNotifications from './components/AppNotifications.vue'
import { useAppStore } from './stores'
import { preloadAppData, setupDataPreloading, setupCacheWarming } from './utils/dataPreloader.js'

export default defineComponent({
  name: 'App',
  components: {
    AppNotifications,
    ConfirmDialog
  },
  setup() {
    const appStore = useAppStore()

    onMounted(async () => {
      // Initialize app theme
      appStore.initializeTheme()

      // Setup data preloading strategies
      setupDataPreloading()
      setupCacheWarming()

      // Check if this is the first load of the session
      /* const isFirstLoad = !sessionStorage.getItem('gestmed-session-started')
      if (isFirstLoad) {
        sessionStorage.setItem('gestmed-session-started', 'true')
      } */

      // Initial data preload
      const preloadSuccess = await preloadAppData()

      if (preloadSuccess /* && isFirstLoad */) {
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
    })

    return {
      appStore
    }
  }
})
</script>
