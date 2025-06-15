import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apiService } from '../services/api.js'

export const useAliveLogsStore = defineStore('AliveLogs', () => {
  // State
  const appointments = ref([])
  const appointmentLogs = ref({})
  const loading = ref(false)
  const error = ref(null)

  // Getters
  const getAppointmentsByStatus = computed(() => (status) => {
    return appointments.value.filter(apt => apt.status === status)
  })

  const getAppointmentLogs = computed(() => (appointmentId) => {
    return appointmentLogs.value[appointmentId] || []
  })

  const scheduledAppointments = computed(() => 
    appointments.value.filter(apt => apt.status === 'scheduled')
  )

  const inProgressAppointments = computed(() => 
    appointments.value.filter(apt => apt.status === 'in_progress')
  )

  // Actions
  const fetchAliveLogs = async () => {
    loading.value = true
    error.value = null
    try {
      const response = await apiService.getAliveLogs()
      appointments.value = response
    } catch (err) {
      error.value = err.response?.data?.error || 'Errore nel caricamento degli appuntamenti'
      console.error('Error fetching alive appointments:', err)
    } finally {
      loading.value = false
    }
  }

  const fetchAppointmentLogs = async (appointmentId) => {
    try {
      const response = await apiService.getAppointmentLogs(appointmentId)
      appointmentLogs.value[appointmentId] = response
    } catch (err) {
      error.value = err.response?.data?.error || 'Errore nel caricamento dei log'
      console.error('Error fetching appointment logs:', err)
    }
  }

  const addAppointmentLog = async (appointmentId, logData) => {
    try {
      const response = await apiService.addAppointmentLog(appointmentId, logData)
      
      // Update local logs
      if (!appointmentLogs.value[appointmentId]) {
        appointmentLogs.value[appointmentId] = []
      }
      appointmentLogs.value[appointmentId].unshift(response)
      
      return response
    } catch (err) {
      error.value = err.response?.data?.error || 'Errore nell\'aggiunta del log'
      console.error('Error adding appointment log:', err)
      throw err
    }
  }

  const updateAppointmentStatus = async (appointmentId, status) => {
    try {
      const response = await apiService.updateAppointmentStatus(appointmentId, status)
      
      // Update local appointment
      const appointmentIndex = appointments.value.findIndex(apt => apt.id === appointmentId)
      if (appointmentIndex !== -1) {
        appointments.value[appointmentIndex] = { ...appointments.value[appointmentIndex], status }
      }
      
      return response
    } catch (err) {
      error.value = err.response?.data?.error || 'Errore nell\'aggiornamento dello status'
      console.error('Error updating appointment status:', err)
      throw err
    }
  }

  const clearError = () => {
    error.value = null
  }

  const resetStore = () => {
    appointments.value = []
    appointmentLogs.value = {}
    loading.value = false
    error.value = null
  }

  return {
    // State
    appointments,
    appointmentLogs,
    loading,
    error,
    // Getters
    getAppointmentsByStatus,
    getAppointmentLogs,
    scheduledAppointments,
    inProgressAppointments,
    // Actions
    fetchAliveLogs,
    fetchAppointmentLogs,
    addAppointmentLog,
    updateAppointmentStatus,
    clearError,
    resetStore
  }
})
