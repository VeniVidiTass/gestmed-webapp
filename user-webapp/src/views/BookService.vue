<template>
  <div class="book-service-page">
    <div class="page-content">
      <!-- Loading State -->
      <div v-if="loading" class="loading-container">
        <ProgressSpinner />
        <p>Caricamento dettagli servizio...</p>
      </div>

      <!-- Error State -->
      <Card v-else-if="error" class="error-card">
        <template #content>
          <div class="error-content">
            <i class="pi pi-exclamation-triangle error-icon" />
            <h3>Errore</h3>
            <p>{{ error }}</p>
            <Button
              label="Torna ai Servizi"
              icon="pi pi-arrow-left"
              class="p-button-outlined"
              @click="goBack"
            />
          </div>
        </template>
      </Card>

      <!-- Booking Form -->
      <div v-else-if="service" class="booking-container">
        <div class="booking-layout">
          <!-- Service Details -->
          <Card class="service-details">
            <template #header>
              <div class="service-header-card">
                <Button icon="pi pi-arrow-left" class="p-button-text p-button-rounded" @click="goBack" />
                <h2>Dettagli Servizio</h2>
              </div>
            </template>
            <template #content>
              <div class="service-info">
                <h3>{{ service.name }}</h3>
                <p class="service-description">
                  {{ service.description }}
                </p>

                <div class="service-meta">
                  <div class="meta-row">
                    <i class="pi pi-clock" />
                    <span>Durata: {{ service.duration_minutes }} minuti</span>
                  </div>
                  <div class="meta-row">
                    <i class="pi pi-euro" />
                    <span>Prezzo: €{{ service.price }}</span>
                  </div>
                  <div v-if="service.doctor_name" class="meta-row">
                    <i class="pi pi-user" />
                    <span>Medico: Dr. {{ service.doctor_name }}</span>
                  </div>
                </div>
              </div>
            </template>
          </Card>

          <!-- Booking Form -->
          <Card class="booking-form">
            <template #header>
              <div class="booking-header-card">
                <h2>Prenota il tuo appuntamento</h2>
              </div>
            </template>
            <template #content>
              <form class="form-content" @submit.prevent="submitBooking">
                <!-- User Info (Read-only) -->
                <div class="form-section">
                  <h4>Informazioni Personali</h4>
                  <div class="user-info-readonly">
                    <div class="readonly-field">
                      <label>Nome Completo</label>
                      <div class="readonly-value">
                        {{ userStore.user?.name || 'Non specificato' }}
                      </div>
                    </div>

                    <div class="readonly-field">
                      <label>Email</label>
                      <div class="readonly-value">
                        {{ userStore.user?.email || 'Non specificato' }}
                      </div>
                    </div>

                    <div class="readonly-field">
                      <label>Telefono</label>
                      <div class="readonly-value">
                        {{ userStore.user?.phone || 'Non specificato' }}
                      </div>
                    </div>
                  </div>
                </div><!-- Doctor Information -->
                <div v-if="serviceDoctor" class="form-section">
                  <h4>Medico del Servizio</h4>
                  <div class="doctor-info-card">
                    <div class="doctor-details">
                      <h5>Dr. {{ serviceDoctor.name }}</h5>
                      <p class="doctor-specialization">
                        {{ serviceDoctor.specialization }}
                      </p>
                      <div class="doctor-contacts">
                        <div class="contact-item">
                          <i class="pi pi-envelope" />
                          <span>{{ serviceDoctor.email }}</span>
                        </div>
                        <div v-if="serviceDoctor.phone" class="contact-item">
                          <i class="pi pi-phone" />
                          <span>{{ serviceDoctor.phone }}</span>
                        </div>
                      </div>
                    </div>

                    <!-- Doctor Availability Display -->
                    <div v-if="orderedDoctorAvailability" class="doctor-availability">
                      <h6>Disponibilità Settimanale</h6>
                      <div class="availability-grid">
                        <div v-for="day in orderedDoctorAvailability" :key="day.key" class="availability-day">
                          <strong>{{ day.label }}:</strong>
                          <span v-if="day.schedule" class="schedule-time">{{ day.schedule }}</span>
                          <span v-else class="not-available">Non disponibile</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Date and Time -->
                <div class="form-section">
                  <h4>Data e Ora</h4>
                  <div class="form-row">
                    <DatePicker
                      id="appointmentDate"
                      v-model="bookingForm.appointmentDate"
                      class="w-full"
                      :min-date="minDate"
                      :max-date="maxDate"
                      :class="{ 'p-invalid': formErrors.appointmentDate }"
                      date-format="dd/mm/yy"
                      placeholder="Data Appuntamento *"
                      :disabled-dates="disabledDates"
                      :disabled-days="[0]"
                    />
                    <small v-if="formErrors.appointmentDate" class="p-error">
                      {{ formErrors.appointmentDate }}
                    </small>
                  </div>
                  <div class="form-row">
                    <Select
                      id="appointmentTime"
                      v-model="bookingForm.appointmentTime"
                      :options="availableTimeSlots"
                      option-label="label"
                      option-value="value"
                      class="w-full"
                      :class="{ 'p-invalid': formErrors.appointmentTime }"
                      :disabled="!bookingForm.appointmentDate || loadingSlots"
                      :loading="loadingSlots"
                      :placeholder="!bookingForm.appointmentDate ? 'Seleziona prima una data' : 'Orario *'"
                    />
                    <small v-if="formErrors.appointmentTime" class="p-error">
                      {{ formErrors.appointmentTime }}
                    </small>
                    <small
                      v-if="bookingForm.appointmentDate && availableTimeSlots.length === 0 && !loadingSlots"
                      class="p-info"
                    >
                      Nessun slot disponibile per questa data
                    </small>
                  </div>
                </div> <!-- Notes -->
                <div class="form-section">
                  <h4>Note Aggiuntive</h4>
                  <div class="form-row">
                    <Textarea
                      id="notes"
                      v-model="bookingForm.notes"
                      rows="4"
                      class="w-full"
                      auto-resize
                    />
                  </div>
                </div>
                <!-- Submit Button -->
                <div class="form-actions">
                  <Button
                    type="submit"
                    label="Conferma Prenotazione"
                    icon="pi pi-check"
                    class="w-full submit-button"
                    :loading="submitting"
                    :disabled="!isFormValid"
                  />
                </div>
              </form>
            </template>
          </Card>
        </div>
      </div>
    </div>

    <!-- Success Dialog -->
    <Dialog
      v-model:visible="showSuccessDialog"
      modal
      :closable="false"
      class="success-dialog"
    >
      <template #header>
        <div class="dialog-header">
          <i class="pi pi-check-circle success-icon" />
          <h3>Prenotazione Confermata!</h3>
        </div>
      </template>

      <div class="dialog-content">
        <p>La tua prenotazione è stata confermata con successo.</p>
        <div v-if="confirmedBooking" class="booking-summary">
          <div class="summary-item">
            <strong>Servizio:</strong> {{ service.name }}
          </div>
          <div class="summary-item">
            <strong>Data:</strong> {{ formatDate(confirmedBooking.appointmentDate) }}
          </div>
          <div class="summary-item">
            <strong>Orario:</strong> {{ confirmedBooking.appointmentTime }}
          </div>
          <div class="summary-item">
            <strong>Prezzo:</strong> €{{ service.price }}
          </div>
        </div>
        <p class="confirmation-note">
          Riceverai una email di conferma con tutti i dettagli dell'appuntamento.
        </p>
      </div>

      <template #footer>
        <div class="dialog-actions">
          <Button label="Vai alle Mie Prenotazioni" icon="pi pi-calendar" @click="goToBookings" />
          <Button
            label="Torna ai Servizi"
            icon="pi pi-list"
            class="p-button-outlined"
            @click="goToServices"
          />
        </div>
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useServicesStore } from '../stores/services'
import { useBookingsStore } from '../stores/bookings'
import { useUserStore } from '../stores/user'
import { useDoctorsStore } from '../stores/doctors'
import { useToast } from 'primevue/usetoast'
import api from '../services/api'

