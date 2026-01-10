<script setup>
import { useRouter } from 'vue-router'
import { onMounted, ref } from 'vue'
import { useMasterDataSessionStore } from '../store/masterDataSession'
import { modal } from '../plugins/modal'
import { divisionsApi } from '../api/divisions'
import { departmentsApi } from '../api/departments'
import { positionsApi } from '../api/positions'
import { subPositionsApi } from '../api/subPositions'
import { workersApi } from '../api/workers'
import { shiftsApi } from '../api/shifts'
import { suppliersApi } from '../api/suppliers'
import { itemsApi } from '../api/items'
import { problemCommentsApi } from '../api/problemComments'
import { productionLogsApi } from '../api/productionLogs'
import api from '../api/http'

const productionTargetsApi = {
  getAll: () => api.get('/production-targets')
}

const attendancesApi = {
  getAll: () => api.get('/attendances')
}

const productionPlansApi = {
  getAll: () => api.get('/production-plans')
}

const router = useRouter()
const masterDataSession = useMasterDataSessionStore()
const isLoading = ref(false)

const menuItems = ref([
  { title: 'Divisions', path: '/divisions', icon: '🏢', count: null, api: divisionsApi },
  { title: 'Departments', path: '/departments', icon: '🏛️', count: null, api: departmentsApi },
  { title: 'Positions', path: '/positions', icon: '💼', count: null, api: positionsApi },
  { title: 'Sub Positions', path: '/sub-positions', icon: '📋', count: null, api: subPositionsApi },
  { title: 'Workers', path: '/workers', icon: '👥', count: null, api: workersApi },
  { title: 'Shifts', path: '/shifts', icon: '⏰', count: null, api: shiftsApi },
  { title: 'Suppliers', path: '/suppliers', icon: '🚚', count: null, api: suppliersApi },
  { title: 'Items', path: '/items', icon: '📦', count: null, api: itemsApi },
  { title: 'Production Plans', path: '/production-plans-view?from=master-data', icon: '🗓️', count: null, api: productionPlansApi },
  { title: 'Production Targets', path: '/production-targets', icon: '🎯', count: null, api: productionTargetsApi },
  { title: 'Attendances', path: '/attendances', icon: '📅', count: null, api: attendancesApi },
  { title: 'Problem Comments', path: '/problem-comments', icon: '⚠️', count: null, api: problemCommentsApi },
  { title: 'Production Logs', path: '/production-logs?from=master-data', icon: '📊', count: null, api: productionLogsApi }
])

const navigateTo = (path) => {
  router.push(path)
}

const fetchCounts = async () => {
  isLoading.value = true
  const promises = menuItems.value.map(async (item) => {
    try {
      if (item.api && item.api.getAll) {
        const response = await item.api.getAll()
        // Handle both array response and object response with data property
        const data = Array.isArray(response) ? response : (response.data || [])
        item.count = Array.isArray(data) ? data.length : 0
      }
    } catch (error) {
      console.error(`Failed to fetch count for ${item.title}:`, error)
      item.count = '-'
    }
  })
  
  await Promise.allSettled(promises)
  isLoading.value = false
}

onMounted(async () => {
  // Check if superadmin is authenticated
  if (!masterDataSession.isAuthenticated) {
    await modal.showWarning('Silakan login terlebih dahulu')
    router.push('/master-data-login')
    return
  }
  
  fetchCounts()
})
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <div>
        <h1>Master Data Management</h1>
        <p class="subtitle">Kelola seluruh data referensi sistem</p>
      </div>
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
          <div class="menu-meta" v-if="item.api && item.count !== null">
            <span class="count-badge" :class="{ 'error': item.count === '-' }">
              {{ item.count === '-' ? 'Error' : `${item.count} Data` }}
            </span>
          </div>
          <div class="menu-meta skeleton" v-else-if="item.api && item.count === null"></div>
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

.subtitle {
  margin: 0.25rem 0 0 0;
  color: #666;
  font-size: 1rem;
}

.menu-meta {
  margin-top: 0.5rem;
  height: 24px;
}

.count-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background: #e8f5e9;
  color: #2e7d32;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

.count-badge.error {
  background: #ffebee;
  color: #c62828;
}

.skeleton {
  width: 60px;
  height: 24px;
  background: #f0f0f0;
  border-radius: 12px;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% { opacity: 0.6; }
  50% { opacity: 1; }
  100% { opacity: 0.6; }
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

