import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '../services/api'

export const useDoctorsStore = defineStore('doctors', () => {
  const doctors = ref([])
  const loading = ref(false)
  const error = ref(null)

  const fetchDoctors = async () => {
    loading.value = true
    error.value = null
    try {
      const response = await api.get('/doctors')
      doctors.value = response.data
    } catch (err) {
      error.value = 'Errore nel caricamento dei medici'
      console.error('Error fetching doctors:', err)
    } finally {
      loading.value = false
    }
  }

  const getDoctorById = async (id) => {
    try {
      const response = await api.get(`/doctors/${id}`)
      return response.data
    } catch (err) {
      error.value = 'Errore nel caricamento del medico'
      console.error('Error fetching doctor:', err)
      return null
    }
  }

  const getDoctorsForService = async (serviceId) => {
    try {
      // Recupera prima il servizio per ottenere il doctor_id
      const serviceResponse = await api.get(`/appointments/services/${serviceId}`)
      const service = serviceResponse.data
      
      if (service.doctor_id) {
        // Se il servizio è associato a un medico specifico, restituisci solo quello
        const doctor = await getDoctorById(service.doctor_id)
        return doctor ? [doctor] : []
      } else {
        // Altrimenti restituisci tutti i medici
        await fetchDoctors()
        return doctors.value
      }
    } catch (err) {
      error.value = 'Errore nel caricamento dei medici per il servizio'
      console.error('Error fetching doctors for service:', err)
      return []
    }
  }

  return {
    doctors,
    loading,
    error,
    fetchDoctors,
    getDoctorById,
    getDoctorsForService
  }
})
