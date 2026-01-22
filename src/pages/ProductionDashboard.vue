<script setup>
import { ref, onMounted, computed, onUnmounted } from 'vue'
import { Teleport, Transition } from 'vue'
import { useRouter } from 'vue-router'
import { productionLogsApi } from '../api/productionLogs'
import { workersApi } from '../api/workers'
import api from '../api/http'
import { Bar, Line, Scatter } from 'vue-chartjs'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
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
const productionTargets = ref([])

// Filter states
const filterWorkerId = ref('')
const filterShiftId = ref('')
const filterDateFrom = ref('')
const filterDateTo = ref('')
const filterItemId = ref('')
const dateFilterMode = ref('today')
const singleDate = ref('')
const searchQuery = ref('')
const workerSearchInput = ref('')
const itemSearchInput = ref('')

// Master data
const workers = ref([])
const shifts = ref([])
const positions = ref([])
const suppliers = ref([])
const items = ref([])
const departments = ref([])

const getTodayDateString = () => {
  const d = new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const selectedDaysCount = computed(() => {
  if (dateFilterMode.value === 'today') {
    return 1
  }
  if (dateFilterMode.value === 'single') {
    return singleDate.value ? 1 : 0
  }
  if (dateFilterMode.value === 'range') {
    if (!filterDateFrom.value || !filterDateTo.value) {
      return 0
    }
    const from = new Date(filterDateFrom.value)
    const to = new Date(filterDateTo.value)
    from.setHours(0, 0, 0, 0)
    to.setHours(0, 0, 0, 0)
    const diff = to.getTime() - from.getTime()
    if (diff < 0) {
      return 0
    }
    return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1
  }
  return 0
})

const fetchData = async () => {
  isLoading.value = true
  error.value = null
  try {
    const [
      logsRes,
      workersRes,
      shiftsRes,
      positionsRes,
      suppliersRes,
      itemsRes,
      targetsRes,
      departmentsRes
    ] = await Promise.all([
      productionLogsApi.getAll(),
      workersApi.getAll(),
      api.get('/shifts'),
      api.get('/positions'),
      api.get('/suppliers'),
      api.get('/items'),
      api.get('/production-targets'),
      api.get('/departments')
    ])
    logs.value = logsRes.data
    workers.value = workersRes.data
    shifts.value = shiftsRes.data
    positions.value = positionsRes.data
    suppliers.value = suppliersRes.data
    items.value = itemsRes.data
    productionTargets.value = Array.isArray(targetsRes.data) ? targetsRes.data : targetsRes.data?.data || []
    departments.value = Array.isArray(departmentsRes.data) ? departmentsRes.data : departmentsRes.data?.data || []
  } catch (err) {
    error.value = err.response?.data?.detail || 'Gagal memuat data'
    console.error('Error fetching data:', err)
  } finally {
    isLoading.value = false
  }
}

// Filtered and searched logs
const filteredAndSearchedLogs = computed(() => {
  let filtered = logs.value

  if (dateFilterMode.value === 'today') {
    const todayStr = getTodayDateString()
    filtered = filtered.filter(log => {
      const logDateStr = new Date(log.created_at).toISOString().split('T')[0]
      return logDateStr === todayStr
    })
  } else if (dateFilterMode.value === 'single' && singleDate.value) {
    const targetDate = new Date(singleDate.value)
    targetDate.setHours(0, 0, 0, 0)
    filtered = filtered.filter(log => {
      const logDate = new Date(log.created_at)
      logDate.setHours(0, 0, 0, 0)
      return logDate.getTime() === targetDate.getTime()
    })
  } else {
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
  }

  // Apply filters
  if (filterWorkerId.value) {
    filtered = filtered.filter(log => log.worker_id === Number(filterWorkerId.value))
  }

  if (filterShiftId.value) {
    filtered = filtered.filter(log => log.shift_id === Number(filterShiftId.value))
  }

  if (filterItemId.value) {
    filtered = filtered.filter(log => log.item_id === Number(filterItemId.value))
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
  const today = getTodayDateString()
  filterDateFrom.value = today
  filterDateTo.value = today
  filterItemId.value = ''
  searchQuery.value = ''
  workerSearchInput.value = ''
  itemSearchInput.value = ''
  dateFilterMode.value = 'today'
  singleDate.value = today
}

const syncWorkerFilterBySearch = () => {
  const raw = (workerSearchInput.value || '').trim()
  if (!raw) {
    filterWorkerId.value = ''
    return
  }

  const idMatch = raw.match(/\b\d+\b/)
  const idFromText = idMatch ? Number(idMatch[0]) : null

  const exactWorker = workers.value.find(w => {
    const name = (w.name || '').toString().trim().toLowerCase()
    const id = Number(w.id)
    return raw.toLowerCase() === name || raw === String(id) || (idFromText != null && idFromText === id)
  })

  filterWorkerId.value = exactWorker ? String(exactWorker.id) : ''
}

const syncItemFilterBySearch = () => {
  const raw = (itemSearchInput.value || '').trim()
  if (!raw) {
    filterItemId.value = ''
    return
  }

  const rawLower = raw.toLowerCase()
  const idMatch = raw.match(/\b\d+\b/)
  const idFromText = idMatch ? Number(idMatch[0]) : null

  const exactItem = items.value.find(it => {
    const id = Number(it.id)
    const number = (it.item_number || '').toString().trim().toLowerCase()
    const name = (it.item_name || '').toString().trim().toLowerCase()
    return raw === String(id) ||
      rawLower === number ||
      rawLower === name ||
      (idFromText != null && idFromText === id) ||
      (rawLower.includes('-') && rawLower.split('-')[0].trim() === number)
  })

  filterItemId.value = exactItem ? String(exactItem.id) : ''
}

// Chart Data - Production per Worker (Top 10, using filtered data)
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
    .sort((a, b) => b[1].output - a[1].output)
    .slice(0, 10)
  
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

// Chart Data - Production per Worker (Bottom 10, using filtered data)
const productionPerWorkerBottom = computed(() => {
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
    .sort((a, b) => a[1].output - b[1].output)
    .slice(0, 10)

  return {
    labels: sorted.map(([name]) => name),
    datasets: [
      {
        label: 'Output',
        backgroundColor: '#90CAF9',
        data: sorted.map(([, data]) => data.output)
      },
      {
        label: 'Reject',
        backgroundColor: '#FFCDD2',
        data: sorted.map(([, data]) => data.reject)
      }
    ]
  }
})

// Scatter Data - Productivity vs Reject per Worker
const workerScatterData = computed(() => {
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

  const points = Array.from(workerMap.entries()).map(([name, data]) => ({
    x: data.output,
    y: data.reject,
    worker: name
  }))

  return {
    datasets: [
      {
        label: 'Worker',
        data: points,
        backgroundColor: points.map(point => {
          if (point.x === 0 && point.y === 0) {
            return '#B0BEC5'
          }
          if (point.y / (point.x || 1) > 0.1) {
            return '#FF5722'
          }
          return '#2196F3'
        }),
        pointRadius: 5
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
    .slice(0, 10)
  
  return {
    labels: sorted.map(([name]) => name.length > 20 ? name.substring(0, 20) + '...' : name),
    datasets: [
      {
        label: 'Output',
        backgroundColor: '#2196F3',
        data: sorted.map(([, data]) => data.output)
      },
      {
        label: 'Reject',
        backgroundColor: '#E91E63',
        data: sorted.map(([, data]) => data.reject)
      }
    ]
  }
})

// Chart Data - Item vs Reject Rate (heatmap-style)
const itemRejectRateChart = computed(() => {
  const itemMap = new Map()

  filteredAndSearchedLogs.value.forEach(log => {
    const key = log.item?.item_number || log.item?.item_name || 'Unknown'
    if (!itemMap.has(key)) {
      itemMap.set(key, { output: 0, reject: 0 })
    }
    const data = itemMap.get(key)
    data.output += parseFloat(log.qty_output) || 0
    data.reject += parseFloat(log.qty_reject) || 0
  })

  const aggregated = Array.from(itemMap.entries()).map(([key, data]) => {
    const rate = data.output > 0 ? (data.reject / data.output) * 100 : 0
    return { key, rate }
  })

  const sorted = aggregated
    .sort((a, b) => b.rate - a.rate)
    .slice(0, 15)

  const colors = sorted.map(row => {
    if (row.rate >= 10) return '#B71C1C'
    if (row.rate >= 5) return '#F57C00'
    if (row.rate > 0) return '#FBC02D'
    return '#4CAF50'
  })

  return {
    labels: sorted.map(row => row.key.length > 20 ? row.key.substring(0, 20) + '...' : row.key),
    datasets: [
      {
        label: 'Reject Rate (%)',
        backgroundColor: colors,
        data: sorted.map(row => Number(row.rate.toFixed(2)))
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

// productionVsTarget no longer used (digantikan ringkasan lain)

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

const departmentSummary = computed(() => {
  if (!departments.value || departments.value.length === 0) {
    return {
      chartData: {
        labels: [],
        datasets: []
      },
      topDepartments: []
    }
  }

  const departmentMap = new Map()

  departments.value.forEach(dept => {
    departmentMap.set(dept.id, {
      id: dept.id,
      name: dept.name,
      output: 0,
      reject: 0
    })
  })

  filteredAndSearchedLogs.value.forEach(log => {
    const departmentId = log.worker?.department_id
    const dept = departmentMap.get(departmentId)
    if (!dept) {
      return
    }
    dept.output += parseFloat(log.qty_output) || 0
    dept.reject += parseFloat(log.qty_reject) || 0
  })

  const aggregated = Array.from(departmentMap.values()).filter(dept => dept.output > 0 || dept.reject > 0)

  const sorted = aggregated.sort((a, b) => b.output - a.output)

  const top = sorted.slice(0, 5)

  const chartData = {
    labels: top.map(d => d.name),
    datasets: [
      {
        label: 'Output',
        backgroundColor: '#4CAF50',
        data: top.map(d => d.output)
      },
      {
        label: 'Reject',
        backgroundColor: '#f44336',
        data: top.map(d => d.reject)
      }
    ]
  }

  return {
    chartData,
    topDepartments: top
  }
})

const problemSummary = computed(() => {
  const problemMap = new Map()
  let totalDurationMinutes = 0
  let logsWithProblem = 0

  filteredAndSearchedLogs.value.forEach(log => {
    const duration = Number(log.problem_duration_minutes) || 0
    const comments = Array.isArray(log.problem_comments) ? log.problem_comments : []

    if (duration > 0 || comments.length > 0) {
      logsWithProblem += 1
    }

    if (duration > 0) {
      totalDurationMinutes += duration
    }

    comments.forEach(comment => {
      const key = comment.description || 'Lain-lain'
      if (!problemMap.has(key)) {
        problemMap.set(key, { count: 0, totalDuration: 0 })
      }
      const entry = problemMap.get(key)
      entry.count += 1
      entry.totalDuration += duration
    })
  })

  const sorted = Array.from(problemMap.entries())
    .sort((a, b) => b[1].totalDuration - a[1].totalDuration)
    .slice(0, 7)

  const topReasonEntry = sorted[0]
  const topReason = topReasonEntry
    ? {
        description: topReasonEntry[0],
        totalDuration: topReasonEntry[1].totalDuration,
        count: topReasonEntry[1].count
      }
    : null

  const chartData = {
    labels: sorted.map(([description]) =>
      description.length > 30 ? `${description.slice(0, 27)}...` : description
    ),
    datasets: [
      {
        label: 'Total Durasi Problem (menit)',
        backgroundColor: '#E91E63',
        data: sorted.map(([, data]) => data.totalDuration)
      }
    ]
  }

  return {
    chartData,
    totalDurationMinutes,
    logsWithProblem,
    topReason
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

const executiveKpi = computed(() => {
  const totalOutputRaw = filteredAndSearchedLogs.value.reduce((sum, log) => sum + (parseFloat(log.qty_output) || 0), 0)
  const totalRejectRaw = filteredAndSearchedLogs.value.reduce((sum, log) => sum + (parseFloat(log.qty_reject) || 0), 0)

  const rejectRateRaw = totalOutputRaw > 0 ? (totalRejectRaw / totalOutputRaw) * 100 : 0
  const rejectRate = Number(rejectRateRaw.toFixed(2))

  return {
    totalOutput: totalOutputRaw,
    totalReject: totalRejectRaw,
    rejectRate
  }
})

const executiveHealth = computed(() => {
  const kpi = executiveKpi.value
  const rejectRate = kpi.rejectRate

  if (rejectRate <= 3) {
    return { label: 'Produksi Sehat', statusClass: 'health-excellent', color: '#4CAF50' }
  } else if (rejectRate <= 5) {
    return { label: 'Cukup Baik', statusClass: 'health-good', color: '#8BC34A' }
  } else {
    return { label: 'Perlu Perhatian', statusClass: 'health-critical', color: '#f44336' }
  }
})

const positionSubPositionSummary = computed(() => {
  const positionMap = new Map()

  productionTargets.value.forEach(target => {
    const positionCode = target.position?.code || ''
    const subPositionCode = target.sub_position?.code || ''
    const labelParts = []
    if (positionCode) labelParts.push(positionCode)
    if (subPositionCode) labelParts.push(subPositionCode)
    const label = labelParts.join(' - ') || `Posisi ${target.position_id}`
    const key = `${target.position_id}-${target.sub_position_id || ''}`

    positionMap.set(key, {
      label,
      target: Number(target.target) || 0,
      output: 0,
      reject: 0
    })
  })

  filteredAndSearchedLogs.value.forEach(log => {
    const key = `${log.position_id}-${log.sub_position_id || ''}`
    if (positionMap.has(key)) {
      const data = positionMap.get(key)
      data.output += parseFloat(log.qty_output) || 0
      data.reject += parseFloat(log.qty_reject) || 0
    } else {
      const positionCode = log.position?.code || ''
      const subPositionCode = log.sub_position?.code || ''
      const labelParts = []
      if (positionCode) labelParts.push(positionCode)
      if (subPositionCode) labelParts.push(subPositionCode)
      const label = labelParts.join(' - ') || `Posisi ${log.position_id}`

      positionMap.set(key, {
        label,
        target: 0,
        output: parseFloat(log.qty_output) || 0,
        reject: parseFloat(log.qty_reject) || 0
      })
    }
  })

  const result = Array.from(positionMap.values())
  return result.sort((a, b) => a.label.localeCompare(b.label))
})

const outputVsTargetPerPosition = computed(() => {
  if (!positions.value || positions.value.length === 0) {
    return {
      labels: [],
      datasets: []
    }
  }

  const positionMap = new Map()

  positions.value.forEach(pos => {
    positionMap.set(pos.id, {
      code: pos.code || `Posisi ${pos.id}`,
      target: 0,
      output: 0
    })
  })

  const daysCountRaw = selectedDaysCount.value
  const daysCount = daysCountRaw > 0 ? daysCountRaw : 1

  productionTargets.value.forEach(target => {
    const entry = positionMap.get(target.position_id)
    if (entry) {
      entry.target += (Number(target.target) || 0)
    }
  })

  filteredAndSearchedLogs.value.forEach(log => {
    const entry = positionMap.get(log.position_id)
    if (entry) {
      entry.output += parseFloat(log.qty_output) || 0
    }
  })

  const aggregated = Array.from(positionMap.values()).filter(
    row => row.target > 0 || row.output > 0
  )

  const sorted = aggregated
    .sort((a, b) => b.output - a.output)
    .slice(0, 10)

  return {
    labels: sorted.map(row => row.code),
    datasets: [
      {
        label: 'Target',
        backgroundColor: '#B0BEC5',
        data: sorted.map(row => row.target)
      },
      {
        label: 'Output',
        backgroundColor: '#2196F3',
        data: sorted.map(row => row.output)
      }
    ]
  }
})

const outputPerSubPosition = computed(() => {
  const subMap = new Map()

  filteredAndSearchedLogs.value.forEach(log => {
    const code = log.sub_position?.code || 'Tanpa Sub Position'
    if (!subMap.has(code)) {
      subMap.set(code, { output: 0, reject: 0 })
    }
    const data = subMap.get(code)
    data.output += parseFloat(log.qty_output) || 0
    data.reject += parseFloat(log.qty_reject) || 0
  })

  const sorted = Array.from(subMap.entries())
    .sort((a, b) => b[1].output - a[1].output)
    .slice(0, 10)

  return {
    labels: sorted.map(([code]) => code),
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

const rejectRatePerPosition = computed(() => {
  const posMap = new Map()

  filteredAndSearchedLogs.value.forEach(log => {
    const code = log.position?.code || `Posisi ${log.position_id}`
    if (!posMap.has(code)) {
      posMap.set(code, { output: 0, reject: 0 })
    }
    const data = posMap.get(code)
    data.output += parseFloat(log.qty_output) || 0
    data.reject += parseFloat(log.qty_reject) || 0
  })

  const aggregated = Array.from(posMap.entries()).map(([code, data]) => {
    const rate = data.output > 0 ? (data.reject / data.output) * 100 : 0
    return { code, rate }
  })

  const sorted = aggregated
    .sort((a, b) => b.rate - a.rate)
    .slice(0, 10)

  return {
    labels: sorted.map(row => row.code),
    datasets: [
      {
        label: 'Reject Rate (%)',
        backgroundColor: '#E91E63',
        data: sorted.map(row => Number(row.rate.toFixed(2)))
      }
    ]
  }
})

const rejectPerSubPosition = computed(() => {
  const subMap = new Map()

  filteredAndSearchedLogs.value.forEach(log => {
    const code = log.sub_position?.code || 'Tanpa Sub Position'
    if (!subMap.has(code)) {
      subMap.set(code, 0)
    }
    const current = subMap.get(code) || 0
    subMap.set(code, current + (parseFloat(log.qty_reject) || 0))
  })

  const sorted = Array.from(subMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)

  return {
    labels: sorted.map(([code]) => code),
    datasets: [
      {
        label: 'Reject',
        backgroundColor: '#E91E63',
        data: sorted.map(([, value]) => value)
      }
    ]
  }
})

const supplierPerformance = computed(() => {
  const supplierMap = new Map()

  filteredAndSearchedLogs.value.forEach(log => {
    const name = log.supplier?.name || 'Unknown'
    if (!supplierMap.has(name)) {
      supplierMap.set(name, { output: 0, reject: 0 })
    }
    const data = supplierMap.get(name)
    data.output += parseFloat(log.qty_output) || 0
    data.reject += parseFloat(log.qty_reject) || 0
  })

  const aggregated = Array.from(supplierMap.entries()).map(([name, data]) => {
    const rate = data.output > 0 ? (data.reject / data.output) * 100 : 0
    return {
      name,
      output: data.output,
      reject: data.reject,
      rejectRate: Number(rate.toFixed(2))
    }
  })

  const sortedByOutput = aggregated.sort((a, b) => b.output - a.output)
  const top = sortedByOutput.slice(0, 10)
  const labels = top.map(row => row.name)

  const outputVsRejectData = {
    labels,
    datasets: [
      {
        label: 'Output',
        backgroundColor: '#4CAF50',
        data: top.map(row => row.output)
      },
      {
        label: 'Reject',
        backgroundColor: '#f44336',
        data: top.map(row => row.reject)
      }
    ]
  }

  const rejectRateData = {
    labels,
    datasets: [
      {
        label: 'Reject Rate (%)',
        backgroundColor: '#FF9800',
        data: top.map(row => row.rejectRate)
      }
    ]
  }

  return {
    outputVsRejectData,
    rejectRateData
  }
})

const recentItemProduction = computed(() => {
  const recentLogs = [...filteredAndSearchedLogs.value]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 10)

  const labels = recentLogs.map(log => {
    const itemName = log.item?.item_name || log.item?.item_number || 'Unknown'
    const date = new Date(log.created_at).toLocaleDateString('id-ID')
    return `${itemName} (${date})`
  })

  const data = recentLogs.map(log => parseFloat(log.qty_output) || 0)

  return {
    labels,
    datasets: [
      {
        label: 'Qty Output',
        backgroundColor: '#42A5F5',
        data
      }
    ]
  }
})

const problemPareto = computed(() => {
  const categoryMap = new Map()
  let totalDuration = 0

  const classify = (description) => {
    const text = (description || '').toLowerCase()
    if (!text) return 'Lain-lain'
    if (text.includes('kawat')) return 'Kawat Nyangkut'
    if (text.includes('setting')) return 'Setting Mesin'
    if (text.includes('rusak') || text.includes('trouble') || text.includes('repair')) return 'Mesin Rusak'
    if (text.includes('operator') || text.includes('human') || text.includes('salah')) return 'Kesalahan Operator'
    return 'Lain-lain'
  }

  filteredAndSearchedLogs.value.forEach(log => {
    const duration = Number(log.problem_duration_minutes) || 0
    const comments = Array.isArray(log.problem_comments) ? log.problem_comments : []

    if (duration <= 0 || comments.length === 0) {
      return
    }

    comments.forEach(comment => {
      const category = classify(comment.description)
      if (!categoryMap.has(category)) {
        categoryMap.set(category, { duration: 0 })
      }
      const entry = categoryMap.get(category)
      entry.duration += duration
      totalDuration += duration
    })
  })

  const entries = Array.from(categoryMap.entries()).sort(
    (a, b) => b[1].duration - a[1].duration
  )

  const labels = []
  const barData = []
  const lineData = []
  let cumulative = 0

  entries.forEach(([category, data]) => {
    labels.push(category)
    barData.push(data.duration)
    if (totalDuration > 0) {
      cumulative += (data.duration / totalDuration) * 100
    } else {
      cumulative = 0
    }
    lineData.push(Number(cumulative.toFixed(1)))
  })

  return {
    labels,
    datasets: [
      {
        type: 'bar',
        label: 'Durasi Problem (menit)',
        backgroundColor: '#E91E63',
        data: barData,
        yAxisID: 'y'
      },
      {
        type: 'line',
        label: 'Kumulatif (%)',
        borderColor: '#333b5f',
        backgroundColor: 'rgba(51, 59, 95, 0.1)',
        data: lineData,
        yAxisID: 'y1',
        tension: 0.3,
        fill: false
      }
    ]
  }
})

const executiveSummary = computed(() => {
  const kpi = executiveKpi.value
  const totalOutput = kpi.totalOutput
  const rejectRate = kpi.rejectRate
  const days = selectedDaysCount.value

  if (!totalOutput) {
    return {
      main: 'Belum ada data produksi pada periode dan filter yang dipilih.',
      trend: ''
    }
  }

  let main
  if (rejectRate <= 3) {
    main = `Produksi sangat sehat dengan reject rate rendah ${rejectRate.toFixed(2)}%.`
  } else if (rejectRate <= 5) {
    main = `Produksi cukup sehat, reject rate ${rejectRate.toFixed(2)}% masih dalam batas toleransi.`
  } else {
    main = `Produksi perlu perhatian: reject rate ${rejectRate.toFixed(2)}% tergolong tinggi.`
  }

  let trend = ''
  if (days > 1) {
    const avgOutputPerDay = totalOutput / days
    trend = `Rata-rata output per hari: ${avgOutputPerDay.toLocaleString('id-ID', { maximumFractionDigits: 0 })} unit selama ${days} hari.`
  }

  return {
    main,
    trend
  }
})

const operationalSummary = computed(() => {
  const chart = outputVsTargetPerPosition.value
  const labels = chart.labels || []
  const datasets = chart.datasets || []

  if (!labels.length || datasets.length < 2) {
    return 'Belum ada data posisi yang bisa dianalisis untuk periode ini.'
  }

  const targetData = datasets[0].data || []
  const outputData = datasets[1].data || []

  let belowTarget = 0
  let aboveTarget = 0
  let maxGapIndex = -1
  let maxGapValue = 0

  labels.forEach((label, index) => {
    const target = Number(targetData[index] || 0)
    const output = Number(outputData[index] || 0)
    if (!target && !output) {
      return
    }
    if (target > 0 && output < target) {
      belowTarget++
      const gap = target - output
      if (gap > maxGapValue) {
        maxGapValue = gap
        maxGapIndex = index
      }
    } else if (target > 0 && output >= target) {
      aboveTarget++
    }
  })

  if (!belowTarget && !aboveTarget) {
    return 'Target per position belum terset dengan jelas, hanya menampilkan output aktual.'
  }

  if (!belowTarget) {
    return 'Seluruh position yang memiliki target sudah mencapai atau melampaui target pada periode ini.'
  }

  const worstLabel = maxGapIndex >= 0 ? labels[maxGapIndex] : ''
  if (!aboveTarget) {
    return `Semua position dengan target masih di bawah target. Position dengan gap terbesar adalah ${worstLabel}.`
  }

  return `${aboveTarget} position sudah mencapai target, ${belowTarget} masih di bawah target. Position dengan gap terbesar adalah ${worstLabel}.`
})

const workforceSummary = computed(() => {
  const workerChart = productionPerWorker.value
  const labels = workerChart.labels || []
  const datasets = workerChart.datasets || []
  if (!labels.length || datasets.length < 1) {
    return 'Belum ada data produksi worker pada periode ini.'
  }

  const outputData = datasets[0].data || []
  let maxIndex = 0
  let maxOutput = 0
  labels.forEach((label, index) => {
    const value = Number(outputData[index] || 0)
    if (value > maxOutput) {
      maxOutput = value
      maxIndex = index
    }
  })

  const scatter = workerScatterData.value
  const points = scatter.datasets?.[0]?.data || []
  let riskyCount = 0
  points.forEach(point => {
    const output = Number(point.x || 0)
    const reject = Number(point.y || 0)
    if (output > 0) {
      const rate = reject / output
      if (output > maxOutput * 0.5 && rate > 0.08) {
        riskyCount++
      }
    }
  })

  const bestWorker = labels[maxIndex]

  if (!riskyCount) {
    return `Worker dengan output tertinggi adalah ${bestWorker} dengan total output ${maxOutput.toLocaleString('id-ID')}. Tidak ada pola worker ber-output tinggi dengan reject tinggi yang mencolok.`
  }

  return `Worker dengan output tertinggi adalah ${bestWorker} dengan total output ${maxOutput.toLocaleString('id-ID')}. Terdapat ${riskyCount} worker ber-output tinggi dengan reject relatif tinggi yang perlu dicek lebih detail.`
})

const qualitySummary = computed(() => {
  const rejectChart = rejectRatePerPosition.value
  const labels = rejectChart.labels || []
  const data = rejectChart.datasets?.[0]?.data || []

  let worstLabel = ''
  let worstRate = 0
  labels.forEach((label, index) => {
    const value = Number(data[index] || 0)
    if (value > worstRate) {
      worstRate = value
      worstLabel = label
    }
  })

  const pareto = problemPareto.value
  const paretoLabels = pareto.labels || []
  const paretoData = pareto.datasets?.[0]?.data || []
  let mainCategory = ''
  let mainDuration = 0
  if (paretoLabels.length && paretoData.length) {
    mainCategory = paretoLabels[0]
    mainDuration = Number(paretoData[0] || 0)
  }

  if (!worstLabel && !mainCategory) {
    return 'Belum ada data reject dan problem yang cukup untuk dianalisis di periode ini.'
  }

  if (worstLabel && !mainCategory) {
    return `Reject tertinggi ada di position ${worstLabel} dengan rate sekitar ${worstRate.toFixed(2)}%.`
  }

  if (!worstLabel && mainCategory) {
    return `Problem utama produksi didominasi oleh kategori ${mainCategory} dengan total durasi sekitar ${mainDuration.toLocaleString('id-ID')} menit.`
  }

  return `Reject tertinggi ada di position ${worstLabel} dengan rate sekitar ${worstRate.toFixed(2)}%. Problem terbesar berasal dari kategori ${mainCategory} dengan durasi sekitar ${mainDuration.toLocaleString('id-ID')} menit.`
})

const materialSummary = computed(() => {
  const supplierRate = supplierPerformance.value.rejectRateData
  const supplierLabels = supplierRate.labels || []
  const supplierData = supplierRate.datasets?.[0]?.data || []

  let worstSupplier = ''
  let worstSupplierRate = 0
  supplierLabels.forEach((label, index) => {
    const value = Number(supplierData[index] || 0)
    if (value > worstSupplierRate) {
      worstSupplierRate = value
      worstSupplier = label
    }
  })

  const itemChart = itemRejectRateChart.value
  const itemLabels = itemChart.labels || []
  const itemData = itemChart.datasets?.[0]?.data || []
  let worstItem = ''
  let worstItemRate = 0
  itemLabels.forEach((label, index) => {
    const value = Number(itemData[index] || 0)
    if (value > worstItemRate) {
      worstItemRate = value
      worstItem = label
    }
  })

  if (!worstSupplier && !worstItem) {
    return 'Belum ada pola reject yang kuat terkait supplier maupun item pada periode ini.'
  }

  if (worstSupplier && !worstItem) {
    return `Supplier dengan reject rate tertinggi adalah ${worstSupplier} dengan rate sekitar ${worstSupplierRate.toFixed(2)}%.`
  }

  if (!worstSupplier && worstItem) {
    return `Item dengan reject rate tertinggi adalah ${worstItem} dengan rate sekitar ${worstItemRate.toFixed(2)}%.`
  }

  return `Supplier dengan reject rate tertinggi adalah ${worstSupplier} (${worstSupplierRate.toFixed(2)}%). Pada level item, ${worstItem} memiliki reject rate tertinggi sekitar ${worstItemRate.toFixed(2)}%.`
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

const horizontalChartOptions = computed(() => {
  return {
    ...chartOptions.value,
    indexAxis: 'y'
  }
})

const paretoChartOptions = computed(() => {
  const base = chartOptions.value
  return {
    ...base,
    scales: {
      ...base.scales,
      y1: {
        type: 'linear',
        position: 'right',
        grid: {
          drawOnChartArea: false
        },
        ticks: {
          ...base.scales.y.ticks,
          callback: value => `${value}%`
        }
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
  const today = getTodayDateString()
  filterDateFrom.value = today
  filterDateTo.value = today
  dateFilterMode.value = 'today'
  singleDate.value = today
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
            <input
              v-model="workerSearchInput"
              list="dashboard-workers-list"
              class="filter-input"
              placeholder="Ketik nama atau ID worker"
              @change="syncWorkerFilterBySearch"
              @blur="syncWorkerFilterBySearch"
            />
            <datalist id="dashboard-workers-list">
              <option v-for="worker in workers" :key="worker.id" :value="worker.name">
                {{ worker.name }} (ID: {{ worker.id }})
              </option>
            </datalist>
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
            <label>Item</label>
            <input
              v-model="itemSearchInput"
              list="dashboard-items-list"
              class="filter-input"
              placeholder="Ketik item number, nama, atau ID"
              @change="syncItemFilterBySearch"
              @blur="syncItemFilterBySearch"
            />
            <datalist id="dashboard-items-list">
              <option v-for="item in items" :key="item.id" :value="item.item_number || item.item_name || String(item.id)">
                {{ item.item_number }} - {{ item.item_name }} (ID: {{ item.id }})
              </option>
            </datalist>
          </div>

          <div class="filter-group">
            <label>Mode Filter Tanggal</label>
            <select v-model="dateFilterMode" class="filter-input">
              <option value="today">Hari ini</option>
              <option value="single">Satu Tanggal</option>
              <option value="range">Rentang Tanggal</option>
            </select>
          </div>

          <div class="filter-group" v-if="dateFilterMode === 'today'">
            <label>Tanggal</label>
            <input type="date" v-model="filterDateFrom" class="filter-input" disabled />
          </div>

          <div class="filter-group" v-if="dateFilterMode === 'single'">
            <label>Tanggal</label>
            <input type="date" v-model="singleDate" class="filter-input" />
          </div>

          <div class="filter-group" v-if="dateFilterMode === 'range'">
            <label>Tanggal Dari</label>
            <input type="date" v-model="filterDateFrom" class="filter-input" />
          </div>

          <div class="filter-group" v-if="dateFilterMode === 'range'">
            <label>Tanggal Sampai</label>
            <input type="date" v-model="filterDateTo" class="filter-input" />
          </div>
        </div>

        <div class="filter-info">
          <p>Menampilkan <strong>{{ filteredAndSearchedLogs.length }}</strong> dari <strong>{{ logs.length }}</strong> production log</p>
        </div>
      </div>

      <div class="dashboard-section level-1-section">
        <div class="level-1-header">
          <div class="header-left">
            <h2>Level 1 — Executive View</h2>
            <p>Snapshot kesehatan produksi & KPI utama.</p>
          </div>
          <div class="header-right">
             <div class="health-badge" :class="executiveHealth.statusClass">
              {{ executiveHealth.label }}
            </div>
          </div>
        </div>

        <div class="kpi-grid">
          <!-- KPI 1: Total Output -->
          <div class="kpi-card main-kpi">
            <div class="kpi-top">
              <div class="kpi-icon-wrapper blue">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
              </div>
              <div class="kpi-info">
                 <span class="kpi-label">Total Output</span>
                 <span class="kpi-value text-dark">{{ executiveKpi.totalOutput.toLocaleString('id-ID') }}</span>
              </div>
            </div>
            <div class="kpi-bottom">
              <p class="kpi-sub">Unit Produced</p>
            </div>
          </div>

          <!-- KPI 2: Reject Rate -->
          <div class="kpi-card main-kpi">
             <div class="kpi-top">
              <div class="kpi-icon-wrapper red">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
              </div>
              <div class="kpi-info">
                <span class="kpi-label">Reject Rate</span>
                <span class="kpi-value text-danger">{{ executiveKpi.rejectRate.toFixed(2) }}%</span>
              </div>
            </div>
             <div class="kpi-bottom">
              <p class="kpi-sub">Total Reject: {{ executiveKpi.totalReject.toLocaleString('id-ID') }}</p>
            </div>
          </div>

          <!-- KPI 3: Quick Stats -->
          <div class="kpi-card quick-stats-card">
            <h3 class="card-title">Ringkasan Data</h3>
            <div class="quick-stats-grid">
              <div class="qs-item">
                <span class="qs-value">{{ statistics.totalLogs }}</span>
                <span class="qs-label">Logs</span>
              </div>
              <div class="qs-divider"></div>
              <div class="qs-item">
                <span class="qs-value">{{ statistics.uniqueWorkers }}</span>
                <span class="qs-label">Workers</span>
              </div>
              <div class="qs-divider"></div>
              <div class="qs-item">
                <span class="qs-value">{{ statistics.uniqueItems }}</span>
                <span class="qs-label">Items</span>
              </div>
            </div>
          </div>
        </div>

        <div class="executive-summary-box">
          <div class="summary-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
          </div>
          <div class="summary-content">
            <p class="main-summary">{{ executiveSummary.main }}</p>
            <p v-if="executiveSummary.trend" class="trend-summary">{{ executiveSummary.trend }}</p>
          </div>
        </div>
      </div>

      <div class="dashboard-section">
        <div class="section-header">
          <h2>Level 2 — Produksi Operasional</h2>
          <p>Output vs target per position dan performa sub position.</p>
        </div>
        <div class="charts-grid">
          <div
            v-if="outputVsTargetPerPosition.labels && outputVsTargetPerPosition.labels.length > 0"
            class="chart-card"
          >
            <h3>Output vs Target per Position</h3>
            <div class="chart-container">
              <Bar :data="outputVsTargetPerPosition" :options="chartOptions" :key="`position-target-${windowWidth}`" />
            </div>
          </div>

          <div class="chart-card">
            <h3>Output per Sub Position</h3>
            <div class="chart-container">
              <Bar :data="outputPerSubPosition" :options="chartOptions" :key="`sub-position-${windowWidth}`" />
            </div>
          </div>

          <div
            class="chart-card full-width"
            v-if="positionSubPositionSummary.length > 0"
          >
            <h3>Ringkasan Target vs Output per Position/Sub Position</h3>
            <div class="position-summary-table">
              <table class="summary-table">
                <thead>
                  <tr>
                    <th>Position / Sub Position</th>
                    <th>Target</th>
                    <th>Output</th>
                    <th>Reject</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in positionSubPositionSummary" :key="row.label">
                    <td>{{ row.label }}</td>
                    <td>{{ row.target.toLocaleString('id-ID') }}</td>
                    <td>{{ row.output.toLocaleString('id-ID') }}</td>
                    <td>{{ row.reject.toLocaleString('id-ID') }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div class="chart-insight">
          <p>{{ operationalSummary }}</p>
        </div>
      </div>

      <div class="dashboard-section">
        <div class="section-header">
          <h2>Level 3 — Tenaga Kerja</h2>
          <p>Produktivitas worker, department, dan per shift.</p>
        </div>
        <div class="charts-grid">
          <div class="chart-card">
            <h3>Produksi per Worker/Operator (Top 10)</h3>
            <div class="chart-container">
              <Bar :data="productionPerWorker" :options="chartOptions" :key="`worker-top-${windowWidth}`" />
            </div>
          </div>

          <div class="chart-card">
            <h3>Produksi per Worker/Operator (Bottom 10)</h3>
            <div class="chart-container">
              <Bar :data="productionPerWorkerBottom" :options="chartOptions" :key="`worker-bottom-${windowWidth}`" />
            </div>
          </div>

          <div class="chart-card full-width">
            <h3>Produktivitas Worker (Output vs Reject)</h3>
            <div class="chart-container">
              <Scatter :data="workerScatterData" :options="chartOptions" :key="`worker-scatter-${windowWidth}`" />
            </div>
          </div>

          <div class="chart-card">
            <h3>Produksi per Shift</h3>
            <div class="chart-container">
              <Bar :data="productionPerShift" :options="chartOptions" :key="`shift-${windowWidth}`" />
            </div>
          </div>

          <div class="chart-card" v-if="departmentSummary.chartData.labels.length > 0">
            <h3>Produksi per Department</h3>
            <div class="chart-container">
              <Bar :data="departmentSummary.chartData" :options="chartOptions" :key="`dept-${windowWidth}`" />
            </div>
          </div>
        </div>
        <div class="chart-insight">
          <p>{{ workforceSummary }}</p>
        </div>
      </div>

      <div class="dashboard-section">
        <div class="section-header">
          <h2>Level 4 — Kualitas</h2>
          <p>Analisis reject per position, sub position, dan problem utama.</p>
        </div>
        <div class="charts-grid">
          <div class="chart-card">
            <h3>Reject Rate per Position</h3>
            <div class="chart-container">
              <Bar :data="rejectRatePerPosition" :options="chartOptions" :key="`reject-pos-${windowWidth}`" />
            </div>
          </div>

          <div class="chart-card">
            <h3>Total Reject per Sub Position</h3>
            <div class="chart-container">
              <Bar :data="rejectPerSubPosition" :options="chartOptions" :key="`reject-subpos-${windowWidth}`" />
            </div>
          </div>

          <div class="chart-card full-width">
            <h3>Trend Output & Reject per Tanggal (30 Hari)</h3>
            <div class="chart-container">
              <Line :data="productionPerDate" :options="chartOptions" :key="`date-${windowWidth}`" />
            </div>
          </div>

          <div
            v-if="problemPareto.labels && problemPareto.labels.length > 0"
            class="chart-card full-width"
          >
            <h3>Problem Comments Pareto (80/20)</h3>
            <div class="chart-container">
              <Bar
                :data="problemPareto"
                :options="paretoChartOptions"
                :key="`pareto-${windowWidth}`"
              />
            </div>
          </div>

          <div
            v-if="problemSummary.chartData.labels && problemSummary.chartData.labels.length > 0"
            class="chart-card full-width"
          >
            <h3>Top Problem Produksi (berdasarkan durasi)</h3>
            <div class="chart-container">
              <Bar
                :data="problemSummary.chartData"
                :options="horizontalChartOptions"
                :key="`problem-${windowWidth}`"
              />
            </div>
            <div class="chart-insight">
              <p>
                Total durasi problem pada data terfilter:
                <strong>{{ problemSummary.totalDurationMinutes }}</strong>
                menit dari
                <strong>{{ problemSummary.logsWithProblem }}</strong>
                production log.
              </p>
              <p v-if="problemSummary.topReason">
                Penyebab terbesar:
                <strong>{{ problemSummary.topReason.description }}</strong>
                ({{ problemSummary.topReason.totalDuration }} menit,
                {{ problemSummary.topReason.count }} kejadian).
              </p>
            </div>
          </div>
        </div>
        <div class="chart-insight">
          <p>{{ qualitySummary }}</p>
        </div>
      </div>

      <div class="dashboard-section">
        <div class="section-header">
          <h2>Level 5 — Material & Supplier</h2>
          <p>Performa supplier dan analisis item level terhadap reject.</p>
        </div>
        <div class="charts-grid">
          <div class="chart-card">
            <h3>Supplier Performance: Output vs Reject</h3>
            <div class="chart-container">
              <Bar
                :data="supplierPerformance.outputVsRejectData"
                :options="chartOptions"
                :key="`supplier-or-${windowWidth}`"
              />
            </div>
          </div>

          <div class="chart-card">
            <h3>Supplier Performance: Reject Rate (%)</h3>
            <div class="chart-container">
              <Bar
                :data="supplierPerformance.rejectRateData"
                :options="chartOptions"
                :key="`supplier-rate-${windowWidth}`"
              />
            </div>
          </div>

          <div class="chart-card">
            <h3>Produksi per Item (Top 10)</h3>
            <div class="chart-container">
              <Bar :data="productionPerItem" :options="chartOptions" :key="`item-${windowWidth}`" />
            </div>
          </div>

          <div class="chart-card">
            <h3>Item vs Reject Rate (Heatmap)</h3>
            <div class="chart-container">
              <Bar :data="itemRejectRateChart" :options="chartOptions" :key="`item-heat-${windowWidth}`" />
            </div>
          </div>

          <div
            class="chart-card full-width"
            v-if="recentItemProduction.labels && recentItemProduction.labels.length > 0"
          >
            <h3>Item Terakhir Diproduksi (10 log terbaru)</h3>
            <div class="chart-container">
              <Bar
                :data="recentItemProduction"
                :options="chartOptions"
                :key="`recent-items-${windowWidth}`"
              />
            </div>
          </div>
        </div>
        <div class="chart-insight">
          <p>{{ materialSummary }}</p>
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
  max-width: 1440px;
  margin: 0 auto;
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

.dashboard-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.section-header {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.section-header h2 {
  margin: 0;
  font-size: 1.3rem;
  font-weight: 600;
  color: #333b5f;
}

.section-header p {
  margin: 0;
  font-size: 0.9rem;
  color: #666;
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

.stat-subvalue {
  margin: 0.15rem 0 0 0;
  font-size: 0.875rem;
  color: #666;
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

.chart-insight {
  margin-top: 0.75rem;
  font-size: 0.875rem;
  color: #555;
}

.chart-insight strong {
  color: #333b5f;
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

.position-summary-table {
  width: 100%;
  overflow-x: auto;
  margin-top: 0.5rem;
}

.summary-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.summary-table thead tr {
  background: #f8f9fa;
}

.summary-table th,
.summary-table td {
  padding: 0.75rem 0.75rem;
  border-bottom: 1px solid #e0e0e0;
}

.summary-table th {
  text-align: left;
  font-weight: 600;
  color: #333b5f;
  white-space: nowrap;
}

.summary-table tbody tr:nth-child(even) {
  background: #fafbff;
}

.summary-table tbody tr:hover {
  background: #f1f3fb;
}

.summary-table td:nth-child(2),
.summary-table td:nth-child(3),
.summary-table td:nth-child(4),
.summary-table td:nth-child(5) {
  text-align: right;
  font-variant-numeric: tabular-nums;
}

/* Level 1 Executive View Styles */
.level-1-section {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
  margin-bottom: 2rem;
  border: 1px solid #f1f5f9;
}

.level-1-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #f1f5f9;
}

.header-left h2 {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 0.25rem 0;
}

.header-left p {
  font-size: 0.875rem;
  color: #64748b;
  margin: 0;
}

.health-badge {
  padding: 0.5rem 1rem;
  border-radius: 9999px;
  font-weight: 600;
  font-size: 0.875rem;
  letter-spacing: 0.025em;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.health-excellent { background-color: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; }
.health-good { background-color: #f0fdf4; color: #166534; border: 1px solid #dcfce7; }
.health-warning { background-color: #fff7ed; color: #c2410c; border: 1px solid #ffedd5; }
.health-critical { background-color: #fef2f2; color: #b91c1c; border: 1px solid #fee2e2; }

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.kpi-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid #e2e8f0;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.kpi-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
  border-color: #cbd5e1;
}

.main-kpi {
  justify-content: space-between;
}

.kpi-top {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1rem;
}

.kpi-icon-wrapper {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.kpi-icon-wrapper.blue { background: #eff6ff; color: #2563eb; }
.kpi-icon-wrapper.red { background: #fef2f2; color: #dc2626; }

.kpi-info {
  display: flex;
  flex-direction: column;
}

.kpi-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #64748b;
  margin-bottom: 0.25rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.kpi-value {
  font-size: 1.875rem;
  font-weight: 800;
  line-height: 1.2;
  letter-spacing: -0.025em;
  color: #1e293b;
}

.text-dark { color: #0f172a; }
.text-danger { color: #dc2626; }

.kpi-bottom {
  margin-top: auto;
  padding-top: 1rem;
  border-top: 1px solid #f1f5f9;
}

.kpi-sub {
  font-size: 0.875rem;
  color: #64748b;
  margin: 0;
  font-weight: 500;
}

.quick-stats-card .card-title {
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 1.25rem 0;
}

.quick-stats-grid {
  display: grid;
  grid-template-columns: 1fr auto 1fr auto 1fr;
  align-items: center;
}

.qs-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.qs-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #334155;
  margin-bottom: 0.25rem;
}

.qs-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
}

.qs-divider {
  width: 1px;
  height: 40px;
  background: #e2e8f0;
}

.executive-summary-box {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.25rem;
  display: flex;
  gap: 1rem;
}

.summary-icon {
  color: #2563eb;
  padding-top: 0.125rem;
}

.summary-content {
  flex: 1;
}

.main-summary {
  font-size: 0.95rem;
  color: #334155;
  font-weight: 500;
  margin: 0 0 0.25rem 0;
  line-height: 1.5;
}

.trend-summary {
  font-size: 0.875rem;
  color: #64748b;
  margin: 0;
}

/* Responsive adjustments for Level 1 */
@media (max-width: 1200px) {
  .kpi-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .kpi-grid {
    grid-template-columns: 1fr;
  }
  .level-1-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  .quick-stats-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  .qs-divider {
    display: none;
  }
  .qs-item {
    flex-direction: row;
    justify-content: space-between;
    width: 100%;
    padding: 0.5rem 0;
    border-bottom: 1px solid #f1f5f9;
  }
  .qs-item:last-child {
    border-bottom: none;
  }
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

.logs-table td:nth-child(7),
.logs-table td:nth-child(8) {
  text-align: right;
  font-variant-numeric: tabular-nums;
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
