<template>
  <div class="layout-container">
    <!-- Sidebar -->
    <div class="layout-sidebar" :class="{ 'sidebar-active': sidebarVisible }">
      <div class="sidebar-header">
        <div class="logo">
          <i class="pi pi-heart text-primary"></i>
          <span class="logo-text text-primary">GestMed</span>
        </div>
        <Button icon="pi pi-times" class="p-button-text sidebar-close-btn" @click="closeSidebar" v-if="isMobile" />
      </div>

      <div class="sidebar-content">
        <nav class="nav-menu">
          <router-link v-for="item in menuItems" :key="item.name" :to="item.route" class="nav-item"
            :class="{ 'nav-item-active': $route.name === item.name }">
            <i :class="item.icon"></i>
            <span class="nav-label">{{ item.label }}</span>
          </router-link>
        </nav>
      </div>

      <div class="sidebar-footer">
        <Button label="Logout" icon="pi pi-sign-out" class="p-button-text logout-btn" @click="logout" />
      </div>
    </div>

    <!-- Main Content -->
    <div class="layout-content">
      <!-- Mobile Header -->
      <div class="mobile-header" v-if="isMobile">
        <Button icon="pi pi-bars" class="p-button-text menu-toggle" @click="toggleSidebar" />
        <h2 class="page-title">{{ currentPageTitle }}</h2>
      </div>

      <!-- Desktop Header -->
      <div class="desktop-header" v-else>
        <h2 class="page-title">{{ currentPageTitle }}</h2>
        <div class="header-actions">
          <span class="user-info">
            <i class="pi pi-user"></i>
            Admin User
          </span>
        </div>
      </div>

      <!-- Page Content -->
      <div class="content-area">
        <slot />
      </div>
    </div>

    <!-- Mobile Overlay -->
    <div class="mobile-overlay" v-if="isMobile && sidebarVisible" @click="closeSidebar"></div>
  </div>
</template>

<script>
import { defineComponent, ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import Button from 'primevue/button'

export default defineComponent({
  name: 'DashboardLayout',
  components: {
    Button
  },
  setup() {
    const router = useRouter()
    const route = useRoute()
    const sidebarVisible = ref(false)
    const windowWidth = ref(window.innerWidth)

    const menuItems = [
      { name: 'Dashboard', label: 'Dashboard', route: '/dashboard', icon: 'pi pi-home' },
      { name: 'Patients', label: 'Pazienti', route: '/patients', icon: 'pi pi-users' },
      { name: 'Doctors', label: 'Medici', route: '/doctors', icon: 'pi pi-user-plus' },
      { name: 'Calendar', label: 'Calendario', route: '/calendar', icon: 'pi pi-calendar' }
    ]

    const isMobile = computed(() => windowWidth.value <= 768)

    const currentPageTitle = computed(() => {
      const currentItem = menuItems.find(item => item.name === route.name)
      return currentItem ? currentItem.label : 'GestMed'
    })

    const toggleSidebar = () => {
      sidebarVisible.value = !sidebarVisible.value
    }

    const closeSidebar = () => {
      sidebarVisible.value = false
    }

    const logout = () => {
      router.push('/')
    }

    const handleResize = () => {
      windowWidth.value = window.innerWidth
      if (!isMobile.value) {
        sidebarVisible.value = false
      }
    }

    onMounted(() => {
      window.addEventListener('resize', handleResize)
    })

    onUnmounted(() => {
      window.removeEventListener('resize', handleResize)
    })

    return {
      menuItems,
      sidebarVisible,
      isMobile,
      currentPageTitle,
      toggleSidebar,
      closeSidebar,
      logout
    }
  }
})
</script>

<style scoped>
.sidebar-header {
  padding: 1.5rem;
  border-bottom: 1px solid var(--surface-200);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.5rem;
  font-weight: 700;
}

.logo i {
  font-size: 2rem;
}

.sidebar-close-btn {
  padding: 0.5rem;
}

.sidebar-content {
  flex: 1;
  overflow-y: auto;
  padding: 1rem 0;
}

.nav-menu {
  display: flex;
  flex-direction: column;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1.5rem;
  color: var(--text-color-secondary);
  text-decoration: none;
  transition: all 0.2s ease;
  border-left: 3px solid transparent;
}

.nav-item:hover {
  background-color: var(--primary-50);
  color: var(--primary-700);
}

.nav-item-active {
  background-color: var(--primary-100);
  color: var(--primary-700);
  border-left-color: var(--primary-600);
  font-weight: 600;
}

.nav-item i {
  font-size: 1.125rem;
  width: 1.25rem;
}

.sidebar-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--surface-200);
}

.logout-btn {
  width: 100%;
  justify-content: flex-start;
  color: var(--text-color-secondary);
}

.mobile-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 0;
  border-bottom: 1px solid var(--surface-200);
  margin-bottom: 1.5rem;
}

.desktop-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 0;
  border-bottom: 1px solid var(--surface-200);
  margin-bottom: 1.5rem;
}

.page-title {
  color: var(--text-color);
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-color-secondary);
  font-weight: 500;
}

.menu-toggle {
  padding: 0.5rem;
}

.content-area {
  flex: 1;
}

.mobile-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 999;
}

/* Mobile responsiveness handled by global CSS */
@media (max-width: 768px) {
  .desktop-header {
    display: none;
  }
}

@media (min-width: 769px) {
  .mobile-header {
    display: none;
  }
}
</style>
