<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '../api/http'
import { modal } from '../plugins/modal'

const router = useRouter()
const attendances = ref([])
const isLoading = ref(false)
const error = ref(null)

const fetchAttendances = async () => {
  isLoading.value = true
  error.value = null
  try {
    const res = await api.get('/attendances')
    attendances.value = res.data
  } catch (err) {
    error.value = err.response?.data?.detail || 'Gagal memuat data attendances'
    console.error('Error fetching attendances:', err)
  } finally {
    isLoading.value = false
  }
}

const handleDelete = async (id) => {
  const confirmed = await modal.confirm(`Yakin ingin menghapus attendance #${id}?`)
  if (!confirmed) return
  
  try {
    await api.delete(`/attendances/${id}`)
    await modal.showSuccess('Attendance berhasil dihapus')
    fetchAttendances()
  } catch (err) {
    await modal.showError(err.response?.data?.detail || 'Gagal menghapus attendance')
  }
}

const handleEdit = (id) => {
  router.push(`/attendances/${id}/edit`)
}

const handleCreate = () => {
  router.push('/attendances/create')
}

const goBack = () => {
  router.push('/master-data')
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

const formatTime = (timeString) => {
  if (!timeString) return '-'
  return timeString.substring(0, 5)
}

onMounted(() => {
  fetchAttendances()
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
        <h1>Attendances</h1>
      </div>
      <button class="btn-primary" @click="handleCreate">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        Tambah Attendance
      </button>
    </div>

    <div v-if="error" class="error-message">{{ error }}</div>

    <div v-if="isLoading" class="loading">Memuat data...</div>

    <div v-else-if="attendances.length === 0" class="empty-state">
      <p>Tidak ada data attendances</p>
    </div>

    <table v-else class="data-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Worker</th>
          <th>Tanggal</th>
          <th>Waktu</th>
          <th>Status</th>
          <th>Notes</th>
          <th>Aksi</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="attendance in attendances" :key="attendance.id">
          <td data-label="ID">{{ attendance.id }}</td>
          <td data-label="Worker">{{ attendance.worker?.name || attendance.worker_id }}</td>
          <td data-label="Tanggal">{{ formatDate(attendance.date) }}</td>
          <td data-label="Waktu">{{ formatTime(attendance.time) }}</td>
          <td data-label="Status">
            <span :class="['status-badge', attendance.status.toLowerCase()]">
              {{ attendance.status }}
            </span>
          </td>
          <td data-label="Notes">{{ attendance.notes || '-' }}</td>
          <td class="actions" data-label="Aksi">
            <button class="btn-edit" @click="handleEdit(attendance.id)">Edit</button>
            <button class="btn-delete" @click="handleDelete(attendance.id)">Hapus</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.page-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.back-button {
  display: flex;
  align-items: center;
  gap: 8px;
  background: none;
  border: none;
  color: #666;
  font-size: 1rem;
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.back-button:hover {
  background-color: #f3f4f6;
  color: #111827;
}

h1 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.btn-primary {
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: #2563eb;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-primary:hover {
  background-color: #1d4ed8;
}

.error-message {
  background-color: #fee2e2;
  color: #b91c1c;
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 16px;
}

.loading, .empty-state {
  text-align: center;
  padding: 40px;
  color: #6b7280;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.data-table th,
.data-table td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}

.data-table th {
  background-color: #f9fafb;
  font-weight: 600;
  color: #374151;
}

.actions {
  display: flex;
  gap: 8px;
}

.btn-edit, .btn-delete {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: background-color 0.2s;
}

.btn-edit {
  background-color: #f3f4f6;
  color: #4b5563;
}

.btn-edit:hover {
  background-color: #e5e7eb;
}

.btn-delete {
  background-color: #fee2e2;
  color: #991b1b;
}

.btn-delete:hover {
  background-color: #fecaca;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  background-color: #e5e7eb;
  color: #374151;
}

.status-badge.hadir {
  background-color: #d1fae5;
  color: #065f46;
}

.status-badge.izin, .status-badge.sakit {
  background-color: #fef3c7;
  color: #92400e;
}

.status-badge.alpha {
  background-color: #fee2e2;
  color: #991b1b;
}

@media (max-width: 768px) {
  .data-table, .data-table tbody, .data-table tr, .data-table td {
    display: block;
    width: 100%;
  }

  .data-table thead {
    display: none;
  }

  .data-table tr {
    margin-bottom: 16px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    box-shadow: 0 1px 2px rgba(0,0,0,0.05);
  }

  .data-table td {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #f3f4f6;
    padding: 12px;
  }

  .data-table td:last-child {
    border-bottom: none;
  }

  .data-table td::before {
    content: attr(data-label);
    font-weight: 600;
    color: #374151;
    margin-right: 12px;
  }

  .actions {
    justify-content: flex-end;
  }
}
</style>
