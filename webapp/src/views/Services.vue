<template>
  <DashboardLayout>
    <div class="services-page">
      <!-- Header with search and add button -->
      <div class="page-header">
        <div class="search-section">
          <div class="p-inputgroup">
            <InputText v-model="searchQuery" placeholder="Cerca servizi per nome o descrizione..." class="search-input"
              @input="debouncedSearch" />
            <Button icon="pi pi-search" class="p-button-primary" @click="searchServices" />
          </div>
          <!-- Filtri -->
          <div class="filters">
            <Select v-model="selectedDoctor" :options="doctorOptions" option-label="label" option-value="value"
              placeholder="Filtra per medico" class="doctor-filter" :show-clear="true" @change="applyFilters" />

            <Select v-model="selectedStatus" :options="statusOptions" option-label="label" option-value="value"
              placeholder="Stato servizio" class="status-filter" @change="applyFilters" />

            <Select v-model="selectedBookingType" :options="bookingTypeOptions" option-label="label"
              option-value="value" placeholder="Tipo prenotazione" class="booking-type-filter" :show-clear="true"
              @change="applyFilters" />
          </div>
        </div>

        <Button label="Nuovo Servizio" icon="pi pi-plus" class="p-button-primary" @click="openNewServiceDialog" />
      </div>

      <!-- Services Table -->
      <div class="table-container custom-card">
        <DataTable :value="filteredServices" :loading="isLoading" paginator :rows="10"
          :rows-per-page-options="[10, 25, 50]" responsive-layout="scroll" empty-message="Nessun servizio trovato"
          class="services-table">
          <Column field="name" header="Nome Servizio" sortable>
            <template #body="{ data }">
              <div class="service-name">
                <i class="pi pi-briefcase" />
                {{ data.name }}
                <Tag v-if="!data.is_active" value="Disattivo" severity="warning" class="ml-2" />
              </div>
            </template>
          </Column>

          <Column field="description" header="Descrizione">
            <template #body="{ data }">
              <span class="service-description" :title="data.description">
                {{ truncateText(data.description, 50) }}
              </span>
            </template>
          </Column>

          <Column field="doctor_name" header="Medico" sortable>
            <template #body="{ data }">
              <div class="doctor-info">
                <i class="pi pi-user-plus" />
                Dr. {{ getDoctorName(data.doctor_id) }}
              </div>
            </template>
          </Column>

          <Column field="duration_minutes" header="Durata" sortable>
            <template #body="{ data }">
              <Tag :value="`${data.duration_minutes} min`" class="duration-tag" />
            </template>
          </Column>

          <Column field="price" header="Prezzo" sortable>
            <template #body="{ data }">
              <span class="price-value">€ {{ formatPrice(data.price) }}</span>
            </template>
          </Column>
          <Column header="Stato">
            <template #body="{ data }">
              <Tag :value="data.is_active ? 'Attivo' : 'Disattivo'"
                :severity="data.is_active ? 'success' : 'warning'" />
            </template>
          </Column>

          <Column header="Prenotazione Esterna">
            <template #body="{ data }">
              <Tag v-if="data.is_external_bookable" value="Prenotabile" severity="info" icon="pi pi-globe" />
              <Tag v-else value="Solo interna" severity="secondary" icon="pi pi-lock" />
            </template>
          </Column>

          <Column header="Azioni" :exportable="false" style="min-width: 150px;">
            <template #body="{ data }">
              <div class="action-buttons">
                <Button v-tooltip.top="'Visualizza'" icon="pi pi-eye" class="p-button-rounded p-button-text p-button-sm"
                  @click="viewService(data)" />
                <Button v-tooltip.top="'Modifica'" icon="pi pi-pencil"
                  class="p-button-rounded p-button-text p-button-sm" @click="editService(data)" />
                <Button v-tooltip.top="'Elimina'" icon="pi pi-trash"
                  class="p-button-rounded p-button-text p-button-sm p-button-danger" :disabled="!canDeleteService(data)"
                  @click="confirmDeleteService(data)" />
              </div>
            </template>
          </Column>
        </DataTable>
      </div>

      <!-- Service Form Dialog -->
      <ServiceForm :visible="showServiceDialog" :service="currentService" @update:visible="showServiceDialog = $event"
        @saved="onServiceSaved" />

      <!-- Service Detail Dialog -->
      <Dialog v-model:visible="showDetailDialog" header="Dettagli Servizio" modal :style="{ width: '500px' }"
        class="service-detail-dialog">
        <div v-if="currentService" class="service-details">
          <div class="detail-group">
            <label>Nome Servizio</label>
            <span>{{ currentService.name }}</span>
          </div>

          <div class="detail-group">
            <label>Descrizione</label>
            <span>{{ currentService.description || 'Nessuna descrizione' }}</span>
          </div>

          <div class="detail-row">
            <div class="detail-group">
              <label>Durata</label>
              <span>{{ currentService.duration_minutes }} minuti</span>
            </div>

            <div class="detail-group">
              <label>Prezzo</label>
              <span>€ {{ formatPrice(currentService.price) }}</span>
            </div>
          </div>

          <div class="detail-group">
            <label>Medico</label>
            <span>Dr. {{ getDoctorName(currentService.doctor_id) }}</span>
          </div>
          <div class="detail-group">
            <label>Stato</label>
            <Tag :value="currentService.is_active ? 'Attivo' : 'Disattivo'"
              :severity="currentService.is_active ? 'success' : 'warning'" />
          </div>

          <div class="detail-group">
            <label>Prenotazione</label>
            <Tag v-if="currentService.is_external_bookable" value="Prenotabile esternamente" severity="info"
              icon="pi pi-globe" />
            <Tag v-else value="Solo prenotazione interna" severity="secondary" icon="pi pi-lock" />
          </div>

          <div class="detail-row">
            <div class="detail-group">
              <label>Creato il</label>
              <span>{{ formatDate(currentService.created_at) }}</span>
            </div>

            <div class="detail-group">
              <label>Aggiornato il</label>
              <span>{{ formatDate(currentService.updated_at) }}</span>
            </div>
          </div>
        </div>

        <template #footer>
          <Button label="Chiudi" icon="pi pi-times" class="p-button-text" @click="showDetailDialog = false" />
          <Button label="Modifica" icon="pi pi-pencil" class="p-button-primary" @click="editServiceFromDetail" />
        </template>
      </Dialog>

      <!-- Delete Confirmation Dialog -->
      <ConfirmDialog />
    </div>
  </DashboardLayout>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useConfirm } from 'primevue/useconfirm'
