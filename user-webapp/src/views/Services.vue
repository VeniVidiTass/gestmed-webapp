<template>
  <div class="services-page">
    <div class="page-content">
      <!-- Page Header -->
      <div class="page-header">
        <h1>I Nostri Servizi Medici</h1>
        <p>Scegli tra la nostra ampia gamma di servizi sanitari specializzati</p>
      </div>

      <!-- Filters -->
      <Card class="filters-card">
        <template #content>
          <div class="filters-content">
            <div class="search-section">
              <FloatLabel>
                <InputText 
                  id="search"
                  v-model="searchQuery" 
                  class="w-full large-input"
                />
                <label for="search">Cerca servizi...</label>
              </FloatLabel>
            </div>
        
            <div class="filter-section">
              <FloatLabel>
                <Select
                  id="priceFilter"
                  v-model="selectedPriceRange"
                  :options="priceRanges"
                  option-label="label"
                  option-value="value"
                  class="w-full large-select"
                />
                <label for="priceFilter">Fascia di prezzo</label>
              </FloatLabel>
            </div>

            <div class="filter-section">
              <FloatLabel>
                <Select
                  id="durationFilter"
                  v-model="selectedDurationRange"
                  :options="durationRanges"
                  option-label="label"
                  option-value="value"
                  class="w-full large-select"
                />
                <label for="durationFilter">Durata</label>
              </FloatLabel>
            </div>

            <Button 
              label="Reset Filtri" 
              icon="pi pi-refresh"
              class="p-button-outlined large-button"
              @click="resetFilters"
            />
          </div>
        </template>
      </Card>

      <!-- Loading State -->
      <div
        v-if="servicesStore.loading"
        class="loading-container"
      >
        <ProgressSpinner />
        <p>Caricamento servizi...</p>
      </div>

      <!-- Error State -->
      <Card
        v-else-if="servicesStore.error"
        class="error-card"
      >
        <template #content>
          <div class="error-content">
            <i class="pi pi-exclamation-triangle error-icon" />
            <h3>Errore nel caricamento</h3>
            <p>{{ servicesStore.error }}</p>
            <Button 
              label="Riprova" 
              icon="pi pi-refresh"
              @click="loadServices"
            />
          </div>
        </template>
      </Card>

      <!-- Services Grid -->
      <div
        v-else-if="filteredServices.length > 0"
        class="services-grid"
      >
        <Card 
          v-for="service in filteredServices" 
          :key="service.id"
          class="service-card"
        >
          <template #content>
            <div class="service-content">
              <!-- Service Header -->
              <div class="service-header">
                <h3>{{ service.name }}</h3>
                <Tag 
                  :value="`€${service.price}`" 
                  class="service-price"
                  severity="success"
                />
              </div>

              <!-- Service Description -->
              <p class="service-description">
                {{ service.description }}
              </p>

              <!-- Service Meta Info -->
              <div class="service-meta">
                <div class="meta-item">
                  <i class="pi pi-clock" />
                  <span>{{ service.duration_minutes }} minuti</span>
                </div>
                <div
                  v-if="service.doctor_name"
                  class="meta-item"
                >
                  <i class="pi pi-user" />
                  <span>{{ service.doctor_name }}</span>
                </div>
              </div>

              <!-- Service Tags -->
              <div
                v-if="service.category"
                class="service-tags"
              >
                <Chip
                  :label="service.category"
                  class="service-category"
                />
              </div>

              <!-- Action Button -->
              <Button 
                label="Prenota Ora" 
                icon="pi pi-calendar-plus"
                class="w-full book-button"
                @click="bookService(service.id)"
              />
            </div>
          </template>
        </Card>
      </div>

      <!-- No Results -->
      <Card
        v-else
        class="no-results-card"
      >
        <template #content>
          <div class="no-results-content">
            <i class="pi pi-search no-results-icon" />
            <h3>Nessun servizio trovato</h3>
            <p>Prova a modificare i filtri di ricerca o rimuovili per vedere tutti i servizi disponibili.</p>
            <Button 
              label="Mostra Tutti i Servizi" 
              icon="pi pi-list"
              class="p-button-outlined"
              @click="resetFilters"
            />
          </div>
        </template>
      </Card>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useServicesStore } from '../stores/services'
import { useToast } from 'primevue/usetoast'

const router = useRouter()
const servicesStore = useServicesStore()
const toast = useToast()

// Reactive data
const searchQuery = ref('')
const selectedPriceRange = ref(null)
const selectedDurationRange = ref(null)

// Filter options
const priceRanges = [
  { label: 'Tutti i prezzi', value: null },
  { label: 'Fino a €50', value: { min: 0, max: 50 } },
  { label: '€50 - €100', value: { min: 50, max: 100 } },
  { label: '€100 - €200', value: { min: 100, max: 200 } },
  { label: 'Oltre €200', value: { min: 200, max: Infinity } }
]

const durationRanges = [
  { label: 'Tutte le durate', value: null },
  { label: 'Fino a 30 min', value: { min: 0, max: 30 } },
  { label: '30 - 60 min', value: { min: 30, max: 60 } },
  { label: '60 - 120 min', value: { min: 60, max: 120 } },
  { label: 'Oltre 120 min', value: { min: 120, max: Infinity } }
]

