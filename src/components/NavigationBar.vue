<template>
  <nav class="navbar" v-show="!isHome">
    <div class="navbar-content">
      <div class="logo-section" @click="goHome">
        <img src="/logo-massindo.png" alt="Logo" class="nav-logo" />
        <span class="nav-title">MATRIX</span>
      </div>

      <div class="menu-items">
        <div 
          v-for="item in menuItems" 
          :key="item.label"
          class="menu-item-wrapper"
          @mouseenter="hoverItem = item.label"
          @mouseleave="hoverItem = null"
        >
          <button 
            class="nav-btn"
            :class="{ 
              active: currentPath === item.path || (item.children && item.children.some(child => child.path === currentPath)),
              'has-dropdown': item.children
            }"
            @click="item.children ? null : navigate(item.path)"
          >
            <span class="icon" v-html="item.icon"></span>
            <span class="label">{{ item.label }}</span>
            <span v-if="item.children" class="dropdown-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>
            </span>
          </button>

          <!-- Dropdown Menu -->
          <div v-if="item.children" class="dropdown-menu" :class="{ show: hoverItem === item.label }">
            <button
              v-for="child in item.children"
              :key="child.path"
              class="dropdown-item"
              :class="{ active: currentPath === child.path }"
              @click="navigate(child.path)"
            >
              {{ child.label }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const hoverItem = ref(null)

const currentPath = computed(() => route.path)
const isHome = computed(() => route.path === '/')

const goHome = () => router.push('/')
const navigate = (path) => {
  router.push(path)
  hoverItem.value = null
}

const menuItems = [
  {
    label: 'Home',
    path: '/',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>`
  },
  {
    label: 'Produksi',
    path: '/production-menu',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 7h-4V4c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v3H4c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2z"></path></svg>`,
    children: [
      { label: 'Menu Utama', path: '/production-menu' },
      { label: 'Dashboard', path: '/production-dashboard' },
      { label: 'Admin Produksi', path: '/admin-produksi-login' },
      { label: 'Supervisor', path: '/supervisor-login' },
      { label: 'Koordinator', path: '/coordinator-login' },
      { label: 'Operator', path: '/production-operator' }
    ]
  },
  {
    label: 'Master Data',
    path: '/master-data-login',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`
  },
  {
    label: 'Server Status',
    path: '/server-status',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect><rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect><line x1="6" y1="6" x2="6.01" y2="6"></line><line x1="6" y1="18" x2="6.01" y2="18"></line></svg>`
  }
]
</script>

<style scoped>
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 64px;
  background: #ffffff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 9999;
  display: flex;
  justify-content: center;
  border-bottom: 1px solid #e2e8f0;
}

.navbar-content {
  width: 100%;
  max-width: 1400px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1.5rem;
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  user-select: none;
}

.nav-logo {
  height: 36px;
  width: auto;
}

.nav-title {
  font-size: 1.25rem;
  font-weight: 800;
  color: #333b5f;
  letter-spacing: 0.05em;
}

.menu-items {
  display: flex;
  gap: 0.5rem;
}

.menu-item-wrapper {
  position: relative;
}

.nav-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1rem;
  border: none;
  background: transparent;
  border-radius: 8px;
  cursor: pointer;
  color: #64748b;
  font-weight: 600;
  font-size: 0.95rem;
  transition: all 0.2s ease;
  height: 42px;
}

.nav-btn:hover {
  background: #f1f5f9;
  color: #333b5f;
}

.nav-btn.active {
  background: #333b5f;
  color: #ffffff;
}

.dropdown-icon {
  display: flex;
  align-items: center;
  margin-left: 0.2rem;
  transition: transform 0.2s ease;
}

.menu-item-wrapper:hover .dropdown-icon {
  transform: rotate(180deg);
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%) translateY(10px);
  background: white;
  min-width: 200px;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  padding: 0.5rem;
  opacity: 0;
  visibility: hidden;
  transition: all 0.2s ease;
  border: 1px solid #e2e8f0;
}

.dropdown-menu.show {
  opacity: 1;
  visibility: visible;
  transform: translateX(-50%) translateY(5px);
}

.dropdown-item {
  display: block;
  width: 100%;
  text-align: left;
  padding: 0.75rem 1rem;
  border: none;
  background: transparent;
  color: #64748b;
  font-weight: 500;
  font-size: 0.9rem;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.dropdown-item:hover {
  background: #f8fafc;
  color: #333b5f;
  padding-left: 1.25rem;
}

.dropdown-item.active {
  color: #333b5f;
  background: #f1f5f9;
  font-weight: 600;
}

.icon {
  display: flex;
  align-items: center;
}

@media (max-width: 768px) {
  .nav-title, .label, .dropdown-icon {
    display: none;
  }
  
  .nav-btn {
    padding: 0.6rem;
  }

  .dropdown-menu {
    left: auto;
    right: 0;
    transform: translateY(10px);
  }

  .dropdown-menu.show {
    transform: translateY(5px);
  }
}
</style>
