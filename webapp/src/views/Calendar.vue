<template>
  <DashboardLayout>
    <div class="calendar-page">
      <!-- Header with filters and add button -->
      <div class="page-header">
        <div class="filters-section">
          <div class="filter-group">
            <Select id="doctor-filter" v-model="selectedDoctor" :options="doctorOptions" option-label="label"
              option-value="value" placeholder="Tutti i medici" :filter="true" filter-placeholder="Cerca medico..."
              :show-clear="true" :virtual-scroller-options="{ itemSize: 44 }" />
          </div>
        </div>

        <Button label="Nuovo Appuntamento" icon="pi pi-plus" class="p-button-primary add-appointment-btn"
          @click="openNewAppointmentDialog" />
      </div>

      <!-- Calendar View -->
      <div class="calendar-container custom-card">
        <div class="calendar-header">
          <div class="calendar-navigation">
            <Button icon="pi pi-chevron-left" class="p-button-text p-button-sm" @click="previousPeriod" />
            <h3 class="calendar-title">
              {{ formatPeriodRange() }}
            </h3>
            <Button icon="pi pi-chevron-right" class="p-button-text p-button-sm" @click="nextPeriod" />
          </div>

          <div class="view-controls">
            <div class="view-toggles">
              <Button label="Settimana" :class="['p-button-text p-button-sm', { 'active-view': viewMode === 'week' }]"
                @click="setViewMode('week')" />
              <Button label="Giorno" :class="['p-button-text p-button-sm', { 'active-view': viewMode === 'day' }]"
                @click="setViewMode('day')" />
            </div>
            <Button label="Oggi" class="p-button-text p-button-sm" @click="goToToday" />
          </div>
        </div>
        <div class="calendar-grid" :class="{ 'day-view': viewMode === 'day' }">
          <!-- Time slots column -->
          <div class="time-column">
            <div class="time-header">
              Orario
            </div>
            <div v-for="timeSlot in timeSlots" :key="timeSlot" class="time-slot">
              {{ timeSlot }}
            </div>
          </div> <!-- Days columns -->
          <div v-for="day in displayDays" :key="day.date" class="day-column"
            :class="{ 'weekend-column': day.isWeekend && viewMode === 'week' }">
            <div class="day-header">
              <div class="day-name">
                {{ day.name }}
              </div>
              <div class="day-date">
                {{ day.displayDate }}
              </div>
            </div>
            <div class="day-slots">
              <div v-for="timeSlot in timeSlots" :key="`${day.date}-${timeSlot}`" class="hour-slot"
                @click="openAppointmentDialog(day.date, timeSlot)">
                <!-- Appointments for this time slot -->
                <div class="appointments-container">
                  <div v-for="(appointment, index) in getAppointmentsForSlot(day.date, timeSlot)" :key="appointment.id"
                    class="appointment-card"
                    :class="[getAppointmentClass(appointment), getAppointmentPosition(index, getAppointmentsForSlot(day.date, timeSlot).length)]"
                    @click.stop="viewAppointment(appointment)">
                    <div class="appointment-time">
                      {{ formatTime(appointment.appointment_date) }}
                    </div>
                    <div class="appointment-patient">
                      {{ appointment.patient_name || appointment.patient?.name || appointment.patient_full_name || 'Paziente sconosciuto' }}
                    </div>
                    <div class="appointment-service" :title="appointment.service_description">
                      {{ appointment.service_name || 'Prestazione non specificata' }}
                    </div>
                    <div v-if="getAppointmentsForSlot(day.date, timeSlot).length <= 2" class="appointment-doctor">
                      {{ appointment.doctor_name || appointment.doctor?.name || 'Dottore sconosciuto' }}
                    </div>
                  </div>
                  <!-- Indicator for more appointments -->
                  <div v-if="getAppointmentsForSlot(day.date, timeSlot).length > 3" class="more-appointments-indicator"
                    @click.stop="showMoreAppointments(day.date, timeSlot)">
                    +{{ getAppointmentsForSlot(day.date, timeSlot).length - 3 }} altri
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Appointment Dialog -->
      <Dialog v-model:visible="appointmentDialogVisible" :modal="true"
        :header="dialogMode === 'create' ? 'Nuovo Appuntamento' : dialogMode === 'edit' ? 'Modifica Appuntamento' : 'Dettagli Appuntamento'"
        :maximizable="false" :closable="true">        <AppointmentForm :appointment="selectedAppointment" :mode="dialogMode"
          :preselected-date="preselectedDate" :preselected-hour="preselectedHour" @save="handleSaveAppointment"
          @cancel="closeAppointmentDialog" @switch-mode="handleSwitchMode" @delete="handleDeleteAppointment" />
      </Dialog>

      <!-- Floating Action Button -->
      <Button v-tooltip.left="'Nuovo Appuntamento'" icon="pi pi-plus"
        class="p-button-rounded p-button-primary floating-button" @click="openNewAppointmentDialog" />
    </div>
  </DashboardLayout>
