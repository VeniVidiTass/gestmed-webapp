<template>
  <DashboardLayout>
    <div class="alive-container">
      <!-- Status Cards -->
      <div class="status-cards">
        <Card class="status-card in-progress">
          <template #content>
            <div class="status-card-content">
              <div class="status-icon">
                <i class="pi pi-play-circle" />
              </div>
              <div class="status-info">
                <h3>{{ inProgressAppointments.length }}</h3>
                <p>In Corso</p>
              </div>
            </div>
          </template>
        </Card>
        <Card class="status-card scheduled">
          <template #content>
            <div class="status-card-content">
              <div class="status-icon">
                <i class="pi pi-clock" />
              </div>
              <div class="status-info">
                <h3>{{ scheduledAppointments.length }}</h3>
                <p>Programmati</p>
              </div>
            </div>
          </template>
        </Card>

        <Card class="status-card confirmed">
          <template #content>
            <div class="status-card-content">
              <div class="status-icon">
                <i class="pi pi-check" />
              </div>
              <div class="status-info">
                <h3>{{ confirmedAppointments.length }}</h3>
                <p>Confermati</p>
              </div>
            </div>
          </template>
        </Card>

        <Card class="status-card total">
          <template #content>
            <div class="status-card-content">
              <div class="status-icon">
                <i class="pi pi-list" />
              </div>
              <div class="status-info">
                <h3>{{ totalActiveAppointments.length }}</h3>
                <p>Totale Attivi</p>
              </div>
            </div>
          </template>
        </Card>
      </div>
      <div class="controls-section">
        <div class="filter-section">
          <label for="statusFilter" class="filter-label">Filtra per stato:</label>
          <Select id="statusFilter" v-model="selectedStatusFilter" :options="statusFilterOptions" option-label="label"
            option-value="value" placeholder="Tutti gli stati" class="status-filter" @change="applyStatusFilter" />
        </div>

        <Button label="Aggiorna" icon="pi pi-refresh" :loading="loading" class="p-button-outlined"
          @click="refreshData" />
      </div>

      <!-- Error Message -->
      <Message v-if="error" severity="error" @close="clearError">
        {{ error }}
      </Message>

      <!-- Appointments List -->
      <div class="appointments-section">
        <Card v-if="appointments.length === 0 && !loading" class="empty-state">
          <template #content>
            <div class="empty-content">
              <i class="pi pi-calendar-times" />
              <h3>Nessun appuntamento attivo</h3>
              <p>Non ci sono appuntamenti programmati o in corso al momento.</p>
            </div>
          </template>
        </Card>

        <div v-else class="appointments-grid">
          <Card v-for="appointment in appointments" :key="appointment.id" class="appointment-card" :class="{
            'status-in-progress': appointment.status === 'in_progress',
            'status-scheduled': appointment.status === 'scheduled',
            'status-confirmed': appointment.status === 'confirmed'
          }">
            <template #header>
              <div class="appointment-header">
                <Tag
                  :value="getStatusLabel(appointment.status)"
                  :severity="getStatusSeverity(appointment.status)"
                  :icon="getStatusIcon(appointment.status)"
                />
                <div class="appointment-actions">
                  <Button
                    v-tooltip.top="'Aggiungi Log'"
                    icon="pi pi-plus"
                    class="p-button-rounded p-button-text p-button-sm"
                    @click="openLogForm(appointment)"
                  />
                  <Button
                    v-tooltip.top="'Visualizza Log'"
                    icon="pi pi-list"
                    class="p-button-rounded p-button-text p-button-sm"
                    @click="toggleLogs(appointment.id)"
                  />
                  <Select
                    v-model="appointment.status"
                    :options="statusOptions"
                    option-label="label"
                    option-value="value"
                    class="status-dropdown"
                    @change="updateStatus(appointment.id, $event.value)"
                  />
                </div>
              </div>
            </template>

            <template #content>
              <div class="appointment-content">
                <div class="appointment-info">
                  <div class="info-row">
                    <i class="pi pi-user" />
                    <span><strong>Paziente:</strong> {{ appointment.patient_name }}</span>
                  </div>
                  <div class="info-row">
                    <i class="pi pi-user-plus" />
                    <span><strong>Medico:</strong> {{ appointment.doctor_name }}</span>
                  </div>
                  <div class="info-row">
                    <i class="pi pi-calendar" />
                    <span><strong>Data:</strong> {{ formatDate(appointment.appointment_date)
                    }}</span>
                  </div>
                  <div class="info-row">
                    <i class="pi pi-clock" />
                    <span><strong>Ora:</strong> {{ formatTime(appointment.appointment_date)
                    }}</span>
                  </div>
                  <div v-if="appointment.code" class="info-row">
                    <i class="pi pi-hashtag" />
                    <span><strong>Codice:</strong> {{ appointment.code }}</span>
                  </div>
                  <div v-if="appointment.notes" class="info-row">
                    <i class="pi pi-file-edit" />
                    <span><strong>Note:</strong> {{ appointment.notes }}</span>
                  </div>
                </div>
              </div>
            </template>
          </Card>
        </div>
      </div>
    </div> <!-- Add Log Dialog -->
    <AliveLogForm v-model:visible="showLogForm" :appointment-id="selectedAppointment?.id"
      :appointment-title="`${selectedAppointment?.patient_name} - Dr. ${selectedAppointment?.doctor_name}`"
      :appointment-code="selectedAppointment?.code" :loading="logLoading" @submit="handleLogSubmit"
      @cancel="closeLogForm" />

    <!-- Logs View Dialog -->
    <Dialog v-model:visible="showLogsDialog" modal
      :header="`Log Attività - ${selectedLogAppointment?.patient_name} - Dr. ${selectedLogAppointment?.doctor_name}`"
      :style="{ width: '60vw' }" :breakpoints="{ '960px': '75vw', '641px': '90vw' }">
      <div class="logs-dialog-content">
        <!-- Appointment Info Card -->
        <Card class="appointment-info-card" :class="{
          'status-in-progress': selectedLogAppointment?.status === 'in_progress',
          'status-scheduled': selectedLogAppointment?.status === 'scheduled',
          'status-confirmed': selectedLogAppointment?.status === 'confirmed'
        }">
          <template #content>
            <div class="appointment-content">
              <div class="appointment-header-info">
                <Tag :value="getStatusLabel(selectedLogAppointment?.status)"
                  :severity="getStatusSeverity(selectedLogAppointment?.status)"
                  :icon="getStatusIcon(selectedLogAppointment?.status)" />
              </div>

              <div class="appointment-info">
                <div class="info-row">
                  <i class="pi pi-user" />
                  <span><strong>Paziente:</strong> {{ selectedLogAppointment?.patient_name }}</span>
                </div>
                <div class="info-row">
                  <i class="pi pi-user-plus" />
                  <span><strong>Medico:</strong> {{ selectedLogAppointment?.doctor_name }}</span>
                </div>
                <div class="info-row">
                  <i class="pi pi-calendar" />
                  <span><strong>Data:</strong> {{ formatDate(selectedLogAppointment?.appointment_date)
                  }}</span>
                </div>
                <div v-if="selectedLogAppointment?.code" class="info-row">
                  <i class="pi pi-hashtag" />
                  <span><strong>Codice:</strong> {{ selectedLogAppointment.code }}</span>
                </div>
                <div class="info-row">
                  <i class="pi pi-clock" />
                  <span><strong>Ora:</strong> {{ formatTime(selectedLogAppointment?.appointment_date)
                  }}</span>
                </div>
                <div v-if="selectedLogAppointment?.notes" class="info-row">
                  <i class="pi pi-file-edit" />
                  <span><strong>Note:</strong> {{ selectedLogAppointment?.notes }}</span>
                </div>
              </div>
            </div>
          </template>
        </Card>

        <!-- Logs Section -->
        <div class="logs-section">
          <div class="logs-header">
            <h4>
              <i class="pi pi-history" />
              Log Attività
            </h4>
            <Button label="Aggiungi Log" icon="pi pi-plus" class="p-button-sm" @click="openLogFormFromDialog" />
          </div>

          <div class="logs-list">
            <div v-if="getAppointmentLogs(selectedLogAppointment?.id).length === 0" class="no-logs">
              <p>Nessun log presente per questo appuntamento.</p>
            </div>
            <div v-for="log in getAppointmentLogs(selectedLogAppointment?.id)" v-else :key="log.id" class="log-item">
              <div class="log-header">
                <h5>{{ log.title }}</h5>
                <div class="log-meta">
                  <span v-if="log.code" class="log-code">{{ log.code }}</span>
                  <span class="log-time">{{ formatDateTime(log.created_at) }}</span>
                </div>
              </div>
              <p class="log-description">
                {{ log.description }}
              </p>
              <small class="log-author">Creato da: {{ log.created_by }}</small>
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  </DashboardLayout>
</template>

