<script setup>
import { ref, onMounted, computed, onUnmounted } from 'vue'
import { Teleport, Transition } from 'vue'
import { useRouter } from 'vue-router'
import { productionLogsApi } from '../api/productionLogs'
import { workersApi } from '../api/workers'
import api from '../api/http'
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
const selectedLog = ref(null)
const showDetailModal = ref(false)
const windowWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1920)

// Filter states
const filterWorkerId = ref('')
const filterShiftId = ref('')
const filterDateFrom = ref('')
const filterDateTo = ref('')
const filterPositionId = ref('')
const filterSubPositionId = ref('')
const filterSupplierId = ref('')
const filterItemId = ref('')
const filterApprovalCoordinator = ref('')
const filterApprovalSpv = ref('')
const searchQuery = ref('')

// Master data
const workers = ref([])
const shifts = ref([])
const positions = ref([])
const subPositions = ref([])
const suppliers = ref([])
const items = ref([])

const fetchData = async () => {
  isLoading.value = true
  error.value = null
  try {
    const [logsRes, workersRes, shiftsRes, positionsRes, suppliersRes, itemsRes] = await Promise.all([
      productionLogsApi.getAll(),
      workersApi.getAll(),
      api.get('/shifts'),
      api.get('/positions'),
      api.get('/suppliers'),
      api.get('/items')
    ])
    logs.value = logsRes.data
    workers.value = workersRes.data
    shifts.value = shiftsRes.data
    positions.value = positionsRes.data
    suppliers.value = suppliersRes.data
    items.value = itemsRes.data
  } catch (err) {
    error.value = err.response?.data?.detail || 'Gagal memuat data'
    console.error('Error fetching data:', err)
  } finally {
    isLoading.value = false
  }
}

// Load sub positions when position is selected
const loadSubPositions = async () => {
  filterSubPositionId.value = ''
  subPositions.value = []
  
  if (!filterPositionId.value) return
  
  try {
    const res = await api.get(`/sub-positions/by-position/${filterPositionId.value}`)
    subPositions.value = res.data
  } catch (err) {
    console.error('Error loading sub positions:', err)
  }
}

// Filtered and searched logs
const filteredAndSearchedLogs = computed(() => {
  let filtered = logs.value

  // Apply filters
  if (filterWorkerId.value) {
    filtered = filtered.filter(log => log.worker_id === Number(filterWorkerId.value))
  }

  if (filterShiftId.value) {
    filtered = filtered.filter(log => log.shift_id === Number(filterShiftId.value))
  }

  if (filterDateFrom.value) {
    const fromDate = new Date(filterDateFrom.value)
    fromDate.setHours(0, 0, 0, 0)
    filtered = filtered.filter(log => {
      const logDate = new Date(log.created_at)
      logDate.setHours(0, 0, 0, 0)
      return logDate >= fromDate
    })
  }

  if (filterDateTo.value) {
    const toDate = new Date(filterDateTo.value)
    toDate.setHours(23, 59, 59, 999)
    filtered = filtered.filter(log => {
      const logDate = new Date(log.created_at)
      return logDate <= toDate
    })
  }

  if (filterPositionId.value) {
    filtered = filtered.filter(log => log.position_id === Number(filterPositionId.value))
  }

  if (filterSubPositionId.value) {
    filtered = filtered.filter(log => log.sub_position_id === Number(filterSubPositionId.value))
  }

  if (filterSupplierId.value) {
    filtered = filtered.filter(log => log.supplier_id === Number(filterSupplierId.value))
  }

  if (filterItemId.value) {
    filtered = filtered.filter(log => log.item_id === Number(filterItemId.value))
  }

  if (filterApprovalCoordinator.value) {
    if (filterApprovalCoordinator.value === 'approved') {
      filtered = filtered.filter(log => log.approved_coordinator === true)
    } else if (filterApprovalCoordinator.value === 'pending') {
      filtered = filtered.filter(log => log.approved_coordinator !== true)
    }
  }

  if (filterApprovalSpv.value) {
    if (filterApprovalSpv.value === 'approved') {
      filtered = filtered.filter(log => log.approved_spv === true)
    } else if (filterApprovalSpv.value === 'pending') {
      filtered = filtered.filter(log => log.approved_spv !== true)
    }
  }

  // Apply search
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(log => {
      const workerName = log.worker?.name?.toLowerCase() || ''
      const itemName = log.item?.item_name?.toLowerCase() || ''
      const itemNumber = log.item?.item_number?.toLowerCase() || ''
      const positionCode = log.position?.code?.toLowerCase() || ''
      const shiftName = log.shift?.name?.toLowerCase() || ''
      const supplierName = log.supplier?.name?.toLowerCase() || ''
      const id = log.id?.toString() || ''
      
      return workerName.includes(query) ||
             itemName.includes(query) ||
             itemNumber.includes(query) ||
             positionCode.includes(query) ||
             shiftName.includes(query) ||
             supplierName.includes(query) ||
             id.includes(query)
    })
  }

  return filtered
})

