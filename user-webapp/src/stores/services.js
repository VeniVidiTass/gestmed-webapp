import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '../services/api'

export const useServicesStore = defineStore('services', () => {
  const services = ref([])
  const loading = ref(false)
  const error = ref(null)

  const fetchServices = async () => {
    loading.value = true
    error.value = null
    try {
      const response = await api.get('/appointments/services', {
        params: { external: true }
      })
      services.value = response.data
    } catch (err) {
      error.value = 'Errore nel caricamento dei servizi'
      console.error('Error fetching services:', err)
    } finally {
      loading.value = false
    }
  }

  const getServiceById = async (id) => {
    try {
      const response = await api.get(`/appointments/services/${id}`)
      return response.data
    } catch (err) {
      error.value = 'Errore nel caricamento del servizio'
      console.error('Error fetching service:', err)
      return null
    }
  }

  return {
    services,
    loading,
    error,
    fetchServices,
    getServiceById
  }
})
