import { useDoctorsStore, useAppointmentsStore, usePatientsStore, useServicesStore } from '../stores'

export async function preloadAppData() {
  try {
    const doctorsStore = useDoctorsStore()
    const appointmentsStore = useAppointmentsStore()
    const patientsStore = usePatientsStore()
    const servicesStore = useServicesStore()

    console.log('🔄 Starting application data preload...')

    // Verifica se i dati sono già freschi
    if (areDataFresh()) {
      console.log('✅ Data is already fresh - skipping preload')
      return true
    }

    // Preload critical data in parallel with improved error handling
    const preloadPromises = [
      // Doctors list (frequently accessed) - usando ensureDoctorsLoaded
      doctorsStore.ensureDoctorsLoaded().then(() => {
        console.log('✅ Doctors preloaded successfully')
      }).catch(error => {
        console.warn('⚠️ Failed to preload doctors:', error)
        return null // Non fallire completamente
      }),

      // Patients data (for dashboard statistics) - usando ensurePatientsLoaded
      patientsStore.ensurePatientsLoaded().then(() => {
        console.log('✅ Patients preloaded successfully')
      }).catch(error => {
        console.warn('⚠️ Failed to preload patients:', error)
        return null
      }),

      // Services data - usando ensureServicesLoaded
      servicesStore.ensureServicesLoaded().then(() => {
        console.log('✅ Services preloaded successfully')
      }).catch(error => {
        console.warn('⚠️ Failed to preload services:', error)
        return null
      }),

      // Today's appointments
      appointmentsStore.fetchAppointments({
        limit: 20,
        dateFrom: new Date().toISOString().split('T')[0]
      }).then(() => {
        console.log('✅ Today\'s appointments preloaded successfully')
      }).catch(error => {
        console.warn('⚠️ Failed to preload appointments:', error)
        return null
      })
    ]

    // Wait for all preload operations with a longer timeout
    const results = await Promise.race([
      Promise.allSettled(preloadPromises),
      new Promise((_, reject) =>
        globalThis.setTimeout(() => reject(new Error('Preload timeout')), 8000)
      )
    ])

    // Verifica quante operazioni sono riuscite
    const successful = results.filter(result => result.status === 'fulfilled').length
    const total = preloadPromises.length

    console.log(`✅ Application data preload completed: ${successful}/${total} successful`)

    // Restituisce true se almeno il 75% delle operazioni è riuscito
    return successful >= Math.ceil(total * 0.75)
  } catch (error) {
    console.warn('⚠️ Preload operations failed or timed out:', error)
    return false
  }
}

export function setupDataPreloading() {
  // Preload data when the app becomes visible
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      globalThis.setTimeout(() => {
        preloadAppData()
      }, 1000) // Small delay to avoid competing with user interactions
    }
  })

  // Preload data on focus (when user returns to tab)
  window.addEventListener('focus', () => {
    globalThis.setTimeout(() => {
      preloadAppData()
    }, 500)
  })
}

// Cache warming strategy
export function setupCacheWarming() {
  // Warm cache every 5 minutes if the page is visible
  let warmingInterval

  const startWarming = () => {
    if (warmingInterval) return

    warmingInterval = globalThis.setInterval(() => {
      if (!document.hidden) {
        preloadAppData()
      }
    }, 5 * 60 * 1000) // 5 minutes
  }

  const stopWarming = () => {
    if (warmingInterval) {
      window.clearInterval(warmingInterval)
      warmingInterval = null
    }
  }

  // Start warming when page becomes visible
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopWarming()
    } else {
      startWarming()
    }
  })

  // Start immediately if page is visible
  if (!document.hidden) {
    startWarming()
  }

  // Cleanup on page unload
  window.addEventListener('beforeunload', stopWarming)
}

// Funzione per garantire che tutti i dati necessari siano caricati
export async function ensureAllDataLoaded() {
  try {
    const doctorsStore = useDoctorsStore()
    const patientsStore = usePatientsStore()
    const servicesStore = useServicesStore()

    console.log('🔄 Ensuring all critical data is loaded...')

    // Carica tutti i dati necessari in parallelo
    await Promise.allSettled([
      doctorsStore.ensureDoctorsLoaded(),
      patientsStore.ensurePatientsLoaded(),
      servicesStore.ensureServicesLoaded()
    ])

    console.log('✅ All critical data ensured and available')
    return true
  } catch (error) {
    console.warn('⚠️ Failed to ensure all data loaded:', error)
    return false
  }
}

// Funzione per il preload su richiesta specifico per i form
export async function ensureFormDataLoaded() {
  try {
    const doctorsStore = useDoctorsStore()
    const patientsStore = usePatientsStore()
    const servicesStore = useServicesStore()

    console.log('🔄 Ensuring form data is loaded...')

    // Carica dati necessari per i form con priorità
    const results = await Promise.allSettled([
      doctorsStore.ensureDoctorsLoaded(),
      servicesStore.ensureServicesLoaded(),
      patientsStore.ensurePatientsLoaded()
    ])

    const successful = results.filter(result => result.status === 'fulfilled').length

    if (successful >= 2) { // Almeno dottori e servizi devono essere caricati
      console.log('✅ Form data ensured and available')
      return true
    } else {
      console.warn('⚠️ Not enough form data could be loaded')
      return false
    }
  } catch (error) {
    console.warn('⚠️ Failed to ensure form data loaded:', error)
    return false
  }
}

// Funzione per verificare se i dati sono ancora freschi
export function areDataFresh() {
  try {
    const doctorsStore = useDoctorsStore()
    const patientsStore = usePatientsStore()
    const servicesStore = useServicesStore()
    const appointmentsStore = useAppointmentsStore()

    // Controlla se almeno i dati principali sono freschi
    const doctorsFresh = !doctorsStore.isDataStale && doctorsStore.doctors.length > 0
    const patientsFresh = !patientsStore.isDataStale && patientsStore.patients.length > 0
    const servicesFresh = !servicesStore.isDataStale && servicesStore.services.length > 0
    
    const freshCount = [doctorsFresh, patientsFresh, servicesFresh].filter(Boolean).length
    
    console.log(`📊 Data freshness check: ${freshCount}/3 stores have fresh data`)
    
    // Ritorna true se almeno 2 su 3 hanno dati freschi
    return freshCount >= 2
  } catch (error) {
    console.warn('⚠️ Error checking data freshness:', error)
    return false
  }
}
