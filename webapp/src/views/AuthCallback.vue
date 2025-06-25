<template>
  <div class="auth-callback-container">
    <div class="auth-callback-content">
      <div class="loading-spinner">
        <ProgressSpinner />
      </div>

      <h2 class="callback-title">
        {{ callbackMessage }}
      </h2>

      <p class="callback-description">
        {{ callbackDescription }}
      </p>

      <div v-if="error" class="error-section">
        <Message severity="error" :closable="false">
          {{ error }}
        </Message>

        <div class="error-actions">
          <Button label="Torna alla Home" @click="goHome" class="p-button-outlined" />
          <Button label="Riprova Login" @click="retryLogin" icon="pi pi-refresh" />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ProgressSpinner from 'primevue/progressspinner'
import Message from 'primevue/message'
import Button from 'primevue/button'
import { useAuth } from '../composables/useAuth'
import { useAppStore } from '../stores'

export default defineComponent({
  name: 'AuthCallback',
  components: {
    ProgressSpinner,
    Message,
    Button
  },
  setup() {
    const route = useRoute()
    const router = useRouter()
    const { login, initializeAuth } = useAuth()
    const appStore = useAppStore()

    const callbackMessage = ref('Elaborazione autenticazione...')
    const callbackDescription = ref('Stiamo completando il processo di autenticazione.')
    const error = ref(null)

    const processAuthCallback = async () => {
      try {
        callbackMessage.value = 'Autenticazione completata!'
        callbackDescription.value = 'Ti stiamo reindirizzando...'

        // Con oauth2-proxy, tentiamo di inizializzare l'autenticazione
        await initializeAuth()

        // Get intended route from session storage
        let redirectTo = '/dashboard'
        if (typeof sessionStorage !== 'undefined') {
          const intendedRoute = sessionStorage.getItem('intended_route')
          if (intendedRoute) {
            redirectTo = intendedRoute
            sessionStorage.removeItem('intended_route')
          }
        }

        // Small delay to show success message
        setTimeout(() => {
          router.push(redirectTo)
        }, 1500)

      } catch (err) {
        console.error('Auth callback error:', err)
        error.value = err.message || 'Errore durante l\'autenticazione'
        callbackMessage.value = 'Errore di autenticazione'
        callbackDescription.value = 'Si è verificato un problema durante il processo di autenticazione.'

        appStore.addNotification({
          severity: 'error',
          summary: 'Errore Autenticazione',
          detail: error.value,
          life: 8000
        })
      }
    }

    const goHome = () => {
      router.push('/')
    }

    const retryLogin = () => {
      login()
    }

    onMounted(() => {
      processAuthCallback()
    })

    return {
      callbackMessage,
      callbackDescription,
      error,
      goHome,
      retryLogin
    }
  }
})
</script>

<style scoped>
.auth-callback-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--surface-50);
  padding: 2rem;
}

.auth-callback-content {
  background: var(--surface-0);
  padding: 3rem;
  border-radius: 1rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  text-align: center;
  max-width: 500px;
  width: 100%;
}

.loading-spinner {
  margin-bottom: 2rem;
}

.callback-title {
  color: var(--text-color);
  margin-bottom: 1rem;
  font-size: 1.5rem;
  font-weight: 600;
}

.callback-description {
  color: var(--text-color-secondary);
  margin-bottom: 2rem;
  line-height: 1.5;
}

.error-section {
  margin-top: 2rem;
}

.error-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 1.5rem;
  flex-wrap: wrap;
}

@media (max-width: 768px) {
  .auth-callback-content {
    padding: 2rem;
    margin: 1rem;
  }

  .error-actions {
    flex-direction: column;
    align-items: center;
  }

  .error-actions .p-button {
    width: 100%;
    max-width: 200px;
  }
}
</style>
