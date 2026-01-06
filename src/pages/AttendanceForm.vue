<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '../api/http'
import { modal } from '../plugins/modal'

const route = useRoute()
const router = useRouter()
const attendanceId = route.params.id
const isLoading = ref(false)
const isSubmitting = ref(false)
const error = ref(null)

const workers = ref([])
const selectedWorkerIds = ref([])
const batchEntries = ref([])

const form = ref({
  worker_id: '',
  status: 'HADIR',
  date: '',
  time: '',
  notes: ''
})

const fetchWorkers = async () => {
  try {
    const res = await api.get('/workers')
    workers.value = res.data.filter(w => w.department?.name === 'Operator')
  } catch (err) {
    console.error('Error loading workers:', err)
  }
}

const fetchAttendance = async () => {
  if (!attendanceId) return
  isLoading.value = true
  try {
    const res = await api.get(`/attendances/${attendanceId}`)
    const a = res.data
    form.value = {
      worker_id: a.worker?.id || a.worker_id || '',
      status: a.status || 'HADIR',
      date: a.date,
      time: (a.time && typeof a.time === 'string') ? a.time.substring(0, 5) : a.time || '',
      notes: a.notes || ''
    }
  } catch (err) {
    error.value = err.response?.data?.detail || 'Gagal memuat data attendance'
  } finally {
    isLoading.value = false
  }
}

const normalizeTime = (t) => {
  if (!t) return ''
  if (t.length === 5) return `${t}:00`
  return t
}

const handleSubmit = async () => {
  if (attendanceId) {
    if (!form.value.worker_id || !form.value.status || !form.value.date || !form.value.time) {
      await modal.showWarning('Worker, Status, Tanggal, dan Waktu wajib diisi')
      return
    }
    isSubmitting.value = true
    error.value = null
    try {
      const payload = {
        worker_id: Number(form.value.worker_id),
        status: form.value.status,
        date: form.value.date,
        time: normalizeTime(form.value.time),
        notes: form.value.notes || null
      }
      await api.put(`/attendances/${attendanceId}`, payload)
      await modal.showSuccess('Attendance berhasil diperbarui')
      router.push('/production-coordinator')
    } catch (err) {
      error.value = err.response?.data?.detail || 'Gagal memperbarui attendance'
    } finally {
      isSubmitting.value = false
    }
  } else {
    if (!form.value.date || !form.value.time) {
      await modal.showWarning('Tanggal dan Waktu wajib diisi')
      return
    }
    if (batchEntries.value.length === 0) {
      await modal.showWarning('Pilih minimal satu worker untuk batch attendance')
      return
    }
    isSubmitting.value = true
    error.value = null
    try {
      const payloads = batchEntries.value.map(e => ({
        worker_id: Number(e.worker_id),
        status: e.status,
        date: form.value.date,
        time: normalizeTime(form.value.time),
        notes: e.notes || null,
        approved_coordinator: true
      }))
      await Promise.all(payloads.map(p => api.post('/attendances/', p)))
      await modal.showSuccess(`Attendance berhasil ditambahkan untuk ${payloads.length} worker`)
      router.push('/production-coordinator')
    } catch (err) {
      error.value = err.response?.data?.detail || 'Gagal menambahkan attendance batch'
    } finally {
      isSubmitting.value = false
    }
  }
}

const goBack = () => {
  router.push('/production-coordinator')
}

onMounted(async () => {
  await fetchWorkers()
  await fetchAttendance()
})

