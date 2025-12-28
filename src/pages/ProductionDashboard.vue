<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { productionLogsApi } from '../api/productionLogs'
import { Bar, Line, Doughnut } from 'vue-chartjs'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Title, Tooltip, Legend } from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
)

const router = useRouter()
const logs = ref([])
const isLoading = ref(false)
const error = ref(null)

const fetchData = async () => {
  isLoading.value = true
  error.value = null
  try {
    const res = await productionLogsApi.getAll()
    logs.value = res.data
  } catch (err) {
    error.value = err.response?.data?.detail || 'Gagal memuat data'
    console.error('Error fetching data:', err)
  } finally {
    isLoading.value = false
  }
}

// Chart Data - Production per Worker
const productionPerWorker = computed(() => {
  const workerMap = new Map()
  
  logs.value.forEach(log => {
    const workerName = log.worker?.name || 'Unknown'
    if (!workerMap.has(workerName)) {
      workerMap.set(workerName, { output: 0, reject: 0 })
    }
    const data = workerMap.get(workerName)
    data.output += parseFloat(log.qty_output) || 0
    data.reject += parseFloat(log.qty_reject) || 0
  })
  
  const sorted = Array.from(workerMap.entries())
    .sort((a, b) => (b[1].output + b[1].reject) - (a[1].output + a[1].reject))
    .slice(0, 10) // Top 10 workers
  
  return {
    labels: sorted.map(([name]) => name),
    datasets: [
      {
        label: 'Output',
        backgroundColor: '#4CAF50',
        data: sorted.map(([, data]) => data.output)
      },
      {
        label: 'Reject',
        backgroundColor: '#f44336',
        data: sorted.map(([, data]) => data.reject)
      }
    ]
  }
})

// Chart Data - Production per Item
const productionPerItem = computed(() => {
  const itemMap = new Map()
  
  logs.value.forEach(log => {
    const itemName = log.item?.item_name || log.item?.item_number || 'Unknown'
    if (!itemMap.has(itemName)) {
      itemMap.set(itemName, { output: 0, reject: 0, count: 0 })
    }
    const data = itemMap.get(itemName)
    data.output += parseFloat(log.qty_output) || 0
    data.reject += parseFloat(log.qty_reject) || 0
    data.count += 1
  })
  
  const sorted = Array.from(itemMap.entries())
    .sort((a, b) => b[1].output - a[1].output)
    .slice(0, 10) // Top 10 items
  
  return {
    labels: sorted.map(([name]) => name.length > 20 ? name.substring(0, 20) + '...' : name),
    datasets: [
      {
        label: 'Total Produksi',
        backgroundColor: '#2196F3',
        data: sorted.map(([, data]) => data.output)
      }
    ]
  }
})

// Chart Data - Production per Shift
const productionPerShift = computed(() => {
  const shiftMap = new Map()
  
  logs.value.forEach(log => {
    const shiftName = log.shift?.name || 'Unknown'
    if (!shiftMap.has(shiftName)) {
      shiftMap.set(shiftName, { output: 0, reject: 0 })
    }
    const data = shiftMap.get(shiftName)
    data.output += parseFloat(log.qty_output) || 0
    data.reject += parseFloat(log.qty_reject) || 0
  })
  
  return {
    labels: Array.from(shiftMap.keys()),
    datasets: [
      {
        label: 'Output',
        backgroundColor: '#FF9800',
        data: Array.from(shiftMap.values()).map(data => data.output)
      },
      {
        label: 'Reject',
        backgroundColor: '#E91E63',
        data: Array.from(shiftMap.values()).map(data => data.reject)
      }
    ]
  }
})

