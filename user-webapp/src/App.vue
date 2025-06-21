<template>
  <div id="app">
    <div class="app-layout">
      <!-- Header -->
      <header class="app-header">
        <div class="header-content">
          <div class="logo-section">
            <i
              class="pi pi-heart-fill"
              style="color: var(--primary-color); font-size: 2rem;"
            />
            <h1 class="app-title">
              GestMed
            </h1>
          </div>
          
          <nav class="navigation">
            <router-link
              to="/"
              class="nav-link"
            >
              <i class="pi pi-home" />
              Home
            </router-link>
            <router-link
              to="/services"
              class="nav-link"
            >
              <i class="pi pi-list" />
              Servizi
            </router-link>
            <router-link
              v-if="userStore.isLoggedIn"
              to="/my-bookings"
              class="nav-link"
            >
              <i class="pi pi-calendar" />
              Le mie prenotazioni
            </router-link>
          </nav>

          <div
            v-if="userStore.isLoggedIn"
            class="user-section"
          >
            <Avatar
              :label="userStore.user?.name?.charAt(0)"
              class="user-avatar"
            />
            <span class="user-name">{{ userStore.user?.name }}</span>
          </div>
        </div>
      </header>      <!-- Main Content -->
      <main class="app-main">
        <div class="page-container">
          <router-view />
        </div>
      </main>

      <!-- Footer -->
      <footer class="app-footer">
        <div class="footer-content">
          <div class="footer-section">
            <h3>GestMed</h3>
            <p>Il tuo centro medico di fiducia</p>
          </div>
          <div class="footer-section">
            <h4>Contatti</h4>
            <p><i class="pi pi-phone" /> +39 123 456 789</p>
            <p><i class="pi pi-envelope" /> info@gestmed.it</p>
          </div>
          <div class="footer-section">
            <h4>Orari</h4>
            <p>Lun-Ven: 8:00 - 20:00</p>
            <p>Sab: 8:00 - 13:00</p>
          </div>
        </div>
        <div class="footer-bottom">
          <p>&copy; 2025 GestMed. Tutti i diritti riservati.</p>
        </div>
      </footer>
    </div>

    <Toast />
    <ConfirmDialog />
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useUserStore } from './stores/user'

const userStore = useUserStore()

onMounted(() => {
  // Applica il tema dark
  document.documentElement.classList.add('dark-mode')
  document.body.classList.add('dark-mode')
  
  // Inizializzazione dell'app
  console.log('GestMed User App avviata')
})
</script>

<style scoped>
.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  background-color: var(--primary-500);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--border-color);
  padding: 1rem 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 1000;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.app-title {
  color: var(--primary-color);
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
}

.navigation {
  display: flex;
  gap: 2rem;
  flex: 1;
  justify-content: center;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-color-secondary);
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  transition: all 0.3s ease;
  font-weight: 500;
}

.nav-link:hover {
  color: var(--primary-color);
  background-color: rgba(184, 134, 11, 0.1);
}

.nav-link.router-link-active {
  color: var(--primary-color);
  background-color: rgba(184, 134, 11, 0.2);
}

.user-section {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.user-avatar {
  background-color: var(--primary-color);
  color: white;
}

.user-name {
  color: var(--text-color);
  font-weight: 500;
}

.app-main {
  flex: 1;
  padding: 1.5rem 0;
  background-color: var(--background-color);
}

.app-footer {
  background-color: var(--surface-800);
  color: var(--surface-100);
  padding: 2rem 0 1rem;
  margin-top: auto;
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
}

.footer-section h3,
.footer-section h4 {
  color: var(--primary-color);
  margin-bottom: 1rem;
}

.footer-section p {
  color: var(--surface-300);
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.footer-bottom {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem 2rem 0;
  border-top: 1px solid var(--border-color);  text-align: center;
  color: var(--surface-400);
}

@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: 1rem;
    padding: 0 1rem;
  }

  .logo-section {
    order: 1;
  }

  .navigation {
    order: 3;
    justify-content: center;
    flex-wrap: wrap;
    gap: 0.5rem;
    width: 100%;
  }

  .nav-link {
    padding: 0.5rem 0.75rem;
    font-size: 0.875rem;
  }

  .user-section {
    order: 2;
  }

  .app-main {
    padding: 1rem 0;
  }

  .footer-content {
    padding: 0 1rem;
    text-align: center;
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  .footer-bottom {
    padding: 1rem 1rem 0;
  }
}

@media (max-width: 480px) {
  .header-content {
    padding: 0 0.5rem;
  }

  .app-title {
    font-size: 1.25rem;
  }

  .nav-link {
    padding: 0.5rem;
    font-size: 0.8rem;
  }

  .footer-content {
    padding: 0 0.5rem;
  }
}
</style>