const toggleWorker = (id) => {
  const idx = selectedWorkerIds.value.indexOf(id)
  if (idx === -1) {
    selectedWorkerIds.value.push(id)
    batchEntries.value.push({ worker_id: id, status: 'HADIR', notes: '' })
  } else {
    selectedWorkerIds.value.splice(idx, 1)
    batchEntries.value = batchEntries.value.filter(e => e.worker_id !== id)
  }
}
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
        <h1>{{ attendanceId ? 'Edit Attendance' : 'Tambah Attendance' }}</h1>
      </div>
    </div>

    <div v-if="isLoading" class="loading">Memuat data...</div>
    <div v-else-if="error" class="error-message">{{ error }}</div>
    
    <div v-else class="form-card">
      <form @submit.prevent="handleSubmit">
        <template v-if="attendanceId">
          <div class="form-group">
            <label>Worker <span class="required">*</span></label>
            <select v-model="form.worker_id" required class="form-input">
              <option value="" disabled>Pilih Worker</option>
              <option v-for="w in workers" :key="w.id" :value="w.id">
                {{ w.name }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>Status <span class="required">*</span></label>
            <select v-model="form.status" required class="form-input">
              <option value="HADIR">HADIR</option>
              <option value="IJIN">IJIN</option>
              <option value="CUTI">CUTI</option>
              <option value="ALPA">ALPA</option>
            </select>
          </div>
          <div class="form-group">
            <label>Tanggal <span class="required">*</span></label>
            <input type="date" v-model="form.date" required class="form-input" />
          </div>
          <div class="form-group">
            <label>Waktu <span class="required">*</span></label>
            <input type="time" v-model="form.time" required class="form-input" />
          </div>
          <div class="form-group">
            <label>Catatan</label>
            <input type="text" v-model="form.notes" class="form-input" placeholder="Opsional" />
          </div>
        </template>
        <template v-else>
          <div class="form-group">
            <label>Tanggal <span class="required">*</span></label>
            <input type="date" v-model="form.date" required class="form-input" />
          </div>
          <div class="form-group">
            <label>Waktu <span class="required">*</span></label>
            <input type="time" v-model="form.time" required class="form-input" />
          </div>
          <div class="form-group">
            <label>Pilih Worker</label>
            <div class="checkbox-group">
              <label v-for="w in workers" :key="w.id" class="checkbox-label">
                <input type="checkbox" :value="w.id" :checked="selectedWorkerIds.includes(w.id)" @change="toggleWorker(w.id)" class="checkbox-input" />
                <span>{{ w.name }}</span>
              </label>
            </div>
          </div>
          <div v-if="batchEntries.length > 0" class="item-detail-card">
            <div class="item-detail-header">
              <span>Detail Attendance Per Worker</span>
            </div>
            <div class="item-detail-content">
              <div class="detail-row" v-for="entry in batchEntries" :key="entry.worker_id" style="display: grid; grid-template-columns: 1fr 160px 1fr; gap: 0.75rem; align-items: center;">
                <span class="detail-label">{{ workers.find(w => w.id === entry.worker_id)?.name }}</span>
                <select v-model="entry.status" class="form-input">
                  <option value="HADIR">HADIR</option>
                  <option value="IJIN">IJIN</option>
                  <option value="CUTI">CUTI</option>
                  <option value="ALPA">ALPA</option>
                </select>
                <input type="text" v-model="entry.notes" class="form-input" placeholder="Catatan (opsional)" />
              </div>
            </div>
          </div>
        </template>
        <div class="form-actions">
          <button type="button" class="btn-cancel" @click="goBack">Batal</button>
          <button type="submit" class="btn-submit" :disabled="isSubmitting">
            {{ isSubmitting ? 'Menyimpan...' : (attendanceId ? 'Simpan' : 'Simpan Batch') }}
          </button>
        </div>
      </form>
    </div>
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
  padding: 0.5rem 1rem;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s;
}

.back-button:hover {
  background: #f8fafc;
  color: #334155;
}

.form-card {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #334155;
}

.required {
  color: #ef4444;
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.form-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e2e8f0;
}

.btn-cancel {
  padding: 0.75rem 1.5rem;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  color: #64748b;
  cursor: pointer;
  font-weight: 500;
}

.btn-cancel:hover {
  background: #f8fafc;
}

.btn-submit {
  padding: 0.75rem 1.5rem;
  background: #3b82f6;
  border: none;
  border-radius: 8px;
  color: white;
  cursor: pointer;
  font-weight: 500;
}

.btn-submit:hover {
  background: #2563eb;
}

.btn-submit:disabled {
  background: #94a3b8;
  cursor: not-allowed;
}

.error-message {
  background: #fef2f2;
  color: #ef4444;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
}

.loading {
  text-align: center;
  padding: 2rem;
  color: #64748b;
}
</style>
