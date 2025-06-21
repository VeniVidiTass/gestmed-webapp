<template>
  <div class="my-bookings-page">
    <div class="page-content">
      <!-- Page Header -->
      <div class="page-header">
        <h1>Le Mie Prenotazioni</h1>
        <p>Gestisci i tuoi appuntamenti e visualizza lo storico delle visite</p>
      </div>

      <!-- Quick Actions -->
      <Card class="quick-actions-card">
        <template #content>
          <div class="quick-actions">
            <Button label="Nuova Prenotazione" icon="pi pi-plus" @click="goToServices" />
            <Button
              label="Aggiorna"
              icon="pi pi-refresh"
              class="p-button-outlined"
              :loading="bookingsStore.loading"
              @click="loadBookings"
            />
          </div>
        </template>
      </Card>

      <!-- Loading State -->
      <div v-if="bookingsStore.loading" class="loading-container">
        <ProgressSpinner />
        <p>Caricamento prenotazioni...</p>
      </div>

      <!-- Error State -->
      <Card v-else-if="bookingsStore.error" class="error-card">
        <template #content>
          <div class="error-content">
            <i class="pi pi-exclamation-triangle error-icon" />
            <h3>Errore nel caricamento</h3>
            <p>{{ bookingsStore.error }}</p>
            <Button label="Riprova" icon="pi pi-refresh" @click="loadBookings" />
          </div>
        </template>
      </Card>

      <!-- Empty State -->
      <Card v-else-if="bookingsStore.bookings.length === 0" class="empty-state-card">
        <template #content>
          <div class="empty-state">
            <i class="pi pi-calendar empty-icon" />
            <h3>Nessuna prenotazione trovata</h3>
            <p>Non hai ancora effettuato nessuna prenotazione.</p>
            <Button label="Prenota il tuo primo servizio" icon="pi pi-plus" @click="goToServices" />
          </div>
        </template>
      </Card>

      <!-- Bookings List -->
      <div v-else class="bookings-section">
        <!-- Upcoming Bookings -->
        <div v-if="upcomingBookings.length > 0" class="bookings-group">
          <h2 class="group-title">
            <i class="pi pi-calendar-plus" />
            Prossimi Appuntamenti
          </h2>
          <div class="bookings-grid">
            <Card v-for="booking in upcomingBookings" :key="booking.id" class="booking-card upcoming">
              <template #content>
                <div class="booking-content">
                  <div class="booking-header">
                    <h4>{{ booking.service_name || 'Servizio' }}</h4>
                    <Tag
                      :value="getStatusLabel(booking.status)"
                      :severity="getStatusSeverity(booking.status)"
                      class="booking-status"
                    />
                  </div>

                  <div class="booking-details">
                    <div class="detail-item">
                      <i class="pi pi-calendar" />
                      <span>{{ formatDate(booking.appointment_date) }}</span>
                    </div>
                    <div class="detail-item">
                      <i class="pi pi-clock" />
                      <span>{{ formatTime(booking.appointment_time || booking.appointment_date) }}</span>
                    </div>
                    <div v-if="booking.doctor_name" class="detail-item">
                      <i class="pi pi-user" />
                      <span>Dr. {{ booking.doctor_name }}</span>
                    </div>
                    <div v-if="booking.service_price" class="detail-item">
                      <i class="pi pi-euro" />
                      <span>€{{ booking.service_price }}</span>
                    </div>
                  </div>

                  <div v-if="booking.notes" class="booking-notes">
                    <strong>Note:</strong> {{ booking.notes }}
                  </div>

                  <div class="booking-actions">
                    <Button
                      v-if="canModifyBooking(booking)"
                      label="Modifica"
                      icon="pi pi-pencil"
                      class="p-button-sm p-button-outlined"
                      @click="editBooking(booking)"
                    />
                    <Button
                      v-if="canCancelBooking(booking)"
                      label="Cancella"
                      icon="pi pi-times"
                      class="p-button-sm p-button-danger p-button-outlined"
                      @click="confirmCancelBooking(booking)"
                    />
                  </div>
                </div>
              </template>
            </Card>
          </div>
        </div>

        <!-- Past Bookings -->
        <div v-if="pastBookings.length > 0" class="bookings-group">
          <h2 class="group-title">
            <i class="pi pi-history" />
            Storico Appuntamenti
          </h2>
          <div class="bookings-grid">
            <Card v-for="booking in pastBookings" :key="booking.id" class="booking-card past">
              <template #content>
                <div class="booking-content">
                  <div class="booking-header">
                    <h4>{{ booking.service_name || 'Servizio' }}</h4>
                    <Tag
                      :value="getStatusLabel(booking.status)"
                      :severity="getStatusSeverity(booking.status)"
                      class="booking-status"
                    />
                  </div>

                  <div class="booking-details">
                    <div class="detail-item">
                      <i class="pi pi-calendar" />
                      <span>{{ formatDate(booking.appointment_date) }}</span>
                    </div>
                    <div class="detail-item">
                      <i class="pi pi-clock" />
                      <span>{{ booking.appointment_time }}</span>
                    </div>
                    <div v-if="booking.doctor_name" class="detail-item">
                      <i class="pi pi-user" />
                      <span>Dr. {{ booking.doctor_name }}</span>
                    </div>
                  </div>

                  <div class="booking-actions">
                    <Button
                      label="Prenota di nuovo"
                      icon="pi pi-refresh"
                      class="p-button-sm p-button-outlined"
                      @click="rebookService(booking)"
                    />
                  </div>
                </div>
              </template>
            </Card>
          </div>
        </div>
      </div>
    </div>

    <!-- Cancel Confirmation Dialog -->
    <Dialog
      v-model:visible="showCancelDialog"
      modal
      header="Conferma Cancellazione"
      class="cancel-dialog"
    >
      <div class="dialog-content">
        <div class="warning-message">
          <i class="pi pi-exclamation-triangle warning-icon" />
          <div>
            <p><strong>Sei sicuro di voler cancellare questa prenotazione?</strong></p>
            <p v-if="bookingToCancel">
              {{ bookingToCancel.service_name }} - {{ formatDate(bookingToCancel.appointment_date) }}
              alle {{ bookingToCancel.appointment_time }}
            </p>
            <p class="warning-text">
              Questa azione non può essere annullata.
            </p>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="dialog-actions">
          <Button
            label="Annulla"
            icon="pi pi-times"
            class="p-button-text"
            @click="showCancelDialog = false"
          />
          <Button
            label="Conferma Cancellazione"
            icon="pi pi-check"
            class="p-button-danger"
            :loading="cancelling"
            @click="cancelBooking"
          />
        </div>
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useBookingsStore } from '../stores/bookings'
import { useUserStore } from '../stores/user'
import { useToast } from 'primevue/usetoast'