// Computed properties
const filteredServices = computed(() => {
  let filtered = [...servicesStore.services]

  // Search filter
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(service => 
      service.name.toLowerCase().includes(query) ||
      service.description.toLowerCase().includes(query) ||
      (service.doctor_name && service.doctor_name.toLowerCase().includes(query))
    )
  }

  // Price filter
  if (selectedPriceRange.value) {
    const { min, max } = selectedPriceRange.value
    filtered = filtered.filter(service => {
      const price = parseFloat(service.price)
      return price >= min && price <= max
    })
  }

  // Duration filter
  if (selectedDurationRange.value) {
    const { min, max } = selectedDurationRange.value
    filtered = filtered.filter(service => {
      const duration = parseInt(service.duration_minutes)
      return duration >= min && duration <= max
    })
  }

  return filtered
})

const resetFilters = () => {
  searchQuery.value = ''
  selectedPriceRange.value = null
  selectedDurationRange.value = null
}

const bookService = (serviceId) => {
  router.push(`/book/${serviceId}`)
}

const loadServices = async () => {
  try {
    await servicesStore.fetchServices()
  } catch (e) {
    toast.add({
      severity: 'error',
      summary: 'Errore',
      detail: `Impossibile caricare i servizi. Riprova più tardi.${  e.message}`,
      life: 5000
    })
  }
}

// Lifecycle
onMounted(() => {
  loadServices()
})
</script>

<style scoped>
.services-page {
  min-height: 100vh;
}

.page-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.5rem;
}

.page-header {
  text-align: center;
  margin-bottom: 2rem;
}

.page-header h1 {
  font-size: 2.5rem;
  color: var(--text-color);
  margin-bottom: 0.5rem;
}

.page-header p {
  font-size: 1.1rem;
  color: var(--text-color-secondary);
}

.filters-card {
  margin-bottom: 2rem;
}

.filters-card .p-card-content {
  padding: 1.5rem;
}

.filters-content {
  display: flex;
  align-items: flex-end;
  gap: 1.25rem;
  width: 100%;
}

.search-section,
.filter-section {
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.search-section {
  flex: 2;
}

.search-section .p-inputtext,
.filter-section .p-select,
.large-input,
.large-select {
  height: 3rem;
  width: 100%;
}

.filters-content .p-button,
.large-button {
  height: 3rem;
  padding: 0 1.5rem;
  white-space: nowrap;
  flex-shrink: 0;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  color: var(--text-color-secondary);
}

.error-card,
.no-results-card {
  margin: 2rem 0;
}

.error-content,
.no-results-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 1rem;
  padding: 1.5rem;
}

.error-icon,
.no-results-icon {
  font-size: 3rem;
  color: var(--error-color);
}

.no-results-icon {
  color: var(--text-color-secondary);
}

.services-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.service-card {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  height: fit-content;
}

.service-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.4);
}

.service-content {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  height: 100%;
}

.service-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.service-header h3 {
  font-size: 1.3rem;
  color: var(--text-color);
  margin: 0;
  line-height: 1.3;
}

.service-price {
  background-color: var(--success-color);
  flex-shrink: 0;
}

.service-description {
  color: var(--text-color-secondary);
  line-height: 1.5;
  flex-grow: 1;
}

.service-meta {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-color-secondary);
  font-size: 0.9rem;
}

.meta-item i {
  color: var(--primary-color);
  width: 16px;
}

.service-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.service-category {
  background-color: var(--primary-color);
  color: white;
}

.book-button {
  margin-top: auto;
  background-color: var(--primary-600) !important;
  border-color: var(--primary-600) !important;
  font-weight: 600;
  transition: all 0.3s ease;
}

.book-button:hover {
  background-color: var(--primary-600) !important;
  border-color: var(--primary-600) !important;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px var(--primary-color-shadow);
}

@media (max-width: 768px) {
  .page-content {
    padding: 1rem;
  }

  .page-header h1 {
    font-size: 2rem;
  }

  .page-header p {
    font-size: 1rem;
  }  .filters-content {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }

  .search-section,
  .filter-section {
    flex: none;
  }

  .services-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .service-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .service-price {
    align-self: flex-end;
  }
}

@media (max-width: 1024px) and (min-width: 769px) {
  .filters-content {
    flex-wrap: wrap;
    gap: 1rem;
  }
  
  .search-section {
    flex: 1 1 100%;
  }

  .filter-section {
    flex: 1 1 calc(50% - 0.625rem);
  }

  .filters-content .p-button,
  .large-button {
    flex: 0 0 auto;
    align-self: flex-start;
    margin-top: 0.5rem;
  }
}

@media (max-width: 480px) {
  .page-content {
    padding: 0.75rem;
  }

  .page-header h1 {
    font-size: 1.75rem;
  }

  .page-header p {
    font-size: 0.9rem;
  }

  .service-header h3 {
    font-size: 1.1rem;
  }

  .service-description {
    font-size: 0.9rem;
  }

  .meta-item {
    font-size: 0.85rem;
  }
}
</style>
