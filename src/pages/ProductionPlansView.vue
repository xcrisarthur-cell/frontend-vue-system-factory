<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import api from '../api/http'
import { modal } from '../plugins/modal'

const router = useRouter()
const route = useRoute()

const isLoading = ref(false)
const isSubmitting = ref(false)
const error = ref(null)

const productionPlans = ref([])
const workers = ref([])
const shifts = ref([])
const positions = ref([])
const subPositions = ref([])
const items = ref([])

const filterWorkerId = ref('')
const filterWorkerInput = ref('')
const filterShiftId = ref('')
const filterPositionId = ref('')
const filterSubPositionId = ref('')
const filterItemId = ref('')
const filterItemInput = ref('')
const filterCreatedDate = ref('')
const filterNoteQuery = ref('')

const isMasterDataView = computed(() => route.query.from === 'master-data')

const isFormOpen = ref(false)
const isEditing = ref(false)
const editingId = ref(null)
const formIsLoading = ref(false)
const formSubPositions = ref([])

const form = ref({
  worker_id: '',
  shift_id: '',
  position_id: '',
  sub_position_id: '',
  item_id: '',
  target: 0,
  note: ''
})

const toISODateInput = (dateValue) => {
  if (!dateValue) return ''
  const d = new Date(dateValue)
  if (Number.isNaN(d.getTime())) return ''
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

const normalizeText = (value) => {
  return String(value || '').trim().toLowerCase()
}

const syncWorkerFilterByInput = () => {
  const raw = String(filterWorkerInput.value || '').trim()
  if (!raw) {
    filterWorkerId.value = ''
    return
  }

  if (/^\d+$/.test(raw)) {
    const numericId = Number(raw)
    const byId = workers.value.find(w => w.id === numericId)
    if (byId) {
      filterWorkerId.value = String(byId.id)
      filterWorkerInput.value = byId.name
      return
    }
  }

  const q = normalizeText(raw)
  const byNameExact = workers.value.find(w => normalizeText(w.name) === q)
  if (byNameExact) {
    filterWorkerId.value = String(byNameExact.id)
    filterWorkerInput.value = byNameExact.name
    return
  }

  filterWorkerId.value = ''
}

const syncItemFilterByInput = () => {
  const raw = String(filterItemInput.value || '').trim()
  if (!raw) {
    filterItemId.value = ''
    return
  }

  const byNumber = items.value.find(i => String(i.item_number) === raw)
  if (byNumber) {
    filterItemId.value = String(byNumber.id)
    filterItemInput.value = byNumber.item_number
    return
  }

  if (/^\d+$/.test(raw)) {
    const numericId = Number(raw)
    const byId = items.value.find(i => i.id === numericId)
    if (byId) {
      filterItemId.value = String(byId.id)
      filterItemInput.value = byId.item_number
      return
    }
  }

  filterItemId.value = ''
}

const fetchData = async () => {
  isLoading.value = true
  error.value = null
  try {
    const [plansRes, workersRes, shiftsRes, positionsRes, itemsRes] = await Promise.all([
      api.get('/production-plans'),
      api.get('/workers'),
      api.get('/shifts'),
      api.get('/positions'),
      api.get('/items')
    ])
    productionPlans.value = Array.isArray(plansRes.data) ? plansRes.data : []
    workers.value = Array.isArray(workersRes.data) ? workersRes.data : []
    shifts.value = Array.isArray(shiftsRes.data) ? shiftsRes.data : []
    positions.value = Array.isArray(positionsRes.data) ? positionsRes.data : []
    items.value = Array.isArray(itemsRes.data) ? itemsRes.data : []
  } catch (err) {
    error.value = err.response?.data?.detail || 'Gagal memuat data rencana produksi'
  } finally {
    isLoading.value = false
  }
}

const loadSubPositions = async () => {
  filterSubPositionId.value = ''
  subPositions.value = []
  if (!filterPositionId.value) return
  try {
    const res = await api.get(`/sub-positions/by-position/${filterPositionId.value}`)
    subPositions.value = Array.isArray(res.data) ? res.data : []
  } catch (err) {
    await modal.showError(err.response?.data?.detail || 'Gagal memuat sub posisi')
  }
}

const loadFormSubPositions = async () => {
  form.value.sub_position_id = ''
  formSubPositions.value = []
  if (!form.value.position_id) return
  try {
    const res = await api.get(`/sub-positions/by-position/${form.value.position_id}`)
    formSubPositions.value = Array.isArray(res.data) ? res.data : []
  } catch (err) {
    await modal.showError(err.response?.data?.detail || 'Gagal memuat sub posisi')
  }
}

const resetForm = () => {
  isEditing.value = false
  editingId.value = null
  form.value = {
    worker_id: '',
    shift_id: '',
    position_id: '',
    sub_position_id: '',
    item_id: '',
    target: 0,
    note: ''
  }
  formSubPositions.value = []
}

const openCreate = () => {
  resetForm()
  isFormOpen.value = true
}

const openEdit = async (plan) => {
  resetForm()
  isEditing.value = true
  editingId.value = plan.id
  formIsLoading.value = true
  try {
    form.value = {
      worker_id: String(plan.worker_id ?? plan.worker?.id ?? ''),
      shift_id: String(plan.shift_id ?? plan.shift?.id ?? ''),
      position_id: String(plan.position_id ?? plan.position?.id ?? ''),
      sub_position_id: String(plan.sub_position_id ?? plan.sub_position?.id ?? ''),
      item_id: String(plan.item_id ?? plan.item?.id ?? ''),
      target: Number(plan.target ?? 0),
      note: String(plan.note ?? '')
    }
    if (form.value.position_id) {
      await loadFormSubPositions()
      if (formSubPositions.value.length > 0 && form.value.sub_position_id) {
        const exists = formSubPositions.value.some(sp => String(sp.id) === String(form.value.sub_position_id))
        if (!exists) form.value.sub_position_id = ''
      }
    }
  } finally {
    formIsLoading.value = false
    isFormOpen.value = true
  }
}

const closeForm = () => {
  isFormOpen.value = false
}

const submitForm = async () => {
  if (!isMasterDataView.value) return

  if (!form.value.worker_id || !form.value.shift_id || !form.value.position_id || !form.value.item_id) {
    await modal.showWarning('Worker, Shift, Position, dan Item wajib diisi')
    return
  }

  if (!form.value.target || Number(form.value.target) <= 0) {
    await modal.showWarning('Target wajib diisi dan lebih dari 0')
    return
  }

  if (formSubPositions.value.length > 0 && !form.value.sub_position_id) {
    await modal.showWarning('Sub Position wajib dipilih untuk posisi ini')
    return
  }

  isSubmitting.value = true
  try {
    const payload = {
      worker_id: Number(form.value.worker_id),
      shift_id: Number(form.value.shift_id),
      position_id: Number(form.value.position_id),
      sub_position_id: form.value.sub_position_id ? Number(form.value.sub_position_id) : null,
      item_id: Number(form.value.item_id),
      target: Number(form.value.target),
      note: form.value.note ? String(form.value.note) : null
    }

    if (isEditing.value && editingId.value) {
      await api.put(`/production-plans/${editingId.value}`, payload)
      await modal.showSuccess('Production plan berhasil diperbarui')
    } else {
      await api.post('/production-plans', payload)
      await modal.showSuccess('Production plan berhasil dibuat')
    }

    closeForm()
    await fetchData()
  } catch (err) {
    await modal.showError(err.response?.data?.detail || 'Gagal menyimpan production plan')
  } finally {
    isSubmitting.value = false
  }
}

const handleDelete = async (id) => {
  if (!isMasterDataView.value) return
  const confirmed = await modal.confirm('Yakin ingin menghapus production plan ini?')
  if (!confirmed) return
  isSubmitting.value = true
  try {
    await api.delete(`/production-plans/${id}`)
    await modal.showSuccess('Production plan berhasil dihapus')
    await fetchData()
  } catch (err) {
    await modal.showError(err.response?.data?.detail || 'Gagal menghapus production plan')
  } finally {
    isSubmitting.value = false
  }
}

const clearFilters = () => {
  filterWorkerId.value = ''
  filterWorkerInput.value = ''
  filterShiftId.value = ''
  filterPositionId.value = ''
  filterSubPositionId.value = ''
  filterItemId.value = ''
  filterItemInput.value = ''
  filterCreatedDate.value = ''
  filterNoteQuery.value = ''
  subPositions.value = []
}

const filteredPlans = computed(() => {
  let filtered = productionPlans.value

  if (filterWorkerId.value) {
    const id = Number(filterWorkerId.value)
    filtered = filtered.filter(p => (p.worker_id ?? p.worker?.id) === id)
  } else if (filterWorkerInput.value) {
    const q = normalizeText(filterWorkerInput.value)
    filtered = filtered.filter(p => normalizeText(p.worker?.name).includes(q))
  }

  if (filterShiftId.value) {
    const id = Number(filterShiftId.value)
    filtered = filtered.filter(p => (p.shift_id ?? p.shift?.id) === id)
  }

  if (filterPositionId.value) {
    const id = Number(filterPositionId.value)
    filtered = filtered.filter(p => (p.position_id ?? p.position?.id) === id)
  }

  if (filterSubPositionId.value) {
    const id = Number(filterSubPositionId.value)
    filtered = filtered.filter(p => (p.sub_position_id ?? p.sub_position?.id) === id)
  }

  if (filterItemId.value) {
    const id = Number(filterItemId.value)
    filtered = filtered.filter(p => (p.item_id ?? p.item?.id) === id)
  } else if (filterItemInput.value) {
    const q = normalizeText(filterItemInput.value)
    filtered = filtered.filter(p => {
      const byName = normalizeText(p.item?.item_name).includes(q)
      const byNumber = normalizeText(p.item?.item_number).includes(q)
      return byName || byNumber
    })
  }

  if (filterCreatedDate.value) {
    filtered = filtered.filter(p => toISODateInput(p.created_at) === filterCreatedDate.value)
  }

  if (filterNoteQuery.value) {
    const q = normalizeText(filterNoteQuery.value)
    filtered = filtered.filter(p => normalizeText(p.note).includes(q))
  }

  return [...filtered].sort((a, b) => (b.id || 0) - (a.id || 0))
})

const goBack = () => {
  if (route.query.from === 'master-data') {
    router.push('/master-data')
    return
  }
  router.push('/production-login')
}

onMounted(async () => {
  await fetchData()
})
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <div>
        <h1>Rencana Produksi</h1>
        <p class="subtitle">Daftar production plan beserta filter</p>
      </div>
      <div class="header-actions">
        <button v-if="isMasterDataView" class="btn-primary" @click="openCreate" type="button">Tambah Production Plan</button>
        <button class="btn-back" @click="goBack" type="button">Kembali</button>
      </div>
    </div>

    <div class="filters-section">
      <h3>Filter</h3>
      <div class="filters-grid">
        <div class="filter-group">
          <label>Worker</label>
          <input
            v-model="filterWorkerInput"
            class="filter-input"
            list="plans-worker-list"
            placeholder="Ketik nama worker"
            @blur="syncWorkerFilterByInput"
          />
          <datalist id="plans-worker-list">
            <option v-for="w in workers" :key="w.id" :value="w.name">{{ w.name }}</option>
          </datalist>
        </div>

        <div class="filter-group">
          <label>Position</label>
          <select v-model="filterPositionId" class="filter-input" @change="loadSubPositions">
            <option value="">Semua Position</option>
            <option v-for="p in positions" :key="p.id" :value="p.id">{{ p.code }}</option>
          </select>
        </div>

        <div class="filter-group" v-if="subPositions.length > 0">
          <label>Sub Position</label>
          <select v-model="filterSubPositionId" class="filter-input">
            <option value="">Semua Sub Position</option>
            <option v-for="sp in subPositions" :key="sp.id" :value="sp.id">{{ sp.code }}</option>
          </select>
        </div>

        <div class="filter-group">
          <label>Shift</label>
          <select v-model="filterShiftId" class="filter-input">
            <option value="">Semua Shift</option>
            <option v-for="s in shifts" :key="s.id" :value="s.id">{{ s.name }}</option>
          </select>
        </div>

        <div class="filter-group">
          <label>Item</label>
          <input
            v-model="filterItemInput"
            class="filter-input"
            list="plans-item-list"
            placeholder="Ketik item number"
            @blur="syncItemFilterByInput"
          />
          <datalist id="plans-item-list">
            <option v-for="i in items" :key="i.id" :value="i.item_number">
              {{ i.item_name || i.item_number }}
            </option>
          </datalist>
        </div>

        <div class="filter-group">
          <label>Tanggal Dibuat</label>
          <input v-model="filterCreatedDate" type="date" class="filter-input" />
        </div>

        <div class="filter-group">
          <label>Catatan</label>
          <input v-model="filterNoteQuery" type="text" class="filter-input" placeholder="Cari catatan" />
        </div>

        <div class="filter-group">
          <button class="btn-clear" @click="clearFilters" type="button">Clear Filters</button>
        </div>
      </div>
    </div>

    <div v-if="error" class="error-message">{{ error }}</div>
    <div v-if="isLoading" class="loading">Memuat data...</div>
    <div v-else-if="filteredPlans.length === 0" class="empty-state">
      <p>Tidak ada data rencana produksi</p>
    </div>

    <table v-else class="data-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Nama</th>
          <th>Posisi</th>
          <th>Mesin</th>
          <th>Item / Barang</th>
          <th class="num">Target</th>
          <th>Shift</th>
          <th>Catatan</th>
          <th>Tanggal</th>
          <th>Diperbarui</th>
          <th>Dibuat Oleh</th>
          <th v-if="isMasterDataView">Aksi</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="p in filteredPlans" :key="p.id">
          <td data-label="ID">{{ p.id }}</td>
          <td data-label="Worker">{{ p.worker?.name || '-' }}</td>
          <td data-label="Position">{{ p.position?.code || '-' }}</td>
          <td data-label="Sub Position">{{ p.sub_position?.code || '-' }}</td>
          <td data-label="Item">{{ p.item?.item_name || p.item?.item_number || '-' }}</td>
          <td class="num" data-label="Target">{{ p.target }}</td>
          <td data-label="Shift">{{ p.shift?.name || '-' }}</td>
          <td data-label="Catatan">{{ p.note || '-' }}</td>
          <td data-label="Dibuat">{{ p.created_at ? new Date(p.created_at).toLocaleString('id-ID') : '-' }}</td>
          <td data-label="Diperbarui">{{ p.updated_at ? new Date(p.updated_at).toLocaleString('id-ID') : '-' }}</td>
          <td data-label="Dibuat Oleh">{{ p.created_by_worker?.name || '-' }}</td>
          <td v-if="isMasterDataView" class="actions" data-label="Aksi">
            <div class="action-buttons">
              <button class="btn-edit" type="button" @click="openEdit(p)" :disabled="isSubmitting">Edit</button>
              <button class="btn-delete" type="button" @click="handleDelete(p.id)" :disabled="isSubmitting">Hapus</button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-if="isFormOpen" class="modal-overlay" @click.self="closeForm">
      <div class="modal-card">
        <div class="modal-header">
          <h3>{{ isEditing ? 'Edit Production Plan' : 'Tambah Production Plan' }}</h3>
          <button class="btn-icon" type="button" @click="closeForm">✕</button>
        </div>

        <div v-if="formIsLoading" class="modal-loading">Memuat...</div>

        <form v-else class="modal-body" @submit.prevent="submitForm">
          <div class="form-grid">
            <div class="form-group">
              <label>Worker *</label>
              <select v-model="form.worker_id" class="filter-input" required>
                <option disabled value="">Pilih Worker</option>
                <option v-for="w in workers" :key="w.id" :value="String(w.id)">{{ w.name }}</option>
              </select>
            </div>

            <div class="form-group">
              <label>Shift *</label>
              <select v-model="form.shift_id" class="filter-input" required>
                <option disabled value="">Pilih Shift</option>
                <option v-for="s in shifts" :key="s.id" :value="String(s.id)">{{ s.name }}</option>
              </select>
            </div>

            <div class="form-group">
              <label>Position *</label>
              <select v-model="form.position_id" class="filter-input" required @change="loadFormSubPositions">
                <option disabled value="">Pilih Position</option>
                <option v-for="p in positions" :key="p.id" :value="String(p.id)">{{ p.code }}</option>
              </select>
            </div>

            <div class="form-group" v-if="formSubPositions.length > 0">
              <label>Sub Position *</label>
              <select v-model="form.sub_position_id" class="filter-input" required>
                <option disabled value="">Pilih Sub Position</option>
                <option v-for="sp in formSubPositions" :key="sp.id" :value="String(sp.id)">{{ sp.code }}</option>
              </select>
            </div>

            <div class="form-group">
              <label>Item *</label>
              <select v-model="form.item_id" class="filter-input" required>
                <option disabled value="">Pilih Item</option>
                <option v-for="i in items" :key="i.id" :value="String(i.id)">
                  {{ i.item_number }} - {{ i.item_name || '-' }}
                </option>
              </select>
            </div>

            <div class="form-group">
              <label>Target *</label>
              <input v-model.number="form.target" type="number" min="1" class="filter-input" required />
            </div>

            <div class="form-group form-wide">
              <label>Catatan</label>
              <input v-model="form.note" type="text" class="filter-input" placeholder="Catatan (opsional)" />
            </div>
          </div>

          <div class="modal-actions">
            <button class="btn-back" type="button" @click="closeForm" :disabled="isSubmitting">Batal</button>
            <button class="btn-primary" type="submit" :disabled="isSubmitting">
              {{ isSubmitting ? 'Menyimpan...' : 'Simpan' }}
            </button>
          </div>
        </form>
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
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  gap: 1rem;
}

