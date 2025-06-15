import { computed } from 'vue'
import { useAppStore } from '../stores'

export function useLoading() {
  const appStore = useAppStore()

  const isLoading = computed(() => appStore.isLoading)

  const setLoading = (loading) => {
    appStore.setLoading(loading)
  }

  const withLoading = async (asyncFunction) => {
    try {
      setLoading(true)
      return await asyncFunction()
    } finally {
      setLoading(false)
    }
  }

  return {
    isLoading,
    setLoading,
    withLoading
  }
}