</template>

<script>
import { defineComponent, ref, computed, onMounted, watch } from 'vue'
import DashboardLayout from '../components/DashboardLayout.vue'
import AppointmentForm from '../components/AppointmentForm.vue'
import Button from 'primevue/button'
import Select from 'primevue/select'
import Dialog from 'primevue/dialog'
import { useAppointmentsStore } from '../stores/appointments.js'
import { useDoctorsStore } from '../stores/doctors.js'
import { usePatientsStore } from '../stores/patients.js'
import { useAppStore } from '../stores/app.js'

export default defineComponent({
  name: 'CalendarView', components: {
    DashboardLayout,
    AppointmentForm,
    Button,
    Select,
    Dialog
  },
  setup() {
    // Store instances
    const appointmentsStore = useAppointmentsStore()
    const doctorsStore = useDoctorsStore()
    const patientsStore = usePatientsStore()
    const appStore = useAppStore()

    // Local reactive data
    const selectedDoctor = ref(null)
    const currentWeekStart = ref(getStartOfWeek(new Date()))
    const currentDay = ref(new Date())
    const viewMode = ref('week') // 'week' or 'day'

    const appointmentDialogVisible = ref(false)
    const selectedAppointment = ref(null)
    const dialogMode = ref('view')
    const preselectedDate = ref(null)
    const preselectedHour = ref(null)

    const timeSlots = [
      '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
      '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
      '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
      '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00'
    ]

    function getStartOfWeek(date) {
      const d = new Date(date)
      const day = d.getDay()
      const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Adjust for Monday start
      return new Date(d.setDate(diff))
    }

    const doctorOptions = computed(() => [
      { label: 'Tutti i medici', value: null },
      ...doctorsStore.allDoctors.map(doctor => ({
        label: `Dr. ${doctor.name} - ${doctor.specialization}`,
        value: doctor.id
      }))
    ])

    const weekDays = computed(() => {
      const days = []
      const start = new Date(currentWeekStart.value)

      for (let i = 0; i < 7; i++) {
        const date = new Date(start)
        date.setDate(start.getDate() + i)
        const dayOfWeek = date.getDay() // 0 = Sunday, 6 = Saturday
        days.push({
          name: date.toLocaleDateString('it-IT', { weekday: 'short' }),
          date: date.toISOString().split('T')[0],
          displayDate: date.toLocaleDateString('it-IT'),
          fullDate: new Date(date),
          isWeekend: dayOfWeek === 0 || dayOfWeek === 6 // Sunday or Saturday
        })
      }

      return days
    })

    const dayView = computed(() => {
      const date = new Date(currentDay.value)
      return [{
        name: date.toLocaleDateString('it-IT', { weekday: 'long' }),
        date: date.toISOString().split('T')[0],
        displayDate: date.toLocaleDateString('it-IT'),
        fullDate: new Date(date)
      }]
    })

    const displayDays = computed(() => {
      return viewMode.value === 'week' ? weekDays.value : dayView.value
    })

    const loadAppointments = async () => {
      try {
        const params = {}

        if (selectedDoctor.value) {
          params.doctor_id = selectedDoctor.value
        }        // Carica per il periodo corrente
        if (viewMode.value === 'week') {
          const start = new Date(currentWeekStart.value)
          const end = new Date(start)
          end.setDate(start.getDate() + 6)
          params.start_date = start.toISOString().split('T')[0]
          params.end_date = end.toISOString().split('T')[0]
        } else {
          params.date = currentDay.value.toISOString().split('T')[0]
        } await appointmentsStore.fetchAppointments(params, true)
      } catch (error) {
        console.error('Error loading appointments:', error)
        // Error notifications are handled by the store
      }
    }
    
    const getAppointmentsForSlot = (date, timeSlot) => {
      if (!appointmentsStore.allAppointments || !Array.isArray(appointmentsStore.allAppointments)) {
        return []
      }

      return appointmentsStore.allAppointments.filter(appointment => {
        if (!appointment || !appointment.appointment_date) {
          return false
        }

        try {
          const appointmentDate = new Date(appointment.appointment_date)
          const appointmentDateStr = appointmentDate.toISOString().split('T')[0]
          const appointmentTime = appointmentDate.toLocaleTimeString('it-IT', {
            hour: '2-digit',
            minute: '2-digit'
          })

          // Filtro per data e ora
          const dateTimeMatch = appointmentDateStr === date && appointmentTime === timeSlot

          // Filtro per medico (se selezionato)
          const doctorMatch = !selectedDoctor.value || appointment.doctor_id === selectedDoctor.value

          return dateTimeMatch && doctorMatch
        } catch (error) {
          console.error('Error parsing appointment date:', appointment.appointment_date, error)
          return false
        }
      })
    }

    const getAppointmentClass = (appointment) => {
      const statusClasses = {
        'scheduled': 'appointment-scheduled',
        'confirmed': 'appointment-confirmed',
        'cancelled': 'appointment-cancelled',
        'completed': 'appointment-completed'
      }
      return statusClasses[appointment.status] || 'appointment-scheduled'
    }

    const getAppointmentPosition = (index, totalCount) => {
      if (totalCount === 1) return 'single-appointment'
      if (totalCount === 2) return index === 0 ? 'appointment-left' : 'appointment-right'
      if (totalCount >= 3) {
        if (index === 0) return 'appointment-first'
        if (index === 1) return 'appointment-second'
        if (index === 2) return 'appointment-third'
        return 'appointment-hidden' // Gli appuntamenti oltre i primi 3 sono nascosti
      }
      return ''
    }
    
    const showMoreAppointments = (date, timeSlot) => {
      const appointments = getAppointmentsForSlot(date, timeSlot)
      // Qui potresti aprire un dialog o popover per mostrare tutti gli appuntamenti
      console.log(`Showing ${appointments.length} appointments for ${date} at ${timeSlot}`, appointments)
      // Per ora, mostreremo un alert semplice, ma potresti implementare un dialog più sofisticato
      /* const appointmentsList = appointments.map(apt =>
        `${formatTime(apt.appointment_date)} - ${apt.patient_name} (Dr. ${apt.doctor_name})`
      ).join('\n')
      alert(`Appuntamenti per ${date} alle ${timeSlot}:\n\n${appointmentsList}`) */
    }

    const formatTime = (dateString) => {
      return new Date(dateString).toLocaleTimeString('it-IT', {
        hour: '2-digit',
        minute: '2-digit'
      })
    }

    const formatWeekRange = (startDate) => {
      const start = new Date(startDate)
      const end = new Date(start)
      end.setDate(start.getDate() + 6)

      return `${start.toLocaleDateString('it-IT')} - ${end.toLocaleDateString('it-IT')}`
    }

    const formatPeriodRange = () => {
      if (viewMode.value === 'week') {
        return formatWeekRange(currentWeekStart.value)
      } else {
        return currentDay.value.toLocaleDateString('it-IT', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      }
    }

    const setViewMode = (mode) => {
      viewMode.value = mode
    }

    const previousPeriod = () => {
      if (viewMode.value === 'week') {
        previousWeek()
      } else {
        previousDay()
      }
    }

    const nextPeriod = () => {
      if (viewMode.value === 'week') {
        nextWeek()
      } else {
        nextDay()
      }
    }

    const previousDay = () => {
      const newDay = new Date(currentDay.value)
      newDay.setDate(newDay.getDate() - 1)
      currentDay.value = newDay
    }

    const nextDay = () => {
      const newDay = new Date(currentDay.value)
      newDay.setDate(newDay.getDate() + 1)
      currentDay.value = newDay
    }

    const previousWeek = () => {
      const newStart = new Date(currentWeekStart.value)
      newStart.setDate(newStart.getDate() - 7)
      currentWeekStart.value = newStart
    }

    const nextWeek = () => {
      const newStart = new Date(currentWeekStart.value)
      newStart.setDate(newStart.getDate() + 7)
      currentWeekStart.value = newStart
    }

    const goToToday = () => {
      const today = new Date()
      if (viewMode.value === 'week') {
        currentWeekStart.value = getStartOfWeek(today)
      } else {
        currentDay.value = today
      }
    }

    const openNewAppointmentDialog = () => {
      selectedAppointment.value = null
      preselectedDate.value = null
      preselectedHour.value = null
      dialogMode.value = 'create'
      appointmentDialogVisible.value = true
    }
    
    const openAppointmentDialog = (date, timeSlot) => {
      selectedAppointment.value = null
      preselectedDate.value = date
      // Converte il timeSlot da stringa HH:MM a ora per compatibilità con AppointmentForm
      const [hour, minute] = timeSlot.split(':').map(Number)
      preselectedHour.value = hour + (minute / 60) // Converte in decimale (es: 19.5 per 19:30)
      dialogMode.value = 'create'
      appointmentDialogVisible.value = true
    }

    const viewAppointment = (appointment) => {
      selectedAppointment.value = { ...appointment }
      dialogMode.value = 'view'
      appointmentDialogVisible.value = true
    }

    const handleSaveAppointment = async (appointmentData) => {
      try {
        if (dialogMode.value === 'create') {
          await appointmentsStore.createAppointment(appointmentData)
        } else if (dialogMode.value === 'edit') {
          await appointmentsStore.updateAppointment(selectedAppointment.value.id, appointmentData)
        }
        loadAppointments()
        closeAppointmentDialog()
      } catch (error) {
        console.error('Error saving appointment:', error)
        // Error notifications are handled by the store
      }
    }

    const handleSwitchMode = (newMode) => {
      dialogMode.value = newMode
    }

    const handleDeleteAppointment = async (appointmentId) => {
      try {
        await appointmentsStore.deleteAppointment(appointmentId)
        loadAppointments()
        closeAppointmentDialog()
      } catch (error) {
        console.error('Error deleting appointment:', error)
        // Error notifications are handled by the store
      }
    }

    const closeAppointmentDialog = () => {
      appointmentDialogVisible.value = false
      selectedAppointment.value = null
      dialogMode.value = 'view'
      preselectedDate.value = null
      preselectedHour.value = null
    }

    // Watchers per reagire ai cambiamenti dei filtri
    watch(selectedDoctor, () => {
      loadAppointments()
    })

    watch(viewMode, () => {
      loadAppointments()
    })

    watch(currentDay, () => {
      if (viewMode.value === 'day') {
        loadAppointments()
      }
    })

    onMounted(async () => {
      try {
        // Carica i dati da tutti gli store
        await Promise.all([
          doctorsStore.fetchDoctors(),
          patientsStore.fetchPatients()
        ])

        // Carica gli appuntamenti dopo aver caricato medici e pazienti
        await loadAppointments()
      } catch (error) {
        console.error('Error loading initial data:', error)
      }
    })

    return {
      // Store data
      appointments: appointmentsStore.allAppointments,
      doctors: doctorsStore.allDoctors,
      patients: patientsStore.allPatients,
      loading: appStore.isLoading,
      selectedDoctor,
      currentWeekStart,
      currentDay,
      viewMode,
      appointmentDialogVisible,
      selectedAppointment,
      dialogMode,
      preselectedDate,
      preselectedHour,
      timeSlots,
      doctorOptions,
      weekDays,
      dayView,
      displayDays,
      loadAppointments,
      getAppointmentsForSlot,
      getAppointmentClass,
      getAppointmentPosition,
      showMoreAppointments,
      formatTime,
      formatWeekRange,
      formatPeriodRange,
      setViewMode,
      previousPeriod,
      nextPeriod,
      previousWeek,
      nextWeek,
      previousDay,
      nextDay,
      goToToday,
      openNewAppointmentDialog,
      openAppointmentDialog,
      viewAppointment,
      handleSaveAppointment,
      handleSwitchMode,
      handleDeleteAppointment,
      closeAppointmentDialog
    }
  }
})
</script>

<style scoped>
.calendar-page {
  height: 100%;
  position: relative;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  gap: 1rem;
}

.filters-section {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  width: 400px;
}

.filter-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-color-secondary);
}