// PrimeVue Components
import Card from 'primevue/card'
import Button from 'primevue/button'
import ProgressSpinner from 'primevue/progressspinner'
import DatePicker from 'primevue/datepicker'
import Select from 'primevue/select'
import Textarea from 'primevue/textarea'
import Dialog from 'primevue/dialog'

const router = useRouter()
const servicesStore = useServicesStore()
const bookingsStore = useBookingsStore()
const userStore = useUserStore()
const doctorsStore = useDoctorsStore()
const toast = useToast()

// Props
const props = defineProps({
  serviceId: {
    type: String,
    required: true
  }
})

// Reactive data
const service = ref(null)
const loading = ref(false)
const error = ref(null)
const submitting = ref(false)
const showSuccessDialog = ref(false)
const confirmedBooking = ref(null)
const serviceDoctor = ref(null)
const doctorAvailability = ref(null)
const bookedSlots = ref([])
const loadingSlots = ref(false)

// Form data
const bookingForm = ref({
  appointmentDate: null,
  appointmentTime: null,
  notes: ''
})

const formErrors = ref({})

// Date constraints
const minDate = computed(() => {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return tomorrow
})

const maxDate = computed(() => {
  const maxDate = new Date()
  maxDate.setMonth(maxDate.getMonth() + 3)
  return maxDate
})

