<template>
    <div class="user-info-card">
        <Card v-if="userStore.isLoggedIn">
            <template #header>
                <div class="user-header">
                    <Avatar :label="userInitials" class="user-avatar" size="large" shape="circle" />
                    <h3>{{ userStore.userName }}</h3>
                </div>
            </template>

            <template #content>
                <div class="user-details">
                    <div class="detail-item" v-if="userStore.userEmail">
                        <i class="pi pi-envelope"></i>
                        <span>{{ userStore.userEmail }}</span>
                    </div>

                    <div class="detail-item" v-if="userStore.userRole">
                        <i class="pi pi-shield"></i>
                        <span>{{ userStore.userRole }}</span>
                    </div>

                    <div class="detail-item" v-if="userStore.userPermissions.length > 0">
                        <i class="pi pi-key"></i>
                        <span>{{ userStore.userPermissions.join(', ') }}</span>
                    </div>
                </div>

                <div v-if="userStore.loading" class="loading-state">
                    <ProgressSpinner size="small" />
                    <span>Caricamento informazioni utente...</span>
                </div>

                <Message v-if="userStore.error" severity="error" :closable="false">
                    {{ userStore.error }}
                </Message>
            </template>

            <template #footer>
                <div class="user-actions">
                    <Button label="Aggiorna Info" icon="pi pi-refresh" @click="refreshUserInfo"
                        :loading="userStore.loading" size="small" text />
                </div>
            </template>
        </Card>

        <Card v-else>
            <template #content>
                <div class="no-user">
                    <i class="pi pi-user-times"></i>
                    <p>Nessun utente autenticato</p>
                </div>
            </template>
        </Card>
    </div>
</template>

<script>
import { defineComponent, computed } from 'vue'
import Card from 'primevue/card'
import Avatar from 'primevue/avatar'
import Button from 'primevue/button'
import Message from 'primevue/message'
import ProgressSpinner from 'primevue/progressspinner'
import { useUserStore } from '../stores'

export default defineComponent({
    name: 'UserInfoCard',
    components: {
        Card,
        Avatar,
        Button,
        Message,
        ProgressSpinner
    },
    setup() {
        const userStore = useUserStore()

        const userInitials = computed(() => {
            const name = userStore.userName
            if (!name) return '?'

            const parts = name.split(' ')
            if (parts.length >= 2) {
                return (parts[0][0] + parts[1][0]).toUpperCase()
            }
            return name.substring(0, 2).toUpperCase()
        })

        const refreshUserInfo = async () => {
            await userStore.fetchUserInfo()
        }

        return {
            userStore,
            userInitials,
            refreshUserInfo
        }
    }
})
</script>

<style scoped>
.user-info-card {
    width: 100%;
}

.user-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    text-align: left;
}

.user-avatar {
    background: var(--primary-color);
    color: white;
}

.user-header h3 {
    margin: 0;
    color: var(--text-color);
    font-size: 1.1rem;
}

.user-details {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.detail-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0;
}

.detail-item i {
    color: var(--primary-color);
    width: 1.2rem;
    flex-shrink: 0;
}

.detail-item span {
    font-size: 0.875rem;
    word-break: break-word;
}

.loading-state {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 1rem;
    justify-content: center;
}

.user-actions {
    display: flex;
    justify-content: flex-end;
}

.no-user {
    text-align: center;
    padding: 2rem;
    color: var(--text-color-secondary);
}

.no-user i {
    font-size: 2rem;
    margin-bottom: 1rem;
    display: block;
}
</style>