import { useServicesStore } from '../stores/services'
import { useDoctorsStore } from '../stores/doctors'
import DashboardLayout from '../components/DashboardLayout.vue'
import ServiceForm from '../components/ServiceForm.vue'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import Dialog from 'primevue/dialog'
import Tag from 'primevue/tag'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import ConfirmDialog from 'primevue/confirmdialog'

// Stores
const servicesStore = useServicesStore()
const doctorsStore = useDoctorsStore()
const confirm = useConfirm()

// State
const searchQuery = ref('')
const selectedDoctor = ref(null)
const selectedStatus = ref(null) // Default: show all services
const selectedBookingType = ref(null)
const showServiceDialog = ref(false)
const showDetailDialog = ref(false)
const currentService = ref(null)
const searchTimeout = ref(null)

// Computed
const isLoading = computed(() => doctorsStore.isLoading || false)
const filteredServices = computed(() => servicesStore.filteredServices)

const doctorOptions = computed(() => {
  const options = [{ label: 'Tutti i medici', value: null }]
  doctorsStore.allDoctors.forEach(doctor => {
    options.push({
      label: `Dr. ${doctor.name} - ${doctor.specialization}`,
      value: doctor.id
    })
  })
  return options
})

const statusOptions = ref([
  { label: 'Tutti i servizi', value: null },
  { label: 'Solo attivi', value: true },
  { label: 'Solo disattivi', value: false }
])

const bookingTypeOptions = ref([
  { label: 'Tutti i tipi', value: null },
  { label: 'Prenotabili esternamente', value: true },
  { label: 'Solo prenotazione interna', value: false }
])

