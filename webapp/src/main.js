import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import Aura from '@primevue/themes/aura'
import ToastService from 'primevue/toastservice'
import ConfirmationService from 'primevue/confirmationservice'
import Tooltip from 'primevue/tooltip'

import 'primeicons/primeicons.css'
import './style.css'

import App from './App.vue'
import routes from './router/routes.js'
import { useAppStore } from './stores'

const router = createRouter({
  history: createWebHistory(),
  routes
})

const pinia = createPinia()

// Add persistence plugin
import { persistencePlugin } from './stores/persistence.js'
pinia.use(persistencePlugin)

const app = createApp(App)

app.use(router)
app.use(pinia)
app.use(PrimeVue, {
  theme: {
    preset: Aura,
    options: {
      prefix: 'p',
      darkModeSelector: '.dark',
      cssLayer: false
    }
  }
})
app.use(ToastService)
app.use(ConfirmationService)
app.directive('tooltip', Tooltip)

// Initialize app store and theme
const appStore = useAppStore()
appStore.initializeTheme()

app.mount('#app')
