import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apiService } from '../services/api'
import { useAppStore } from './app'
import { usePatientsStore } from './patients'
import { useDoctorsStore } from './doctors'

export const useAppointmentsStore = defineStore('appointments', () => {
  const appStore = useAppStore()
  const patientsStore = usePatientsStore()
  const doctorsStore = useDoctorsStore()

  // State
  const appointments = ref([])
  const currentAppointment = ref(null)
  const pagination = ref({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  })
  const filters = ref({
    search: '',
    status: '',
    doctorId: '',
    patientId: '',
    dateFrom: '',
    dateTo: '',
    sortBy: 'appointment_date',
    sortOrder: 'asc'
  })
  const lastFetched = ref(null)
  const cacheTimeout = 1 * 60 * 1000 // 1 minuto (gli appuntamenti cambiano spesso)

  // Getters
  const allAppointments = computed(() => enrichedAppointments.value)
  const isDataStale = computed(() => {
    if (!lastFetched.value) return true
    return Date.now() - lastFetched.value > cacheTimeout
  })
  const todayAppointments = computed(() => {
    const today = new Date().toISOString().split('T')[0]
    return enrichedAppointments.value.filter(apt =>
      apt.appointment_date?.startsWith(today)
    )
  })

  const upcomingAppointments = computed(() => {
    const now = new Date()
    return enrichedAppointments.value.filter(apt => {
      const aptDate = new Date(apt.appointment_date)
      return aptDate > now && apt.status !== 'cancelled'
    }).sort((a, b) => new Date(a.appointment_date) - new Date(b.appointment_date))
  })
  const pendingAppointments = computed(() =>
    enrichedAppointments.value.filter(apt => apt.status === 'pending')
  )

  const appointmentsByStatus = computed(() => {
    const grouped = {}
    enrichedAppointments.value.forEach(apt => {
      const status = apt.status || 'pending'
      if (!grouped[status]) {
        grouped[status] = []
      }
      grouped[status].push(apt)
    })
    return grouped
  })

  const appointmentsByDoctor = computed(() => {
    const grouped = {}
    enrichedAppointments.value.forEach(apt => {
      const doctorId = apt.doctor_id || 'unknown'
      if (!grouped[doctorId]) {
        grouped[doctorId] = []
      }
      grouped[doctorId].push(apt)
    })
    return grouped
  })
  const filteredAppointments = computed(() => {
    let filtered = enrichedAppointments.value

    if (filters.value.search) {
      const search = filters.value.search.toLowerCase()
      filtered = filtered.filter(apt =>
        apt.patient_name?.toLowerCase().includes(search) ||
        apt.doctor_name?.toLowerCase().includes(search) ||
        apt.notes?.toLowerCase().includes(search)
      )
    }

    if (filters.value.status) {
      filtered = filtered.filter(apt => apt.status === filters.value.status)
    }

    if (filters.value.doctorId) {
      filtered = filtered.filter(apt => apt.doctor_id == filters.value.doctorId)
    }

    if (filters.value.patientId) {
      filtered = filtered.filter(apt => apt.patient_id == filters.value.patientId)
    }

    if (filters.value.dateFrom) {
      filtered = filtered.filter(apt =>
        new Date(apt.appointment_date) >= new Date(filters.value.dateFrom)
      )
    }

    if (filters.value.dateTo) {
      filtered = filtered.filter(apt =>
        new Date(apt.appointment_date) <= new Date(filters.value.dateTo)
      )
    }

    return filtered
  })
  // Computed per appuntamenti arricchiti con dati paziente e dottore
  const enrichedAppointments = computed(() => {
    return appointments.value.map(appointment => {
      const patient = patientsStore.allPatients.find(p => p.id === appointment.patient_id)
      const doctor = doctorsStore.allDoctors.find(d => d.id === appointment.doctor_id)

      return {
        ...appointment,
        patient_name: patient?.name || appointment.patient_full_name || 'Paziente non trovato',
        patient_email: patient?.email || appointment.patient_email || '',
        patient_phone: patient?.phone || appointment.patient_phone || '',
        doctor_name: doctor?.name || 'Dottore non trovato',
        doctor_specialization: doctor?.specialization || '',
        doctor_email: doctor?.email || ''
      }
    })
  })

  // Helper function per ottenere un appuntamento arricchito per ID
  function getEnrichedAppointment(appointmentId) {
    return enrichedAppointments.value.find(apt => apt.id === appointmentId)
  }

  // Helper function per assicurarsi che i dati correlati siano caricati
  async function ensureRelatedDataLoaded() {
    const promises = []

    // Carica pazienti se non sono aggiornati
    if (patientsStore.isDataStale) {
      promises.push(patientsStore.fetchPatients())
    }

    // Carica dottori se non sono aggiornati
    if (doctorsStore.isDataStale) {
      promises.push(doctorsStore.fetchDoctors())
    }

    await Promise.all(promises)
  }
  // Actions
  async function fetchAppointments(params = {}, force = false) {
    // Skip if data is fresh and not forced
    if (!force && !isDataStale.value && appointments.value.length > 0) {
      return enrichedAppointments.value
    }

    try {
      appStore.setLoading(true)
      appStore.clearError()

      // Assicuriamoci che i dati correlati siano caricati
      await ensureRelatedDataLoaded()

      const queryParams = {
        page: pagination.value.page,
        limit: pagination.value.limit,
        sortBy: filters.value.sortBy,
        sortOrder: filters.value.sortOrder,
        ...params
      }      // Add all active filters
      Object.keys(filters.value).forEach(key => {
        if (filters.value[key] && key !== 'sortBy' && key !== 'sortOrder') {
          queryParams[key] = filters.value[key]
        }
      })

      const response = await apiService.getAppointments(queryParams)

      // L'API restituisce direttamente l'array di appuntamenti
      if (Array.isArray(response)) {
        appointments.value = response
        pagination.value = {
          page: pagination.value.page,
          limit: pagination.value.limit,
          total: response.length,
          totalPages: Math.ceil(response.length / pagination.value.limit)
        }
      } else {
        // Formato con paginazione strutturata
        appointments.value = response.data || []
        pagination.value = {
          page: response.page || 1,
          limit: response.limit || 20,
          total: response.total || 0,
          totalPages: response.totalPages || 0
        }
      } lastFetched.value = Date.now()

      return enrichedAppointments.value
    } catch (error) {
      appStore.handleApiError(error)
      throw error
    } finally {
      appStore.setLoading(false)
    }
  }

  async function fetchAppointment(id, force = false) {
    // Check if appointment is already in cache
    if (!force && currentAppointment.value?.id === id) {
      return currentAppointment.value
    }

    const cachedAppointment = appointments.value.find(a => a.id === id)
    if (!force && cachedAppointment) {
      currentAppointment.value = cachedAppointment
      return cachedAppointment
    }

    try {
      appStore.setLoading(true)
      appStore.clearError()

      const appointment = await apiService.getAppointment(id)
      currentAppointment.value = appointment

      // Update in appointments array if exists
      const index = appointments.value.findIndex(a => a.id === id)
      if (index !== -1) {
        appointments.value[index] = appointment
      }

      return appointment
    } catch (error) {
      appStore.handleApiError(error)
      throw error
    } finally {
      appStore.setLoading(false)
    }
  }

  async function createAppointment(appointmentData) {
    try {
      appStore.setLoading(true)
      appStore.clearError()

      const newAppointment = await apiService.createAppointment(appointmentData)
      appointments.value.unshift(newAppointment)
      pagination.value.total += 1

      appStore.addNotification({
        severity: 'success',
        summary: 'Successo',
        detail: 'Appuntamento creato con successo'
      })

      return newAppointment
    } catch (error) {
      appStore.handleApiError(error)
      throw error
    } finally {
      appStore.setLoading(false)
    }
  }

  async function updateAppointment(id, appointmentData) {
    try {
      appStore.setLoading(true)
      appStore.clearError()

      const updatedAppointment = await apiService.updateAppointment(id, appointmentData)

      // Update in appointments array
      const index = appointments.value.findIndex(a => a.id === id)
      if (index !== -1) {
        appointments.value[index] = updatedAppointment
      }

      // Update current appointment if it's the same
      if (currentAppointment.value?.id === id) {
        currentAppointment.value = updatedAppointment
      }

      appStore.addNotification({
        severity: 'success',
        summary: 'Successo',
        detail: 'Appuntamento aggiornato con successo'
      })

      return updatedAppointment
    } catch (error) {
      appStore.handleApiError(error)
      throw error
    } finally {
      appStore.setLoading(false)
    }
  }

  async function deleteAppointment(id) {
    try {
      appStore.setLoading(true)
      appStore.clearError()

      await apiService.deleteAppointment(id)

      // Remove from appointments array
      const index = appointments.value.findIndex(a => a.id === id)
      if (index !== -1) {        // Remove from appointments array
        appointments.value.splice(index, 1)
        pagination.value.total -= 1
      }

      // Clear current appointment if it's the same
      if (currentAppointment.value?.id === id) {
        currentAppointment.value = null
      }

      appStore.addNotification({
        severity: 'success',
        summary: 'Successo',
        detail: 'Appuntamento eliminato con successo'
      })

      return true
    } catch (error) {
      appStore.handleApiError(error)
      throw error
    } finally {
      appStore.setLoading(false)
    }
  }

  async function updateAppointmentStatus(id, status) {
    const updatedAppointment = await updateAppointment(id, { status })

    const statusMessages = {
      'confirmed': 'Appuntamento confermato',
      'cancelled': 'Appuntamento cancellato',
      'completed': 'Appuntamento completato',
      'pending': 'Appuntamento in attesa'
    }

    appStore.addNotification({
      severity: status === 'cancelled' ? 'warn' : 'info',
      summary: 'Status aggiornato',
      detail: statusMessages[status] || 'Status appuntamento aggiornato'
    })

    return updatedAppointment
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

  function clearCurrentAppointment() {
    currentAppointment.value = null
  }
  // Utility function to get appointments for a specific date range
  function getAppointmentsByDateRange(startDate, endDate) {
    return enrichedAppointments.value.filter(apt => {
      const aptDate = new Date(apt.appointment_date)
      return aptDate >= startDate && aptDate <= endDate    })
  }

  return {
    // State
    appointments,
    currentAppointment,
    pagination,
    filters,
    lastFetched,

    // Getters
    allAppointments,
    isDataStale,
    todayAppointments,
    upcomingAppointments,
    pendingAppointments,
    appointmentsByStatus,
    appointmentsByDoctor,
    filteredAppointments,
    enrichedAppointments,

    // Actions
    fetchAppointments,
    fetchAppointment,
    createAppointment,
    updateAppointment,
    deleteAppointment,
    updateAppointmentStatus,
    setFilters,
    setPagination,
    clearCache,
    clearCurrentAppointment,
    getAppointmentsByDateRange,
    getEnrichedAppointment,
    ensureRelatedDataLoaded
  }
})
