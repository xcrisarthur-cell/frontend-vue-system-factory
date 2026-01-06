<script setup>
import { ref, onMounted, computed } from 'vue'
import { Teleport, Transition } from 'vue'
import { useRouter } from 'vue-router'
import { productionLogsApi } from '../api/productionLogs'
import { workersApi } from '../api/workers'
import api from '../api/http'
import { useAdminProduksiSessionStore } from '../store/adminProduksiSession'
import { modal } from '../plugins/modal'
import * as XLSX from 'xlsx'

const router = useRouter()
const adminProduksiSession = useAdminProduksiSessionStore()
const logs = ref([])
const isLoading = ref(false)
const error = ref(null)
const selectedLog = ref(null)
const showDetailModal = ref(false)
const selectedLogIds = ref([])
const activeTab = ref('not_completion')

// Filter states
const filterWorkerId = ref('')
const filterShiftId = ref('')
const filterDate = ref('')
const filterPositionId = ref('')
const filterSubPositionId = ref('')
const filterSupplierId = ref('')
const filterItemId = ref('')
const filterApprovalStatus = ref('')
const filterApprovalSpv = ref('')
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

const filteredLogs = computed(() => {
  let filtered = logs.value

  if (filterWorkerId.value) {
    filtered = filtered.filter(log => log.worker_id === Number(filterWorkerId.value))
  }

  if (filterShiftId.value) {
    filtered = filtered.filter(log => log.shift_id === Number(filterShiftId.value))
  }

  if (filterDate.value) {
    const filterDateObj = new Date(filterDate.value)
    filtered = filtered.filter(log => {
      const logDate = new Date(log.created_at)
      return logDate.toDateString() === filterDateObj.toDateString()
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

  if (filterApprovalStatus.value) {
    if (filterApprovalStatus.value === 'approved') {
      filtered = filtered.filter(log => log.approved_coordinator === true)
    } else if (filterApprovalStatus.value === 'pending') {
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

  return filtered
})

const pendingCompletionLogs = computed(() => {
  return filteredLogs.value.filter(log => !log.status_completion || log.status_completion === 0)
})

const completedCompletionLogs = computed(() => {
  return filteredLogs.value.filter(log => log.status_completion && log.status_completion > 0)
})

const isAllPendingSelected = computed(() => {
  if (pendingCompletionLogs.value.length === 0) return false
  return pendingCompletionLogs.value.every(log => selectedLogIds.value.includes(log.id))
})

const isAllCompletedSelected = computed(() => {
  if (completedCompletionLogs.value.length === 0) return false
  return completedCompletionLogs.value.every(log => selectedLogIds.value.includes(log.id))
})

const toggleSelectPending = () => {
  const pendingIds = pendingCompletionLogs.value.map(log => log.id)
  if (isAllPendingSelected.value) {
    selectedLogIds.value = selectedLogIds.value.filter(id => !pendingIds.includes(id))
  } else {
    selectedLogIds.value = [...new Set([...selectedLogIds.value, ...pendingIds])]
  }
}

const toggleSelectCompleted = () => {
  const completedIds = completedCompletionLogs.value.map(log => log.id)
  if (isAllCompletedSelected.value) {
    selectedLogIds.value = selectedLogIds.value.filter(id => !completedIds.includes(id))
  } else {
    selectedLogIds.value = [...new Set([...selectedLogIds.value, ...completedIds])]
  }
}

const formatStatusCompletion = (status) => {
  const val = status || 0
  if (val === 0) return 'Belum'
  if (val === 1) return 'Sudah'
  return `${val}x Tarik Data`
}

const handleEdit = (id) => {
  router.push(`/production-logs/${id}/edit?from=admin-produksi`)
}

const handleShowDetail = (log) => {
  selectedLog.value = log
  showDetailModal.value = true
}

const closeDetailModal = () => {
  showDetailModal.value = false
  selectedLog.value = null
}

const handleDelete = async (id) => {
  const confirmed = await modal.confirm('Yakin ingin menghapus production log ini?')
  if (!confirmed) return
  
  try {
    await productionLogsApi.delete(id)
    await modal.showSuccess('Production log berhasil dihapus')
    fetchData()
  } catch (err) {
    await modal.showError(err.response?.data?.detail || 'Gagal menghapus production log')
  }
}

const clearFilters = () => {
  filterWorkerId.value = ''
  filterShiftId.value = ''
  filterDate.value = ''
  filterPositionId.value = ''
  filterSubPositionId.value = ''
  filterSupplierId.value = ''
  filterItemId.value = ''
  filterApprovalStatus.value = ''
  filterApprovalSpv.value = ''
  subPositions.value = []
}

const handleLogout = async () => {
  const confirmed = await modal.confirm('Yakin ingin logout?')
  if (confirmed) {
    adminProduksiSession.clearSession()
    router.push('/admin-produksi-login')
  }
}

const downloadExcel = async () => {
  try {
    if (selectedLogIds.value.length === 0) {
      await modal.showWarning('Silakan pilih data yang ingin diunduh (checklist) terlebih dahulu')
      return
    }

    isLoading.value = true
    
    // Update status in backend
    await productionLogsApi.bulkIncrementStatus(selectedLogIds.value)

    // Fetch fresh logs to get updated status
    const logsRes = await productionLogsApi.getAll()
    const allLogs = logsRes.data
    
    const logsToDownload = allLogs.filter(log => selectedLogIds.value.includes(log.id))
    
    // Prepare data for Excel
    const excelData = logsToDownload.map(log => ({
      'ID': log.id,
      'Status Completion': log.status_completion || 0,
      'Tanggal Dibuat': new Date(log.created_at).toLocaleString('id-ID'),
      'Worker': log.worker?.name || '-',
      'Position': log.position?.code || '-',
      'Position Unit': log.position?.unit || '-',
      'Sub Position': log.sub_position?.code || '-',
      'Shift': log.shift?.name || '-',
      'Supplier': log.supplier?.name || '-',
      'Item Name': log.item?.item_name || '-',
      'Item Number': log.item?.item_number || '-',
      'Item Spec': log.item?.spec || '-',
      'Qty Output': log.qty_output,
      'Qty Reject': log.qty_reject,
      'Problem Duration (Menit)': log.problem_duration_minutes || '-',
      'Problem Comments': log.problem_comments && log.problem_comments.length > 0 
        ? log.problem_comments.map(pc => pc.description).join('; ') 
        : '-',
      'Status Coordinator': log.approved_coordinator ? 'Approved' : 'Pending',
      'Approved Coordinator At': log.approved_coordinator_at 
        ? new Date(log.approved_coordinator_at).toLocaleString('id-ID') 
        : '-',
      'Approved Coordinator By': log.approved_coordinator_by_worker?.name || '-',
      'Status Supervisor': log.approved_spv ? 'Approved' : 'Pending',
      'Approved Supervisor At': log.approved_spv_at 
        ? new Date(log.approved_spv_at).toLocaleString('id-ID') 
        : '-',
      'Approved Supervisor By': log.approved_spv_by_worker?.name || '-'
    }))
    
    // Create workbook and worksheet
    const worksheet = XLSX.utils.json_to_sheet(excelData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Production Logs')
    
    // Generate filename with current date
    const now = new Date()
    const dateStr = now.toISOString().split('T')[0]
    const filename = `Production_Logs_${dateStr}.xlsx`
    
    // Write and download
    XLSX.writeFile(workbook, filename)
    
    await modal.showSuccess(`Data berhasil diunduh dan status diperbarui`)
    
    // Clear selection
    selectedLogIds.value = []
    
    // Update local state with fresh data
    logs.value = allLogs
    
  } catch (err) {
    console.error('Error downloading Excel:', err)
    await modal.showError('Gagal memproses data. Silakan coba lagi.')
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  // Check if admin produksi is authenticated
  if (!adminProduksiSession.isAuthenticated) {
    await modal.showWarning('Silakan login terlebih dahulu')
    router.push('/admin-produksi-login')
    return
  }
  fetchData()
})
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <div>
        <h1>Production Logs - Admin Produksi</h1>
        <p class="admin-name">Logged in as: {{ adminProduksiSession.adminProduksiName }}</p>
      </div>
      <div class="header-actions">
        <button class="btn-download" @click="downloadExcel" :disabled="isLoading || selectedLogIds.length === 0" :class="{ 'disabled': selectedLogIds.length === 0 }">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          {{ isLoading ? 'Mengunduh...' : 'Download Excel' }}
        </button>
        <button class="btn-logout" @click="handleLogout">
          Logout
        </button>
        <button class="btn-back" @click="router.push('/production-menu')">
          Kembali
        </button>
      </div>
    </div>

    <!-- Filters -->
    <div class="filters-section">
      <h3>Filter</h3>
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
          <label>Status Approval Coordinator</label>
          <select v-model="filterApprovalStatus" class="filter-input">
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

        <div class="filter-group">
          <label>Tanggal</label>
          <input v-model="filterDate" type="date" class="filter-input" />
        </div>

        <div class="filter-group">
          <button class="btn-clear" @click="clearFilters">Clear Filters</button>
        </div>
      </div>
    </div>

    <div v-if="error" class="error-message">{{ error }}</div>
    <div v-if="isLoading" class="loading">Memuat data...</div>
    <div v-else-if="filteredLogs.length === 0" class="empty-state">
      <p>Tidak ada data production logs</p>
    </div>

    <div v-else class="tables-container">
      <div class="tabs-header" style="margin-bottom: 20px; display: flex; gap: 10px;">
        <button 
          @click="activeTab = 'not_completion'"
          :class="['tab-btn', { active: activeTab === 'not_completion' }]"
        >
          Not Completion
        </button>
        <button 
          @click="activeTab = 'done_completion'"
          :class="['tab-btn', { active: activeTab === 'done_completion' }]"
        >
          Done Completion
        </button>
      </div>

      <!-- Table 1: Pending Logs -->
      <div class="table-section" v-if="activeTab === 'not_completion'">
        <h3>Data Belum Ditarik</h3>
        <div v-if="pendingCompletionLogs.length === 0" class="empty-state-small" style="padding: 20px; text-align: center; background: #f9fafb; border-radius: 8px; margin-bottom: 20px;">
          <p>Tidak ada data belum ditarik</p>
        </div>
        <table v-else class="data-table">
          <thead>
            <tr>
              <th style="width: 40px; text-align: center;">
                <input 
                  type="checkbox" 
                  :checked="isAllPendingSelected" 
                  @change="toggleSelectPending"
                />
              </th>
              <th>ID</th>
              <th>Worker</th>
              <th>Position</th>
              <th>Sub Position</th>
              <th>Item</th>
              <th>Output</th>
              <th>Reject</th>
              <th>Shift</th>
              <th>Supplier</th>
              <th>Tanggal</th>
              <th>Status Completion</th>
              <th>Status Coordinator</th>
              <th>Status Supervisor</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="log in pendingCompletionLogs" :key="log.id">
              <td style="text-align: center;">
                <input 
                  type="checkbox" 
                  :value="log.id" 
                  v-model="selectedLogIds" 
                />
              </td>
              <td data-label="ID">{{ log.id }}</td>
              <td data-label="Worker">{{ log.worker?.name || '-' }}</td>
              <td data-label="Position">{{ log.position?.code || '-' }}</td>
              <td data-label="Sub Position">{{ log.sub_position?.code || '-' }}</td>
              <td data-label="Item">{{ log.item?.item_name || log.item?.item_number || '-' }}</td>
              <td class="num" data-label="Output">{{ log.qty_output }}</td>
              <td class="num reject" data-label="Reject">{{ log.qty_reject }}</td>
              <td data-label="Shift">{{ log.shift?.name || '-' }}</td>
              <td data-label="Supplier">{{ log.supplier?.name || '-' }}</td>
              <td data-label="Tanggal">{{ new Date(log.created_at).toLocaleString('id-ID') }}</td>
              <td data-label="Status Completion" style="text-align: center;">
                <span class="badge" style="background-color: #f3f4f6; color: #374151;">{{ formatStatusCompletion(log.status_completion) }}</span>
              </td>
              <td data-label="Status Coordinator">
                <span v-if="log.approved_coordinator" class="badge approved">Approved</span>
                <span v-else class="badge draft">Pending</span>
              </td>
              <td data-label="Status Supervisor">
                <span v-if="log.approved_spv" class="badge approved">Approved</span>
                <span v-else-if="log.approved_coordinator" class="badge pending">Pending</span>
                <span v-else class="badge draft">Belum</span>
              </td>
              <td class="actions" data-label="Aksi">
                <button class="btn-detail" @click="handleShowDetail(log)">Detail Data</button>
                <button class="btn-edit" @click="handleEdit(log.id)">Edit</button>
                <button class="btn-delete" @click="handleDelete(log.id)">Hapus</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Table 2: Completed Logs -->
      <div class="table-section" v-if="activeTab === 'done_completion'">
        <h3>Riwayat Tarik Data</h3>
        <div v-if="completedCompletionLogs.length === 0" class="empty-state-small" style="padding: 20px; text-align: center; background: #f9fafb; border-radius: 8px;">
          <p>Tidak ada riwayat tarik data</p>
        </div>
        <table v-else class="data-table">
          <thead>
            <tr>
              <th style="width: 40px; text-align: center;">
                <input 
                  type="checkbox" 
                  :checked="isAllCompletedSelected" 
                  @change="toggleSelectCompleted"
                />
              </th>
              <th>ID</th>
              <th>Worker</th>
              <th>Position</th>
              <th>Sub Position</th>
              <th>Item</th>
              <th>Output</th>
              <th>Reject</th>
              <th>Shift</th>
              <th>Supplier</th>
              <th>Tanggal</th>
              <th>Status Completion</th>
              <th>Status Coordinator</th>
              <th>Status Supervisor</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="log in completedCompletionLogs" :key="log.id">
              <td style="text-align: center;">
                <input 
                  type="checkbox" 
                  :value="log.id" 
                  v-model="selectedLogIds" 
                />
              </td>
              <td data-label="ID">{{ log.id }}</td>
              <td data-label="Worker">{{ log.worker?.name || '-' }}</td>
              <td data-label="Position">{{ log.position?.code || '-' }}</td>
              <td data-label="Sub Position">{{ log.sub_position?.code || '-' }}</td>
              <td data-label="Item">{{ log.item?.item_name || log.item?.item_number || '-' }}</td>
              <td class="num" data-label="Output">{{ log.qty_output }}</td>
              <td class="num reject" data-label="Reject">{{ log.qty_reject }}</td>
              <td data-label="Shift">{{ log.shift?.name || '-' }}</td>
              <td data-label="Supplier">{{ log.supplier?.name || '-' }}</td>
              <td data-label="Tanggal">{{ new Date(log.created_at).toLocaleString('id-ID') }}</td>
              <td data-label="Status Completion" style="text-align: center;">
                <span class="badge" style="background-color: #d1fae5; color: #065f46;">{{ formatStatusCompletion(log.status_completion) }}</span>
              </td>
              <td data-label="Status Coordinator">
                <span v-if="log.approved_coordinator" class="badge approved">Approved</span>
                <span v-else class="badge draft">Pending</span>
              </td>
              <td data-label="Status Supervisor">
                <span v-if="log.approved_spv" class="badge approved">Approved</span>
                <span v-else-if="log.approved_coordinator" class="badge pending">Pending</span>
                <span v-else class="badge draft">Belum</span>
              </td>
              <td class="actions" data-label="Aksi">
                <button class="btn-detail" @click="handleShowDetail(log)">Detail Data</button>
                <button class="btn-edit" @click="handleEdit(log.id)">Edit</button>
                <button class="btn-delete" @click="handleDelete(log.id)">Hapus</button>
              </td>
            </tr>
          </tbody>
        </table>
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
                  <span class="detail-value">{{ selectedLog.qty_output }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Qty Reject:</span>
                  <span class="detail-value reject-value">{{ selectedLog.qty_reject }}</span>
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
                    <span v-else class="badge draft">Pending</span>
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
</template>

<style scoped>
.tab-btn {
  padding: 10px 20px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.tab-btn.active {
  background-color: #3b82f6 !important;
  color: white !important;
  border-color: #3b82f6 !important;
}

.page-container {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.page-header h1 {
  margin: 0 0 0.25rem 0;
  font-size: 2rem;
  font-weight: 700;
  color: #333b5f;
}

.admin-name {
  margin: 0;
  font-size: 0.875rem;
  color: #666;
  font-weight: 500;
}

.header-actions {
  display: flex;
  gap: 0.75rem;
}

.btn-logout {
  padding: 0.75rem 1.5rem;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-logout:hover {
  background: #c82333;
}

.tab-btn {
  padding: 10px 20px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
  color: #374151;
}

.tab-btn.active {
  background-color: #333b5f !important;
  color: white !important;
  border-color: #333b5f !important;
}

.btn-download {
  padding: 0.75rem 1.5rem;
  background: #28a745;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-download:hover:not(:disabled) {
  background: #218838;
}

.btn-download:disabled {
  background: #6c757d;
  cursor: not-allowed;
  opacity: 0.7;
}

.btn-back {
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

.filters-section {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

.filters-section h3 {
  margin: 0 0 1rem 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #333b5f;
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
  align-items: end;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-group label {
  font-weight: 600;
  color: #333b5f;
  font-size: 0.875rem;
}

.filter-input {
  padding: 0.75rem;
  border: 2px solid #beceea;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.3s ease;
  width: 100%;
  box-sizing: border-box;
}

.filter-input:focus {
  outline: none;
  border-color: #333b5f;
  box-shadow: 0 0 0 4px rgba(51, 59, 95, 0.1);
}

.btn-clear {
  padding: 0.75rem 1.5rem;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-clear:hover {
  background: #c82333;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.data-table th {
  background: #f8f9fa;
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  color: #333b5f;
  border-bottom: 2px solid #beceea;
  font-size: 0.9rem;
}

.data-table td {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #e9ecef;
  font-size: 0.9rem;
}

.data-table tr:hover {
  background: #f8f9fa;
}

.num {
  text-align: right;
}

.reject {
  color: #c0392b;
  font-weight: 600;
}

.badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

.badge.approved {
  background: #d4edda;
  color: #155724;
}

.badge.pending {
  background: #fff3cd;
  color: #856404;
}

.badge.draft {
  background: #f8d7da;
  color: #721c24;
}

.actions {
  display: flex;
  gap: 0.5rem;
}

.btn-edit {
  padding: 0.5rem 1rem;
  background: #333b5f;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.875rem;
  transition: all 0.2s ease;
}

.btn-edit:hover {
  background: #2a3250;
}

.btn-delete {
  padding: 0.5rem 1rem;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.875rem;
  transition: all 0.2s ease;
}

.btn-delete:hover {
  background: #c82333;
}

.loading, .empty-state {
  padding: 2rem;
  text-align: center;
  color: #666;
}

.error-message {
  padding: 1rem;
  background: #f8d7da;
  color: #721c24;
  border-radius: 8px;
  margin-bottom: 1rem;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .page-container {
    padding: 1.5rem;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .header-actions {
    width: 100%;
    justify-content: flex-end;
  }

  .filters-grid {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  }

  .data-table {
    font-size: 0.85rem;
  }

  .data-table th,
  .data-table td {
    padding: 0.625rem 0.75rem;
  }
}

@media (max-width: 768px) {
  .page-container {
    padding: 1rem;
  }

  .page-header h1 {
    font-size: 1.5rem;
  }

  .admin-name {
    font-size: 0.8125rem;
  }

  .header-actions {
    flex-direction: column;
    width: 100%;
  }

  .btn-download,
  .btn-logout,
  .btn-back {
    width: 100%;
  }

  .filters-section {
    padding: 1rem;
  }

  .filters-section h3 {
    font-size: 1.1rem;
  }

  .filters-grid {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }

  .btn-clear {
    width: 100%;
    margin-top: 0.5rem;
  }

  .data-table {
    display: block;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .data-table thead {
    display: none;
  }

  .data-table tbody {
    display: block;
  }

  .data-table tr {
    display: block;
    margin-bottom: 1rem;
    border: 1px solid #e9ecef;
    border-radius: 8px;
    padding: 0.75rem;
    background: white;
  }

  .data-table td {
    display: flex;
    justify-content: space-between;
    padding: 0.5rem 0;
    border-bottom: 1px solid #f0f0f0;
    text-align: right;
  }

  .data-table td::before {
    content: attr(data-label);
    font-weight: 600;
    color: #333b5f;
    text-align: left;
    flex: 1;
    margin-right: 1rem;
  }

  .data-table td.num::before {
    text-align: left;
  }

  .data-table td:last-child {
    border-bottom: none;
  }

  .actions {
    flex-direction: column;
    gap: 0.5rem;
  }

  .btn-edit,
  .btn-delete {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .page-container {
    padding: 0.75rem;
  }

  .page-header h1 {
    font-size: 1.25rem;
  }

  .filters-section {
    padding: 0.75rem;
  }

  .filter-input {
    padding: 0.625rem;
    font-size: 0.9375rem;
    width: 100%;
    box-sizing: border-box;
  }

  .btn-clear {
    padding: 0.625rem 1rem;
    font-size: 0.875rem;
    width: 100%;
    margin-top: 0.5rem;
  }

  .filters-grid {
    gap: 0.5rem;
  }

  .filter-input {
    width: 100%;
    box-sizing: border-box;
  }

  .data-table td {
    font-size: 0.8125rem;
  }

  .badge {
    font-size: 0.6875rem;
    padding: 0.2rem 0.5rem;
  }
}

/* Detail Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-container {
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 800px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  animation: zoomIn 0.3s ease-out;
}

@keyframes zoomIn {
  from {
    transform: scale(0.9);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.detail-modal .modal-header {
  padding: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #e9ecef;
  background: #333b5f;
  color: white;
}

.detail-modal .modal-header h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
}

.modal-close {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: background 0.2s ease;
}

.modal-close:hover {
  background: rgba(255, 255, 255, 0.1);
}

.detail-body {
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
}

.detail-section {
  margin-bottom: 2rem;
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
  border-bottom: 2px solid #beceea;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
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
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.detail-value {
  font-size: 1rem;
  color: #333;
  word-break: break-word;
}

.detail-value.reject-value {
  color: #c0392b;
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
  padding: 0.375rem 0.75rem;
  background: #fff3cd;
  color: #856404;
  border-radius: 6px;
  font-size: 0.875rem;
  border: 1px solid #ffc107;
}

.modal-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid #e9ecef;
  display: flex;
  justify-content: flex-end;
}

.btn-close-modal {
  padding: 0.75rem 1.5rem;
  background: #333b5f;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-close-modal:hover {
  background: #2a3250;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(51, 59, 95, 0.3);
}

.btn-detail {
  padding: 0.5rem 1rem;
  background: #17a2b8;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.875rem;
  transition: all 0.2s ease;
  margin-right: 0.5rem;
}

.btn-detail:hover {
  background: #138496;
  transform: translateY(-1px);
}

/* Modal Transitions */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

/* Responsive Detail Modal */
@media (max-width: 768px) {
  .modal-container {
    max-width: 100%;
    margin: 0.5rem;
    max-height: 95vh;
  }

  .detail-grid {
    grid-template-columns: 1fr;
  }

  .detail-body {
    padding: 1rem;
  }

  .detail-section h3 {
    font-size: 1rem;
  }
}

@media (max-width: 480px) {
  .modal-container {
    margin: 0.25rem;
    border-radius: 12px;
  }

  .detail-modal .modal-header {
    padding: 1rem;
  }

  .detail-modal .modal-header h2 {
    font-size: 1.25rem;
  }

  .detail-body {
    padding: 0.75rem;
  }

  .detail-section {
    margin-bottom: 1.5rem;
  }

  .btn-detail {
    width: 100%;
    margin-right: 0;
    margin-bottom: 0.5rem;
  }

  .actions {
    flex-direction: column;
  }
}
</style>

