/* global localStorage */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apiService } from '../services/api'

export const useUserStore = defineStore('user', () => {
    // State
    const userInfo = ref(null)
    const loading = ref(false)
    const error = ref(null)
    // Getters
    const isLoggedIn = computed(() => userInfo.value !== null)
    const userName = computed(() => userInfo.value?.preferredUsername || 'Utente')
    const userEmail = computed(() => userInfo.value?.email || '')
    const userRole = computed(() => {
        if (!userInfo.value?.groups || !Array.isArray(userInfo.value.groups)) return 'user'
        // Restituisce il primo gruppo come ruolo principale
        return userInfo.value.groups[0]?.toLowerCase() || 'user'
    })
    const userPermissions = computed(() => userInfo.value?.groups || [])

    // Actions
    async function fetchUserInfo() {
        const USERINFO_URL = import.meta.env.VITE_USERINFO_URL

        if (!USERINFO_URL) {
            console.warn('VITE_USERINFO_URL non configurato')
            return
        }

        try {
            loading.value = true
            error.value = null
            // Usa l'endpoint configurato tramite variabile d'ambiente con cookie oauth2-proxy
            const response = await fetch(USERINFO_URL, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include' // Importante per includere i cookie oauth2-proxy
            })

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`)
            }

            const userData = await response.json()

            // Salva i dati utente
            userInfo.value = userData

            // Salva in localStorage per persistenza
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem('user_info', JSON.stringify(userData))
            }

            console.log('✅ User info fetched successfully:', userData)

        } catch (err) {
            console.error('❌ Error fetching user info:', err)
            error.value = err.message
            // In caso di errore 401, il cookie oauth2-proxy potrebbe essere scaduto
            if (err.message.includes('401')) {
                clearUserInfo()
                console.warn('Cookie di sessione oauth2-proxy non valido o scaduto')
            }
        } finally {
            loading.value = false
        }
    }

    function setUserInfo(userData) {
        userInfo.value = userData

        // Salva in localStorage
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('user_info', JSON.stringify(userData))
        }
    }

    function clearUserInfo() {
        userInfo.value = null
        error.value = null

        // Rimuovi da localStorage
        if (typeof localStorage !== 'undefined') {
            localStorage.removeItem('user_info')
        }
    }

    function loadUserInfoFromStorage() {
        if (typeof localStorage !== 'undefined') {
            const stored = localStorage.getItem('user_info')
            if (stored) {
                try {
                    userInfo.value = JSON.parse(stored)
                } catch (err) {
                    console.error('Error parsing stored user info:', err)
                    localStorage.removeItem('user_info')
                }
            }
        }
    }

    function updateUserInfo(updates) {
        if (userInfo.value) {
            userInfo.value = { ...userInfo.value, ...updates }

            // Aggiorna localStorage
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem('user_info', JSON.stringify(userInfo.value))
            }
        }
    }

    return {
        // State
        userInfo,
        loading,
        error,

        // Getters
        isLoggedIn,
        userName,
        userEmail,
        userRole,
        userPermissions,

        // Actions
        fetchUserInfo,
        setUserInfo,
        clearUserInfo,
        loadUserInfoFromStorage,
        updateUserInfo
    }
})
