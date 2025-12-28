<script setup>
import { useRouter } from 'vue-router'
import { onMounted } from 'vue'
import { useMasterDataSessionStore } from '../store/masterDataSession'
import { modal } from '../plugins/modal'

const router = useRouter()
const masterDataSession = useMasterDataSessionStore()

const menuItems = [
  { title: 'Divisions', path: '/divisions', icon: '🏢' },
  { title: 'Departments', path: '/departments', icon: '🏛️' },
  { title: 'Positions', path: '/positions', icon: '💼' },
  { title: 'Sub Positions', path: '/sub-positions', icon: '📋' },
  { title: 'Workers', path: '/workers', icon: '👥' },
  { title: 'Shifts', path: '/shifts', icon: '⏰' },
  { title: 'Suppliers', path: '/suppliers', icon: '🚚' },
  { title: 'Items', path: '/items', icon: '📦' },
  { title: 'Problem Comments', path: '/problem-comments', icon: '⚠️' },
  { title: 'Production Logs', path: '/production-logs', icon: '📊' }
]

const navigateTo = (path) => {
  router.push(path)
}

onMounted(async () => {
  // Check if superadmin is authenticated
  if (!masterDataSession.isAuthenticated) {
    await modal.showWarning('Silakan login terlebih dahulu')
    router.push('/master-data-login')
    return
  }
})
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <h1>Master Data Management</h1>
      <button class="btn-back" @click="router.push('/')">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        Kembali ke Home
      </button>
    </div>

    <div class="menu-grid">
      <button
        v-for="item in menuItems"
        :key="item.path"
        class="menu-item"
        @click="navigateTo(item.path)"
      >
        <div class="menu-icon">{{ item.icon }}</div>
        <div class="menu-content">
          <h3>{{ item.title }}</h3>
        </div>
        <div class="menu-arrow">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </div>
      </button>
    </div>
  </div>
</template>

<style scoped>
.page-container {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.page-header h1 {
  margin: 0;
  font-size: 2rem;
  font-weight: 700;
  color: #333b5f;
}

.btn-back {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: white;
  color: #333b5f;
  border: 2px solid #beceea;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-back:hover {
  border-color: #333b5f;
  background: #f8f9fa;
}

.menu-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  background: white;
  border: 2px solid #beceea;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: left;
  position: relative;
  overflow: hidden;
}

.menu-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: rgba(190, 206, 234, 0.1);
  transition: left 0.3s ease;
}

.menu-item:hover::before {
  left: 0;
}

.menu-item:hover {
  border-color: #333b5f;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(51, 59, 95, 0.15);
}

.menu-icon {
  font-size: 2rem;
  flex-shrink: 0;
}

.menu-content {
  flex: 1;
  position: relative;
  z-index: 1;
}

.menu-content h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #333b5f;
  letter-spacing: 0.2px;
}

.menu-arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #333b5f;
  opacity: 0.5;
  transition: all 0.3s ease;
  flex-shrink: 0;
  position: relative;
  z-index: 1;
}

.menu-item:hover .menu-arrow {
  opacity: 1;
  transform: translateX(4px);
}

/* Responsive Design */
@media (max-width: 1024px) {
  .page-container {
    padding: 1.5rem;
  }

  .menu-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .page-container {
    padding: 1rem;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .page-header h1 {
    font-size: 1.5rem;
  }

  .btn-back {
    width: 100%;
    justify-content: center;
  }

  .menu-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .menu-item {
    padding: 1.25rem;
  }

  .menu-icon {
    font-size: 1.75rem;
  }

  .menu-content h3 {
    font-size: 1.1rem;
  }
}

@media (max-width: 480px) {
  .page-container {
    padding: 0.75rem;
  }

  .page-header h1 {
    font-size: 1.25rem;
  }

  .menu-item {
    padding: 1rem;
    gap: 0.875rem;
  }

  .menu-icon {
    font-size: 1.5rem;
  }

  .menu-content h3 {
    font-size: 1rem;
  }
}
</style>

