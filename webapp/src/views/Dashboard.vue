<template>
  <DashboardLayout>
    <div class="dashboard-page">
      <!-- Stats Cards -->
      <div class="stats-grid">
        <div class="stat-card custom-card">
          <div class="stat-content">
            <div class="stat-info">
              <h3 class="stat-number">
                {{ dashboardData.totalPatients || 0 }}
              </h3>
              <p class="stat-label">
                Pazienti Totali
              </p>
            </div>
            <i class="pi pi-users stat-icon" />
          </div>
        </div>

        <div class="stat-card custom-card">
          <div class="stat-content">
            <div class="stat-info">
              <h3 class="stat-number">
                {{ dashboardData.totalDoctors || 0 }}
              </h3>
              <p class="stat-label">
                Medici
              </p>
            </div>
            <i class="pi pi-user-plus stat-icon" />
          </div>
        </div>

        <div class="stat-card custom-card">
          <div class="stat-content">
            <div class="stat-info">
              <h3 class="stat-number">
                {{ dashboardData.todayAppointments || 0 }}
              </h3>
              <p class="stat-label">
                Appuntamenti Oggi
              </p>
            </div>
            <i class="pi pi-calendar stat-icon" />
          </div>
        </div>

        <div class="stat-card custom-card">
          <div class="stat-content">
            <div class="stat-info">
              <h3 class="stat-number">
                {{ dashboardData.pendingAppointments || 0 }}
              </h3>
              <p class="stat-label">
                Appuntamenti Pianificati
              </p>
            </div>
            <i class="pi pi-chart-line stat-icon" />
          </div>
        </div>
      </div>

      <!-- Recent Appointments -->
      <div class="dashboard-sections">
        <div class="section-card custom-card">
          <div class="section-header">
            <h3>Prossimi Appuntamenti</h3>
            <Button
              label="Vedi Tutti"
              icon="pi pi-calendar"
              class="p-button-text p-button-sm"
              @click="goToCalendar"
            />
          </div>
          <div v-if="dashboardData.recentAppointments?.length" class="appointments-list">
            <div v-for="appointment in dashboardData.recentAppointments" :key="appointment.id" class="appointment-item">
              <div class="appointment-time">
                <i class="pi pi-clock" />
                {{ formatDateTime(appointment.appointment_date) }}
              </div>
              <div class="appointment-details">
                <div class="patient-name">
                  {{ appointment.patient_name }}
                </div>
                <div class="doctor-info">
                  Dr. {{ appointment.doctor_name }} - {{ appointment.doctor_specialization || 'Medico Generico' }}
                </div>
              </div>
              <Badge :value="appointment.status" :severity="getStatusSeverity(appointment.status)" />
            </div>
          </div>

          <div v-else class="empty-state">
            <i class="pi pi-calendar" />
            <p>Nessun appuntamento programmato</p>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="section-card custom-card">
          <div class="section-header">
            <h3>Azioni Rapide</h3>
          </div>

          <div class="quick-actions">
            <Button
              label="Nuovo Paziente"
              icon="pi pi-user-plus"
              class="p-button-outlined quick-action-btn"
              @click="goToPatients"
            />
            <Button
              label="Nuovo Medico"
              icon="pi pi-plus"
              class="p-button-outlined quick-action-btn"
              @click="goToDoctors"
            />
            <Button
              label="Nuovo Appuntamento"
              icon="pi pi-calendar-plus"
              class="quick-action-btn"
              @click="goToCalendar"
            />
          </div>
        </div>
      </div>
      <!-- Loading overlay -->
      <div v-if="isLoading" class="loading-overlay">
        <ProgressSpinner style="width: 100px; height: 100px" stroke-width="4" />
        <p>Caricamento dati...</p>
      </div>
    </div>
  </DashboardLayout>
</template>

<script>
import { defineComponent, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import DashboardLayout from '../components/DashboardLayout.vue'
import Button from 'primevue/button'
import Badge from 'primevue/badge'
import ProgressSpinner from 'primevue/progressspinner'
import { useDashboardStore, useAppStore } from '../stores'

export default defineComponent({
  components: {
    DashboardLayout,
    Button,
    Badge,
    ProgressSpinner
  },
  setup() {
    const router = useRouter()
    const dashboardStore = useDashboardStore()
    const appStore = useAppStore()

    // Reactive refs from stores
    const { dashboardData } = storeToRefs(dashboardStore)
    const { isLoading } = storeToRefs(appStore)

    const formatDateTime = (dateString) => {
      if (!dateString) return ''
      const date = new Date(dateString)
      return date.toLocaleDateString('it-IT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }

    const getStatusSeverity = (status) => {
      const severityMap = {
        'pending': 'warn',
        'confirmed': 'success',
        'cancelled': 'danger',
        'completed': 'info'
      }
      return severityMap[status] || 'info'
    }

    const goToPatients = () => {
      router.push('/patients')
    }

    const goToDoctors = () => {
      router.push('/doctors')
    }

    const goToCalendar = () => {
      router.push('/calendar')
    }

    onMounted(async () => {
      try {
        await dashboardStore.fetchDashboardData()
      } catch (error) {
        console.error('Error loading dashboard:', error)
      }
    })

    return {
      dashboardData,
      isLoading,
      formatDateTime,
      getStatusSeverity,
      goToPatients,
      goToDoctors,
      goToCalendar
    }
  }
})
</script>

<style scoped>
.dashboard-page {
  position: relative;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  padding: 1.5rem;
}

.stat-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.stat-number {
  font-size: 2rem;
  font-weight: 700;
  color: var(--primary-700);
  margin: 0 0 0.25rem 0;
}

.stat-label {
  color: var(--text-color-secondary);
  font-weight: 500;
  margin: 0;
}

.stat-icon {
  font-size: 2.5rem;
  color: var(--primary-300);
}

.dashboard-sections {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1.5rem;
}

.section-card {
  padding: 1.5rem;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--surface-200);
}

.section-header h3 {
  color: var(--text-color);
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
}

.appointments-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.appointment-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background-color: var(--surface-50);
  border-radius: 6px;
  border: 1px solid var(--surface-200);
}

.appointment-time {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-color-secondary);
  font-weight: 500;
  min-width: 140px;
  font-size: 0.875rem;
}

.appointment-details {
  flex: 1;
}

.patient-name {
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 0.25rem;
}

.doctor-info {
  color: var(--text-color-secondary);
  font-size: 0.875rem;
}

.quick-actions {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.quick-action-btn {
  width: 100%;
  justify-content: flex-start;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: var(--text-color-muted);
}

.empty-state i {
  font-size: 3rem;
  margin-bottom: 1rem;
  display: block;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.8);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  z-index: 10;
}

.loading-overlay p {
  color: var(--text-color-secondary);
  font-weight: 500;
}

/* Responsive design */
@media (max-width: 1024px) {
  .dashboard-sections {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }

  .stat-card {
    padding: 1rem;
  }

  .stat-number {
    font-size: 1.5rem;
  }

  .appointment-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .appointment-time {
    min-width: auto;
  }
}

@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
