<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { productionLogsApi } from '../api/productionLogs'
import { workersApi } from '../api/workers'
import api from '../api/http'
import { modal } from '../plugins/modal'

const router = useRouter()
const route = useRoute()

const logs = ref([])
const isLoading = ref(false)
const error = ref(null)

// Filter states
const filterWorkerId = ref('')
const filterShiftId = ref('')
const filterDate = ref('')
const filterPositionId = ref('')
const filterSubPositionId = ref('')
const filterSupplierId = ref('')
const filterItemId = ref('')

// Master data
const workers = ref([])
const shifts = ref([])
const positions = ref([])
const subPositions = ref([])
const suppliers = ref([])
const items = ref([])

// Check if accessed from operator (has worker_id query param)
const isOperatorView = computed(() => {
  return !!route.query.worker_id
})

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

    // Set default filter worker_id if from query param
    if (route.query.worker_id) {
      filterWorkerId.value = route.query.worker_id
    }
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

// Filter logs
const filteredLogs = computed(() => {
  let filtered = logs.value

  // Default filter: jika dari operator view, filter by worker_id
  if (isOperatorView.value && route.query.worker_id) {
    filtered = filtered.filter(log => log.worker_id === Number(route.query.worker_id))
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

const handleEdit = (id) => {
  const workerId = route.query.worker_id
  const from = route.query.from
  if (workerId) {
    const query = new URLSearchParams()
    query.set('worker_id', workerId)
    if (from) query.set('from', String(from))
    router.push(`/production-logs/${id}/edit?${query.toString()}`)
  } else {
    if (from) {
      router.push(`/production-logs/${id}/edit?from=${encodeURIComponent(String(from))}`)
    } else {
      router.push(`/production-logs/${id}/edit`)
    }
  }
}

const handleCreate = () => {
  const from = route.query.from
  if (from) {
    router.push(`/production-logs/create?from=${encodeURIComponent(String(from))}`)
    return
  }
  router.push('/production-logs/create')
}

const goBack = () => {
  if (route.query.from === 'master-data') {
    router.push('/master-data')
    return
  }
  // Jika dari operator view, kembali ke ProductionLogin
  if (isOperatorView.value && route.query.worker_id) {
    router.push('/production-operator')
  } else {
    // Kembali ke halaman sebelumnya atau home
    router.push('/')
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
  subPositions.value = []
  
  // Reset to query param worker_id if exists
  if (route.query.worker_id) {
    filterWorkerId.value = route.query.worker_id
  }
}

onMounted(() => {
  fetchData()
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
        <h1>Production Logs</h1>
      </div>
      <button v-if="!isOperatorView" class="btn-primary" @click="handleCreate">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        Tambah Production Log
      </button>
    </div>

    <!-- Filters -->
    <div class="filters-section">
      <h3>Filter</h3>
      <div class="filters-grid">
        <div class="filter-group">
          <label>Worker</label>
          <select v-model="filterWorkerId" class="filter-input" :disabled="isOperatorView">
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
          <th>Status</th>
          <th v-if="!isOperatorView">Aksi</th>
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
          <td data-label="Status">
            <span v-if="log.approved_spv" class="badge approved">Approved</span>
            <span v-else-if="log.approved_coordinator" class="badge pending">Pending SPV</span>
            <span v-else class="badge draft">Draft</span>
          </td>
          <td v-if="!isOperatorView" class="actions" data-label="Aksi">
            <button class="btn-edit" @click="handleEdit(log.id)">Edit</button>
            <button class="btn-delete" @click="handleDelete(log.id)">Hapus</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
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

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.back-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  background: transparent;
  border: 2px solid #beceea;
  border-radius: 8px;
  color: #333b5f;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.back-button:hover {
  background: #f8f9fa;
  border-color: #333b5f;
  transform: translateX(-2px);
}

.back-button:active {
  transform: translateX(0);
}

.page-header h1 {
  margin: 0;
  font-size: 2rem;
  font-weight: 700;
  color: #333b5f;
}

.btn-primary {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #333b5f;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary:hover {
  background: #2a3250;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(51, 59, 95, 0.3);
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
}

.filter-input:focus {
  outline: none;
  border-color: #333b5f;
  box-shadow: 0 0 0 4px rgba(51, 59, 95, 0.1);
}

.filter-input:disabled {
  background-color: #f0f2f5;
  color: #666;
  cursor: not-allowed;
  opacity: 0.6;
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

  .header-left {
    width: 100%;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .back-button {
    padding: 0.5625rem 0.875rem;
    font-size: 0.875rem;
  }

  .btn-primary {
    width: 100%;
    justify-content: center;
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

  .back-button {
    padding: 0.5rem 0.75rem;
    font-size: 0.8125rem;
  }

  .back-button svg {
    width: 18px;
    height: 18px;
  }

  .page-header h1 {
    font-size: 1.5rem;
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
  }

  .btn-clear {
    padding: 0.625rem 1rem;
    font-size: 0.875rem;
  }

  .data-table td {
    font-size: 0.8125rem;
  }

  .badge {
    font-size: 0.6875rem;
    padding: 0.2rem 0.5rem;
  }
}
</style>
