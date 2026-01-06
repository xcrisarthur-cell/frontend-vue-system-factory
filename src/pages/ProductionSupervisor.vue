<script setup>
import { ref, onMounted, computed } from 'vue'
import { Teleport, Transition } from 'vue'
import { useRouter } from 'vue-router'
import { productionLogsApi } from '../api/productionLogs'
import { workersApi } from '../api/workers'
import api from '../api/http'
import { useSupervisorSessionStore } from '../store/supervisorSession'
import { modal } from '../plugins/modal'

const router = useRouter()
const supervisorSession = useSupervisorSessionStore()
const logs = ref([])
const targets = ref([])
const attendances = ref([])
const activeTab = ref('logs')
const isLoading = ref(false)
const error = ref(null)
const selectedLog = ref(null)
const showDetailModal = ref(false)

// Filter states
const logFilterMode = ref('approved_coordinator') // 'approved_coordinator', 'not_approved_coordinator', 'approved_supervisor'
const filterWorkerId = ref('')
const filterShiftId = ref('')
const filterDate = ref('')
const filterPositionId = ref('')
const filterSubPositionId = ref('')
const filterSupplierId = ref('')
const filterItemId = ref('')
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

// Filter logs based on mode and other criteria
const filteredLogs = computed(() => {
  let filtered = logs.value

  // Main filter based on selected mode
  if (logFilterMode.value === 'approved_coordinator') {
    // Menampilkan data yang status coordinatornya Approved (true)
    filtered = filtered.filter(log => log.approved_coordinator === true)
  } else if (logFilterMode.value === 'not_approved_coordinator') {
    // Menampilkan data yang status coordinatornya bukan Approved (false)
    filtered = filtered.filter(log => !log.approved_coordinator)
  } else if (logFilterMode.value === 'approved_supervisor') {
    // Menampilkan data yang status supervisornya Approved (true)
    filtered = filtered.filter(log => log.approved_spv === true)
  }

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

  return filtered
})

const handleApprove = async (logId) => {
  const confirmed = await modal.confirm('Yakin ingin approve production log ini sebagai supervisor?')
  if (!confirmed) return

  try {
    if (!supervisorSession.isAuthenticated || !supervisorSession.supervisorId) {
      await modal.showError('Session tidak valid. Silakan login ulang.')
      router.push('/supervisor-login')
      return
    }
    
    await productionLogsApi.update(logId, {
      approved_spv: true,
      approved_spv_by: supervisorSession.supervisorId
    })
    await modal.showSuccess('Production log berhasil di-approve')
    fetchData()
  } catch (err) {
    await modal.showError(err.response?.data?.detail || 'Gagal approve production log')
  }
}

const handleEdit = (id) => {
  router.push(`/production-logs/${id}/edit`)
}

const handleShowDetail = (log) => {
  selectedLog.value = log
  showDetailModal.value = true
}

const closeDetailModal = () => {
  showDetailModal.value = false
  selectedLog.value = null
}

const clearFilters = () => {
  filterWorkerId.value = ''
  filterShiftId.value = ''
  filterDate.value = ''
  filterPositionId.value = ''
  filterSubPositionId.value = ''
  filterSupplierId.value = ''
  filterItemId.value = ''
  subPositions.value = []
}

const handleLogout = async () => {
  const confirmed = await modal.confirm('Yakin ingin logout?')
  if (confirmed) {
    supervisorSession.clearSession()
    router.push('/supervisor-login')
  }
}

const fetchTargets = async () => {
  isLoading.value = true
  error.value = null
  try {
    const res = await api.get('/production-targets')
    targets.value = res.data
  } catch (err) {
    error.value = err.response?.data?.detail || 'Gagal memuat data'
  } finally {
    isLoading.value = false
  }
}

const handleEditTarget = (id) => {
  router.push(`/production-targets/${id}/edit`)
}

const handleAddTarget = () => {
  router.push('/production-targets/create')
}

const handleDeleteTarget = async (id) => {
  const confirmed = await modal.confirm('Yakin ingin menghapus production target ini?')
  if (!confirmed) return

  try {
    await api.delete(`/production-targets/${id}`)
    await modal.showSuccess('Production target berhasil dihapus')
    fetchTargets()
  } catch (err) {
    await modal.showError(err.response?.data?.detail || 'Gagal menghapus production target')
  }
}

const fetchAttendances = async () => {
  isLoading.value = true
  error.value = null
  try {
    const res = await api.get('/attendances')
    attendances.value = res.data
  } catch (err) {
    error.value = err.response?.data?.detail || 'Gagal memuat data'
  } finally {
    isLoading.value = false
  }
}

const handleAddAttendance = () => {
  router.push('/attendances/create')
}

const handleEditAttendance = (record) => {
  router.push(`/attendances/${record.id}/edit`)
}