// Chart Data - Production per Date (Last 30 days)
const productionPerDate = computed(() => {
  const dateMap = new Map()
  const today = new Date()
  
  // Initialize last 30 days
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    dateMap.set(dateStr, { output: 0, reject: 0 })
  }
  
  logs.value.forEach(log => {
    const logDate = new Date(log.created_at).toISOString().split('T')[0]
    if (dateMap.has(logDate)) {
      const data = dateMap.get(logDate)
      data.output += parseFloat(log.qty_output) || 0
      data.reject += parseFloat(log.qty_reject) || 0
    }
  })
  
  const sorted = Array.from(dateMap.entries()).sort()
  
  return {
    labels: sorted.map(([date]) => {
      const d = new Date(date)
      return `${d.getDate()}/${d.getMonth() + 1}`
    }),
    datasets: [
      {
        label: 'Output',
        borderColor: '#4CAF50',
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        data: sorted.map(([, data]) => data.output),
        tension: 0.4,
        fill: true
      },
      {
        label: 'Reject',
        borderColor: '#f44336',
        backgroundColor: 'rgba(244, 67, 54, 0.1)',
        data: sorted.map(([, data]) => data.reject),
        tension: 0.4,
        fill: true
      }
    ]
  }
})

// Chart Data - Approval Status
const approvalStatus = computed(() => {
  let approvedCoordinator = 0
  let pendingCoordinator = 0
  let approvedSupervisor = 0
  let pendingSupervisor = 0
  
  logs.value.forEach(log => {
    if (log.approved_coordinator) {
      approvedCoordinator++
    } else {
      pendingCoordinator++
    }
    
    if (log.approved_spv) {
      approvedSupervisor++
    } else {
      pendingSupervisor++
    }
  })
  
  return {
    coordinator: {
      labels: ['Approved', 'Pending'],
      datasets: [{
        backgroundColor: ['#4CAF50', '#FF9800'],
        data: [approvedCoordinator, pendingCoordinator]
      }]
    },
    supervisor: {
      labels: ['Approved', 'Pending'],
      datasets: [{
        backgroundColor: ['#4CAF50', '#FF9800'],
        data: [approvedSupervisor, pendingSupervisor]
      }]
    }
  }
})

// Statistics
const statistics = computed(() => {
  const totalOutput = logs.value.reduce((sum, log) => sum + (parseFloat(log.qty_output) || 0), 0)
  const totalReject = logs.value.reduce((sum, log) => sum + (parseFloat(log.qty_reject) || 0), 0)
  const totalLogs = logs.value.length
  const uniqueWorkers = new Set(logs.value.map(log => log.worker_id)).size
  const uniqueItems = new Set(logs.value.map(log => log.item_id)).size
  const rejectionRate = totalOutput > 0 ? ((totalReject / totalOutput) * 100).toFixed(2) : 0
  
  return {
    totalOutput: totalOutput.toLocaleString('id-ID'),
    totalReject: totalReject.toLocaleString('id-ID'),
    totalLogs,
    uniqueWorkers,
    uniqueItems,
    rejectionRate
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top',
    },
    title: {
      display: false
    }
  }
}

const goBack = () => {
  router.push('/production-menu')
}

onMounted(() => {
  fetchData()
})
</script>

