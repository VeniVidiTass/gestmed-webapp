import { computed } from 'vue'
import { useDoctorsStore } from '../stores/doctors'
import { usePatientsStore } from '../stores/patients'
import { useServicesStore } from '../stores/services'
import { ensureFormDataLoaded } from '../utils/dataPreloader'

/**
 * Composable per garantire che i dati necessari per i form siano sempre disponibili
 */
export function useFormData() {
  const doctorsStore = useDoctorsStore()
  const patientsStore = usePatientsStore()
  const servicesStore = useServicesStore()

  // Computed reattivi per i dati
  const doctors = computed(() => doctorsStore.allDoctors)
  const patients = computed(() => patientsStore.allPatients)
  const services = computed(() => servicesStore.allServices)

  // Funzione per garantire che i dati siano caricati
  const ensureDataLoaded = async () => {
    try {
      await ensureFormDataLoaded()
      return {
        doctors: doctors.value,
        patients: patients.value,
        services: services.value
      }
    } catch (error) {
      console.warn('⚠️ Failed to ensure form data loaded:', error)
      return {
        doctors: doctors.value || [],
        patients: patients.value || [],
        services: services.value || []
      }
    }
  }

  // Verifica se i dati sono disponibili
  const isDataAvailable = computed(() => {
    return doctors.value.length > 0 ||
      patients.value.length > 0 ||
      services.value.length > 0
  })

  // Verifica se tutti i dati critici sono disponibili
  const isCriticalDataAvailable = computed(() => {
    return doctors.value.length > 0 && services.value.length > 0
  })

  return {
    // Dati reattivi
    doctors,
    patients,
    services,

    // Stati
    isDataAvailable,
    isCriticalDataAvailable,

    // Funzioni
    ensureDataLoaded,

    // Store diretti per accesso avanzato
    doctorsStore,
    patientsStore,
    servicesStore
  }
}