const handleDeleteAttendance = async (id) => {
  const confirmed = await modal.confirm('Yakin ingin menghapus attendance ini?')
  if (!confirmed) return
  try {
    await api.delete(`/attendances/${id}`)
    await modal.showSuccess('Attendance berhasil dihapus')
    fetchAttendances()
  } catch (err) {
    await modal.showError(err.response?.data?.detail || 'Gagal menghapus attendance')
  }
}

const handleApproveAttendance = async (attendanceId) => {
  const confirmed = await modal.confirm('Approve attendance ini sebagai supervisor?')
  if (!confirmed) return
  try {
    await api.put(`/attendances/${attendanceId}`, { approved_supervisor: true })
    await modal.showSuccess('Attendance berhasil di-approve supervisor')
    fetchAttendances()
  } catch (err) {
    await modal.showError(err.response?.data?.detail || 'Gagal approve attendance')
  }
}

const setTab = async (tab) => {
  activeTab.value = tab
  if (tab === 'logs') {
    if (logs.value.length === 0) await fetchData()
  } else if (tab === 'targets') {
    if (targets.value.length === 0) await fetchTargets()
  } else if (tab === 'attendance') {
    if (attendances.value.length === 0) await fetchAttendances()
  }
}

onMounted(async () => {
  // Check if supervisor is authenticated
  if (!supervisorSession.isAuthenticated) {
    await modal.showWarning('Silakan login terlebih dahulu')
    router.push('/supervisor-login')
    return
  }
  fetchData()
})
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <div>
        <h1>Production Logs - Supervisor</h1>
        <p class="supervisor-name">Logged in as: {{ supervisorSession.supervisorName }}</p>
      </div>
      <div class="header-actions">
        <button class="btn-logout" @click="handleLogout">
          Logout
        </button>
        <button class="btn-back" @click="router.push('/production-menu')">
          Kembali
        </button>
      </div>
    </div>

    <div class="tab-buttons">
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'logs' }"
        @click="setTab('logs')"
        type="button"
      >
        Production Log
      </button>
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'targets' }"
        @click="setTab('targets')"
        type="button"
      >
        Production Target
      </button>
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'attendance' }"
        @click="setTab('attendance')"
        type="button"
      >
        Production Attendance
      </button>
    </div>

    <!-- Filters -->
    <div v-if="activeTab === 'logs'" class="filters-section">
      <div class="log-mode-buttons">
        <button 
          class="mode-btn"
          :class="{ active: logFilterMode === 'approved_coordinator' }"
          @click="logFilterMode = 'approved_coordinator'"
        >
          Approved Coordinator
        </button>
        <button 
          class="mode-btn"
          :class="{ active: logFilterMode === 'not_approved_coordinator' }"
          @click="logFilterMode = 'not_approved_coordinator'"
        >
          Not Approved Coordinator
        </button>
        <button 
          class="mode-btn"
          :class="{ active: logFilterMode === 'approved_supervisor' }"
          @click="logFilterMode = 'approved_supervisor'"
        >
          Approved Supervisor
        </button>
      </div>

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
          <label>Tanggal</label>
          <input v-model="filterDate" type="date" class="filter-input" />
        </div>

        <div class="filter-group">
          <button class="btn-clear" @click="clearFilters">Clear Filters</button>
        </div>
      </div>
    </div>

    <div v-if="activeTab === 'logs'">
      <div v-if="error" class="error-message">{{ error }}</div>
      <div v-if="isLoading" class="loading">Memuat data...</div>
      <div v-else-if="filteredLogs.length === 0" class="empty-state">
        <p>Tidak ada data production logs</p>
      </div>
      <table v-else class="data-table">
        <thead>
          <tr>
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
          <th>Status Coordinator</th>
          <th>Status Supervisor</th>
          <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="log in filteredLogs" :key="log.id">
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
          <td data-label="Status Coordinator">
            <span v-if="log.approved_coordinator" class="badge approved">Approved</span>
            <span v-else class="badge draft">Pending</span>
          </td>
          <td data-label="Status Supervisor">
            <span v-if="log.approved_spv" class="badge approved">Approved</span>
            <span v-else class="badge pending">Pending</span>
          </td>
          <td class="actions" data-label="Aksi">
            <button class="btn-detail" @click="handleShowDetail(log)">Detail Data</button>
            <button 
              v-if="!log.approved_spv && log.approved_coordinator"
              class="btn-approve" 
              @click="handleApprove(log.id)"
            >
              Approve
            </button>
            <button class="btn-edit" @click="handleEdit(log.id)">Edit</button>
          </td>
        </tr>
      </tbody>
    </table>
    </div>

    <div v-else-if="activeTab === 'targets'">
      <div style="margin-bottom: 1rem; display: flex; justify-content: flex-end;">
        <button class="btn-add" @click="handleAddTarget">
          + Tambah Target
        </button>
      </div>
      <div v-if="error" class="error-message">{{ error }}</div>
      <div v-if="isLoading" class="loading">Memuat data...</div>
      <div v-else-if="targets.length === 0" class="empty-state">
        <p>Tidak ada data production target</p>
      </div>
      <table v-else class="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Position</th>
            <th>Sub Position</th>
            <th>Target</th>
            <th>Dibuat</th>
            <th>Diperbarui</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="t in targets" :key="t.id">
            <td data-label="ID">{{ t.id }}</td>
            <td data-label="Position">{{ t.position?.code || '-' }}</td>
            <td data-label="Sub Position">{{ t.sub_position?.code || '-' }}</td>
            <td class="num" data-label="Target">{{ t.target }}</td>
            <td data-label="Dibuat">{{ new Date(t.created_at).toLocaleString('id-ID') }}</td>
            <td data-label="Diperbarui">{{ new Date(t.updated_at).toLocaleString('id-ID') }}</td>
            <td class="actions" data-label="Aksi">
              <button class="btn-edit" @click="handleEditTarget(t.id)">Edit</button>
              <button class="btn-delete" @click="handleDeleteTarget(t.id)">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-else-if="activeTab === 'attendance'">
      <div style="margin-bottom: 1rem; display: flex; justify-content: flex-end;">
        <button class="btn-add" @click="handleAddAttendance">
          + Tambah Attendance
        </button>
      </div>
      <div v-if="error" class="error-message">{{ error }}</div>
      <div v-if="isLoading" class="loading">Memuat data...</div>
      <div v-else-if="attendances.length === 0" class="empty-state">
        <p>Tidak ada data attendance</p>
      </div>
      <table v-else class="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Worker</th>
            <th>Status</th>
            <th>Tanggal</th>
            <th>Waktu</th>
            <th>Coordinator</th>
            <th>Supervisor</th>
            <th>Catatan</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="a in attendances" :key="a.id">
            <td data-label="ID">{{ a.id }}</td>
            <td data-label="Worker">{{ a.worker?.name || '-' }}</td>
            <td data-label="Status">{{ a.status }}</td>
            <td data-label="Tanggal">{{ new Date(a.date).toLocaleDateString('id-ID') }}</td>
            <td data-label="Waktu">{{ a.time }}</td>
            <td data-label="Coordinator">
              <span v-if="a.approved_coordinator" class="badge approved">Approved</span>
              <span v-else class="badge draft">Pending</span>
            </td>
            <td data-label="Supervisor">
              <span v-if="a.approved_supervisor" class="badge approved">Approved</span>
              <span v-else class="badge pending">Pending</span>
            </td>
            <td data-label="Catatan">{{ a.notes || '-' }}</td>
            <td class="actions" data-label="Aksi">
              <button class="btn-approve" v-if="!a.approved_supervisor" @click="handleApproveAttendance(a.id)">Approve</button>
              <button class="btn-edit" @click="handleEditAttendance(a)">Edit</button>
              <button class="btn-delete" @click="handleDeleteAttendance(a.id)">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
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

