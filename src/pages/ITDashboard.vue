<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// Filter states
const selectedType = ref('ALL')
const selectedLocation = ref('ALL')

const devices = ref([
  // DVR BEKASI
  { id: 1, name: 'DVR CCTV HRD - BEKASI', ip: '103.164.99.2', port: '11011', type: 'DVR', location: 'BEKASI', isOnline: false, isLoading: true, lastCheck: '-' },
  { id: 2, name: 'DVR PPIC - BEKASI', ip: '103.164.99.2', port: '11012', type: 'DVR', location: 'BEKASI', isOnline: false, isLoading: true, lastCheck: '-' },
  { id: 3, name: 'DVR SECURITY - BEKASI', ip: '103.164.99.2', port: '11013', type: 'DVR', location: 'BEKASI', isOnline: false, isLoading: true, lastCheck: '-' },
  { id: 4, name: 'DVR PRODUKSI 1 - BEKASI', ip: '103.164.99.2', port: '11014', type: 'DVR', location: 'BEKASI', isOnline: false, isLoading: true, lastCheck: '-' },
  { id: 5, name: 'DVR GUDANG JADI - BEKASI', ip: '103.164.99.2', port: '11015', type: 'DVR', location: 'BEKASI', isOnline: false, isLoading: true, lastCheck: '-' },
  { id: 6, name: 'DVR PRODUKSI 2 - BEKASI', ip: '103.164.99.2', port: '11016', type: 'DVR', location: 'BEKASI', isOnline: false, isLoading: true, lastCheck: '-' },
  { id: 7, name: 'DVR KAWAT - BEKASI', ip: '103.164.99.2', port: '11017', type: 'DVR', location: 'BEKASI', isOnline: false, isLoading: true, lastCheck: '-' },
  { id: 8, name: 'DVR ICU - BEKASI', ip: '103.164.99.2', port: '11018', type: 'DVR', location: 'BEKASI', isOnline: false, isLoading: true, lastCheck: '-' },
  
  // DVR BANDUNG (Updated IP)
  { id: 9, name: 'DVR PRODUKSI - BANDUNG', ip: '36.93.215.10', port: '11021', type: 'DVR', location: 'BANDUNG', isOnline: false, isLoading: true, lastCheck: '-' },
  { id: 10, name: 'DVR OFFICE - BANDUNG', ip: '36.93.215.10', port: '11022', type: 'DVR', location: 'BANDUNG', isOnline: false, isLoading: true, lastCheck: '-' },
  
  // DVR PEKANBARU
  { id: 11, name: 'DVR OFFICE - PEKANBARU', ip: '103.183.14.82', port: '11041', type: 'DVR', location: 'PEKANBARU', isOnline: false, isLoading: true, lastCheck: '-' },
  { id: 12, name: 'DVR PRODUKSI - PEKANBARU', ip: '103.183.14.82', port: '11042', type: 'DVR', location: 'PEKANBARU', isOnline: false, isLoading: true, lastCheck: '-' },

])

const filteredDevices = computed(() => {
  return devices.value.filter(device => {
    const typeMatch = selectedType.value === 'ALL' || device.type === selectedType.value
    const locationMatch = selectedLocation.value === 'ALL' || device.location === selectedLocation.value
    return typeMatch && locationMatch
  })
})

const hasRestrictedPorts = computed(() => {
  return devices.value.some(d => d.statusText === 'BLOCKED')
})