<script>
import { defineComponent, ref, computed, onMounted } from 'vue'
import DashboardLayout from '../components/DashboardLayout.vue'
import AliveLogForm from '../components/AliveLogForm.vue'
import { useAliveLogsStore } from '../stores/aliveLogs'
import { useAppointmentsStore } from '../stores/appointments'
import { useNotifications } from '../composables/useNotifications'
import Card from 'primevue/card'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import Message from 'primevue/message'
import Select from 'primevue/select'
import Dialog from 'primevue/dialog'

export default defineComponent({
  name: 'ALive',
  components: {
    DashboardLayout,
    AliveLogForm,
    Card,
    Button,
    Tag,
    Message,
    Select,
    Dialog
  },
  setup() {
    const aliveLogsStore = useAliveLogsStore()
    const appointmentsStore = useAppointmentsStore()
    const { showSuccess, showError } = useNotifications()

    // State
    const showLogs = ref({})
    const showLogForm = ref(false)
    const showLogsDialog = ref(false)
    const selectedAppointment = ref(null)
    const selectedLogAppointment = ref(null)
    const logLoading = ref(false)
    const selectedStatusFilter = ref('active') // Default filter for active appointments    // Status options for dropdown
    const statusOptions = [
      { label: 'Programmato', value: 'scheduled' },
      { label: 'Confermato', value: 'confirmed' },
      { label: 'In Corso', value: 'in_progress' },
      { label: 'Completato', value: 'completed' },
      { label: 'Annullato', value: 'cancelled' }
    ]    // Status filter options
    const statusFilterOptions = [
      { label: 'Solo attivi (Programmati + Confermati + In Corso)', value: 'active' },
      { label: 'Tutti gli stati', value: 'all' },
      { label: 'Programmati', value: 'scheduled' },
      { label: 'Confermati', value: 'confirmed' },
      { label: 'In Corso', value: 'in_progress' },
      { label: 'Completati', value: 'completed' },
      { label: 'Annullati', value: 'cancelled' }
    ]

    // Computed
    const appointments = computed(() => {
      let filteredAppointments = appointmentsStore.allAppointments      // Apply status filter
      switch (selectedStatusFilter.value) {
        case 'active':
          filteredAppointments = filteredAppointments.filter(apt =>
            ['scheduled', 'confirmed', 'in_progress'].includes(apt.status)
          )
          break
        case 'all':
          // Show all appointments
          break
        case 'scheduled':
        case 'confirmed':
        case 'in_progress':
        case 'completed':
        case 'cancelled':
          filteredAppointments = filteredAppointments.filter(apt =>
            apt.status === selectedStatusFilter.value
          )
          break
        default:
          // Default to active appointments
          filteredAppointments = filteredAppointments.filter(apt =>
            ['scheduled', 'confirmed', 'in_progress'].includes(apt.status)
          )
      }
      return filteredAppointments
    })

    const loading = computed(() => appointmentsStore.loading)
    const error = computed(() => appointmentsStore.error || aliveLogsStore.error)    // Status cards show counts based on all appointments, not filtered ones
    const scheduledAppointments = computed(() =>
      appointmentsStore.allAppointments.filter(apt => apt.status === 'scheduled')
    )
    const confirmedAppointments = computed(() =>
      appointmentsStore.allAppointments.filter(apt => apt.status === 'confirmed')
    )
    const inProgressAppointments = computed(() =>
      appointmentsStore.allAppointments.filter(apt => apt.status === 'in_progress')
    )
    const totalActiveAppointments = computed(() =>
      appointmentsStore.allAppointments.filter(apt =>
        ['scheduled', 'confirmed', 'in_progress'].includes(apt.status)
      )
    )
    // Methods
    const getAppointmentLogs = (appointmentId) => aliveLogsStore.getAppointmentLogs(appointmentId)

    const refreshData = async () => {
      await appointmentsStore.fetchAppointments()
    }

    const applyStatusFilter = () => {
      // The computed property will automatically update when selectedStatusFilter changes
      // This method is called by the Select component's @change event
    }

    const clearError = () => {
      appointmentsStore.clearError()
      aliveLogsStore.clearError()
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

    const formatDateTime = (dateString) => {
      return new Date(dateString).toLocaleString('it-IT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }

    const getStatusLabel = (status) => {
      const statusMap = {
        scheduled: 'Programmato',
        confirmed: 'Confermato',
        in_progress: 'In Corso',
        completed: 'Completato',
        cancelled: 'Annullato'
      }
      return statusMap[status] || status
    }

    const getStatusSeverity = (status) => {
      const severityMap = {
        scheduled: 'info',
        confirmed: 'success',
        in_progress: 'success',
        completed: 'secondary',
        cancelled: 'danger'
      }
      return severityMap[status] || 'info'
    }

    const getStatusIcon = (status) => {
      const iconMap = {
        scheduled: 'pi pi-clock',
        confirmed: 'pi pi-check',
        in_progress: 'pi pi-play-circle',
        completed: 'pi pi-check-circle',
        cancelled: 'pi pi-times-circle'
      }
      return iconMap[status] || 'pi pi-circle'
    }

    const toggleLogs = async (appointmentId) => {
      const appointment = appointments.value.find(app => app.id === appointmentId)
      if (appointment) {
        selectedLogAppointment.value = appointment
        showLogsDialog.value = true

        // Load logs if not already loaded
        if (!aliveLogsStore.appointmentLogs[appointmentId]) {
          await aliveLogsStore.fetchAppointmentLogs(appointmentId)
        }
      }
    }

    const openLogForm = (appointment) => {
      selectedAppointment.value = appointment
      showLogForm.value = true
    }

    const closeLogForm = () => {
      showLogForm.value = false
      selectedAppointment.value = null
    }

    const openLogFormFromDialog = () => {
      selectedAppointment.value = selectedLogAppointment.value
      showLogForm.value = true
    }

    const handleLogSubmit = async (logData) => {
      logLoading.value = true
      try {
        await aliveLogsStore.addAppointmentLog(logData.appointmentId, {
          title: logData.title,
          description: logData.description,
          code: selectedAppointment.value?.code
        })
        showSuccess('Log aggiunto con successo')
        closeLogForm()
      } catch (error) {
        showError('Errore nell\'aggiunta del log', error.message)
      } finally {
        logLoading.value = false
      }
    }

    const updateStatus = async (appointmentId, newStatus) => {
      try {
        await aliveLogsStore.updateAppointmentStatus(appointmentId, newStatus)
        // Aggiorna anche lo store degli appuntamenti
        await appointmentsStore.updateAppointment(appointmentId, { status: newStatus })
        showSuccess('Status aggiornato con successo')

        // If status is no longer active, refresh the list
        if (!['scheduled', 'in_progress'].includes(newStatus)) {
          await refreshData()
        }
      } catch (error) {
        showError('Errore nell\'aggiornamento dello status', error.message)
        // Refresh to get the correct status
        await refreshData()
      }
    }        // Lifecycle
    onMounted(async () => {
      await refreshData()
    })

    return {      // State
      appointments,
      loading, error,
      scheduledAppointments,
      confirmedAppointments,
      inProgressAppointments,
      totalActiveAppointments,
      showLogs,
      showLogForm,
      showLogsDialog,
      selectedAppointment,
      selectedLogAppointment,
      logLoading,
      statusOptions,
      selectedStatusFilter,
      statusFilterOptions,
      // Methods
      getAppointmentLogs,
      refreshData,
      applyStatusFilter,
      clearError,
      formatDate,
      formatTime,
      formatDateTime,
      getStatusLabel,
      getStatusSeverity,
      getStatusIcon, toggleLogs,
      openLogForm,
      closeLogForm,
      openLogFormFromDialog,
      handleLogSubmit,
      updateStatus
    }
  }
})
</script>

<style scoped>
.alive-container {
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  gap: 1rem;
}

.header-content {
  flex: 1;
}

.page-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-color);
  margin: 0 0 0.5rem 0;
}

.page-subtitle {
  color: var(--text-color-secondary);
  font-size: 1rem;
  margin: 0;
}

.status-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.status-card {
  transition: transform 0.2s;
}

.status-card:hover {
  transform: translateY(-2px);
}

.status-card-content {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.status-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.status-card.in-progress .status-icon {
  background-color: var(--green-100);
  color: var(--green-600);
}

.status-card.scheduled .status-icon {
  background-color: var(--blue-100);
  color: var(--blue-600);
}

.status-card.confirmed .status-icon {
  background-color: var(--orange-100);
  color: var(--orange-600);
}

.status-card.total .status-icon {
  background-color: var(--yellow-100);
  color: var(--yellow-600);
}

.status-info h3 {
  font-size: 2rem;
  font-weight: 700;
  margin: 0;
  color: var(--text-color);
}

.status-info p {
  margin: 0;
  color: var(--text-color-secondary);
  font-weight: 500;
}

.controls-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 2rem 0;
  gap: 1rem;
  flex-wrap: wrap;
}

.filter-section {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.filter-label {
  font-weight: 600;
  color: var(--text-color);
  white-space: nowrap;
}

.status-filter {
  min-width: 250px;
}

@media (max-width: 768px) {
  .controls-section {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-section {
    justify-content: space-between;
  }

  .status-filter {
    min-width: auto;
    flex: 1;
  }
}

.appointments-section {
  margin-top: 2rem;
}

.empty-state {
  text-align: center;
  padding: 3rem;
}

.empty-content i {
  font-size: 4rem;
  color: var(--text-color-secondary);
  margin-bottom: 1rem;
}

.empty-content h3 {
  color: var(--text-color);
  margin-bottom: 0.5rem;
}

.empty-content p {
  color: var(--text-color-secondary);
}

.appointments-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 1.5rem;
}

.appointment-card {
  transition: all 0.2s;
}

.appointment-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.appointment-card.status-in-progress {
  border-left-color: var(--green-500);
}

.appointment-card.status-scheduled {
  border-left-color: var(--blue-500);
}

.appointment-card.status-confirmed {
  border-left-color: var(--orange-500);
}

.appointment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid var(--surface-200);
}

.appointment-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.status-dropdown {
  min-width: 120px;
}

.appointment-content {
  padding: 1.5rem;
}

.appointment-info {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.info-row i {
  color: var(--primary-color);
  font-size: 0.875rem;
  width: 16px;
}

.info-row span {
  font-size: 0.875rem;
  color: var(--text-color);
}

.logs-section {
  margin-top: 1rem;
}

.logs-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.logs-header h4 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
  color: var(--text-color);
  font-size: 1rem;
}

.logs-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.no-logs {
  text-align: center;
  padding: 2rem;
  color: var(--text-color-secondary);
  font-style: italic;
}

.log-item {
  background: var(--surface-50);
  border-radius: 8px;
  padding: 1rem;
  border-left: 3px solid var(--primary-color);
}

.log-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.5rem;
}

