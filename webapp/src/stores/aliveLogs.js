import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apiService } from '../services/api.js'

export const useAliveLogsStore = defineStore('AliveLogs', () => {
  // State
  const appointmentLogs = ref({})
  const loading = ref(false)
  const error = ref(null)

  // Getters
  const getAppointmentLogs = computed(() => (appointmentId) => {
    return appointmentLogs.value[appointmentId] || []
  })  // Actions
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
    appointmentLogs.value = {}
    loading.value = false
    error.value = null
  }

  return {
    // State
    appointmentLogs,
    loading,
    error,
    // Getters
    getAppointmentLogs,
    // Actions
    fetchAppointmentLogs,
    addAppointmentLog,
    updateAppointmentStatus,
    clearError,
    resetStore
  }
})
