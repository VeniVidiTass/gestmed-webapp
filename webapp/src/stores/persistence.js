/* global localStorage */

// Verifica la disponibilità di localStorage
const isLocalStorageAvailable = typeof localStorage !== 'undefined';

// Plugin Pinia per la persistenza dei dati
export function persistencePlugin({ store }) {
  // Lista degli store che devono essere persistiti
  const persistentStores = ['app']

  if (persistentStores.includes(store.$id)) {
    // Carica i dati salvati al mount dello store
    if (isLocalStorageAvailable) {
      const savedState = localStorage.getItem(`gestmed-${store.$id}`)
      if (savedState) {
        try {
          const parsedState = JSON.parse(savedState)
          store.$patch(parsedState)
        } catch (error) {
          console.warn(`Failed to restore state for store ${store.$id}:`, error)
        }
      }
    }

    // Salva i dati quando lo stato cambia
    store.$subscribe((mutation, state) => {
      // Filtra i dati sensibili e temporanei
      const dataToSave = filterSensitiveData(state, store.$id)

      if (isLocalStorageAvailable) {
        try {
          localStorage.setItem(`gestmed-${store.$id}`, JSON.stringify(dataToSave))
        } catch (error) {
          console.warn(`Failed to save state for store ${store.$id}:`, error)
        }
      }
    }, { detached: true })
  }
}

function filterSensitiveData(state, storeId) {
  const filtered = { ...state }

  // Rimuovi dati sensibili e temporanei
  if (storeId === 'app') {
    delete filtered.loading
    delete filtered.error
    delete filtered.notifications
  }

  // Per altri store, rimuovi timestamp di cache
  delete filtered.lastFetched

  return filtered
}
