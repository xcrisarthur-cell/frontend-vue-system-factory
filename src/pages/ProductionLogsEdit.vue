<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { productionLogsApi } from '../api/productionLogs'
import { workersApi } from '../api/workers'
import api from '../api/http'
import { modal } from '../plugins/modal'

const route = useRoute()
const router = useRouter()
const logId = route.params.id
const isEdit = ref(!!logId)
const isLoading = ref(false)
const isSubmitting = ref(false)
const error = ref(null)

// Master data
const workers = ref([])
const positions = ref([])
const subPositions = ref([])
const shifts = ref([])
const suppliers = ref([])
const items = ref([])

const form = ref({
  worker_id: '',
  position_id: '',
  sub_position_id: '',
  shift_id: '',
  supplier_id: '',
  item_id: '',
  qty_output: 0,
  qty_reject: 0,
  problem_duration_minutes: null
})

const hasSubPositions = ref(false)

const fetchMasterData = async () => {
  try {
    const [workersRes, positionsRes, shiftsRes, suppliersRes, itemsRes] = await Promise.all([
      workersApi.getAll(),
      api.get('/positions'),
      api.get('/shifts'),
      api.get('/suppliers'),
      api.get('/items')
    ])
    workers.value = workersRes.data
    positions.value = positionsRes.data
    shifts.value = shiftsRes.data
    suppliers.value = suppliersRes.data
    items.value = itemsRes.data
  } catch (err) {
    console.error('Error loading master data:', err)
  }
}

const loadSubPositions = async () => {
  form.value.sub_position_id = ''
  subPositions.value = []
  hasSubPositions.value = false
  
  if (!form.value.position_id) return
  
  try {
    const res = await api.get(`/sub-positions/by-position/${form.value.position_id}`)
    subPositions.value = res.data
    hasSubPositions.value = subPositions.value.length > 0
  } catch (err) {
    console.error('Error loading sub positions:', err)
  }
}

const fetchLog = async () => {
  if (!logId) return
  
  isLoading.value = true
  try {
    const res = await productionLogsApi.getById(logId)
    const log = res.data
    
    form.value = {
      worker_id: log.worker_id || '',
      position_id: log.position_id || '',
      sub_position_id: log.sub_position_id || '',
      shift_id: log.shift_id || '',
      supplier_id: log.supplier_id || '',
      item_id: log.item_id || '',
      qty_output: log.qty_output || 0,
      qty_reject: log.qty_reject || 0,
      problem_duration_minutes: log.problem_duration_minutes || null
    }

    // Load sub positions if position is selected
    if (form.value.position_id) {
      await loadSubPositions()
    }
  } catch (err) {
    error.value = err.response?.data?.detail || 'Gagal memuat data production log'
    console.error('Error loading production log:', err)
  } finally {
    isLoading.value = false
  }
}