const router = useRouter()
const bookingsStore = useBookingsStore()
const userStore = useUserStore()
const toast = useToast()

// Reactive data
const showCancelDialog = ref(false)
const bookingToCancel = ref(null)
const cancelling = ref(false)

// Computed properties
const upcomingBookings = computed(() => {
  const now = new Date()
  return bookingsStore.bookings.filter(booking => {
    const appointmentDate = new Date(booking.appointment_date)
    return appointmentDate >= now && booking.status !== 'cancelled'
  }).sort((a, b) => new Date(a.appointment_date) - new Date(b.appointment_date))
})

const pastBookings = computed(() => {
  const now = new Date()
  return bookingsStore.bookings.filter(booking => {
    const appointmentDate = new Date(booking.appointment_date)
    return appointmentDate < now || booking.status === 'cancelled' || booking.status === 'completed'
  }).sort((a, b) => new Date(b.appointment_date) - new Date(a.appointment_date))
})

// Methods
const loadBookings = async () => {
  if (userStore.user?.id) {
    await bookingsStore.fetchUserBookings(userStore.user.id)
  }
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

const formatTime = (dateString) => {
  return new Date(dateString).toLocaleTimeString('it-IT', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getStatusLabel = (status) => {
  const statusLabels = {
    'scheduled': 'Programmato',
    'confirmed': 'Confermato',
    'completed': 'Completato',
    'cancelled': 'Cancellato',
    'no-show': 'Non presentato'
  }
  return statusLabels[status] || status
}

const getStatusSeverity = (status) => {
  const severityMap = {
    'scheduled': 'info',
    'confirmed': 'success',
    'completed': 'success',
    'cancelled': 'danger',
    'no-show': 'warn'
  }
  return severityMap[status] || 'info'
}

const canModifyBooking = (booking) => {
  const appointmentDate = new Date(booking.appointment_date)
  const now = new Date()
  const timeDiff = appointmentDate - now
  const hoursDiff = timeDiff / (1000 * 60 * 60)

  return booking.status === 'scheduled' && hoursDiff > 24
}

const canCancelBooking = (booking) => {
  const appointmentDate = new Date(booking.appointment_date)
  const now = new Date()
  const timeDiff = appointmentDate - now
  const hoursDiff = timeDiff / (1000 * 60 * 60)

  return booking.status !== 'cancelled' &&
    booking.status !== 'completed' &&
    hoursDiff > 2
}

const editBooking = (booking) => {
  // Per ora, reindirizza alla pagina di prenotazione del servizio
  router.push(`/book/${booking.service_id}`)
}

const confirmCancelBooking = (booking) => {
  bookingToCancel.value = booking
  showCancelDialog.value = true
}

const cancelBooking = async () => {
  if (!bookingToCancel.value) return

  cancelling.value = true

  try {
    await bookingsStore.cancelBooking(bookingToCancel.value.id)

    toast.add({
      severity: 'success',
      summary: 'Prenotazione cancellata',
      detail: 'La prenotazione è stata cancellata con successo.',
      life: 3000
    })

    showCancelDialog.value = false
    bookingToCancel.value = null

  } catch (e) {
    toast.add({
      severity: 'error',
      summary: 'Errore',
      detail: `Impossibile cancellare la prenotazione. Riprova più tardi.${e.message}`,
      life: 5000
    })
  } finally {
    cancelling.value = false
  }
}

const rebookService = (booking) => {
  router.push(`/book/${booking.service_id}`)
}

const goToServices = () => {
  router.push('/services')
}

// Lifecycle
onMounted(() => {
  loadBookings()
})
</script>

<style scoped>
.my-bookings-page {
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

.quick-actions-card {
  margin-bottom: 2rem;
}

.quick-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
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
.empty-state-card {
  margin: 2rem 0;
}

.error-content,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 1rem;
  padding: 1.5rem;
}

.error-icon,
.empty-icon {
  font-size: 3rem;
  color: var(--error-color);
}

.empty-icon {
  color: var(--text-color-secondary);
}

.bookings-section {
  display: flex;
  flex-direction: column;
  gap: 3rem;
}

.bookings-group {
  width: 100%;
}

.group-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.5rem;
  color: var(--text-color);
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid var(--primary-color);
}

.group-title i {
  color: var(--primary-color);
}

.bookings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 1.5rem;
}

.booking-card {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.booking-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.3);
}

