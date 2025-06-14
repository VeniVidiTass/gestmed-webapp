import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apiService } from '../services/api'
import { useAppStore } from './app'

export const useDashboardStore = defineStore('dashboard', () => {
  const appStore = useAppStore()

  // State
  const data = ref({
    totalPatients: 0,
    totalDoctors: 0,
    todayAppointments: 0,
    pendingAppointments: 0,
    recentPatients: [],
    recentAppointments: [],
    statistics: {}
  })
  const lastFetched = ref(null)
  const cacheTimeout = 5 * 60 * 1000 // 5 minuti

  // Getters
  const dashboardData = computed(() => data.value)
  const isDataStale = computed(() => {
    if (!lastFetched.value) return true
    return Date.now() - lastFetched.value > cacheTimeout
  })

  // Actions
  async function fetchDashboardData(force = false) {
    // Skip if data is fresh and not forced
    if (!force && !isDataStale.value) {
      return data.value
    }

    try {
      appStore.setLoading(true)
      appStore.clearError()

      const response = await apiService.getDashboardData()
      
      data.value = {
        totalPatients: response.totalPatients || 0,
        totalDoctors: response.totalDoctors || 0,
        todayAppointments: response.todayAppointments || 0,
        pendingAppointments: response.pendingAppointments || 0,
        recentPatients: response.recentPatients || [],
        recentAppointments: response.recentAppointments || [],
        statistics: response.statistics || {}
      }
      
      lastFetched.value = Date.now()
      
      return data.value
    } catch (error) {
      appStore.handleApiError(error)
      throw error
    } finally {
      appStore.setLoading(false)
    }
  }

  function updatePatientCount(increment = 1) {
    data.value.totalPatients += increment
  }

  function updateDoctorCount(increment = 1) {
    data.value.totalDoctors += increment
  }

  function updateTodayAppointments(increment = 1) {
    data.value.todayAppointments += increment
  }

  function addRecentPatient(patient) {
    data.value.recentPatients.unshift(patient)
    // Keep only last 5
    if (data.value.recentPatients.length > 5) {
      data.value.recentPatients.pop()
    }
  }

  function addRecentAppointment(appointment) {
    data.value.recentAppointments.unshift(appointment)
    // Keep only last 5
    if (data.value.recentAppointments.length > 5) {
      data.value.recentAppointments.pop()
    }
  }

  function clearCache() {
    lastFetched.value = null
  }

  return {
    // State
    data,
    lastFetched,
    
    // Getters
    dashboardData,
    isDataStale,
    
    // Actions
    fetchDashboardData,
    updatePatientCount,
    updateDoctorCount,
    updateTodayAppointments,
    addRecentPatient,
    addRecentAppointment,
    clearCache
  }
})