const submit = async () => {
  if (!form.value.worker_id || !form.value.position_id || !form.value.shift_id || !form.value.item_id) {
    await modal.showWarning('Worker, Position, Shift, dan Item wajib diisi')
    return
  }

  if (!form.value.qty_output && !form.value.qty_reject) {
    await modal.showWarning('Qty Output atau Qty Reject wajib diisi')
    return
  }

  if (form.value.qty_reject > form.value.qty_output) {
    await modal.showWarning('Qty Reject tidak boleh lebih besar dari Qty Output')
    return
  }

  // Jika position punya sub position, wajib dipilih
  if (hasSubPositions.value && !form.value.sub_position_id) {
    await modal.showWarning('Sub Position wajib dipilih untuk posisi ini')
    return
  }

  isSubmitting.value = true
  error.value = null

  try {
    if (isEdit.value) {
      const updateData = {
        worker_id: Number(form.value.worker_id),
        position_id: Number(form.value.position_id),
        sub_position_id: form.value.sub_position_id ? Number(form.value.sub_position_id) : null,
        shift_id: Number(form.value.shift_id),
        supplier_id: form.value.supplier_id ? Number(form.value.supplier_id) : null,
        item_id: Number(form.value.item_id),
        qty_output: Number(form.value.qty_output),
        qty_reject: Number(form.value.qty_reject),
        problem_duration_minutes: form.value.problem_duration_minutes ? Number(form.value.problem_duration_minutes) : null
      }
      
      await productionLogsApi.update(logId, updateData)
      await modal.showSuccess('Production log berhasil diperbarui')
      
      // Redirect back based on where user came from
      const from = route.query.from
      const workerId = route.query.worker_id
      
      if (from === 'coordinator') {
        router.push('/production-coordinator')
      } else if (from === 'admin-produksi') {
        router.push('/production-admin-produksi')
      } else if (workerId) {
        router.push(`/production-logs?worker_id=${workerId}`)
      } else {
        router.push('/production-logs')
      }
    } else {
      await modal.showInfo('Mode create belum diimplementasikan. Silakan gunakan Production Input untuk membuat production log baru.')
      return
    }
  } catch (err) {
    error.value = err.response?.data?.detail || 'Gagal menyimpan production log'
    await modal.showError(error.value)
  } finally {
    isSubmitting.value = false
  }
}

const goBack = () => {
  // Redirect back based on where user came from
  const from = route.query.from
  const workerId = route.query.worker_id
  
  if (from === 'coordinator') {
    router.push('/production-coordinator')
  } else if (from === 'admin-produksi') {
    router.push('/production-admin-produksi')
  } else if (workerId) {
    router.push(`/production-logs?worker_id=${workerId}`)
  } else {
    router.push('/production-logs')
  }
}