.log-header h5 {
  margin: 0;
  color: var(--text-color);
  font-size: 0.875rem;
  font-weight: 600;
}

.log-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.25rem;
}

.log-code {
  background: var(--primary-100);
  color: var(--primary-700);
  padding: 0.125rem 0.375rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  font-family: monospace;
}

.log-time {
  font-size: 0.75rem;
  color: var(--text-color-secondary);
}

.log-description {
  margin: 0.5rem 0;
  color: var(--text-color);
  font-size: 0.875rem;
  line-height: 1.4;
}

.log-author {
  color: var(--text-color-secondary);
  font-size: 0.75rem;
}

/* Logs Dialog Styles */
.logs-dialog-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* .appointment-info-card {
  border-left: 4px solid var(--surface-200);
}

.appointment-info-card.status-in-progress {
  border-left-color: var(--green-500);
}

.appointment-info-card.status-scheduled {
  border-left-color: var(--blue-500);
} */

.appointment-header-info {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 1rem;
}

@media (max-width: 768px) {
  .alive-container {
    padding: 1rem;
  }

  .page-header {
    flex-direction: column;
    align-items: stretch;
  }

  .appointments-grid {
    grid-template-columns: 1fr;
  }

  .appointment-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .appointment-actions {
    justify-content: center;
  }
}
</style>
