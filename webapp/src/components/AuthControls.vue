<template>
    <div class="auth-controls">
        <!-- Autenticazione Disabilitata -->
        <div v-if="authDisabled" class="auth-disabled">
            <Badge value="Demo Mode" severity="info" @click="showUserCard = !showUserCard" style="cursor: pointer;" />
            <span class="demo-user">{{ userDisplayName }}</span>
        </div>
        <!-- Autenticazione Abilitata -->
        <div v-else class="auth-enabled">
            <div class="user-info">
                <Avatar :label="userInitials" class="user-avatar" size="large" shape="circle" />
                <span class="user-name">{{ userDisplayName }}</span>
            </div>
        </div>

        <!-- Bottone logout sempre visibile in modalità demo -->
        <div class="demo-logout">
            <Button icon="pi pi-sign-out" class="p-button-text logout-btn" @click="handleLogout" :loading="loading" />
        </div>
        <div v-if="showUserCard" class="user-card-overlay" @click="showUserCard = false">
            <div class="user-card-floating" @click.stop>
                <UserInfoCard />
            </div>
        </div>

    </div>
</template>

<script>
import { defineComponent, ref, computed, onMounted } from 'vue'
import Button from 'primevue/button'
import Badge from 'primevue/badge'
import Avatar from 'primevue/avatar'
import UserInfoCard from './UserInfoCard.vue'
import { useAuth } from '../composables/useAuth'
import { useAppStore } from '../stores'

export default defineComponent({
    name: 'AuthControls',
    components: {
        Button,
        Badge,
        Avatar,
        UserInfoCard
    }, setup() {
        const {
            isLoggedIn,
            authDisabled,
            user,
            login,
            logout,
            initializeAuth
        } = useAuth()

        const appStore = useAppStore()
        const loading = ref(false)
        const showUserCard = ref(false)

        // Computed
        const userDisplayName = computed(() => {
            if (user.value) {
                return user.value.name || user.value.email || 'Utente'
            }
            return 'Utente'
        })

        const userInitials = computed(() => {
            const name = userDisplayName.value
            if (!name || name === 'Utente') return 'U'

            const parts = name.split(' ')
            if (parts.length >= 2) {
                return (parts[0][0] + parts[1][0]).toUpperCase()
            }
            return name.substring(0, 2).toUpperCase()
        })

        const handleLogout = async () => {
            try {
                await logout()
            } catch (error) {
                console.error('Logout error:', error)
                appStore.addNotification({
                    severity: 'error',
                    summary: 'Errore Logout',
                    detail: 'Errore durante il logout',
                    life: 5000
                })
            }
        }

        // Initialize auth on mount
        onMounted(() => {
            initializeAuth()
        })

        return {
            isLoggedIn,
            authDisabled,
            user,
            userDisplayName,
            userInitials,
            loading,
            showUserCard,
            handleLogout
        }
    }
})
</script>

<style scoped>
.auth-controls {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.auth-disabled {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.5rem;
    border-radius: 0.5rem;
    background: var(--surface-100);
    border: 1px solid var(--surface-200);
}

.demo-user {
    font-size: 0.875rem;
    color: var(--text-color-secondary);
    font-weight: 500;
}

.demo-logout {
    display: flex;
    align-items: center;
}

.logout-btn {
    color: var(--text-color-secondary);
}

.logout-btn:hover {
    color: var(--primary-color);
}

.user-card-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(2px);
}

.user-card-floating {
    position: relative;
    max-width: 400px;
    width: 90%;
    background: var(--surface-card);
    border-radius: 0.75rem;
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
    animation: fadeInScale 0.2s ease-out;
    border: 1px solid var(--surface-border);
}

@keyframes fadeInScale {
    from {
        opacity: 0;
        transform: scale(0.9);
    }

    to {
        opacity: 1;
        transform: scale(1);
    }
}

@media (max-width: 768px) {
    .auth-controls {
        gap: 0.5rem;
    }

    .auth-disabled {
        padding: 0.375rem;
        gap: 0.5rem;
    }

    .demo-user {
        font-size: 0.8rem;
    }
}
</style>
