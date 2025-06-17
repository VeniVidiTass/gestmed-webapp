import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apiService } from '../services/api'
import { useAppStore } from './app'

export const usePatientsStore = defineStore('patients', () => {
  const appStore = useAppStore()

  // State
  const patients = ref([])
  const currentPatient = ref(null)
  const pagination = ref({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })
  const filters = ref({
    search: '',
    status: '',
    sortBy: 'created_at',
    sortOrder: 'desc'
  })
  const lastFetched = ref(null)
  const cacheTimeout = 2 * 60 * 1000 // 2 minuti

  // Getters
  const allPatients = computed(() => patients.value)
  const isDataStale = computed(() => {
    if (!lastFetched.value) return true
    return Date.now() - lastFetched.value > cacheTimeout
  })
  const filteredPatients = computed(() => {
    let filtered = patients.value

    if (filters.value.search) {
      const search = filters.value.search.toLowerCase()
      filtered = filtered.filter(patient =>
        patient.name?.toLowerCase().includes(search) ||
        patient.email?.toLowerCase().includes(search) ||
        patient.phone?.includes(search) ||
        patient.fiscal_code?.toLowerCase().includes(search)
      )
    }

    if (filters.value.status) {
      filtered = filtered.filter(patient => patient.status === filters.value.status)
    }

    return filtered
  })

  // Actions
  async function fetchPatients(params = {}, force = false) {
    // Skip if data is fresh and not forced
    if (!force && !isDataStale.value && patients.value.length > 0) {
      return patients.value
    }

    try {
      appStore.setLoading(true)
      appStore.clearError()

      const queryParams = {
        page: pagination.value.page,
        limit: pagination.value.limit,
        sortBy: filters.value.sortBy,
        sortOrder: filters.value.sortOrder,
        ...params
      }

      if (filters.value.search) {
        queryParams.search = filters.value.search
      }

      if (filters.value.status) {
        queryParams.status = filters.value.status
      } const response = await apiService.getPatients(queryParams)

      // L'API restituisce direttamente l'array di pazienti
      if (Array.isArray(response)) {
        patients.value = response
        pagination.value = {
          page: pagination.value.page,
          limit: pagination.value.limit,
          total: response.length,
          totalPages: Math.ceil(response.length / pagination.value.limit)
        }
      } else {
        // Formato con paginazione strutturata
        patients.value = response.data || []
        pagination.value = {
          page: response.page || 1,
          limit: response.limit || 10,
          total: response.total || 0,
          totalPages: response.totalPages || 0
        }
      }

      lastFetched.value = Date.now()

      return patients.value
    } catch (error) {
      appStore.handleApiError(error)
      throw error
    } finally {
      appStore.setLoading(false)
    }
  }

  async function fetchPatient(id, force = false) {
    // Check if patient is already in cache
    if (!force && currentPatient.value?.id === id) {
      return currentPatient.value
    }

    const cachedPatient = patients.value.find(p => p.id === id)
    if (!force && cachedPatient) {
      currentPatient.value = cachedPatient
      return cachedPatient
    }

    try {
      appStore.setLoading(true)
      appStore.clearError()

      const patient = await apiService.getPatient(id)
      currentPatient.value = patient

      // Update in patients array if exists
      const index = patients.value.findIndex(p => p.id === id)
      if (index !== -1) {
        patients.value[index] = patient
      }

      return patient
    } catch (error) {
      appStore.handleApiError(error)
      throw error
    } finally {
      appStore.setLoading(false)
    }
  }

  async function createPatient(patientData) {
    try {
      appStore.setLoading(true)
      appStore.clearError()

      const newPatient = await apiService.createPatient(patientData)      // Add to patients array
      patients.value.unshift(newPatient)
      pagination.value.total += 1

      appStore.addNotification({
        severity: 'success',
        summary: 'Successo',
        detail: 'Paziente creato con successo'
      })

      return newPatient
    } catch (error) {
      appStore.handleApiError(error)
      throw error
    } finally {
      appStore.setLoading(false)
    }
  }

  async function updatePatient(id, patientData) {
    try {
      appStore.setLoading(true)
      appStore.clearError()

      const updatedPatient = await apiService.updatePatient(id, patientData)

      // Update in patients array
      const index = patients.value.findIndex(p => p.id === id)
      if (index !== -1) {
        patients.value[index] = updatedPatient
      }

      // Update current patient if it's the same
      if (currentPatient.value?.id === id) {
        currentPatient.value = updatedPatient
      }

      appStore.addNotification({
        severity: 'success',
        summary: 'Successo',
        detail: 'Paziente aggiornato con successo'
      })

      return updatedPatient
    } catch (error) {
      appStore.handleApiError(error)
      throw error
    } finally {
      appStore.setLoading(false)
    }
  }

  async function deletePatient(id) {
    try {
      appStore.setLoading(true)
      appStore.clearError()

      await apiService.deletePatient(id)

      // Remove from patients array
      const index = patients.value.findIndex(p => p.id === id)
      if (index !== -1) {
        patients.value.splice(index, 1)
        pagination.value.total -= 1
      }

      // Clear current patient if it's the same
      if (currentPatient.value?.id === id) {
        currentPatient.value = null
      }

      appStore.addNotification({
        severity: 'success',
        summary: 'Successo',
        detail: 'Paziente eliminato con successo'
      })

      return true
    } catch (error) {
      appStore.handleApiError(error)
      throw error
    } finally {
      appStore.setLoading(false)
    }
  }

  function setFilters(newFilters) {
    filters.value = { ...filters.value, ...newFilters }
    clearCache()
  }

  function setPagination(newPagination) {
    pagination.value = { ...pagination.value, ...newPagination }
  }

  function clearCache() {
    lastFetched.value = null
  }

  function clearCurrentPatient() {
    currentPatient.value = null
  }

  return {
    // State
    patients,
    currentPatient,
    pagination,
    filters,
    lastFetched,

    // Getters
    allPatients,
    isDataStale,
    filteredPatients,

    // Actions
    fetchPatients,
    fetchPatient,
    createPatient,
    updatePatient,
    deletePatient,
    setFilters,
    setPagination,
    clearCache,
    clearCurrentPatient
  }
})