const handleShowDetail = async (log) => {
  try {
    // Fetch full detail with all relationships
    const res = await productionLogsApi.getById(log.id)
    selectedLog.value = res.data
    showDetailModal.value = true
  } catch (err) {
    console.error('Error fetching log detail:', err)
    // Fallback to basic log data
    selectedLog.value = log
    showDetailModal.value = true
  }
}

const closeDetailModal = () => {
  showDetailModal.value = false
  selectedLog.value = null
}

const clearFilters = () => {
  filterWorkerId.value = ''
  filterShiftId.value = ''
  filterDateFrom.value = ''
  filterDateTo.value = ''
  filterPositionId.value = ''
  filterSubPositionId.value = ''
  filterSupplierId.value = ''
  filterItemId.value = ''
  filterApprovalCoordinator.value = ''
  filterApprovalSpv.value = ''
  searchQuery.value = ''
  subPositions.value = []
}

// Chart Data - Production per Worker (using filtered data)
const productionPerWorker = computed(() => {
  const workerMap = new Map()
  
  filteredAndSearchedLogs.value.forEach(log => {
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

// Chart Data - Production per Item (using filtered data)
const productionPerItem = computed(() => {
  const itemMap = new Map()
  
  filteredAndSearchedLogs.value.forEach(log => {
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

// Chart Data - Production per Shift (using filtered data)
const productionPerShift = computed(() => {
  const shiftMap = new Map()
  
  filteredAndSearchedLogs.value.forEach(log => {
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

// Chart Data - Production per Date (Last 30 days, using filtered data)
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
  
  filteredAndSearchedLogs.value.forEach(log => {
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

// Chart Data - Approval Status (using filtered data)
const approvalStatus = computed(() => {
  let approvedCoordinator = 0
  let pendingCoordinator = 0
  let approvedSupervisor = 0
  let pendingSupervisor = 0
  
  filteredAndSearchedLogs.value.forEach(log => {
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

// Statistics (using filtered data)
const statistics = computed(() => {
  const totalOutput = filteredAndSearchedLogs.value.reduce((sum, log) => sum + (parseFloat(log.qty_output) || 0), 0)
  const totalReject = filteredAndSearchedLogs.value.reduce((sum, log) => sum + (parseFloat(log.qty_reject) || 0), 0)
  const totalLogs = filteredAndSearchedLogs.value.length
  const uniqueWorkers = new Set(filteredAndSearchedLogs.value.map(log => log.worker_id)).size
  const uniqueItems = new Set(filteredAndSearchedLogs.value.map(log => log.item_id)).size
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

// Base chart options with responsive configuration
const baseChartOptions = computed(() => {
  const isMobile = windowWidth.value <= 768
  const devicePixelRatio = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio, isMobile ? 2 : 3) : 1
  
  return {
    responsive: true,
    maintainAspectRatio: false,
    devicePixelRatio: devicePixelRatio,
  layout: {
    padding: {
      top: 10,
      bottom: 10,
      left: 10,
      right: 10
    }
  },
  plugins: {
    legend: {
      position: 'top',
      labels: {
        boxWidth: 12,
        padding: 10,
        font: {
          size: 12
        },
        usePointStyle: true
      }
    },
    title: {
      display: false
    },
    tooltip: {
      enabled: true,
      padding: 8,
      titleFont: {
        size: 12
      },
      bodyFont: {
        size: 11
      },
      boxPadding: 6
    }
  },
  scales: {
    x: {
      ticks: {
        font: {
          size: 11
        },
        maxRotation: 45,
        minRotation: 0
      },
      grid: {
        display: true,
        color: 'rgba(0, 0, 0, 0.05)'
      }
    },
    y: {
      ticks: {
        font: {
          size: 11
        },
        padding: 8
      },
      grid: {
        display: true,
        color: 'rgba(0, 0, 0, 0.05)'
      }
    }
  }
  }
})

// Chart options for different chart types
const chartOptions = computed(() => {
  const isMobile = windowWidth.value <= 768
  const isTablet = windowWidth.value <= 1024 && windowWidth.value > 768
  
  return {
    ...baseChartOptions.value,
    plugins: {
      ...baseChartOptions.value.plugins,
      legend: {
        ...baseChartOptions.value.plugins.legend,
        labels: {
          ...baseChartOptions.value.plugins.legend.labels,
          font: {
            size: isMobile ? 10 : isTablet ? 11 : 12
          },
          boxWidth: isMobile ? 10 : 12,
          padding: isMobile ? 8 : 10
        }
      },
      tooltip: {
        ...baseChartOptions.value.plugins.tooltip,
        titleFont: {
          size: isMobile ? 11 : 12
        },
        bodyFont: {
          size: isMobile ? 10 : 11
        }
      }
    },
    scales: {
      x: {
        ...baseChartOptions.value.scales.x,
        ticks: {
          ...baseChartOptions.value.scales.x.ticks,
          font: {
            size: isMobile ? 9 : isTablet ? 10 : 11
          },
          maxRotation: isMobile ? 90 : 45,
          minRotation: isMobile ? 45 : 0
        }
      },
      y: {
        ...baseChartOptions.value.scales.y,
        ticks: {
          ...baseChartOptions.value.scales.y.ticks,
          font: {
            size: isMobile ? 9 : isTablet ? 10 : 11
          }
        }
      }
    }
  }
})

// Doughnut chart options (no scales)
const doughnutChartOptions = computed(() => {
  const isMobile = windowWidth.value <= 768
  const isTablet = windowWidth.value <= 1024 && windowWidth.value > 768
  const devicePixelRatio = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio, isMobile ? 2 : 3) : 1
  
  return {
    responsive: true,
    maintainAspectRatio: false,
    devicePixelRatio: devicePixelRatio,
    layout: {
      padding: {
        top: 10,
        bottom: 10,
        left: 10,
        right: 10
      }
    },
    plugins: {
      legend: {
        position: isMobile ? 'bottom' : 'top',
        labels: {
          boxWidth: isMobile ? 10 : 12,
          padding: isMobile ? 8 : 10,
          font: {
            size: isMobile ? 10 : isTablet ? 11 : 12
          },
          usePointStyle: true
        }
      },
      title: {
        display: false
      },
      tooltip: {
        enabled: true,
        padding: 8,
        titleFont: {
          size: isMobile ? 11 : 12
        },
        bodyFont: {
          size: isMobile ? 10 : 11
        },
        boxPadding: 6
      }
    }
  }
})

const goBack = () => {
  router.push('/production-menu')
}

// Handle window resize for chart responsiveness
const handleResize = () => {
  windowWidth.value = window.innerWidth
}

onMounted(() => {
  fetchData()
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', handleResize)
    windowWidth.value = window.innerWidth
  }
})

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', handleResize)
  }
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
      <!-- Search and Filter Section -->
      <div class="filter-section">
        <div class="filter-header">
          <h2>Filter & Pencarian</h2>
          <button class="btn-clear-filters" @click="clearFilters">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
            Reset Filter
          </button>
        </div>
        
        <div class="search-box">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
          <input 
            type="text" 
            v-model="searchQuery" 
            placeholder="Cari berdasarkan worker, item, position, shift, supplier, atau ID..."
            class="search-input"
          />
        </div>

        <div class="filters-grid">
          <div class="filter-group">
            <label>Worker</label>
            <select v-model="filterWorkerId" class="filter-input">
              <option value="">Semua Worker</option>
              <option v-for="worker in workers" :key="worker.id" :value="worker.id">
                {{ worker.name }}
              </option>
            </select>
          </div>

          <div class="filter-group">
            <label>Position</label>
            <select v-model="filterPositionId" @change="loadSubPositions" class="filter-input">
              <option value="">Semua Position</option>
              <option v-for="position in positions" :key="position.id" :value="position.id">
                {{ position.code }}
              </option>
            </select>
          </div>

          <div class="filter-group" v-if="subPositions.length > 0">
            <label>Sub Position</label>
            <select v-model="filterSubPositionId" class="filter-input">
              <option value="">Semua Sub Position</option>
              <option v-for="subPos in subPositions" :key="subPos.id" :value="subPos.id">
                {{ subPos.code }}
              </option>
            </select>
          </div>

          <div class="filter-group">
            <label>Shift</label>
            <select v-model="filterShiftId" class="filter-input">
              <option value="">Semua Shift</option>
              <option v-for="shift in shifts" :key="shift.id" :value="shift.id">
                {{ shift.name }}
              </option>
            </select>
          </div>

          <div class="filter-group">
            <label>Supplier</label>
            <select v-model="filterSupplierId" class="filter-input">
              <option value="">Semua Supplier</option>
              <option v-for="supplier in suppliers" :key="supplier.id" :value="supplier.id">
                {{ supplier.name }}
              </option>
            </select>
          </div>

          <div class="filter-group">
            <label>Item</label>
            <select v-model="filterItemId" class="filter-input">
              <option value="">Semua Item</option>
              <option v-for="item in items" :key="item.id" :value="item.id">
                {{ item.item_name || item.item_number }}
              </option>
            </select>
          </div>

          <div class="filter-group">
            <label>Tanggal Dari</label>
            <input type="date" v-model="filterDateFrom" class="filter-input" />
          </div>

          <div class="filter-group">
            <label>Tanggal Sampai</label>
            <input type="date" v-model="filterDateTo" class="filter-input" />
          </div>

          <div class="filter-group">
            <label>Status Approval Coordinator</label>
            <select v-model="filterApprovalCoordinator" class="filter-input">
              <option value="">Semua Status</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          <div class="filter-group">
            <label>Status Approval Supervisor</label>
            <select v-model="filterApprovalSpv" class="filter-input">
              <option value="">Semua Status</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>

        <div class="filter-info">
          <p>Menampilkan <strong>{{ filteredAndSearchedLogs.length }}</strong> dari <strong>{{ logs.length }}</strong> production log</p>
        </div>
      </div>

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
            <Bar :data="productionPerWorker" :options="chartOptions" :key="`worker-${windowWidth}`" />
          </div>
        </div>

        <!-- Production per Item -->
        <div class="chart-card">
          <h3>Produksi per Item (Top 10)</h3>
          <div class="chart-container">
            <Bar :data="productionPerItem" :options="chartOptions" :key="`item-${windowWidth}`" />
          </div>
        </div>

        <!-- Production per Shift -->
        <div class="chart-card">
          <h3>Produksi per Shift</h3>
          <div class="chart-container">
            <Bar :data="productionPerShift" :options="chartOptions" :key="`shift-${windowWidth}`" />
          </div>
        </div>

        <!-- Production per Date -->
        <div class="chart-card full-width">
          <h3>Produksi per Tanggal (30 Hari Terakhir)</h3>
          <div class="chart-container">
            <Line :data="productionPerDate" :options="chartOptions" :key="`date-${windowWidth}`" />
          </div>
        </div>

        <!-- Approval Status -->
        <div class="chart-card">
          <h3>Status Approval Coordinator</h3>
          <div class="chart-container">
            <Doughnut :data="approvalStatus.coordinator" :options="doughnutChartOptions" :key="`coord-${windowWidth}`" />
          </div>
        </div>

        <div class="chart-card">
          <h3>Status Approval Supervisor</h3>
          <div class="chart-container">
            <Doughnut :data="approvalStatus.supervisor" :options="doughnutChartOptions" :key="`spv-${windowWidth}`" />
          </div>
        </div>
      </div>

      <!-- Production Logs Table -->
      <div class="table-section">
        <div class="table-header">
          <h2>Data Production Log</h2>
        </div>
        
        <!-- Desktop Table View -->
        <div class="table-container desktop-view">
          <table class="logs-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Tanggal</th>
                <th>Worker</th>
                <th>Position</th>
                <th>Shift</th>
                <th>Item</th>
                <th>Qty Output</th>
                <th>Qty Reject</th>
                <th>Approval Coordinator</th>
                <th>Approval Supervisor</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="filteredAndSearchedLogs.length === 0">
                <td colspan="11" class="no-data">Tidak ada data production log</td>
              </tr>
              <tr v-for="log in filteredAndSearchedLogs" :key="log.id">
                <td>{{ log.id }}</td>
                <td>{{ new Date(log.created_at).toLocaleDateString('id-ID') }}</td>
                <td>{{ log.worker?.name || '-' }}</td>
                <td>{{ log.position?.code || '-' }}</td>
                <td>{{ log.shift?.name || '-' }}</td>
                <td>{{ log.item?.item_name || log.item?.item_number || '-' }}</td>
                <td>{{ parseFloat(log.qty_output || 0).toLocaleString('id-ID') }}</td>
                <td>{{ parseFloat(log.qty_reject || 0).toLocaleString('id-ID') }}</td>
                <td>
                  <span v-if="log.approved_coordinator" class="badge approved">Approved</span>
                  <span v-else class="badge pending">Pending</span>
                </td>
                <td>
                  <span v-if="log.approved_spv" class="badge approved">Approved</span>
                  <span v-else class="badge pending">Pending</span>
                </td>
                <td>
                  <button class="btn-detail" @click="handleShowDetail(log)">Detail</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Mobile Card View -->
        <div class="mobile-view">
          <div v-if="filteredAndSearchedLogs.length === 0" class="no-data-card">
            <p>Tidak ada data production log</p>
          </div>
          <div v-for="log in filteredAndSearchedLogs" :key="log.id" class="log-card">
            <div class="log-card-header">
              <div class="log-card-id">ID: {{ log.id }}</div>
              <div class="log-card-date">{{ new Date(log.created_at).toLocaleDateString('id-ID') }}</div>
            </div>
            <div class="log-card-body">
              <div class="log-card-row">
                <span class="log-card-label">Worker:</span>
                <span class="log-card-value">{{ log.worker?.name || '-' }}</span>
              </div>
              <div class="log-card-row">
                <span class="log-card-label">Position:</span>
                <span class="log-card-value">{{ log.position?.code || '-' }}</span>
              </div>
              <div class="log-card-row">
                <span class="log-card-label">Shift:</span>
                <span class="log-card-value">{{ log.shift?.name || '-' }}</span>
              </div>
              <div class="log-card-row">
                <span class="log-card-label">Item:</span>
                <span class="log-card-value">{{ log.item?.item_name || log.item?.item_number || '-' }}</span>
              </div>
              <div class="log-card-row">
                <span class="log-card-label">Qty Output:</span>
                <span class="log-card-value">{{ parseFloat(log.qty_output || 0).toLocaleString('id-ID') }}</span>
              </div>
              <div class="log-card-row">
                <span class="log-card-label">Qty Reject:</span>
                <span class="log-card-value reject-value">{{ parseFloat(log.qty_reject || 0).toLocaleString('id-ID') }}</span>
              </div>
              <div class="log-card-row">
                <span class="log-card-label">Approval Coordinator:</span>
                <span v-if="log.approved_coordinator" class="badge approved">Approved</span>
                <span v-else class="badge pending">Pending</span>
              </div>
              <div class="log-card-row">
                <span class="log-card-label">Approval Supervisor:</span>
                <span v-if="log.approved_spv" class="badge approved">Approved</span>
                <span v-else class="badge pending">Pending</span>
              </div>
            </div>
            <div class="log-card-footer">
              <button class="btn-detail" @click="handleShowDetail(log)">Detail</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Detail Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showDetailModal" class="modal-overlay" @click.self="closeDetailModal">
          <div class="modal-container detail-modal">
            <div class="modal-header">
              <h2>Detail Production Log</h2>
              <button class="modal-close" @click="closeDetailModal">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div class="modal-body detail-body" v-if="selectedLog">
              <div class="detail-section">
                <h3>Informasi Umum</h3>
                <div class="detail-grid">
                  <div class="detail-item">
                    <span class="detail-label">ID:</span>
                    <span class="detail-value">{{ selectedLog.id }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Tanggal Dibuat:</span>
                    <span class="detail-value">{{ new Date(selectedLog.created_at).toLocaleString('id-ID') }}</span>
                  </div>
                </div>
              </div>

              <div class="detail-section">
                <h3>Worker & Posisi</h3>
                <div class="detail-grid">
                  <div class="detail-item">
                    <span class="detail-label">Worker:</span>
                    <span class="detail-value">{{ selectedLog.worker?.name || '-' }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Position:</span>
                    <span class="detail-value">{{ selectedLog.position?.code || '-' }} ({{ selectedLog.position?.unit || '-' }})</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Sub Position:</span>
                    <span class="detail-value">{{ selectedLog.sub_position?.code || '-' }}</span>
                  </div>
                </div>
              </div>

              <div class="detail-section">
                <h3>Produksi</h3>
                <div class="detail-grid">
                  <div class="detail-item">
                    <span class="detail-label">Item:</span>
                    <span class="detail-value">{{ selectedLog.item?.item_name || selectedLog.item?.item_number || '-' }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Item Number:</span>
                    <span class="detail-value">{{ selectedLog.item?.item_number || '-' }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Spec:</span>
                    <span class="detail-value">{{ selectedLog.item?.spec || '-' }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Qty Output:</span>
                    <span class="detail-value">{{ parseFloat(selectedLog.qty_output || 0).toLocaleString('id-ID') }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Qty Reject:</span>
                    <span class="detail-value reject-value">{{ parseFloat(selectedLog.qty_reject || 0).toLocaleString('id-ID') }}</span>
                  </div>
                </div>
              </div>

              <div class="detail-section">
                <h3>Shift & Supplier</h3>
                <div class="detail-grid">
                  <div class="detail-item">
                    <span class="detail-label">Shift:</span>
                    <span class="detail-value">{{ selectedLog.shift?.name || '-' }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Supplier:</span>
                    <span class="detail-value">{{ selectedLog.supplier?.name || '-' }}</span>
                  </div>
                </div>
              </div>

              <div class="detail-section" v-if="selectedLog.problem_duration_minutes || (selectedLog.problem_comments && selectedLog.problem_comments.length > 0)">
                <h3>Problem</h3>
                <div class="detail-grid">
                  <div class="detail-item" v-if="selectedLog.problem_duration_minutes">
                    <span class="detail-label">Durasi Problem (Menit):</span>
                    <span class="detail-value">{{ selectedLog.problem_duration_minutes }}</span>
                  </div>
                  <div class="detail-item full-width" v-if="selectedLog.problem_comments && selectedLog.problem_comments.length > 0">
                    <span class="detail-label">Problem Comments:</span>
                    <div class="problem-comments">
                      <span v-for="(comment, idx) in selectedLog.problem_comments" :key="idx" class="problem-comment-tag">
                        {{ comment.description }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="detail-section">
                <h3>Status Approval</h3>
                <div class="detail-grid">
                  <div class="detail-item">
                    <span class="detail-label">Status Coordinator:</span>
                    <span class="detail-value">
                      <span v-if="selectedLog.approved_coordinator" class="badge approved">Approved</span>
                      <span v-else class="badge pending">Pending</span>
                    </span>
                  </div>
                  <div class="detail-item" v-if="selectedLog.approved_coordinator && selectedLog.approved_coordinator_at">
                    <span class="detail-label">Approved Coordinator At:</span>
                    <span class="detail-value">{{ new Date(selectedLog.approved_coordinator_at).toLocaleString('id-ID') }}</span>
                  </div>
                  <div class="detail-item" v-if="selectedLog.approved_coordinator_by_worker">
                    <span class="detail-label">Approved Coordinator By:</span>
                    <span class="detail-value">{{ selectedLog.approved_coordinator_by_worker?.name || '-' }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Status Supervisor:</span>
                    <span class="detail-value">
                      <span v-if="selectedLog.approved_spv" class="badge approved">Approved</span>
                      <span v-else class="badge pending">Pending</span>
                    </span>
                  </div>
                  <div class="detail-item" v-if="selectedLog.approved_spv && selectedLog.approved_spv_at">
                    <span class="detail-label">Approved Supervisor At:</span>
                    <span class="detail-value">{{ new Date(selectedLog.approved_spv_at).toLocaleString('id-ID') }}</span>
                  </div>
                  <div class="detail-item" v-if="selectedLog.approved_spv_by_worker">
                    <span class="detail-label">Approved Supervisor By:</span>
                    <span class="detail-value">{{ selectedLog.approved_spv_by_worker?.name || '-' }}</span>
                  </div>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn-close-modal" @click="closeDetailModal">Tutup</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
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
  width: 100%;
}

.chart-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  width: 100%;
  box-sizing: border-box;
  overflow: hidden;
}

.chart-card.full-width {
  grid-column: 1 / -1;
}

.chart-card h3 {
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #333b5f;
  word-wrap: break-word;
}

.chart-container {
  height: 300px;
  position: relative;
  width: 100%;
  min-height: 250px;
  overflow: hidden;
  box-sizing: border-box;
}

.chart-container > canvas {
  max-width: 100% !important;
  height: auto !important;
}

.chart-container > div {
  width: 100% !important;
  height: 100% !important;
}

/* Responsive Design - Tablet */
@media (max-width: 1024px) {
  .dashboard-container {
    padding: 1.5rem;
  }

  .charts-grid {
    grid-template-columns: 1fr;
    gap: 1.25rem;
  }
  
  .chart-card.full-width {
    grid-column: 1;
  }

  .chart-card {
    padding: 1.25rem;
  }

  .chart-card h3 {
    font-size: 1.05rem;
  }

  .chart-container {
    height: 300px;
    min-height: 280px;
  }

  .stats-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
  }

  .filters-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .logs-table {
    font-size: 0.8rem;
  }

  .logs-table th,
  .logs-table td {
    padding: 0.75rem 0.5rem;
  }
}

/* Responsive Design - Mobile Large */
@media (max-width: 768px) {
  .dashboard-container {
    padding: 1rem;
  }

  .dashboard-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .dashboard-header h1 {
    font-size: 1.5rem;
  }

  .subtitle {
    font-size: 0.875rem;
  }

  .btn-back {
    width: 100%;
    justify-content: center;
    padding: 0.625rem 1.25rem;
    font-size: 0.875rem;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
  }

  .stat-card {
    padding: 1rem;
    flex-direction: row;
    gap: 0.75rem;
  }

  .stat-icon {
    width: 48px;
    height: 48px;
  }

  .stat-icon svg {
    width: 20px;
    height: 20px;
  }

  .stat-content h3 {
    font-size: 0.75rem;
  }

  .stat-value {
    font-size: 1.25rem;
  }

  .charts-grid {
    gap: 1rem;
  }

  .chart-card {
    padding: 1rem;
  }

  .chart-card h3 {
    font-size: 1rem;
    margin-bottom: 0.75rem;
  }

  .chart-container {
    height: 280px;
    min-height: 250px;
  }

  .filter-section {
    padding: 1rem;
  }

  .filter-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .filter-header h2 {
    font-size: 1.1rem;
  }

  .btn-clear-filters {
    width: 100%;
    justify-content: center;
    padding: 0.625rem;
    font-size: 0.875rem;
  }

  .filters-grid {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }

  .search-box {
    padding: 0.625rem 0.875rem;
  }

  .search-input {
    font-size: 0.875rem;
  }

  .table-section {
    padding: 1rem;
  }

  .table-header h2 {
    font-size: 1.1rem;
  }

  .logs-table {
    font-size: 0.75rem;
  }

  .logs-table th,
  .logs-table td {
    padding: 0.625rem 0.5rem;
  }

  .detail-grid {
    grid-template-columns: 1fr;
  }

  .modal-container {
    margin: 0.5rem;
    max-height: 95vh;
  }

  .modal-header {
    padding: 1rem;
  }

  .modal-header h2 {
    font-size: 1.25rem;
  }

  .modal-body {
    padding: 1rem;
  }

  .modal-footer {
    padding: 1rem;
  }
}

/* Responsive Design - Mobile Large (Tablet Portrait) */
@media (max-width: 768px) {
  .desktop-view {
    display: none;
  }

  .mobile-view {
    display: block;
  }

  .charts-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .chart-card {
    min-width: 0;
    width: 100%;
  }

  .chart-container {
    width: 100%;
  }
}

/* Responsive Design - Mobile Small */
@media (max-width: 480px) {
  .dashboard-container {
    padding: 0.75rem;
  }

  .dashboard-header h1 {
    font-size: 1.25rem;
  }

  .subtitle {
    font-size: 0.8125rem;
  }

  .stats-grid {
    grid-template-columns: 1fr;
    gap: 0.625rem;
  }

  .stat-card {
    padding: 0.875rem;
  }

  .stat-icon {
    width: 44px;
    height: 44px;
  }

  .stat-icon svg {
    width: 18px;
    height: 18px;
  }

  .stat-content h3 {
    font-size: 0.6875rem;
  }

  .stat-value {
    font-size: 1.125rem;
  }

  .chart-card {
    padding: 0.875rem;
  }

  .chart-card h3 {
    font-size: 0.9375rem;
  }

  .chart-container {
    height: 250px;
    min-height: 220px;
  }

  .filter-section {
    padding: 0.875rem;
  }

  .filter-header h2 {
    font-size: 1rem;
  }

  .search-box {
    padding: 0.5rem 0.75rem;
  }

  .search-input {
    font-size: 0.8125rem;
  }

  .search-input::placeholder {
    font-size: 0.75rem;
  }

  .filter-group label {
    font-size: 0.8125rem;
  }

  .filter-input {
    padding: 0.625rem;
    font-size: 0.8125rem;
  }

  .filter-info {
    font-size: 0.8125rem;
    padding-top: 0.75rem;
  }

  .table-section {
    padding: 0.875rem;
  }

  .table-header h2 {
    font-size: 1rem;
    margin-bottom: 0.75rem;
  }

  .log-card {
    padding: 0.875rem;
  }

  .log-card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .log-card-row {
    flex-direction: column;
    gap: 0.25rem;
  }

  .log-card-label {
    min-width: auto;
    font-size: 0.8125rem;
  }

  .log-card-value {
    text-align: left;
    font-size: 0.875rem;
  }

  .badge {
    padding: 0.1875rem 0.5rem;
    font-size: 0.625rem;
  }

  .btn-detail {
    padding: 0.5rem;
    font-size: 0.8125rem;
  }

  .modal-container {
    margin: 0.25rem;
    border-radius: 8px;
  }

  .modal-header {
    padding: 0.875rem;
  }

  .modal-header h2 {
    font-size: 1.125rem;
  }

  .modal-body {
    padding: 0.875rem;
  }

  .detail-body {
    max-height: 70vh;
  }

  .detail-section {
    margin-bottom: 1rem;
  }

  .detail-section h3 {
    font-size: 1rem;
    margin-bottom: 0.75rem;
  }

  .detail-label {
    font-size: 0.8125rem;
  }

  .detail-value {
    font-size: 0.9375rem;
  }

  .modal-footer {
    padding: 0.875rem;
  }

  .btn-close-modal {
    padding: 0.625rem 1.25rem;
    font-size: 0.875rem;
    width: 100%;
  }
}

/* Filter Section */
.filter-section {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.filter-header h2 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #333b5f;
}

.btn-clear-filters {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #f44336;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-clear-filters:hover {
  background: #d32f2f;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: #f8f9fa;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  transition: border-color 0.3s ease;
}

.search-box:focus-within {
  border-color: #333b5f;
}

.search-box svg {
  color: #666;
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 1rem;
  outline: none;
  color: #333;
}

.search-input::placeholder {
  color: #999;
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-group label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #666;
}

.filter-input {
  padding: 0.75rem;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  font-size: 0.875rem;
  background: white;
  color: #333;
  transition: border-color 0.3s ease;
}

.filter-input:focus {
  outline: none;
  border-color: #333b5f;
}

.filter-info {
  padding-top: 1rem;
  border-top: 1px solid #e0e0e0;
  color: #666;
  font-size: 0.875rem;
}

.filter-info strong {
  color: #333b5f;
}

/* Table Section */
.table-section {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

.table-header {
  margin-bottom: 1rem;
}

.table-header h2 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #333b5f;
}

.table-container {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.desktop-view {
  display: block;
}

.mobile-view {
  display: none;
}

/* Mobile Card View Styles */
.no-data-card {
  text-align: center;
  padding: 2rem;
  color: #999;
  background: #f8f9fa;
  border-radius: 8px;
}

.log-card {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
  border: 1px solid #e0e0e0;
}

.log-card:last-child {
  margin-bottom: 0;
}

.log-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid #e0e0e0;
}

.log-card-id {
  font-weight: 700;
  color: #333b5f;
  font-size: 0.9375rem;
}

.log-card-date {
  font-size: 0.8125rem;
  color: #666;
}

.log-card-body {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
  margin-bottom: 0.75rem;
}

.log-card-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.log-card-label {
  font-weight: 600;
  color: #666;
  flex-shrink: 0;
  min-width: 120px;
}

.log-card-value {
  color: #333;
  text-align: right;
  flex: 1;
  word-break: break-word;
}

.log-card-value.reject-value {
  color: #f44336;
  font-weight: 600;
}

.log-card-footer {
  padding-top: 0.75rem;
  border-top: 1px solid #e0e0e0;
  display: flex;
  justify-content: flex-end;
}

.log-card-footer .btn-detail {
  width: 100%;
}

.logs-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.logs-table thead {
  background: #f8f9fa;
}

.logs-table th {
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  color: #333b5f;
  border-bottom: 2px solid #e0e0e0;
  white-space: nowrap;
}

.logs-table td {
  padding: 1rem;
  border-bottom: 1px solid #e0e0e0;
  color: #666;
}

.logs-table tbody tr:hover {
  background: #f8f9fa;
}

.logs-table .no-data {
  text-align: center;
  padding: 2rem;
  color: #999;
}

.badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.badge.approved {
  background: #e8f5e9;
  color: #2e7d32;
}

.badge.pending {
  background: #fff3e0;
  color: #e65100;
}

.btn-detail {
  padding: 0.5rem 1rem;
  background: #2196F3;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.875rem;
}

.btn-detail:hover {
  background: #1976D2;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-container {
  background: white;
  border-radius: 12px;
  max-width: 800px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.detail-modal {
  max-width: 900px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e0e0e0;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #333b5f;
}

.modal-close {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  color: #666;
  transition: color 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-close:hover {
  color: #333;
}

.modal-body {
  padding: 1.5rem;
}

.detail-body {
  max-height: 60vh;
  overflow-y: auto;
}

.detail-section {
  margin-bottom: 1.5rem;
}

.detail-section:last-child {
  margin-bottom: 0;
}

.detail-section h3 {
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #333b5f;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #e0e0e0;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.detail-item.full-width {
  grid-column: 1 / -1;
}

.detail-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #666;
}

.detail-value {
  font-size: 1rem;
  color: #333;
  word-break: break-word;
}

.detail-value.reject-value {
  color: #f44336;
  font-weight: 600;
}

.problem-comments {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.problem-comment-tag {
  display: inline-block;
  padding: 0.5rem 1rem;
  background: #fff3e0;
  color: #e65100;
  border-radius: 6px;
  font-size: 0.875rem;
}

.modal-footer {
  padding: 1.5rem;
  border-top: 1px solid #e0e0e0;
  display: flex;
  justify-content: flex-end;
}

.btn-close-modal {
  padding: 0.75rem 1.5rem;
  background: #333b5f;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-close-modal:hover {
  background: #1e2740;
}

/* Modal Transition */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .modal-container,
.modal-leave-active .modal-container {
  transition: transform 0.3s ease;
}

.modal-enter-from .modal-container,
.modal-leave-to .modal-container {
  transform: scale(0.9);
}

/* Additional Mobile Optimizations */
@media (max-width: 640px) {
  .dashboard-content {
    gap: 1.5rem;
  }

  .filter-section,
  .table-section {
    margin-bottom: 1.5rem;
  }

  .charts-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .chart-card {
    padding: 1rem;
    min-width: 0;
  }

  .chart-container {
    height: 260px;
    min-height: 240px;
  }

  .log-card {
    padding: 1rem;
  }

  .log-card-header {
    flex-direction: column;
    align-items: flex-start;
  }
}

/* Landscape Mobile */
@media (max-width: 768px) and (orientation: landscape) {
  .chart-container {
    height: 200px;
  }

  .detail-body {
    max-height: 50vh;
  }
}

/* Touch Device Optimizations */
@media (hover: none) and (pointer: coarse) {
  .btn-back,
  .btn-clear-filters,
  .btn-detail,
  .btn-close-modal {
    min-height: 44px;
    min-width: 44px;
  }

  .filter-input,
  .search-input {
    min-height: 44px;
  }

  .stat-card:hover {
    transform: none;
  }

  .modal-close {
    min-height: 44px;
    min-width: 44px;
  }
}

/* Print Styles */
@media print {
  .dashboard-header,
  .filter-section,
  .btn-back,
  .btn-detail,
  .btn-clear-filters {
    display: none;
  }

  .dashboard-container {
    padding: 0;
    background: white;
  }

  .stats-grid,
  .charts-grid,
  .table-section {
    page-break-inside: avoid;
  }
}
</style>

