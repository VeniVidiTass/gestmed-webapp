import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apiService } from '../services/api'
import { useAppStore } from './app'

export const useServicesStore = defineStore('services', () => {
    const appStore = useAppStore()
    const services = ref([])
    const currentService = ref(null)
    const pagination = ref({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0
    })
    
    const filters = ref({
        search: '',
        doctor_id: '',
        is_active: true,
        sortBy: 'name',
        sortOrder: 'asc'
    })
    
    const lastFetched = ref(null)
    const cacheTimeout = 5 * 60 * 1000 // 5 minuti    // Getters
    const allServices = computed(() => services.value || [])
    
    const isDataStale = computed(() => {
        if (!lastFetched.value) return true
        return Date.now() - lastFetched.value > cacheTimeout
    })
    
    const activeServices = computed(() =>
        (services.value || []).filter(service => service.is_active)
    )
    
    const servicesByDoctor = computed(() => {
        const grouped = {}
            ; (services.value || []).forEach(service => {
                const doctorId = service.doctor_id
                if (!grouped[doctorId]) {
                    grouped[doctorId] = []
                }
                grouped[doctorId].push(service)
            })
        return grouped
    })
    
    const filteredServices = computed(() => {
        let filtered = services.value || []

        // Search filter
        if (filters.value.search) {
            const searchTerm = filters.value.search.toLowerCase()
            filtered = filtered.filter(service =>
                service.name?.toLowerCase().includes(searchTerm) ||
                service.description?.toLowerCase().includes(searchTerm)
            )
        }

        // Doctor filter
        if (filters.value.doctor_id) {
            filtered = filtered.filter(service => service.doctor_id === parseInt(filters.value.doctor_id))
        }

        // Active filter
        if (filters.value.is_active !== null && filters.value.is_active !== '') {
            filtered = filtered.filter(service => service.is_active === filters.value.is_active)
        }

        // Sorting
        filtered.sort((a, b) => {
            const field = filters.value.sortBy
            const order = filters.value.sortOrder === 'asc' ? 1 : -1

            if (field === 'price') {
                return (parseFloat(a[field]) - parseFloat(b[field])) * order
            }

            if (field === 'duration_minutes') {
                return (parseInt(a[field]) - parseInt(b[field])) * order
            }

            return a[field]?.toString().localeCompare(b[field]?.toString()) * order
        })

        return filtered
    })
    
    // Actions
    async function fetchServices(force = false) {
        if (!force && !isDataStale.value && services.value.length > 0) {
            return services.value
        } try {
            appStore.setLoading(true)

            const response = await apiService.getServices(filters.value)
            services.value = response // response è già .data grazie all'interceptor
            lastFetched.value = Date.now()
            return services.value
        } catch (error) {
            console.error('Error fetching services:', error)
            appStore.addNotification({
                severity: 'error',
                summary: 'Errore',
                detail: 'Errore nel caricamento dei servizi'
            })
            throw error
        } finally {
            appStore.setLoading(false)
        }
    }    async function fetchServiceById(id) {
        try {
            const response = await apiService.getService(id)
            currentService.value = response // response è già .data
            return response
        } catch (error) {
            console.error('Error fetching service:', error)
            appStore.addNotification({
                severity: 'error',
                summary: 'Errore',
                detail: 'Errore nel caricamento del servizio'
            })
            throw error
        }
    }
    
    async function createService(serviceData) {
        try {
            appStore.setLoading(true)
            const response = await apiService.createService(serviceData)
            const newService = response // response è già .data

            services.value.unshift(newService)
            appStore.addNotification({
                severity: 'success',
                summary: 'Successo',
                detail: 'Servizio creato con successo'
            })
            return newService
        } catch (error) {
            console.error('Error creating service:', error)
            appStore.addNotification({
                severity: 'error',
                summary: 'Errore',
                detail: 'Errore nella creazione del servizio'
            })
            throw error
        } finally {
            appStore.setLoading(false)
        }
    }
    
    async function updateService(id, serviceData) {
        try {
            appStore.setLoading(true)
            const response = await apiService.updateService(id, serviceData)
            const updatedService = response // response è già .data

            const index = services.value.findIndex(s => s.id === id)
            if (index !== -1) {
                services.value[index] = updatedService
            }

            if (currentService.value?.id === id) {
                currentService.value = updatedService
            }

            appStore.addNotification({
                severity: 'success',
                summary: 'Successo',
                detail: 'Servizio aggiornato con successo'
            })
            return updatedService
        } catch (error) {
            console.error('Error updating service:', error)
            appStore.addNotification({
                severity: 'error',
                summary: 'Errore',
                detail: 'Errore nell\'aggiornamento del servizio'
            })
            throw error
        } finally {
            appStore.setLoading(false)
        }
    }

    async function deleteService(id) {
        try {
            appStore.setLoading(true)
            await apiService.deleteService(id)

            services.value = services.value.filter(s => s.id !== id)

            if (currentService.value?.id === id) {
                currentService.value = null
            }

            appStore.addNotification({
                severity: 'success',
                summary: 'Successo',
                detail: 'Servizio eliminato con successo'
            })
        } catch (error) {
            console.error('Error deleting service:', error)
            if (error.response?.status === 400) {
                appStore.addNotification({
                    severity: 'error',
                    summary: 'Errore',
                    detail: 'Impossibile eliminare: il servizio è utilizzato in appuntamenti esistenti'
                })
            } else {
                appStore.addNotification({
                    severity: 'error',
                    summary: 'Errore',
                    detail: 'Errore nell\'eliminazione del servizio'
                })
            }
            throw error
        } finally {
            appStore.setLoading(false)
        }
    }    async function fetchServicesByDoctor(doctorId) {
        try {
            const response = await apiService.getServicesByDoctor(doctorId)
            return response // response è già .data
        } catch (error) {
            console.error('Error fetching services by doctor:', error)
            appStore.addNotification({
                severity: 'error',
                summary: 'Errore',
                detail: 'Errore nel caricamento dei servizi del medico'
            })
            throw error
        }
    }

    function setFilters(newFilters) {
        filters.value = { ...filters.value, ...newFilters }
    }

    function resetFilters() {
        filters.value = {
            search: '',
            doctor_id: '',
            is_active: true,
            sortBy: 'name',
            sortOrder: 'asc'
        }
    }

    function clearCache() {
        services.value = []
        currentService.value = null
        lastFetched.value = null
    }

    function setCurrentService(service) {
        currentService.value = service
    }

    return {
        // State
        services,
        currentService,
        pagination,
        filters,

        // Getters
        allServices,
        isDataStale,
        activeServices,
        servicesByDoctor,
        filteredServices,

        // Actions
        fetchServices,
        fetchServiceById,
        createService,
        updateService,
        deleteService,
        fetchServicesByDoctor,
        setFilters,
        resetFilters,
        clearCache,
        setCurrentService
    }
})
