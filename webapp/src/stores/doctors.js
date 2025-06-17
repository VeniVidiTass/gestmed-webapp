import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apiService } from '../services/api'
import { useAppStore } from './app'

export const useDoctorsStore = defineStore('doctors', () => {
  const appStore = useAppStore()

  // State
  const doctors = ref([])
  const currentDoctor = ref(null)
  const pagination = ref({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })
  const filters = ref({
    search: '',
    specialization: '',
    availability: '',
    sortBy: 'name',
    sortOrder: 'asc'
  })
  const lastFetched = ref(null)
  const cacheTimeout = 5 * 60 * 1000 // 5 minuti (i dottori cambiano meno spesso)

  // Getters
  const allDoctors = computed(() => doctors.value)
  const isDataStale = computed(() => {
    if (!lastFetched.value) return true
    return Date.now() - lastFetched.value > cacheTimeout
  })
  const availableDoctors = computed(() =>
    doctors.value.filter(doctor => doctor.is_available)
  )
  const doctorsBySpecialization = computed(() => {
    const grouped = {}
    doctors.value.forEach(doctor => {
      const spec = doctor.specialization || 'Generale'
      if (!grouped[spec]) {
        grouped[spec] = []
      }
      grouped[spec].push(doctor)
    })
    return grouped
  })
  const filteredDoctors = computed(() => {
    let filtered = doctors.value

    if (filters.value.search) {
      const search = filters.value.search.toLowerCase()
      filtered = filtered.filter(doctor =>
        doctor.name?.toLowerCase().includes(search) ||
        doctor.email?.toLowerCase().includes(search) ||
        doctor.specialization?.toLowerCase().includes(search) ||
        doctor.license_number?.includes(search)
      )
    }

    if (filters.value.specialization) {
      filtered = filtered.filter(doctor =>
        doctor.specialization === filters.value.specialization
      )
    }

    if (filters.value.availability !== '') {
      const isAvailable = filters.value.availability === 'true'
      filtered = filtered.filter(doctor => doctor.is_available === isAvailable)
    }

    return filtered
  })

  // Actions
  async function fetchDoctors(params = {}, force = false) {
    // Skip if data is fresh and not forced
    if (!force && !isDataStale.value && doctors.value.length > 0) {
      return doctors.value
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

      if (filters.value.specialization) {
        queryParams.specialization = filters.value.specialization
      }

      if (filters.value.availability !== '') {
        queryParams.availability = filters.value.availability
      } const response = await apiService.getDoctors(queryParams)

      // L'API restituisce direttamente l'array di dottori
      if (Array.isArray(response)) {
        doctors.value = response
        pagination.value = {
          page: pagination.value.page,
          limit: pagination.value.limit,
          total: response.length,
          totalPages: Math.ceil(response.length / pagination.value.limit)
        }
      } else {
        // Formato con paginazione strutturata
        doctors.value = response.data || []
        pagination.value = {
          page: response.page || 1,
          limit: response.limit || 10,
          total: response.total || 0,
          totalPages: response.totalPages || 0
        }
      }

      lastFetched.value = Date.now()

      return doctors.value
    } catch (error) {
      appStore.handleApiError(error)
      throw error
    } finally {
      appStore.setLoading(false)
    }
  }

  async function fetchDoctor(id, force = false) {
    // Check if doctor is already in cache
    if (!force && currentDoctor.value?.id === id) {
      return currentDoctor.value
    }

    const cachedDoctor = doctors.value.find(d => d.id === id)
    if (!force && cachedDoctor) {
      currentDoctor.value = cachedDoctor
      return cachedDoctor
    }

    try {
      appStore.setLoading(true)
      appStore.clearError()

      const doctor = await apiService.getDoctor(id)
      currentDoctor.value = doctor

      // Update in doctors array if exists
      const index = doctors.value.findIndex(d => d.id === id)
      if (index !== -1) {
        doctors.value[index] = doctor
      }

      return doctor
    } catch (error) {
      appStore.handleApiError(error)
      throw error
    } finally {
      appStore.setLoading(false)
    }
  }

  async function createDoctor(doctorData) {
    try {
      appStore.setLoading(true)
      appStore.clearError()

      const newDoctor = await apiService.createDoctor(doctorData)      // Add to doctors array
      doctors.value.unshift(newDoctor)
      pagination.value.total += 1

      appStore.addNotification({
        severity: 'success',
        summary: 'Successo',
        detail: 'Dottore creato con successo'
      })

      return newDoctor
    } catch (error) {
      appStore.handleApiError(error)
      throw error
    } finally {
      appStore.setLoading(false)
    }
  }

  async function updateDoctor(id, doctorData) {
    try {
      appStore.setLoading(true)
      appStore.clearError()

      const updatedDoctor = await apiService.updateDoctor(id, doctorData)

      // Update in doctors array
      const index = doctors.value.findIndex(d => d.id === id)
      if (index !== -1) {
        doctors.value[index] = updatedDoctor
      }

      // Update current doctor if it's the same
      if (currentDoctor.value?.id === id) {
        currentDoctor.value = updatedDoctor
      }

      appStore.addNotification({
        severity: 'success',
        summary: 'Successo',
        detail: 'Dottore aggiornato con successo'
      })

      return updatedDoctor
    } catch (error) {
      appStore.handleApiError(error)
      throw error
    } finally {
      appStore.setLoading(false)
    }
  }

  async function deleteDoctor(id) {
    try {
      appStore.setLoading(true)
      appStore.clearError()

      await apiService.deleteDoctor(id)

      // Remove from doctors array
      const index = doctors.value.findIndex(d => d.id === id)
      if (index !== -1) {
        doctors.value.splice(index, 1)
        pagination.value.total -= 1
      }

      // Clear current doctor if it's the same
      if (currentDoctor.value?.id === id) {
        currentDoctor.value = null
      }

      appStore.addNotification({
        severity: 'success',
        summary: 'Successo',
        detail: 'Dottore eliminato con successo'
      })

      return true
    } catch (error) {
      appStore.handleApiError(error)
      throw error
    } finally {
      appStore.setLoading(false)
    }
  }

  async function updateDoctorAvailability(id, isAvailable) {
    const updatedDoctor = await updateDoctor(id, { is_available: isAvailable })

    appStore.addNotification({
      severity: 'info',
      summary: 'Disponibilità aggiornata',
      detail: `Dr. ${updatedDoctor.name} è ora ${isAvailable ? 'disponibile' : 'non disponibile'}`
    })

    return updatedDoctor
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

  function clearCurrentDoctor() {
    currentDoctor.value = null
  }

  return {
    // State
    doctors,
    currentDoctor,
    pagination,
    filters,
    lastFetched,

    // Getters
    allDoctors,
    isDataStale,
    availableDoctors,
    doctorsBySpecialization,
    filteredDoctors,

    // Actions
    fetchDoctors,
    fetchDoctor,
    createDoctor,
    updateDoctor,
    deleteDoctor,
    updateDoctorAvailability,
    setFilters,
    setPagination,
    clearCache,
    clearCurrentDoctor
  }
})