.page-header h1 {
  margin: 0 0 0.25rem 0;
  font-size: 2rem;
  font-weight: 700;
  color: #333b5f;
}

.subtitle {
  margin: 0;
  font-size: 0.9rem;
  color: #666;
  font-weight: 500;
}

.header-actions {
  display: flex;
  gap: 0.75rem;
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

.btn-primary {
  padding: 0.75rem 1.25rem;
  background: #2563eb;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary:hover {
  background: #1d4ed8;
}

.filters-section {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 1.5rem;
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
  white-space: nowrap;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

.btn-edit,
.btn-delete {
  padding: 0.4rem 0.75rem;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
}

.btn-edit {
  background: #f3f4f6;
  color: #374151;
}

.btn-delete {
  background: #fee2e2;
  color: #991b1b;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  z-index: 50;
}

.modal-card {
  width: 100%;
  max-width: 720px;
  background: #fff;
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.1rem;
  color: #111827;
}

.btn-icon {
  background: transparent;
  border: none;
  font-size: 1.1rem;
  cursor: pointer;
  color: #6b7280;
  padding: 0.25rem 0.5rem;
  border-radius: 8px;
}

.btn-icon:hover {
  background: #f3f4f6;
  color: #111827;
}

.modal-loading {
  padding: 1.5rem;
  color: #6b7280;
}

.modal-body {
  padding: 1.25rem;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.form-wide {
  grid-column: 1 / -1;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.25rem;
}

@media (max-width: 640px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}

.data-table td {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #e9ecef;
  font-size: 0.9rem;
  vertical-align: middle;
}

.data-table tr:hover {
  background: #f8f9fa;
}

.num {
  text-align: right;
}

.loading,
.empty-state {
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

/* Tablet & Mobile (Table Card View) */
@media (max-width: 1024px) {
  .page-container {
    padding: 1rem;
  }

  /* Table Card View */
  .data-table {
    display: block;
    background: transparent;
    box-shadow: none;
    border-radius: 0;
  }

  .data-table thead {
    display: none;
  }

  .data-table tbody {
    display: block;
    width: 100%;
  }

  .data-table tr {
    display: block;
    background: white;
    margin-bottom: 1rem;
    border-radius: 12px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    border: 1px solid #e5e7eb;
    overflow: hidden;
  }

  .data-table td {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid #f3f4f6;
    text-align: right;
    min-height: 3rem;
  }

  .data-table td:last-child {
    border-bottom: none;
  }

  .data-table td::before {
    content: attr(data-label);
    font-weight: 600;
    color: #6b7280;
    font-size: 0.85rem;
    text-align: left;
    margin-right: 1rem;
    flex: 1;
  }

  .data-table td .action-buttons {
    width: 100%;
    justify-content: flex-end;
  }
}

/* Mobile Layout Adjustments */
@media (max-width: 640px) {
  .page-header {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }

  .header-actions {
    flex-direction: column;
    width: 100%;
  }

  .header-actions button {
    width: 100%;
    justify-content: center;
  }

  .filters-grid {
    grid-template-columns: 1fr;
  }
}
</style>
