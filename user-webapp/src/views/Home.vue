<template>
  <div class="home-page">
    <!-- Hero Section -->
    <section class="hero-section">
      <div class="hero-content">
        <div class="hero-text">
          <h1 class="hero-title">
            Benvenuto in <span class="text-primary">GestMed</span>
          </h1>
          <p class="hero-subtitle">
            Il tuo centro medico di fiducia. Prenota facilmente i nostri servizi sanitari
            con pochi click e gestisci le tue visite in modo semplice e veloce.
          </p>
          <div class="hero-actions">
            <Button
              label="Esplora i Servizi"
              icon="pi pi-arrow-right"
              class="p-button-lg hero-button"
              @click="goToServices"
            />
            <Button
              v-if="userStore.isLoggedIn"
              label="Le Mie Prenotazioni"
              icon="pi pi-calendar"
              class="p-button-lg p-button-secondary hero-button"
              @click="goToBookings"
            />
          </div>
        </div>
        <div class="hero-image">
          <i class="pi pi-heart-fill hero-icon" />
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section class="features-section">
      <div class="section-content">
        <h2 class="section-title">
          Perché scegliere GestMed
        </h2>
        <div class="features-grid">
          <Card class="feature-card">
            <template #content>
              <div class="feature-content">
                <i class="pi pi-clock feature-icon" />
                <h3>Prenotazione Rapida</h3>
                <p>Prenota i tuoi appuntamenti in pochi click, 24 ore su 24.</p>
              </div>
            </template>
          </Card>

          <Card class="feature-card">
            <template #content>
              <div class="feature-content">
                <i class="pi pi-users feature-icon" />
                <h3>Medici Qualificati</h3>
                <p>Il nostro team è composto da professionisti esperti e qualificati.</p>
              </div>
            </template>
          </Card>

          <Card class="feature-card">
            <template #content>
              <div class="feature-content">
                <i class="pi pi-shield feature-icon" />
                <h3>Sicurezza Garantita</h3>
                <p>I tuoi dati sono protetti con i più alti standard di sicurezza.</p>
              </div>
            </template>
          </Card>

          <Card class="feature-card">
            <template #content>
              <div class="feature-content">
                <i class="pi pi-mobile feature-icon" />
                <h3>Gestione Mobile</h3>
                <p>Accedi ai tuoi appuntamenti da qualsiasi dispositivo, ovunque tu sia.</p>
              </div>
            </template>
          </Card>
        </div>
      </div>
    </section>

    <!-- Services Preview Section -->
    <section class="services-preview-section">
      <div class="section-content">
        <h2 class="section-title">
          I Nostri Servizi
        </h2>
        <p class="section-subtitle">
          Offriamo una vasta gamma di servizi medici per prenderci cura della tua salute
        </p>

        <div v-if="!servicesStore.loading" class="services-preview mb-4">
          <Card v-for="service in featuredServices" :key="service.id" class="service-preview-card">
            <template #content>
              <div class="service-preview-content">
                <div class="service-header">
                  <h4>{{ service.name }}</h4>
                  <Tag :value="`€${service.price}`" class="service-price" severity="success" />
                </div>
                <p class="service-description">
                  {{ service.description }}
                </p>
                <div class="service-meta">
                  <span class="service-duration">
                    <i class="pi pi-clock" />
                    {{ service.duration_minutes }} min
                  </span>
                </div>
                <Button
                  label="Prenota Ora"
                  icon="pi pi-calendar-plus"
                  class="w-full mt-3"
                  @click="bookService(service.id)"
                />
              </div>
            </template>
          </Card>
        </div>
        <!-- <div v-if="servicesStore.loading" class="text-center mb-4">
          <ProgressSpinner />
        </div> -->
        <div class="text-center services-button-container">
          <Button
            label="Vedi Tutti i Servizi"
            icon="pi pi-arrow-right"
            class="p-button-outlined"
            @click="goToServices"
          />
        </div>
      </div>
    </section>

    <!-- Stats Section -->
    <section class="stats-section">
      <div class="section-content">
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-number">
              500+
            </div>
            <div class="stat-label">
              Pazienti Soddisfatti
            </div>
          </div>
          <div class="stat-item">
            <div class="stat-number">
              15+
            </div>
            <div class="stat-label">
              Specialisti
            </div>
          </div>
          <div class="stat-item">
            <div class="stat-number">
              20+
            </div>
            <div class="stat-label">
              Servizi Medici
            </div>
          </div>
          <div class="stat-item">
            <div class="stat-number">
              10+
            </div>
            <div class="stat-label">
              Anni di Esperienza
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useServicesStore } from '../stores/services'
import { useUserStore } from '../stores/user'

