import { useDoctorsStore, useAppointmentsStore, usePatientsStore } from '../stores'

export async function preloadAppData() {
  try {
    console.log('🚀 Preloading application data...')

    const doctorsStore = useDoctorsStore()
    const appointmentsStore = useAppointmentsStore()
    const patientsStore = usePatientsStore()

    // Preload critical data in parallel with timeout
    const preloadPromises = [
      // Doctors list (frequently accessed)
      doctorsStore.fetchDoctors({ limit: 20 }).catch(error => {
        console.warn('Failed to preload doctors:', error)
      }),

      // Patients data (for dashboard statistics)
      patientsStore.fetchPatients({ limit: 50 }).catch(error => {
        console.warn('Failed to preload patients:', error)
      }),

      // Today's appointments
      appointmentsStore.fetchAppointments({
        limit: 20,
        dateFrom: new Date().toISOString().split('T')[0]
      }).catch(error => {
        console.warn('Failed to preload appointments:', error)
      })
    ]

    // Wait for all preload operations with a timeout
    await Promise.race([
      Promise.allSettled(preloadPromises),
      new Promise((_, reject) =>
        globalThis.setTimeout(() => reject(new Error('Preload timeout')), 5000)
      )
    ])

    console.log('✅ Application data preloaded successfully')

    return true
  } catch (error) {
    console.warn('⚠️ Some preload operations failed or timed out:', error)
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