const checkSingleStatus = async (device) => {
  device.isLoading = true
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)
    
    // Cek apakah port termasuk restricted ports di browser (biasanya 1-1024 kecuali 80/443)
    const restrictedPorts = [1, 2, 3, 4]
    const isRestricted = restrictedPorts.includes(Number(device.port))
    const startTime = performance.now()

    if (isRestricted) {
       console.warn(`Port ${device.port} mungkin diblokir oleh browser (Unsafe Port).`)
    }

    await fetch(`http://${device.ip}:${device.port}`, { 
      mode: 'no-cors', 
      signal: controller.signal,
      cache: 'no-store'
    })
    
    device.isOnline = true
    device.statusText = 'ON'
    clearTimeout(timeoutId)
  } catch (err) {
    const endTime = performance.now()
    const duration = endTime - startTime
    
    // Cek apakah error karena unsafe port (biasanya terjadi sangat cepat < 200ms)
    const restrictedPorts = [1, 2, 3, 4]
    const isRestricted = restrictedPorts.includes(Number(device.port))

    if (isRestricted && duration < 200 && err.name !== 'AbortError') {
       device.isOnline = false
       device.statusText = 'BLOCKED'
    } else if (isRestricted) {
       // Jika error bukan blocked (misal timeout atau connection reset), tapi ini port restricted
       // Kemungkinan besar port ini bukan HTTP server (Raw TCP)
       device.isOnline = false
       device.statusText = 'NOT HTTP?'
    } else {
       device.isOnline = false
       device.statusText = 'OFF'
    }
  } finally {
    device.isLoading = false
    device.lastCheck = new Date().toLocaleTimeString()
  }
}

const checkAllStatus = async () => {
  const promises = devices.value.map(device => checkSingleStatus(device))
  await Promise.all(promises)
}

const goBack = () => {
  router.push('/')
}