const router = useRouter()
const servicesStore = useServicesStore()
const userStore = useUserStore()

const featuredServices = computed(() => {
  return servicesStore.services.slice(0, 3)
})

const goToServices = () => {
  router.push('/services')
}

const goToBookings = () => {
  router.push('/my-bookings')
}

const bookService = (serviceId) => {
  router.push(`/book/${serviceId}`)
}

onMounted(async () => {
  await servicesStore.fetchServices()
})
</script>

<style scoped>
.home-page {
  width: 100%;
}

.hero-section {
  background: linear-gradient(135deg, var(--background-color) 0%, var(--surface-color) 100%);
  padding: 4rem 0;
  min-height: 60vh;
  display: flex;
  align-items: center;
}

.hero-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4rem;
  align-items: center;
}

.hero-title {
  font-size: 3rem;
  font-weight: 700;
  margin-bottom: 1rem;
  color: var(--text-color);
  line-height: 1.2;
}

.text-primary {
  color: var(--primary-color);
}

.hero-subtitle {
  font-size: 1.2rem;
  color: var(--text-color-secondary);
  margin-bottom: 2rem;
  line-height: 1.6;
}

.hero-actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.hero-button {
  min-width: 200px;
}

.hero-image {
  display: flex;
  justify-content: center;
  align-items: center;
}

.hero-icon {
  font-size: 12rem;
  color: var(--primary-color);
  opacity: 0.8;
}

.features-section,
.services-preview-section,
.stats-section {
  padding: 4rem 0;
}

.section-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem;
}

.section-title {
  font-size: 2.5rem;
  font-weight: 700;
  text-align: center;
  margin-bottom: 1rem;
  color: var(--text-color);
}

.section-subtitle {
  font-size: 1.1rem;
  text-align: center;
  margin-bottom: 3rem;
  color: var(--text-color-secondary);
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
  margin-top: 3rem;
}

.feature-card {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.4);
}

.feature-content {
  text-align: center;
  padding: 1rem;
}

.feature-icon {
  font-size: 3rem;
  color: var(--primary-color);
  margin-bottom: 1rem;
}

.feature-content h3 {
  font-size: 1.3rem;
  margin-bottom: 1rem;
  color: var(--text-color);
}

.feature-content p {
  color: var(--text-color-secondary);
  line-height: 1.6;
}

.services-preview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 2rem;
  margin-top: 3rem;
}

.service-preview-card {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.service-preview-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.4);
}

.service-preview-content {
  padding: 1rem;
}

.service-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.service-header h4 {
  font-size: 1.2rem;
  color: var(--text-color);
  margin: 0;
}

.service-price {
  background-color: var(--success-color);
}

.service-description {
  color: var(--text-color-secondary);
  margin-bottom: 1rem;
  line-height: 1.5;
}

.service-meta {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.service-duration {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-color-secondary);
  font-size: 0.9rem;
}

.services-button-container {
  margin-top: 1rem;
}

.stats-section {
  background-color: var(--surface-color);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 2rem;
}

.stat-item {
  text-align: center;
  padding: 1rem;
}

.stat-number {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--primary-color);
  margin-bottom: 0.5rem;
}

.stat-label {
  font-size: 1rem;
  color: var(--text-color-secondary);
}

@media (max-width: 768px) {
  .hero-content {
    grid-template-columns: 1fr;
    gap: 2rem;
    text-align: center;
    padding: 0 1rem;
  }

  .hero-title {
    font-size: 2.2rem;
  }

  .hero-subtitle {
    font-size: 1.1rem;
  }

  .hero-icon {
    font-size: 8rem;
  }

  .hero-actions {
    justify-content: center;
    flex-direction: column;
    align-items: center;
  }

  .hero-button {
    min-width: auto;
    width: 100%;
    max-width: 280px;
  }

  .section-content {
    padding: 0 1rem;
  }

  .section-title {
    font-size: 2rem;
  }

  .features-grid,
  .services-preview {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }

  .stat-number {
    font-size: 2rem;
  }
}

@media (max-width: 480px) {
  .hero-title {
    font-size: 1.8rem;
  }

  .hero-subtitle {
    font-size: 1rem;
  }

  .hero-icon {
    font-size: 6rem;
  }

  .section-title {
    font-size: 1.5rem;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .stat-number {
    font-size: 1.8rem;
  }
}
</style>
