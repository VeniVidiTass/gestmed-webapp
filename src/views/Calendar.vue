<template>
  <DashboardLayout>
    <div class="calendar-page">
      <!-- Header with filters and add button -->
      <div class="page-header">
        <div class="filters-section">
          <div class="filter-group">
            <label for="doctor-filter" class="filter-label">Medico:</label>
            <Select id="doctor-filter" v-model="selectedDoctor" :options="doctorOptions" optionLabel="label"
              optionValue="value" placeholder="Tutti i medici" @change="loadAppointments" :showClear="true" />
          </div>
          <div class="filter-group">
            <label for="date-filter" class="filter-label">Data:</label>
            <DatePicker id="date-filter" v-model="selectedDate" dateFormat="dd/mm/yy" :showIcon="true"
              placeholder="Seleziona data" @date-select="loadAppointments" :showClear="true" />
          </div>
        </div>

        <Button label="Nuovo Appuntamento" icon="pi pi-plus" class="p-button-primary add-appointment-btn"
          @click="openNewAppointmentDialog" />
      </div>

      <!-- Calendar View -->
      <div class="calendar-container custom-card">
        <div class="calendar-header">
          <div class="calendar-navigation">
            <Button icon="pi pi-chevron-left" class="p-button-text p-button-sm" @click="previousWeek" />
            <h3 class="calendar-title">
              {{ formatWeekRange(currentWeekStart) }}
            </h3>
            <Button icon="pi pi-chevron-right" class="p-button-text p-button-sm" @click="nextWeek" />
          </div>

          <div class="view-controls">
            <Button label="Oggi" class="p-button-text p-button-sm" @click="goToToday" />
          </div>
        </div>

        <div class="calendar-grid">
          <!-- Time slots column -->
          <div class="time-column">
            <div class="time-header">Orario</div>
            <div v-for="hour in timeSlots" :key="hour" class="time-slot">
              {{ hour }}:00
            </div>
          </div>

          <!-- Days columns -->
          <div v-for="day in weekDays" :key="day.date" class="day-column">
            <div class="day-header">
              <div class="day-name">{{ day.name }}</div>
              <div class="day-date">{{ day.displayDate }}</div>
            </div>

            <div class="day-slots">
              <div v-for="hour in timeSlots" :key="`${day.date}-${hour}`" class="hour-slot"
                @click="openAppointmentDialog(day.date, hour)">
                <!-- Appointments for this hour -->
                <div v-for="appointment in getAppointmentsForSlot(day.date, hour)" :key="appointment.id"
                  class="appointment-card" :class="getAppointmentClass(appointment)"
                  @click.stop="viewAppointment(appointment)">
                  <div class="appointment-time">
                    {{ formatTime(appointment.appointment_date) }}
                  </div>
                  <div class="appointment-patient">
                    {{ appointment.patient_name }}
                  </div>
                  <div class="appointment-doctor">
                    Dr. {{ appointment.doctor_name }}
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
        :style="{ width: '600px' }" :maximizable="false" :closable="true">
        <AppointmentForm :appointment="selectedAppointment" :mode="dialogMode" :doctors="doctors" :patients="patients"
          :preselectedDate="preselectedDate" :preselectedHour="preselectedHour" @save="handleSaveAppointment"
          @cancel="closeAppointmentDialog" />
      </Dialog>

      <!-- Floating Action Button -->
      <Button icon="pi pi-plus" class="p-button-rounded p-button-primary floating-button"
        @click="openNewAppointmentDialog" v-tooltip.left="'Nuovo Appuntamento'" />
    </div>
  </DashboardLayout>
</template>

<script>
import { defineComponent, ref, computed, onMounted } from 'vue'
import DashboardLayout from '../components/DashboardLayout.vue'
import AppointmentForm from '../components/AppointmentForm.vue'
import Button from 'primevue/button'
import DatePicker from 'primevue/datepicker'
import Select from 'primevue/select'
import Dialog from 'primevue/dialog'
import { useAppointmentsStore } from '../stores/appointments.js'
import { useDoctorsStore } from '../stores/doctors.js'
import { usePatientsStore } from '../stores/patients.js'
import { useAppStore } from '../stores/app.js'