const disabledDates = computed(() => {
  // Qui potresti aggiungere date specifiche non disponibili
  return []
})

// Disponibilità ordinata per giorni della settimana
const orderedDoctorAvailability = computed(() => {
  if (!doctorAvailability.value) return []

  const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

  return dayOrder.map(day => ({
    key: day,
    label: getDayLabel(day),
    schedule: doctorAvailability.value[day],
    isAvailable: !!doctorAvailability.value[day]
  })).filter(day => day.isAvailable)
})

// Available time slots
const availableTimeSlots = computed(() => {
  if (!bookingForm.value.appointmentDate || !serviceDoctor.value || !doctorAvailability.value) return []

  const selectedDate = new Date(bookingForm.value.appointmentDate)
  const dayIndex = selectedDate.getDay() // 0 = Sunday, 1 = Monday, etc.
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  const selectedDay = dayNames[dayIndex]
  const dayAvailability = doctorAvailability.value[selectedDay]

  if (!dayAvailability) return []

  const slots = []
  const [startTime, endTime] = dayAvailability.split('-')
  const [startHour, startMinute] = startTime.split(':').map(Number)
  const [endHour, endMinute] = endTime.split(':').map(Number)

  // Genera tutti gli slot possibili per il giorno
  for (let hour = startHour; hour < endHour || (hour === endHour && startMinute < endMinute); hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      if (hour === endHour && minute >= endMinute) break
      if (hour === startHour && minute < startMinute) continue

      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
      const isBooked = bookedSlots.value.includes(timeString)

      if (!isBooked) {
        slots.push({
          label: timeString,
          value: timeString
        })
      }
    }
  } return slots
})

// Form validation
const isFormValid = computed(() => {
  const valid = serviceDoctor.value &&
    bookingForm.value.appointmentDate &&
    bookingForm.value.appointmentTime &&
    Object.keys(formErrors.value).length === 0

  return valid
})

// Watchers
watch(() => bookingForm.value.appointmentDate, async () => {
  bookingForm.value.appointmentTime = null
  if (bookingForm.value.appointmentDate && serviceDoctor.value) {
    await loadBookedSlotsForDate(bookingForm.value.appointmentDate)
  }
})

// Methods
const loadService = async () => {
  loading.value = true
  error.value = null

  try {
    service.value = await servicesStore.getServiceById(props.serviceId)
    if (!service.value) {
      error.value = 'Servizio non trovato'
    } else {
      // Carica il medico per questo servizio
      await loadDoctorForService()
    }
  } catch (err) {
    error.value = `Errore nel caricamento del servizio: ${err.message}`
  } finally {
    loading.value = false
  }
}

const loadDoctorForService = async () => {
  if (!service.value?.doctor_id) {
    serviceDoctor.value = null
    doctorAvailability.value = null
    return
  }

  try {
    serviceDoctor.value = await doctorsStore.getDoctorById(service.value.doctor_id)
    if (serviceDoctor.value) {
      doctorAvailability.value = serviceDoctor.value.availability || {}
    }
  } catch (error) {
    console.error('Error loading doctor for service:', error)
    serviceDoctor.value = null
    doctorAvailability.value = null
  }
}

