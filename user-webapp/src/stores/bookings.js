import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '../services/api'

export const useBookingsStore = defineStore('bookings', () => {
  const bookings = ref([])
  const loading = ref(false)
  const error = ref(null)

  const createBooking = async (bookingData) => {
    loading.value = true
    error.value = null
    try {
      const response = await api.post('/appointments', bookingData)
      return response.data
    } catch (err) {
      error.value = 'Errore nella creazione della prenotazione'
      console.error('Error creating booking:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchUserBookings = async (userId) => {
    loading.value = true
    error.value = null
    try {
      const response = await api.get(`/appointments?patient_id=${userId}`)
      bookings.value = response.data
    } catch (err) {
      error.value = 'Errore nel caricamento delle prenotazioni'
      console.error('Error fetching bookings:', err)
    } finally {
      loading.value = false
    }
  }

  const cancelBooking = async (bookingId) => {
    try {
      await api.delete(`/appointments/${bookingId}`)
      bookings.value = bookings.value.filter(booking => booking.id !== bookingId)
    } catch (err) {
      error.value = 'Errore nella cancellazione della prenotazione'
      console.error('Error canceling booking:', err)
      throw err
    }
  }

  return {
    bookings,
    loading,
    error,
    createBooking,
    fetchUserBookings,
    cancelBooking
  }
})
