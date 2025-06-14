import { useToast } from 'primevue/usetoast'

export function useNotifications() {
  const toast = useToast()

  const showSuccess = (message, detail = null) => {
    toast.add({
      severity: 'success',
      summary: 'Successo',
      detail: detail || message,
      life: 3000
    })
  }

  const showError = (message, detail = null) => {
    toast.add({
      severity: 'error',
      summary: 'Errore',
      detail: detail || message,
      life: 5000
    })
  }

  const showWarning = (message, detail = null) => {
    toast.add({
      severity: 'warn',
      summary: 'Attenzione',
      detail: detail || message,
      life: 4000
    })
  }

  const showInfo = (message, detail = null) => {
    toast.add({
      severity: 'info',
      summary: 'Informazione',
      detail: detail || message,
      life: 3000
    })
  }

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo
  }
}