.booking-card.upcoming {
  border-left: 4px solid var(--primary-color);
}

.booking-card.past {
  border-left: 4px solid var(--text-color-secondary);
  opacity: 0.8;
}

.booking-content {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.booking-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.booking-header h4 {
  font-size: 1.2rem;
  color: var(--text-color);
  margin: 0;
  line-height: 1.3;
}

.booking-details {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-color-secondary);
  font-size: 0.9rem;
}

.detail-item i {
  color: var(--primary-color);
  width: 16px;
}

.booking-notes {
  background-color: rgba(184, 134, 11, 0.1);
  padding: 0.75rem;
  border-radius: 6px;
  border-left: 3px solid var(--primary-color);
  font-size: 0.9rem;
  color: var(--text-color-secondary);
}

.booking-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-top: auto;
}

.cancel-dialog .dialog-content {
  padding: 1rem 0;
}

.warning-message {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}

.warning-icon {
  font-size: 2rem;
  color: var(--warning-color);
  flex-shrink: 0;
}

.warning-text {
  color: var(--text-color-secondary);
  font-style: italic;
  margin-top: 0.5rem;
}

.dialog-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
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
  }

  .bookings-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .booking-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .booking-status {
    align-self: flex-end;
  }

  .dialog-actions {
    flex-direction: column;
    gap: 0.5rem;
  }

  .quick-actions {
    flex-direction: column;
    gap: 0.75rem;
  }

  .group-title {
    font-size: 1.3rem;
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

  .booking-header h4 {
    font-size: 1.1rem;
  }

  .detail-item {
    font-size: 0.85rem;
  }

  .booking-notes {
    font-size: 0.85rem;
    padding: 0.5rem;
  }

  .group-title {
    font-size: 1.2rem;
  }

  .warning-message {
    flex-direction: column;
    gap: 0.75rem;
    text-align: center;
  }
}
</style>
