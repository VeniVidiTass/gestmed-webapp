<template>
  <div class="home-page">
    <div class="hero-section">
      <div class="hero-content">
        <div class="logo-section">
          <i class="pi pi-heart text-primary" style="font-size: 4rem;"></i>
          <h1 class="hero-title text-primary">GestMed</h1>
          <p class="hero-subtitle">Sistema di Gestione per Strutture Sanitarie</p>
        </div>

        <div class="cta-section">
          <Button label="Accedi alla Dashboard" icon="pi pi-sign-in" class="p-button-lg cta-button"
            @click="goToDashboard" />
          <p class="login-note">Login demo - Clicca per accedere al sistema</p>
        </div>

        <!-- <div class="features-grid">
          <div class="feature-card custom-card">
            <i class="pi pi-users feature-icon text-primary"></i>
            <h3>Gestione Pazienti</h3>
            <p>Gestisci facilmente i dati dei pazienti con ricerca avanzata e storico medico completo.</p>
          </div>

          <div class="feature-card custom-card">
            <i class="pi pi-user-plus feature-icon text-primary"></i>
            <h3>Gestione Medici</h3>
            <p>Organizza il personale medico con specializzazioni e disponibilità in tempo reale.</p>
          </div>

          <div class="feature-card custom-card">
            <i class="pi pi-calendar feature-icon text-primary"></i>
            <h3>Calendario Prenotazioni</h3>
            <p>Sistema di prenotazioni integrato con vista calendario e gestione appuntamenti.</p>
          </div>

          <div class="feature-card custom-card">
            <i class="pi pi-chart-line feature-icon text-primary"></i>
            <h3>Dashboard Analytics</h3>
            <p>Visualizza statistiche e metriche in tempo reale per ottimizzare la gestione.</p>
          </div>
        </div> -->
      </div>
    </div>

    <footer class="home-footer">
      <div class="footer-content">
        <p>&copy; 2025 GestMed - Sistema di Gestione Sanitaria</p>
        <p class="text-primary">Sviluppato con Vue 3 + PrimeVue</p>
      </div>
    </footer>
  </div>
</template>

<script>
import { defineComponent } from 'vue'
import Button from 'primevue/button'

export default defineComponent({
  name: 'Home',
  components: {
    Button
  },
  methods: {
    goToDashboard() {
      this.$router.push('/dashboard')
    }
  }
})
</script>

<style scoped>
.home-page {
  min-height: 100vh;
  background: linear-gradient(135deg, var(--surface-50) 0%, var(--primary-50) 100%);
  display: flex;
  flex-direction: column;
}

.hero-section {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.hero-content {
  max-width: 1200px;
  text-align: center;
}

.logo-section {
  margin-bottom: 4rem;
}

.hero-title {
  font-size: 4rem;
  font-weight: 700;
  margin: 1rem 0 0.5rem 0;
  letter-spacing: -0.025em;
}

.hero-subtitle {
  font-size: 1.5rem;
  color: var(--text-color-secondary);
  margin-bottom: 0;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
  margin-bottom: 4rem;
}

.feature-card {
  padding: 2rem;
  text-align: center;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.feature-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.feature-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  display: block;
}

.feature-card h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 1rem;
}

.feature-card p {
  color: var(--text-color-secondary);
  line-height: 1.6;
}

.cta-section {
  margin-top: 2rem;
}

.cta-button {
  font-size: 1.125rem;
  padding: 1rem 2rem;
  margin-bottom: 1rem;
}

.login-note {
  color: var(--text-color-muted);
  font-style: italic;
}

.home-footer {
  background-color: var(--surface-0);
  border-top: 1px solid var(--surface-200);
  padding: 2rem;
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
  text-align: center;
}

.footer-content p {
  margin: 0.5rem 0;
}

.footer-content p:first-child {
  color: var(--text-color-secondary);
}

/* Responsive design */
@media (max-width: 768px) {
  .hero-title {
    font-size: 3rem;
  }

  .hero-subtitle {
    font-size: 1.25rem;
  }

  .features-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  .feature-card {
    padding: 1.5rem;
  }

  .hero-section {
    padding: 1rem;
  }
}
</style>
