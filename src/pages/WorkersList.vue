<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { workersApi } from '../api/workers'
import { positionsApi } from '../api/positions'
import { departmentsApi } from '../api/departments'
import { modal } from '../plugins/modal'

const router = useRouter()
const workers = ref([])
const positions = ref([])
const departments = ref([])
const isLoading = ref(false)
const error = ref(null)
const isDev = import.meta.env.DEV

const fetchData = async () => {
  isLoading.value = true
  error.value = null
  try {
    const [workerRes, posRes, deptRes] = await Promise.all([
      workersApi.getAll(),
      positionsApi.getAll(),
      departmentsApi.getAll()
    ])
    
    // Handle response - axios wraps response in .data
    workers.value = Array.isArray(workerRes.data) ? workerRes.data : (workerRes.data?.data || [])
    positions.value = Array.isArray(posRes.data) ? posRes.data : (posRes.data?.data || [])
    departments.value = Array.isArray(deptRes.data) ? deptRes.data : (deptRes.data?.data || [])
  } catch (err) {
    error.value = err.response?.data?.detail || 'Gagal memuat data'
  } finally {
    isLoading.value = false
  }
}

const getPositionCode = (positionId) => {
  if (!positionId) return '-'
  const position = positions.value.find(p => p.id === positionId)
  return position ? position.code : '-'
}

const getDepartmentName = (departmentId) => {
  if (!departmentId) return '-'
  const dept = departments.value.find(d => d.id === departmentId)
  return dept ? dept.name : '-'
}

const handleDelete = async (id, name) => {
  const confirmed = await modal.confirm(`Yakin ingin menghapus worker "${name}"?`)
  if (!confirmed) return
  
  try {
    await workersApi.delete(id)
    await modal.showSuccess('Worker berhasil dihapus')
    fetchData()
  } catch (err) {
    await modal.showError(err.response?.data?.detail || 'Gagal menghapus worker')
  }
}

const handleEdit = (id) => {
  router.push(`/workers/${id}/edit`)
}

const handleCreate = () => {
  router.push('/workers/create')
}

const goBack = () => {
  router.push('/master-data')
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
        <h1>Workers</h1>
      </div>
      <button class="btn-primary" @click="handleCreate">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        Tambah Worker
      </button>
    </div>

    <div v-if="error" class="error-message">{{ error }}</div>
    <div v-if="isLoading" class="loading">Memuat data...</div>
    
    <!-- Debug info (development only) -->
    <div v-if="!isLoading && isDev" style="padding: 1rem; background: #f0f0f0; margin-bottom: 1rem; border-radius: 8px; font-size: 0.875rem;">
      <strong>Debug Info:</strong><br>
      Workers Count: {{ workers.length }}<br>
      Workers Type: {{ Array.isArray(workers) ? 'Array' : typeof workers }}<br>
      <span v-if="workers.length > 0">
        First Worker ID: {{ workers[0]?.id }}<br>
        First Worker Name: {{ workers[0]?.name }}
      </span>
      <span v-else>No workers data</span>
    </div>
    
    <div v-else-if="!isLoading && workers.length === 0" class="empty-state">
      <p>Tidak ada data workers</p>
      <p style="font-size: 0.875rem; color: #666; margin-top: 0.5rem;">
        Pastikan backend API running dan environment sudah benar.
      </p>
    </div>

    <table v-else-if="!isLoading && workers.length > 0" class="data-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Name</th>
          <th>Position</th>
          <th>Department</th>
          <th>Aksi</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="worker in workers" :key="worker.id">
          <td data-label="ID">{{ worker.id }}</td>
          <td data-label="Name">{{ worker.name }}</td>
          <td data-label="Position">{{ getPositionCode(worker.position_id) }}</td>
          <td data-label="Department">{{ getDepartmentName(worker.department_id) }}</td>
          <td class="actions" data-label="Aksi">
            <button class="btn-edit" @click="handleEdit(worker.id)">Edit</button>
            <button class="btn-delete" @click="handleDelete(worker.id, worker.name)">Hapus</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.page-container {
  padding: 2rem;
  max-width: 1200px;
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
}

.data-table td {
  padding: 1rem;
  border-bottom: 1px solid #e9ecef;
}

.data-table tr:hover {
  background: #f8f9fa;
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

  .btn-primary {
    width: 100%;
    justify-content: center;
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

  .data-table td {
    font-size: 0.8125rem;
  }
}
</style>

