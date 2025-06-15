<template>
    <DashboardLayout>
        <div class="alive-container">
            <!-- Status Cards -->
            <div class="status-cards">
                <Card class="status-card in-progress">
                    <template #content>
                        <div class="status-card-content">
                            <div class="status-icon">
                                <i class="pi pi-play-circle"></i>
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
                                <i class="pi pi-clock"></i>
                            </div>
                            <div class="status-info">
                                <h3>{{ scheduledAppointments.length }}</h3>
                                <p>Programmati</p>
                            </div>
                        </div>
                    </template>
                </Card>

                <Card class="status-card total">
                    <template #content>
                        <div class="status-card-content">
                            <div class="status-icon">
                                <i class="pi pi-list"></i>
                            </div>
                            <div class="status-info">
                                <h3>{{ appointments.length }}</h3>
                                <p>Totale Attivi</p>
                            </div>
                        </div>
                    </template>
                </Card>
            </div>

            <Button label="Aggiorna" icon="pi pi-refresh" @click="refreshData" :loading="loading"
                class="p-button-outlined" />

            <!-- Error Message -->
            <Message v-if="error" severity="error" @close="clearError">
                {{ error }}
            </Message>

            <!-- Appointments List -->
            <div class="appointments-section">
                <Card v-if="appointments.length === 0 && !loading" class="empty-state">
                    <template #content>
                        <div class="empty-content">
                            <i class="pi pi-calendar-times"></i>
                            <h3>Nessun appuntamento attivo</h3>
                            <p>Non ci sono appuntamenti programmati o in corso al momento.</p>
                        </div>
                    </template>
                </Card>

                <div v-else class="appointments-grid">
                    <Card v-for="appointment in appointments" :key="appointment.id" class="appointment-card" :class="{
                        'status-in-progress': appointment.status === 'in_progress',
                        'status-scheduled': appointment.status === 'scheduled'
                    }">
                        <template #header>
                            <div class="appointment-header">
                                <div class="appointment-status">
                                    <Tag :value="getStatusLabel(appointment.status)"
                                        :severity="getStatusSeverity(appointment.status)"
                                        :icon="getStatusIcon(appointment.status)" />
                                </div>
                                <div class="appointment-actions">
                                    <Button icon="pi pi-plus" class="p-button-rounded p-button-text p-button-sm"
                                        @click="openLogForm(appointment)" v-tooltip.top="'Aggiungi Log'" />
                                    <Button icon="pi pi-list" class="p-button-rounded p-button-text p-button-sm"
                                        @click="toggleLogs(appointment.id)" v-tooltip.top="'Visualizza Log'" />
                                    <Select v-model="appointment.status" :options="statusOptions" option-label="label"
                                        option-value="value" @change="updateStatus(appointment.id, $event.value)"
                                        class="status-dropdown" />
                                </div>
                            </div>
                        </template>

                        <template #content>
                            <div class="appointment-content">
                                <div class="appointment-info">
                                    <div class="info-row">
                                        <i class="pi pi-user"></i>
                                        <span><strong>Paziente:</strong> {{ appointment.patient_name }}</span>
                                    </div>
                                    <div class="info-row">
                                        <i class="pi pi-user-plus"></i>
                                        <span><strong>Medico:</strong> Dr. {{ appointment.doctor_name }}</span>
                                    </div>
                                    <div class="info-row">
                                        <i class="pi pi-calendar"></i>
                                        <span><strong>Data:</strong> {{ formatDate(appointment.appointment_date)
                                        }}</span>
                                    </div>
                                    <div class="info-row">
                                        <i class="pi pi-clock"></i>
                                        <span><strong>Ora:</strong> {{ formatTime(appointment.appointment_date)
                                        }}</span>
                                    </div>
                                    <div class="info-row" v-if="appointment.notes">
                                        <i class="pi pi-file-edit"></i>
                                        <span><strong>Note:</strong> {{ appointment.notes }}</span>
                                    </div>
                                </div>

                                <!-- Logs Section -->
                                <div v-if="showLogs[appointment.id]" class="logs-section">
                                    <Divider />
                                    <div class="logs-header">
                                        <h4>
                                            <i class="pi pi-history"></i>
                                            Log Attività
                                        </h4>
                                        <Button label="Aggiungi Log" icon="pi pi-plus" class="p-button-sm"
                                            @click="openLogForm(appointment)" />
                                    </div>

                                    <div class="logs-list">
                                        <div v-if="getAppointmentLogs(appointment.id).length === 0" class="no-logs">
                                            <p>Nessun log presente per questo appuntamento.</p>
                                        </div>
                                        <div v-else v-for="log in getAppointmentLogs(appointment.id)" :key="log.id"
                                            class="log-item">
                                            <div class="log-header">
                                                <h5>{{ log.title }}</h5>
                                                <span class="log-time">{{ formatDateTime(log.created_at) }}</span>
                                            </div>
                                            <p class="log-description">{{ log.description }}</p>
                                            <small class="log-author">Creato da: {{ log.created_by }}</small>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </template>
                    </Card>
                </div>
            </div>
        </div>

        <!-- Add Log Dialog -->
        <AliveLogForm v-model:visible="showLogForm" :appointment-id="selectedAppointment?.id"
            :appointment-title="`${selectedAppointment?.patient_name} - Dr. ${selectedAppointment?.doctor_name}`"
            :loading="logLoading" @submit="handleLogSubmit" @cancel="closeLogForm" />
    </DashboardLayout>
