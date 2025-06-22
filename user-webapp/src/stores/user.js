import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUserStore = defineStore('user', () => {
  const user = ref({
    id: '1', // Simulazione utente per demo
    name: 'Mario Rossi',
    email: 'mario.rossi@email.com',
    codice_fiscale: 'RSSMRA80E15F205X',
    phone: '+39 123 456 7890'
  })

  const isLoggedIn = ref(true) // Simulazione per demo

  const login = (userData) => {
    user.value = userData
    isLoggedIn.value = true
  }

  const logout = () => {
    user.value = null
    isLoggedIn.value = false
  }

  return {
    user,
    isLoggedIn,
    login,
    logout
  }
})