<template>
  <div class="dashboard-container">
    <div class="dashboard-header">
      <div>
        <h1>Production Dashboard</h1>
        <p class="subtitle">Visualisasi Data Production Log</p>
      </div>
      <button class="btn-back" @click="goBack">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        Kembali
      </button>
    </div>

    <div v-if="isLoading" class="loading">
      <p>Memuat data...</p>
    </div>

    <div v-else-if="error" class="error-message">
      <p>{{ error }}</p>
    </div>

    <div v-else class="dashboard-content">
      <!-- Statistics Cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon" style="background: #4CAF50;">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
          </div>
          <div class="stat-content">
            <h3>Total Output</h3>
            <p class="stat-value">{{ statistics.totalOutput }}</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon" style="background: #f44336;">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            </svg>
          </div>
          <div class="stat-content">
            <h3>Total Reject</h3>
            <p class="stat-value">{{ statistics.totalReject }}</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon" style="background: #2196F3;">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
          </div>
          <div class="stat-content">
            <h3>Total Logs</h3>
            <p class="stat-value">{{ statistics.totalLogs }}</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon" style="background: #FF9800;">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <div class="stat-content">
            <h3>Workers</h3>
            <p class="stat-value">{{ statistics.uniqueWorkers }}</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon" style="background: #9C27B0;">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
            </svg>
          </div>
          <div class="stat-content">
            <h3>Items</h3>
            <p class="stat-value">{{ statistics.uniqueItems }}</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon" style="background: #E91E63;">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
          </div>
          <div class="stat-content">
            <h3>Rejection Rate</h3>
            <p class="stat-value">{{ statistics.rejectionRate }}%</p>
          </div>
        </div>
      </div>

      <!-- Charts Grid -->
      <div class="charts-grid">
        <!-- Production per Worker -->
        <div class="chart-card">
          <h3>Produksi per Worker/Operator (Top 10)</h3>
          <div class="chart-container">
            <Bar :data="productionPerWorker" :options="chartOptions" />
          </div>
        </div>

        <!-- Production per Item -->
        <div class="chart-card">
          <h3>Produksi per Item (Top 10)</h3>
          <div class="chart-container">
            <Bar :data="productionPerItem" :options="chartOptions" />
          </div>
        </div>

        <!-- Production per Shift -->
        <div class="chart-card">
          <h3>Produksi per Shift</h3>
          <div class="chart-container">
            <Bar :data="productionPerShift" :options="chartOptions" />
          </div>
        </div>

        <!-- Production per Date -->
        <div class="chart-card full-width">
          <h3>Produksi per Tanggal (30 Hari Terakhir)</h3>
          <div class="chart-container">
            <Line :data="productionPerDate" :options="chartOptions" />
          </div>
        </div>

        <!-- Approval Status -->
        <div class="chart-card">
          <h3>Status Approval Coordinator</h3>
          <div class="chart-container">
            <Doughnut :data="approvalStatus.coordinator" :options="chartOptions" />
          </div>
        </div>

        <div class="chart-card">
          <h3>Status Approval Supervisor</h3>
          <div class="chart-container">
            <Doughnut :data="approvalStatus.supervisor" :options="chartOptions" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard-container {
  min-height: 100vh;
  background: #f4f6fb;
  padding: 2rem;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.dashboard-header h1 {
  margin: 0 0 0.25rem 0;
  font-size: 2rem;
  font-weight: 700;
  color: #333b5f;
}

.subtitle {
  margin: 0;
  font-size: 1rem;
  color: #666;
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

.loading, .error-message {
  text-align: center;
  padding: 3rem;
  background: white;
  border-radius: 12px;
  color: #666;
}

.dashboard-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.stat-content {
  flex: 1;
}

.stat-content h3 {
  margin: 0 0 0.5rem 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-value {
  margin: 0;
  font-size: 1.75rem;
  font-weight: 700;
  color: #333b5f;
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 1.5rem;
}

.chart-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.chart-card.full-width {
  grid-column: 1 / -1;
}

.chart-card h3 {
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #333b5f;
}

.chart-container {
  height: 300px;
  position: relative;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .charts-grid {
    grid-template-columns: 1fr;
  }
  
  .chart-card.full-width {
    grid-column: 1;
  }
}

@media (max-width: 768px) {
  .dashboard-container {
    padding: 1rem;
  }

  .dashboard-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .dashboard-header h1 {
    font-size: 1.5rem;
  }

  .btn-back {
    width: 100%;
    justify-content: center;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }

  .stat-card {
    padding: 1rem;
  }

  .stat-icon {
    width: 48px;
    height: 48px;
  }

  .stat-value {
    font-size: 1.5rem;
  }

  .chart-card {
    padding: 1rem;
  }

  .chart-container {
    height: 250px;
  }
}

@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .chart-container {
    height: 200px;
  }
}
</style>