export default defineComponent({
  name: 'CalendarView',
  components: {
    DashboardLayout,
    AppointmentForm,
    Button,
    DatePicker,
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
    const selectedDate = ref(null)
    const currentWeekStart = ref(getStartOfWeek(new Date()))

    const appointmentDialogVisible = ref(false)
    const selectedAppointment = ref(null)
    const dialogMode = ref('view')
    const preselectedDate = ref(null)
    const preselectedHour = ref(null)

    const timeSlots = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18]

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
        days.push({
          name: date.toLocaleDateString('it-IT', { weekday: 'short' }),
          date: date.toISOString().split('T')[0],
          displayDate: date.toLocaleDateString('it-IT'),
          fullDate: new Date(date)
        })
      }

      return days
    })

    const loadAppointments = async () => {
      try {
        const params = {}

        if (selectedDoctor.value) {
          params.doctor_id = selectedDoctor.value
        }

        if (selectedDate.value) {
          params.date = selectedDate.value.toISOString().split('T')[0]
        }

        await appointmentsStore.fetchAppointments(params, true)
      } catch (error) {
        console.error('Error loading appointments:', error)
        // Error notifications are handled by the store
      }
    }

    const getAppointmentsForSlot = (date, hour) => {
      return appointmentsStore.appointments.filter(appointment => {
        const appointmentDate = new Date(appointment.appointment_date)
        const appointmentDateStr = appointmentDate.toISOString().split('T')[0]
        const appointmentHour = appointmentDate.getHours()

        return appointmentDateStr === date && appointmentHour === hour
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

    const previousWeek = () => {
      const newStart = new Date(currentWeekStart.value)
      newStart.setDate(newStart.getDate() - 7)
      currentWeekStart.value = newStart
      loadAppointments()
    }

    const nextWeek = () => {
      const newStart = new Date(currentWeekStart.value)
      newStart.setDate(newStart.getDate() + 7)
      currentWeekStart.value = newStart
      loadAppointments()
    }

    const goToToday = () => {
      currentWeekStart.value = getStartOfWeek(new Date())
      loadAppointments()
    }

    const openNewAppointmentDialog = () => {
      selectedAppointment.value = null
      preselectedDate.value = null
      preselectedHour.value = null
      dialogMode.value = 'create'
      appointmentDialogVisible.value = true
    }

    const openAppointmentDialog = (date, hour) => {
      selectedAppointment.value = null
      preselectedDate.value = date
      preselectedHour.value = hour
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

    const closeAppointmentDialog = () => {
      appointmentDialogVisible.value = false
      selectedAppointment.value = null
      dialogMode.value = 'view'
      preselectedDate.value = null
      preselectedHour.value = null
    }

    onMounted(async () => {
      // Carica i dati da tutti gli store
      await Promise.all([
        doctorsStore.fetchDoctors(),
        patientsStore.fetchPatients(),
        loadAppointments()
      ])
    })

    return {
      // Store data
      appointments: appointmentsStore.appointments,
      doctors: doctorsStore.allDoctors,
      patients: patientsStore.allPatients,
      loading: appStore.isLoading,

      // Local reactive data
      selectedDoctor,
      selectedDate,
      currentWeekStart,
      appointmentDialogVisible,
      selectedAppointment,
      dialogMode,
      preselectedDate,
      preselectedHour,
      timeSlots,
      doctorOptions,
      weekDays,
      loadAppointments,
      getAppointmentsForSlot,
      getAppointmentClass,
      formatTime,
      formatWeekRange,
      previousWeek,
      nextWeek,
      goToToday,
      openNewAppointmentDialog,
      openAppointmentDialog,
      viewAppointment,
      handleSaveAppointment,
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

.calendar-grid {
  display: grid;
  grid-template-columns: 80px repeat(7, 1fr);
  min-height: 600px;
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

.appointment-card {
  position: absolute;
  left: 2px;
  right: 2px;
  top: 2px;
  bottom: 2px;
  padding: 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  transition: transform 0.2s ease;
  font-size: 0.75rem;
  overflow: hidden;
}

.appointment-card:hover {
  transform: scale(1.02);
  z-index: 10;
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

  .time-slot {
    font-size: 0.625rem;
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

  .hour-slot {
    height: 40px;
  }

  .time-header,
  .day-header {
    height: 40px;
  }

  .appointment-card {
    font-size: 0.625rem;
    padding: 0.25rem;
  }

  .day-name {
    font-size: 0.625rem;
  }

  .day-date {
    font-size: 0.75rem;
  }
}
</style>