// Methods
function truncateText(text, maxLength) {
  if (!text) return ''
  return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text
}

function getDoctorName(doctorId) {
  const doctor = doctorsStore.allDoctors.find(d => d.id === doctorId)
  return doctor ? doctor.name : 'Sconosciuto'
}

function formatPrice(price) {
  return parseFloat(price).toFixed(2)
}

function formatDate(dateString) {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('it-IT', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function canDeleteService(_service) {
  // Per ora permettiamo sempre l'eliminazione, l'API gestirà il controllo
  return true
}

function debouncedSearch() {
  if (searchTimeout.value) {
    window.clearTimeout(searchTimeout.value)
  }
  searchTimeout.value = window.setTimeout(() => {
    searchServices()
  }, 300)
}

function searchServices() {
  applyFilters()
}

function applyFilters() {
  servicesStore.setFilters({
    search: searchQuery.value,
    doctor_id: selectedDoctor.value,
    is_active: selectedStatus.value,
    is_external_bookable: selectedBookingType.value
  })
}

function openNewServiceDialog() {
  currentService.value = null
  showServiceDialog.value = true
}

function viewService(service) {
  currentService.value = service
  showDetailDialog.value = true
}

function editService(service) {
  currentService.value = service
  showServiceDialog.value = true
}

function editServiceFromDetail() {
  showDetailDialog.value = false
  showServiceDialog.value = true
}

function confirmDeleteService(service) {
  confirm.require({
    message: `Sei sicuro di voler eliminare il servizio "${service.name}"?`,
    header: 'Conferma Eliminazione',
    icon: 'pi pi-exclamation-triangle',
    rejectClass: 'p-button-text',
    rejectLabel: 'Annulla',
    acceptLabel: 'Elimina',
    acceptClass: 'p-button-danger',
    accept: () => deleteService(service.id)
  })
}

async function deleteService(serviceId) {
  try {
    await servicesStore.deleteService(serviceId)
  } catch (error) {
    console.error('Error deleting service:', error)
  }
}

async function onServiceSaved() {
  await loadServices()
}

async function loadServices() {
  try {
    await servicesStore.fetchServices()
  } catch (error) {
    console.error('Error loading services:', error)
  }
}

async function loadDoctors() {
  try {
    await doctorsStore.fetchDoctors()
  } catch (error) {
    console.error('Error loading doctors:', error)
  }
}

// Watchers
watch([selectedDoctor, selectedStatus], () => {
  applyFilters()
})

// Lifecycle
onMounted(async () => {
  await Promise.all([
    loadServices(),
    loadDoctors()
  ])
})
</script>

<style scoped>
.services-page {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  height: 100%;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  flex-wrap: wrap;
}

.search-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  flex: 1;
}

.p-inputgroup {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.search-input {
  min-width: 300px;
}

.filters {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.doctor-filter,
.status-filter {
  min-width: 200px;
}

.table-container {
  flex: 1;
  overflow: auto;
}

.services-table {
  min-width: 800px;
}

.service-name {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
}

.service-name i {
  color: var(--primary-color);
}

.service-description {
  color: var(--text-color-secondary);
  font-style: italic;
}

.doctor-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.doctor-info i {
  color: var(--primary-color);
}

.duration-tag {
  background: var(--surface-ground);
  color: var(--text-color);
}

.price-value {
  font-weight: 600;
  color: var(--green-600);
}

.action-buttons {
  display: flex;
  gap: 0.25rem;
}

.service-details {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.detail-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.detail-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.detail-group label {
  font-weight: 600;
  color: var(--text-color-secondary);
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.detail-group span {
  color: var(--text-color);
  font-size: 1rem;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: stretch;
  }

  .search-section {
    min-width: auto;
  }

  .filters {
    flex-direction: column;
  }

  .doctor-filter,
  .status-filter,
  .booking-type-filter {
    min-width: auto;
  }

  .detail-row {
    grid-template-columns: 1fr;
  }
}

.custom-card {
  background: var(--surface-card);
  border-radius: 12px;
  border: 1px solid var(--surface-border);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
</style>