const loadBookedSlotsForDate = async (date) => {
  if (!serviceDoctor.value || !date) {
    bookedSlots.value = []
    return
  }

  loadingSlots.value = true
  try {
    // Formatta la data per l'API (senza conversione di fuso orario)
    console.log('Original date:', date)
    const selectedDate = new Date(date)
    // Formato YYYY-MM-DD mantenendo il fuso orario locale
    const formattedDate = `${selectedDate.getFullYear()}-${(selectedDate.getMonth() + 1).toString().padStart(2, '0')}-${selectedDate.getDate().toString().padStart(2, '0')}`
    const response = await api.get(`/appointments/doctor/${serviceDoctor.value.id}/busy-slots?date=${formattedDate}`)

    // Reset bookedSlots per evitare duplicazioni
    bookedSlots.value = []

    for (const slot of response.data) {
      if (!slot.start_time || !slot.end_time) {
        console.warn('Invalid busy slot received:', slot)
        continue
      }

      // Converti le date in oggetti Date per il confronto
      const startTime = new Date(slot.start_time)
      const endTime = new Date(slot.end_time)

      // Genera tutte le mezz'ore tra start e end e aggiungile ai bookedSlots
      const current = new Date(startTime)
      while (current < endTime) {
        // Usa formato HH:MM per coerenza con availableTimeSlots
        const timeString = `${current.getHours().toString().padStart(2, '0')}:${current.getMinutes().toString().padStart(2, '0')}`
        bookedSlots.value.push(timeString)
        current.setMinutes(current.getMinutes() + 30)
      }
    }
    console.log("bookedSlots:", bookedSlots.value)
  } catch (error) {
    console.error('Error loading booked slots:', error)
    bookedSlots.value = []
  } finally {
    loadingSlots.value = false
  }
}

const getDayLabel = (dayKey) => {
  const dayLabels = {
    monday: 'Lunedì',
    tuesday: 'Martedì',
    wednesday: 'Mercoledì',
    thursday: 'Giovedì',
    friday: 'Venerdì',
    saturday: 'Sabato',
    sunday: 'Domenica'
  }
  return dayLabels[dayKey] || dayKey
}

const validateForm = () => {
  const errors = {}

  if (!bookingForm.value.appointmentDate) {
    errors.appointmentDate = 'La data è obbligatoria'
  }

  if (!bookingForm.value.appointmentTime) {
    errors.appointmentTime = 'L\'orario è obbligatorio'
  }

  formErrors.value = errors
  return Object.keys(errors).length === 0
}

const submitBooking = async () => {
  if (!validateForm()) {
    toast.add({
      severity: 'warn',
      summary: 'Attenzione',
      detail: 'Compila tutti i campi obbligatori',
      life: 3000
    })
    return
  }

  submitting.value = true

  try {
    const bookingData = {
      service_id: service.value.id,
      doctor_id: serviceDoctor.value.id,
      patient_id: userStore.user.id,
      patient_name: userStore.user.name,
      patient_email: userStore.user.email,
      patient_phone: userStore.user.phone,
      appointment_date: bookingForm.value.appointmentDate,
      appointment_time: bookingForm.value.appointmentTime,
      notes: bookingForm.value.notes,
      status: 'scheduled'
    }

    const result = await bookingsStore.createBooking(bookingData)

    confirmedBooking.value = {
      ...bookingData,
      id: result.id
    }

    showSuccessDialog.value = true

  } catch (err) {
    toast.add({
      severity: 'error',
      summary: 'Errore',
      detail: `Impossibile creare la prenotazione. Riprova più tardi.${err.message}`,
      life: 5000
    })
  } finally {
    submitting.value = false
  }
}

const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleDateString('it-IT')
}

const goBack = () => {
  router.go(-1)
}

const goToServices = () => {
  router.push('/services')
}

const goToBookings = () => {
  router.push('/my-bookings')
}

// Lifecycle
onMounted(() => {
  loadService()
})
</script>

<style scoped>
.book-service-page {
  min-height: 100vh;
}

.booking-header-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
}

.page-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  color: var(--text-color-secondary);
}

.error-card {
  margin: 2rem 0;
}

.error-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 1rem;
  padding: 1.5rem;
}

.error-icon {
  font-size: 3rem;
  color: var(--primary-700);
}

.booking-container {
  width: 100%;
}

.booking-layout {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 2rem;
  align-items: start;
}

.service-details {
  position: sticky;
  top: 2rem;
}

.service-header-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
}

.service-header-card h2 {
  margin: 0;
  color: var(--text-color);
}

.service-info h3 {
  color: var(--text-color);
  margin-bottom: 1rem;
  font-size: 1.5rem;
}

.service-description {
  color: var(--text-color-secondary);
  line-height: 1.6;
  margin-bottom: 1.5rem;
}

.service-meta {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.meta-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-color-secondary);
}

.meta-row i {
  color: var(--primary-600);
  width: 20px;
}

.booking-form {
  width: 100%;
}

.form-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-section h4 {
  color: var(--text-color);
  margin: 0;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--surface-200);
}