onMounted(async () => {
  await fetchMasterData()
  if (isEdit.value) {
    await fetchLog()
  }
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
        <h1>{{ isEdit ? 'Edit Production Log' : 'Tambah Production Log' }}</h1>
      </div>
    </div>

    <div v-if="error" class="error-message">{{ error }}</div>
    <div v-if="isLoading" class="loading">Memuat data...</div>

    <form v-else @submit.prevent="submit" class="form-container">
      <div class="form-row">
        <div class="form-group">
          <label for="worker_id">Worker *</label>
          <select id="worker_id" v-model="form.worker_id" class="form-select" required>
            <option disabled value="">Pilih Worker</option>
            <option v-for="worker in workers" :key="worker.id" :value="worker.id">
              {{ worker.name }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label for="position_id">Position *</label>
          <select id="position_id" v-model="form.position_id" @change="loadSubPositions" class="form-select" required>
            <option disabled value="">Pilih Position</option>
            <option v-for="position in positions" :key="position.id" :value="position.id">
              {{ position.code }}
            </option>
          </select>
        </div>
      </div>

      <div class="form-group" v-if="hasSubPositions">
        <label for="sub_position_id">Sub Position {{ hasSubPositions ? '*' : '' }}</label>
        <select id="sub_position_id" v-model="form.sub_position_id" class="form-select" :required="hasSubPositions">
          <option disabled value="">Pilih Sub Position</option>
          <option v-for="subPos in subPositions" :key="subPos.id" :value="subPos.id">
            {{ subPos.code }}
          </option>
        </select>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="shift_id">Shift *</label>
          <select id="shift_id" v-model="form.shift_id" class="form-select" required>
            <option disabled value="">Pilih Shift</option>
            <option v-for="shift in shifts" :key="shift.id" :value="shift.id">
              {{ shift.name }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label for="supplier_id">Supplier</label>
          <select id="supplier_id" v-model="form.supplier_id" class="form-select">
            <option value="">Tanpa Supplier</option>
            <option v-for="supplier in suppliers" :key="supplier.id" :value="supplier.id">
              {{ supplier.name }}
            </option>
          </select>
        </div>
      </div>

      <div class="form-group">
        <label for="item_id">Item *</label>
        <select id="item_id" v-model="form.item_id" class="form-select" required>
          <option disabled value="">Pilih Item</option>
          <option v-for="item in items" :key="item.id" :value="item.id">
            {{ item.item_name || item.item_number }}
          </option>
        </select>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="qty_output">Qty Output *</label>
          <input
            id="qty_output"
            v-model.number="form.qty_output"
            type="number"
            min="0"
            step="0.01"
            class="form-input"
            placeholder="Masukkan qty output"
            required
          />
        </div>

        <div class="form-group">
          <label for="qty_reject">Qty Reject *</label>
          <input
            id="qty_reject"
            v-model.number="form.qty_reject"
            type="number"
            min="0"
            step="0.01"
            class="form-input"
            placeholder="Masukkan qty reject"
            required
          />
        </div>
      </div>

      <div class="form-group">
        <label for="problem_duration_minutes">Problem Duration (Minutes)</label>
        <input
          id="problem_duration_minutes"
          v-model.number="form.problem_duration_minutes"
          type="number"
          min="0"
          step="1"
          class="form-input"
          placeholder="Masukkan durasi kendala (menit)"
        />
      </div>

      <div class="form-actions">
        <button type="button" class="btn-secondary" @click="goBack">Batal</button>
        <button type="submit" class="btn-primary" :disabled="isSubmitting">
          {{ isSubmitting ? 'Menyimpan...' : (isEdit ? 'Update' : 'Simpan') }}
        </button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.page-container {
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;
}

.page-header {
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

.form-container {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.form-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-row .form-group {
  margin-bottom: 0;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #333b5f;
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #beceea;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.3s ease;
  box-sizing: border-box;
}

.form-input:focus {
  outline: none;
  border-color: #333b5f;
  box-shadow: 0 0 0 4px rgba(51, 59, 95, 0.1);
}

.form-select {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #beceea;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.3s ease;
  box-sizing: border-box;
  background-color: white;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23333b5f' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.75rem center;
  padding-right: 2.5rem;
}

.form-select:focus {
  outline: none;
  border-color: #333b5f;
  box-shadow: 0 0 0 4px rgba(51, 59, 95, 0.1);
}

.form-select:hover {
  border-color: #333b5f;
  background-color: #f8f9fa;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
}

.btn-primary {
  padding: 0.75rem 1.5rem;
  background: #333b5f;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary:hover:not(:disabled) {
  background: #2a3250;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  padding: 0.75rem 1.5rem;
  background: white;
  color: #333b5f;
  border: 2px solid #beceea;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-secondary:hover {
  border-color: #333b5f;
  background: #f8f9fa;
}

.loading, .error-message {
  padding: 1rem;
  text-align: center;
}

.error-message {
  background: #f8d7da;
  color: #721c24;
  border-radius: 8px;
  margin-bottom: 1rem;
}

/* Responsive Design */
@media (max-width: 768px) {
  .page-container {
    padding: 1rem;
  }

  .header-left {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .back-button {
    padding: 0.5625rem 0.875rem;
    font-size: 0.875rem;
  }

  .page-header h1 {
    font-size: 1.5rem;
  }

  .form-container {
    padding: 1.5rem;
  }

  .form-row {
    grid-template-columns: 1fr;
    gap: 0;
    margin-bottom: 1.5rem;
  }

  .form-row .form-group {
    margin-bottom: 1.5rem;
  }

  .form-actions {
    flex-direction: column;
  }

  .btn-primary,
  .btn-secondary {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .page-container {
    padding: 0.75rem;
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
    font-size: 1.25rem;
  }

  .form-container {
    padding: 1rem;
  }

  .form-input {
    padding: 0.625rem;
    font-size: 0.9375rem;
  }

  .btn-primary,
  .btn-secondary {
    padding: 0.625rem 1rem;
    font-size: 0.875rem;
  }
}
</style>
    