.supervisor-name {
  margin: 0;
  font-size: 0.875rem;
  color: #666;
  font-weight: 500;
}

.header-actions {
  display: flex;
  gap: 0.75rem;
}

.tab-buttons {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.tab-btn {
  padding: 0.5rem 1rem;
  background: white;
  color: #333b5f;
  border: 2px solid #beceea;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.tab-btn.active,
.tab-btn:hover {
  border-color: #333b5f;
  background: #f8f9fa;
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

.btn-approve {
  padding: 0.5rem 1rem;
  background: #28a745;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.875rem;
  transition: all 0.2s ease;
}

.btn-approve:hover {
  background: #218838;
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
}

.btn-detail:hover {
  background: #138496;
}

.btn-edit {
  padding: 0.5rem 1rem;
  background: #ffc107;
  color: #000;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.875rem;
  transition: all 0.2s ease;
}

.btn-edit:hover {
  background: #e0a800;
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

.btn-add {
  padding: 0.75rem 1.5rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
}

.btn-add:hover {
  background: #2563eb;
  transform: translateY(-1px);
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

  .supervisor-name {
    font-size: 0.8125rem;
  }

  .header-actions {
    flex-direction: column;
    width: 100%;
  }

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

  .btn-approve,
  .btn-detail,
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

.log-mode-buttons {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.mode-btn {
  padding: 0.5rem 1rem;
  background: white;
  color: #333b5f;
  border: 1px solid #beceea;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9rem;
}

.mode-btn:hover {
  background: #f8f9fa;
  border-color: #333b5f;
}

.mode-btn.active {
  background: #333b5f;
  color: white;
  border-color: #333b5f;
}
</style>