onMounted(() => {
  checkAllStatus()
  setInterval(checkAllStatus, 30000)
})
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <div class="header-left">
        <button class="back-button" @click="goBack" type="button">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Kembali
        </button>
        <h1>IT Dashboard</h1>
      </div>
      <button class="refresh-button" @click="checkAllStatus">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M23 4v6h-6"></path>
          <path d="M1 20v-6h6"></path>
          <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
        </svg>
        Refresh
      </button>
    </div>

    <!-- Filters -->
    <div class="filters-container">
      <div class="filter-group">
        <label>Type:</label>
        <div class="filter-buttons">
          <button 
            :class="{ active: selectedType === 'ALL' }" 
            @click="selectedType = 'ALL'"
          >All</button>
          <button 
            :class="{ active: selectedType === 'DVR' }" 
            @click="selectedType = 'DVR'"
          >DVR</button>
        </div>
      </div>

      <div class="filter-group">
        <label>Location:</label>
        <div class="filter-buttons">
          <button 
            :class="{ active: selectedLocation === 'ALL' }" 
            @click="selectedLocation = 'ALL'"
          >All</button>
          <button 
            :class="{ active: selectedLocation === 'BEKASI' }" 
            @click="selectedLocation = 'BEKASI'"
          >Bekasi</button>
          <button 
            :class="{ active: selectedLocation === 'BANDUNG' }" 
            @click="selectedLocation = 'BANDUNG'"
          >Bandung</button>
          <button 
            :class="{ active: selectedLocation === 'PEKANBARU' }" 
            @click="selectedLocation = 'PEKANBARU'"
          >Pekanbaru</button>
        </div>
      </div>
    </div>

    <div class="dashboard-grid">
      <div v-for="device in filteredDevices" :key="device.id" class="status-card" :class="{ 
        'online': device.isOnline, 
        'offline': !device.isOnline && device.statusText !== 'BLOCKED' && device.statusText !== 'NOT HTTP?', 
        'blocked': device.statusText === 'BLOCKED' || device.statusText === 'NOT HTTP?' 
      }">
        <div class="card-header">
          <div class="header-title">
            <span class="device-type-badge" :class="device.type.toLowerCase()">{{ device.type }}</span>
            <h3>{{ device.name }}</h3>
          </div>
          <div class="status-indicator">
            <span class="pulse"></span>
            {{ device.isLoading ? 'Checking...' : (device.statusText || (device.isOnline ? 'ON' : 'OFF')) }}
          </div>
        </div>
        <div class="card-body">
          <div class="info-row">
            <span class="label">Location</span>
            <span class="value badge-location">{{ device.location }}</span>
          </div>
          <div class="info-row">
            <span class="label">IP Address</span>
            <span class="value">{{ device.ip }}</span>
          </div>
          <div class="info-row">
            <span class="label">Port</span>
            <span class="value">{{ device.port }}</span>
          </div>
          <div class="info-row">
            <span class="label">Last Check</span>
            <span class="value">{{ device.lastCheck }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-container {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

/* Filters */
.filters-container {
  background: white;
  padding: 1.5rem;
  border-radius: 16px;
  margin-bottom: 2rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  display: flex;
  gap: 2rem;
  flex-wrap: wrap;
  border: 1px solid #e5e7eb;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.filter-group label {
  font-weight: 600;
  color: #374151;
  min-width: 70px;
}

.filter-buttons {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.filter-buttons button {
  padding: 6px 16px;
  border-radius: 8px;
  border: 1px solid #d1d5db;
  background: white;
  color: #4b5563;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.filter-buttons button:hover {
  background: #f3f4f6;
}

.filter-buttons button.active {
  background: #333b5f;
  color: white;
  border-color: #333b5f;
}

.back-button, .refresh-button {
  display: flex;
  align-items: center;
  gap: 8px;
  background: white;
  border: 1px solid #e5e7eb;
  color: #374151;
  font-size: 1rem;
  cursor: pointer;
  padding: 8px 16px;
  border-radius: 8px;
  transition: all 0.2s;
}

.back-button:hover, .refresh-button:hover {
  background-color: #f3f4f6;
  transform: translateY(-1px);
}

.refresh-button:active {
  transform: translateY(0);
}

h1 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 1.5rem;
}

.status-card {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  border: 2px solid #e5e7eb;
  transition: all 0.3s ease;
}

.status-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 12px -1px rgba(0, 0, 0, 0.1);
}

.status-card.online {
  border-color: #10b981;
  background: #ecfdf5;
}

.status-card.offline {
  border-color: #ef4444;
  background: #fef2f2;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
  gap: 1rem;
}

.header-title {
  flex: 1;
}

.device-type-badge {
  display: inline-block;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 4px;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.device-type-badge.dvr {
  background: #e0e7ff;
  color: #4338ca;
}

.card-header h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #1f2937;
  line-height: 1.4;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  font-size: 0.75rem;
  padding: 4px 12px;
  border-radius: 9999px;
  background: white;
  white-space: nowrap;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
  flex-shrink: 0;
}

.online .status-indicator {
  color: #059669;
}

.offline .status-indicator {
  color: #dc2626;
}

.pulse {
  display: block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: currentColor;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { transform: scale(0.95); opacity: 0.8; }
  50% { transform: scale(1.05); opacity: 1; }
  100% { transform: scale(0.95); opacity: 0.8; }
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(0,0,0,0.05);
}

.info-row:last-child {
  border-bottom: none;
}

.label {
  color: #6b7280;
  font-size: 0.875rem;
}

.value {
  color: #111827;
  font-weight: 500;
  font-family: monospace;
  font-size: 0.9rem;
}

.badge-location {
  font-family: inherit;
  font-size: 0.75rem;
  background: #f3f4f6;
  padding: 2px 8px;
  border-radius: 4px;
  color: #4b5563;
  font-weight: 600;
}

.info-alert {
  background-color: #fff3cd;
  color: #856404;
  border: 1px solid #ffeeba;
  padding: 1rem;
  margin-bottom: 1.5rem;
  border-radius: 8px;
  display: flex;
  gap: 1rem;
  align-items: flex-start;
  line-height: 1.5;
}

.alert-icon {
  font-size: 1.5rem;
}

.alert-content h4 {
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: #856404;
}

.alert-content p {
  margin: 0 0 0.5rem 0;
  font-size: 0.9rem;
}

.alert-content code {
  display: block;
  background: rgba(0,0,0,0.06);
  padding: 8px;
  border-radius: 4px;
  font-family: monospace;
  margin-top: 0.5rem;
  word-break: break-all;
}

.status-card.blocked {
  border-left: 5px solid #ffc107;
}

.status-card.blocked .status-indicator {
  color: #ffc107;
  background-color: rgba(255, 193, 7, 0.1);
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
}

.status-card.blocked .pulse {
  background-color: #ffc107;
}

@media (max-width: 640px) {
  .page-container {
    padding: 1rem;
  }
  
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
  
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .refresh-button {
    width: 100%;
    justify-content: center;
  }
  
  .filters-container {
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
  }
  
  .filter-group {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
}
</style>