</template>

<script>
import { defineComponent, ref, computed, onMounted } from 'vue'
import DashboardLayout from '../components/DashboardLayout.vue'
import AliveLogForm from '../components/AliveLogForm.vue'
import { useAliveLogsStore } from '../stores/aliveLogs'
import { useNotifications } from '../composables/useNotifications'
import Card from 'primevue/card'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import Message from 'primevue/message'
import Divider from 'primevue/divider'
import Select from 'primevue/select'

export default defineComponent({
    name: 'ALive',
    components: {
        DashboardLayout,
        AliveLogForm,
        Card,
        Button,
        Tag,
        Message,
        Divider,
        Select
    },
    setup() {
        const store = useAliveLogsStore()
        const { showSuccess, showError } = useNotifications()

        // State
        const showLogs = ref({})
        const showLogForm = ref(false)
        const selectedAppointment = ref(null)
        const logLoading = ref(false)

        // Status options for dropdown
        const statusOptions = [
            { label: 'Programmato', value: 'scheduled' },
            { label: 'In Corso', value: 'in_progress' },
            { label: 'Completato', value: 'completed' },
            { label: 'Annullato', value: 'cancelled' }
        ]

        // Computed
        const appointments = computed(() => store.appointments)
        const loading = computed(() => store.loading)
        const error = computed(() => store.error)
        const scheduledAppointments = computed(() => store.scheduledAppointments)
        const inProgressAppointments = computed(() => store.inProgressAppointments)

        // Methods
        const getAppointmentLogs = (appointmentId) => store.getAppointmentLogs(appointmentId)

        const refreshData = async () => {
            await store.fetchAliveLogs()
        }

        const clearError = () => {
            store.clearError()
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
                in_progress: 'In Corso',
                completed: 'Completato',
                cancelled: 'Annullato'
            }
            return statusMap[status] || status
        }

        const getStatusSeverity = (status) => {
            const severityMap = {
                scheduled: 'info',
                in_progress: 'success',
                completed: 'secondary',
                cancelled: 'danger'
            }
            return severityMap[status] || 'info'
        }

        const getStatusIcon = (status) => {
            const iconMap = {
                scheduled: 'pi pi-clock',
                in_progress: 'pi pi-play-circle',
                completed: 'pi pi-check-circle',
                cancelled: 'pi pi-times-circle'
            }
            return iconMap[status] || 'pi pi-circle'
        }

        const toggleLogs = async (appointmentId) => {
            if (showLogs.value[appointmentId]) {
                showLogs.value[appointmentId] = false
            } else {
                showLogs.value[appointmentId] = true
                // Load logs if not already loaded
                if (!store.appointmentLogs[appointmentId]) {
                    await store.fetchAppointmentLogs(appointmentId)
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

        const handleLogSubmit = async (logData) => {
            logLoading.value = true
            try {
                await store.addAppointmentLog(logData.appointmentId, {
                    title: logData.title,
                    description: logData.description
                })
                showSuccess('Log aggiunto con successo')
                closeLogForm()
            } catch (error) {
                showError('Errore nell\'aggiunta del log')
            } finally {
                logLoading.value = false
            }
        }

        const updateStatus = async (appointmentId, newStatus) => {
            try {
                await store.updateAppointmentStatus(appointmentId, newStatus)
                showSuccess('Status aggiornato con successo')

                // If status is no longer active, refresh the list
                if (!['scheduled', 'in_progress'].includes(newStatus)) {
                    await refreshData()
                }
            } catch (error) {
                showError('Errore nell\'aggiornamento dello status')
                // Refresh to get the correct status
                await refreshData()
            }
        }

        // Lifecycle
        onMounted(async () => {
            await refreshData()
        })

        return {
            // State
            appointments,
            loading,
            error,
            scheduledAppointments,
            inProgressAppointments,
            showLogs,
            showLogForm,
            selectedAppointment,
            logLoading,
            statusOptions,
            // Methods
            getAppointmentLogs,
            refreshData,
            clearError,
            formatDate,
            formatTime,
            formatDateTime,
            getStatusLabel,
            getStatusSeverity,
            getStatusIcon,
            toggleLogs,
            openLogForm,
            closeLogForm,
            handleLogSubmit,
            updateStatus
        }
    }
})
</script>

<style scoped>
.alive-container {
    padding: 1.5rem;
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
    border-left: 4px solid var(--surface-200);
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

.appointment-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.5rem;
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