.form-row {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-actions {
  padding-top: 1rem;
  border-top: 1px solid var(--surface-200);
  margin-top: 1rem;
  display: block !important;
  visibility: visible !important;
}

.submit-button {
  background-color: var(--primary-600) !important;
  border-color: var(--primary-600) !important;
  color: white !important;
  padding: 0.75rem;
  font-size: 1.1rem;
  font-weight: 600;
  min-height: 48px;
  display: flex !important;
  align-items: center;
  justify-content: center;
}

.submit-button:hover:not(:disabled) {
  background-color: var(--primary-700) !important;
  border-color: var(--primary-700) !important;
}

.submit-button:disabled {
  background-color: var(--surface-400) !important;
  border-color: var(--surface-400) !important;
  color: var(--text-color-muted) !important;
  cursor: not-allowed;
}

.doctor-info-card {
  background-color: var(--surface-0);
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid var(--surface-200);
}

.doctor-details h5 {
  color: var(--text-color);
  margin: 0 0 0.5rem 0;
  font-size: 1.25rem;
}

.doctor-specialization {
  color: var(--primary-600);
  font-weight: 600;
  margin: 0 0 1rem 0;
}

.doctor-contacts {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.contact-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-color-secondary);
  font-size: 0.9rem;
}

.contact-item i {
  color: var(--primary-600);
  width: 16px;
}

.doctor-availability {
  border-top: 1px solid var(--surface-200);
  padding-top: 1rem;
  margin-top: 1rem;
}

.doctor-availability h6 {
  color: var(--text-color);
  margin: 0 0 1rem 0;
  font-size: 1rem;
}

.availability-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 0.75rem;
}

.availability-day {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.9rem;
}

.availability-day strong {
  color: var(--text-color);
}

.schedule-time {
  color: var(--primary-600);
  font-weight: 600;
}

.not-available {
  color: var(--text-color-secondary);
  font-style: italic;
}

.p-info {
  color: var(--primary-600);
  font-style: italic;
}

.success-dialog .dialog-header {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.success-icon {
  font-size: 2rem;
  color: var(--primary-600);
}

.dialog-content {
  padding: 1rem 0;
}

.booking-summary {
  background-color: var(--surface-0);
  padding: 1rem;
  border-radius: 8px;
  margin: 1rem 0;
  border: 1px solid var(--surface-200);
}

.summary-item {
  margin-bottom: 0.5rem;
  color: var(--text-color-secondary);
}

.summary-item:last-child {
  margin-bottom: 0;
}

.confirmation-note {
  color: var(--text-color-secondary);
  font-style: italic;
  margin-top: 1rem;
}

.dialog-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.user-info-readonly {
  background-color: var(--surface-100);
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid var(--surface-200);
}

.readonly-field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-bottom: 1rem;
}

.readonly-field:last-child {
  margin-bottom: 0;
}

.readonly-field label {
  color: var(--text-color-secondary);
  font-size: 0.875rem;
  font-weight: 600;
}

.readonly-value {
  color: var(--text-color);
  font-size: 1rem;
  padding: 0.25rem 0;
}

@media (max-width: 768px) {
  .page-content {
    padding: 1rem;
  }

  .booking-layout {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .service-details {
    position: static;
    order: 1;
  }

  .booking-form {
    order: 2;
  }

  .service-header-card {
    padding: 0.75rem;
  }

  .service-header-card h2 {
    font-size: 1.25rem;
  }

  .service-info h3 {
    font-size: 1.3rem;
  }

  .dialog-actions {
    flex-direction: column;
    gap: 0.75rem;
  }

  .form-section h4 {
    font-size: 1.1rem;
  }

  .doctor-info-card {
    padding: 1rem;
  }

  .doctor-details h5 {
    font-size: 1.1rem;
  }

  .doctor-contacts {
    margin-bottom: 1rem;
  }

  .availability-grid {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }

  .availability-day {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
}

@media (max-width: 480px) {
  .page-content {
    padding: 0.75rem;
  }

  .service-header-card {
    padding: 0.5rem;
  }

  .service-header-card h2 {
    font-size: 1.1rem;
  }

  .service-info h3 {
    font-size: 1.2rem;
  }

  .service-description {
    font-size: 0.9rem;
  }

  .meta-row {
    font-size: 0.9rem;
  }

  .submit-button {
    font-size: 1rem;
    padding: 0.875rem;
  }
}
</style>
