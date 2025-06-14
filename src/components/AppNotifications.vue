<template>
  <Toast />
  <div v-if="notifications.length" class="notification-container">
    <TransitionGroup name="notification" tag="div" class="notifications-list">
      <div
        v-for="notification in notifications"
        :key="notification.id"
        :class="['custom-notification', `notification-${notification.severity}`]"
      >
        <div class="notification-content">
          <i :class="getNotificationIcon(notification.severity)"></i>
          <div class="notification-text">
            <h4 v-if="notification.summary">{{ notification.summary }}</h4>
            <p>{{ notification.detail }}</p>
          </div>
          <Button
            icon="pi pi-times"
            class="p-button-text p-button-sm notification-close"
            @click="removeNotification(notification.id)"
          />
        </div>
      </div>
    </TransitionGroup>
  </div>
</template>

<script>
import { defineComponent, computed } from 'vue'
import { storeToRefs } from 'pinia'
import Toast from 'primevue/toast'
import Button from 'primevue/button'
import { useAppStore } from '../stores'

export default defineComponent({
  name: 'AppNotifications',
  components: {
    Toast,
    Button
  },
  setup() {
    const appStore = useAppStore()
    const { notifications } = storeToRefs(appStore)

    const getNotificationIcon = (severity) => {
      const icons = {
        success: 'pi pi-check-circle',
        error: 'pi pi-times-circle',
        warn: 'pi pi-exclamation-triangle',
        info: 'pi pi-info-circle'
      }
      return icons[severity] || 'pi pi-info-circle'
    }

    const removeNotification = (id) => {
      appStore.removeNotification(id)
    }

    return {
      notifications,
      getNotificationIcon,
      removeNotification
    }
  }
})
</script>

<style scoped>
.notification-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  pointer-events: none;
}

.notifications-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.custom-notification {
  background: white;
  border-radius: 6px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  border-left: 4px solid;
  max-width: 400px;
  pointer-events: auto;
}

.notification-success {
  border-left-color: var(--green-500);
}

.notification-error {
  border-left-color: var(--red-500);
}

.notification-warn {
  border-left-color: var(--yellow-500);
}

.notification-info {
  border-left-color: var(--blue-500);
}

.notification-content {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
}

.notification-content i {
  font-size: 1.25rem;
  margin-top: 0.125rem;
}

.notification-success i {
  color: var(--green-500);
}

.notification-error i {
  color: var(--red-500);
}

.notification-warn i {
  color: var(--yellow-500);
}

.notification-info i {
  color: var(--blue-500);
}

.notification-text {
  flex: 1;
}

.notification-text h4 {
  margin: 0 0 0.25rem 0;
  font-weight: 600;
  font-size: 0.875rem;
}

.notification-text p {
  margin: 0;
  font-size: 0.875rem;
  color: var(--text-color-secondary);
}

.notification-close {
  opacity: 0.6;
}

.notification-close:hover {
  opacity: 1;
}

/* Transitions */
.notification-enter-active,
.notification-leave-active {
  transition: all 0.3s ease;
}

.notification-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.notification-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.notification-move {
  transition: transform 0.3s ease;
}
</style>
