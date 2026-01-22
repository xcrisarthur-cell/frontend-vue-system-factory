<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { getSystemStatus } from '../api/system'

const router = useRouter()
const statusData = ref(null)
const loading = ref(true)
const error = ref(null)
let intervalId = null

const fetchStatus = async () => {
  try {
    const response = await getSystemStatus()
    statusData.value = response.data
    error.value = null
  } catch (err) {
    console.error('Failed to fetch system status:', err)
    error.value = 'Gagal mengambil data server. Pastikan backend aktif.'
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  router.push('/')
}

onMounted(() => {
  fetchStatus()
  // Refresh every 5 seconds
  intervalId = setInterval(fetchStatus, 5000)
})

onUnmounted(() => {
  if (intervalId) clearInterval(intervalId)
})

// Helper untuk warna status
const getStatusColor = (status) => {
  if (status === 'active' || status === 'running') return 'text-green-600 bg-green-100'
  return 'text-red-600 bg-red-100'
}

const getUsageColor = (percent) => {
  if (percent < 70) return '#10B981' // Green
  if (percent < 90) return '#F59E0B' // Orange
  return '#EF4444' // Red
}
</script>

<template>
  <div class="status-container">
    <div class="status-card">
      <div class="header">
        <button @click="goBack" class="back-btn">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Kembali
        </button>
        <h1>Server Status Monitor</h1>
        <div v-if="loading" class="loading-badge">Updating...</div>
      </div>

      <div v-if="error" class="error-msg">
        {{ error }}
      </div>

      <div v-if="statusData" class="dashboard-grid">
        <!-- CPU Card -->
        <div class="metric-card">
          <div class="metric-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
              <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
              <line x1="6" y1="6" x2="6.01" y2="6"></line>
              <line x1="6" y1="18" x2="6.01" y2="18"></line>
            </svg>
          </div>
          <div class="metric-info">
            <h3>CPU Usage</h3>
            <div class="metric-value" :style="{ color: getUsageColor(statusData.system.cpu.usage_percent) }">
              {{ statusData.system.cpu.usage_percent }}%
            </div>
            <p>Cores: {{ statusData.system.cpu.count_logical }}</p>
          </div>
        </div>

        <!-- RAM Card -->
        <div class="metric-card">
          <div class="metric-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
            </svg>
          </div>
          <div class="metric-info">
            <h3>RAM Usage</h3>
            <div class="metric-value" :style="{ color: getUsageColor(statusData.system.memory.percent) }">
              {{ statusData.system.memory.percent }}%
            </div>
            <p>{{ statusData.system.memory.used_gb }}GB / {{ statusData.system.memory.total_gb }}GB</p>
          </div>
        </div>

        <!-- Disk Card -->
        <div class="metric-card">
          <div class="metric-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
            </svg>
          </div>
          <div class="metric-info">
            <h3>Disk Usage</h3>
            <div class="metric-value" :style="{ color: getUsageColor(statusData.system.disk_root.percent) }">
              {{ statusData.system.disk_root.percent }}%
            </div>
            <p>Free: {{ statusData.system.disk_root.free_gb }}GB</p>
          </div>
        </div>

        <!-- Uptime Card -->
        <div class="metric-card">
          <div class="metric-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
          </div>
          <div class="metric-info">
            <h3>System Uptime</h3>
            <div class="metric-value text-blue">
              {{ statusData.system.uptime.split(',')[0] }}
            </div>
            <p>Since last reboot</p>
          </div>
        </div>
      </div>

      <div v-if="statusData" class="services-section">
        <h2>Service Health Status</h2>
        <div class="services-grid">
          <div v-for="(status, name) in statusData.services" :key="name" class="service-item">
            <div class="service-name">{{ name }}</div>
            <div class="service-badge" :class="getStatusColor(status)">
              {{ status }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.status-container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  padding: 2rem;
  background: #f0f4f8;
}

.status-card {
  background: white;
  border-radius: 24px;
  box-shadow: 0 8px 32px rgba(51, 59, 95, 0.1);
  padding: 2.5rem;
  width: 100%;
  max-width: 1000px;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2.5rem;
}

.header h1 {
  font-size: 1.8rem;
  color: #333b5f;
  margin: 0;
  font-weight: 700;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: none;
  background: transparent;
  color: #666;
  font-weight: 600;
  cursor: pointer;
  transition: color 0.2s;
}

.back-btn:hover {
  color: #333b5f;
}

.loading-badge {
  background: #e0e7ff;
  color: #4338ca;
  padding: 0.25rem 0.75rem;
  border-radius: 99px;
  font-size: 0.875rem;
  font-weight: 500;
  animation: pulse 2s infinite;
}

.error-msg {
  background: #fee2e2;
  color: #b91c1c;
  padding: 1rem;
  border-radius: 12px;
  margin-bottom: 2rem;
  text-align: center;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
}

.metric-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  transition: transform 0.2s;
}

.metric-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.metric-icon {
  width: 40px;
  height: 40px;
  background: #f3f4f6;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #4b5563;
}

.metric-info h3 {
  margin: 0;
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
}

.metric-value {
  font-size: 1.75rem;
  font-weight: 700;
  margin: 0.25rem 0;
  color: #111827;
}

.metric-info p {
  margin: 0;
  font-size: 0.875rem;
  color: #9ca3af;
}

.services-section h2 {
  font-size: 1.25rem;
  color: #333b5f;
  margin-bottom: 1.5rem;
}

.services-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.service-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.service-name {
  font-weight: 600;
  color: #334155;
  text-transform: capitalize;
}

.service-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 99px;
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: uppercase;
}

.text-blue { color: #2563eb; }
.text-green-600 { color: #059669; }
.bg-green-100 { background-color: #d1fae5; }
.text-red-600 { color: #dc2626; }
.bg-red-100 { background-color: #fee2e2; }

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* Responsive */
@media (max-width: 640px) {
  .status-container {
    padding: 1rem;
  }
  
  .status-card {
    padding: 1.5rem;
  }
  
  .header h1 {
    font-size: 1.25rem;
  }
}
</style>