.calendar-container {
  padding: 0;
  overflow: hidden;
}

.calendar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--surface-200);
}

.calendar-navigation {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.calendar-title {
  margin: 0;
  color: var(--text-color);
  font-size: 1.25rem;
  font-weight: 600;
  min-width: 200px;
  text-align: center;
}

.view-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.view-toggles {
  display: flex;
  gap: 0.5rem;
  background-color: var(--surface-100);
  border-radius: 6px;
  padding: 2px;
}

.view-toggles .p-button {
  border-radius: 4px;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  transition: all 0.2s ease;
}

.view-toggles .active-view {
  background-color: var(--primary-500) !important;
  color: white !important;
  border-color: var(--primary-500) !important;
}

.calendar-grid {
  display: grid;
  grid-template-columns: 80px repeat(7, 1fr);
  min-height: 600px;
}

.calendar-grid.day-view {
  grid-template-columns: 80px 1fr;
}

.time-column {
  background-color: var(--surface-50);
  border-right: 1px solid var(--surface-200);
}

.time-header {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  color: var(--text-color-secondary);
  font-size: 0.875rem;
  border-bottom: 1px solid var(--surface-200);
}

.time-slot {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  color: var(--text-color-muted);
  border-bottom: 1px solid var(--surface-200);
}

.day-column {
  border-right: 1px solid var(--surface-200);
}

.weekend-column {
  background-color: var(--surface-100);
}

.weekend-column .day-header {
  background-color: var(--surface-100);
}

.weekend-column .hour-slot:hover {
  background-color: var(--surface-100);
}

.day-header {
  height: 60px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: var(--surface-50);
  border-bottom: 1px solid var(--surface-200);
}

.day-name {
  font-weight: 600;
  color: var(--text-color);
  text-transform: uppercase;
  font-size: 0.75rem;
}

.day-date {
  color: var(--text-color-secondary);
  font-size: 0.875rem;
}

.day-slots {
  position: relative;
}

.hour-slot {
  height: 60px;
  border-bottom: 1px solid var(--surface-200);
  position: relative;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.hour-slot:hover {
  background-color: var(--primary-50);
}

.appointments-container {
  position: relative;
  width: 100%;
  height: 100%;
}

.appointment-card {
  position: absolute;
  padding: 0.25rem;
  border-radius: 4px;
  cursor: pointer;
  transition: transform 0.2s ease, z-index 0.2s ease;
  font-size: 0.625rem;
  overflow: hidden;
  border: 1px solid;
}

.appointment-card:hover {
  transform: scale(1.05);
  z-index: 20;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

/* Posizionamento per singolo appuntamento */
.single-appointment {
  left: 2px;
  right: 2px;
  top: 2px;
  bottom: 2px;
}

/* Posizionamento per due appuntamenti */
.appointment-left {
  left: 2px;
  right: 50%;
  top: 2px;
  bottom: 2px;
  margin-right: 1px;
}

.appointment-right {
  left: 50%;
  right: 2px;
  top: 2px;
  bottom: 2px;
  margin-left: 1px;
}

/* Posizionamento per tre o più appuntamenti */
.appointment-first {
  left: 2px;
  right: 2px;
  top: 2px;
  height: 8px;
}

.appointment-second {
  left: 2px;
  right: 2px;
  top: 11px;
  height: 8px;
}

.appointment-third {
  left: 2px;
  right: 2px;
  top: 20px;
  height: 6px;
}

.appointment-hidden {
  display: none;
}

.more-appointments-indicator {
  position: absolute;
  left: 2px;
  right: 2px;
  bottom: 2px;
  height: 12px;
  background-color: var(--primary-200);
  border: 1px solid var(--primary-400);
  border-radius: 2px;
  font-size: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--primary-800);
  font-weight: 600;
}

.more-appointments-indicator:hover {
  background-color: var(--primary-300);
}

.appointment-scheduled {
  background-color: var(--primary-100);
  border: 1px solid var(--primary-300);
  color: var(--primary-800);
}

.appointment-confirmed {
  background-color: #dcfdf4;
  border: 1px solid #86efac;
  color: #065f46;
}

.appointment-cancelled {
  background-color: #fef2f2;
  border: 1px solid #fca5a5;
  color: #991b1b;
}

.appointment-completed {
  background-color: var(--surface-100);
  border: 1px solid var(--surface-300);
  color: var(--text-color-secondary);
}

.appointment-time {
  font-weight: 600;
  margin-bottom: 0.125rem;
}

.appointment-patient {
  font-weight: 500;
  margin-bottom: 0.125rem;
}

.appointment-code {
  font-size: 0.5rem;
  background: rgba(255, 255, 255, 0.3);
  padding: 0.0625rem 0.25rem;
  border-radius: 2px;
  margin-bottom: 0.125rem;
  font-family: monospace;
  font-weight: 600;
}

.appointment-service {
  font-size: 0.625rem;
  color: var(--primary-600);
  margin-bottom: 0.125rem;
  font-style: italic;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.appointment-doctor {
  font-size: 0.625rem;
  opacity: 0.8;
}

.floating-button {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  width: 56px;
  height: 56px;
  z-index: 1000;
  border-radius: 50% !important;
  min-width: 56px;
  min-height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Responsive design */
@media (max-width: 1024px) {
  .calendar-grid {
    grid-template-columns: 60px repeat(7, 1fr);
  }

  .calendar-grid.day-view {
    grid-template-columns: 60px 1fr;
  }

  .time-slot {
    font-size: 0.625rem;
  }

  .view-controls {
    flex-direction: column;
    gap: 0.5rem;
  }
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: stretch;
  }

  .filters-section {
    justify-content: space-between;
  }

  .calendar-grid {
    grid-template-columns: 50px repeat(7, 1fr);
    min-height: 400px;
  }

  .calendar-grid.day-view {
    grid-template-columns: 50px 1fr;
  }

  .view-controls {
    flex-direction: column;
    align-items: stretch;
    gap: 0.5rem;
  }

  .view-toggles {
    justify-content: center;
  }

  .hour-slot {
    height: 20px;
  }

  .time-header,
  .day-header {
    height: 40px;
  }

  .appointment-card {
    font-size: 0.5rem;
    padding: 0.125rem;
  }

  /* Adattamento per appuntamenti multipli su mobile */
  .appointment-first {
    height: 6px;
    top: 2px;
  }

  .appointment-second {
    height: 6px;
    top: 9px;
  }

  .appointment-third {
    height: 4px;
    top: 16px;
  }

  .more-appointments-indicator {
    height: 4px;
    font-size: 0.375rem;
    bottom: 1px;
  }

  .day-name {
    font-size: 0.625rem;
  }

  .day-date {
    font-size: 0.75rem;
  }

  /* Nascondi il nome del dottore su mobile per fare spazio */
  .appointment-doctor {
    display: none;
  }
}
</style>
