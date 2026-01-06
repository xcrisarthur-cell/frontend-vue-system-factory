<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import api from '../api/http'
import { useRouter } from 'vue-router'
import { useSessionStore } from '../store/session'
import { modal } from '../plugins/modal'

const router = useRouter()
const session = useSessionStore()

const positions = ref([])
const subPositions = ref([])
const workers = ref([])

const positionId = ref('')
const subPositionId = ref('')
const workerId = ref('')

const isLoading = ref(false)
const isLoadingSubPositions = ref(false)

const hasSubPositions = ref(false)
const isDev = import.meta.env.DEV

// Tampilkan hanya workers dengan department name = "Operator"
const filteredWorkers = computed(() => {
  const filtered = workers.value.filter(worker => {
    // Check berdasarkan department name (lebih reliable daripada ID)
    if (worker.department && worker.department.name === 'Operator') {
      return true
    }
    // Fallback: jika department object tidak ada, coba cari berdasarkan department_id
    // Tapi ini tidak ideal karena ID bisa berbeda
    return false
  })
  
  return filtered
})

const goToProductionLogs = async () => {
  if (!positionId.value || !workerId.value) {
    await modal.showWarning('Pilih posisi dan nama pekerja terlebih dahulu')
    return
  }

  // simpan session dulu, sama seperti submit
  const position = positions.value.find(p => p.id === positionId.value)
  const worker = workers.value.find(w => w.id === workerId.value)

  session.workerId = worker.id
  session.workerName = worker.name

  session.positionId = position.id
  session.positionCode = position.code
  session.positionUnit = position.unit

  if (hasSubPositions.value && subPositionId.value) {
    const subPosition = subPositions.value.find(s => s.id === subPositionId.value)
    session.subPositionId = subPosition.id
    session.subPositionCode = subPosition.code
  } else {
    session.subPositionId = null
    session.subPositionCode = null
  }

  router.push(`/production-logs?worker_id=${worker.id}`)
}


// Watch positionId untuk logging
watch(positionId, (newPositionId) => {
  if (!newPositionId) return

  const position = positions.value.find(p => p.id === newPositionId)
  if (position) {
    // Logic tambahan jika diperlukan saat posisi berubah
  }
})

onMounted(async () => {
  isLoading.value = true
  try {
    const [posRes, workerRes] = await Promise.all([
      api.get('/positions'),
      api.get('/workers')
    ])

    positions.value = posRes.data
    workers.value = workerRes.data
  } catch (error) {
    await modal.showError('Gagal memuat data. Silakan refresh halaman.')
  } finally {
    isLoading.value = false
  }
})

const loadSubPositions = async () => {
  subPositionId.value = ''
  subPositions.value = []
  hasSubPositions.value = false
  workerId.value = '' // Reset worker selection saat posisi berubah

  if (!positionId.value) return

  isLoadingSubPositions.value = true
  try {
    const res = await api.get(`/sub-positions/by-position/${positionId.value}`)
    subPositions.value = res.data
    hasSubPositions.value = subPositions.value.length > 0
  } catch (error) {
    await modal.showError('Gagal memuat sub posisi.')
  } finally {
    isLoadingSubPositions.value = false
  }
}

const canSubmit = computed(() => {
  if (isLoading.value) return false
  if (!positionId.value || !workerId.value) return false

  // kalau posisi punya sub posisi → wajib dipilih
  if (hasSubPositions.value && !subPositionId.value) return false

  return true
})

const canEdit = computed(() => {
  if (isLoading.value) return false
  if (!workerId.value) return false

  return true
})

const submit = async () => {
  const position = positions.value.find(p => p.id === positionId.value)
  const worker = workers.value.find(w => w.id === workerId.value)

  if (!position || !worker) {
    await modal.showError('Data tidak valid')
    return
  }

  let subPosition = null
  if (hasSubPositions.value) {
    subPosition = subPositions.value.find(s => s.id === subPositionId.value)
    if (!subPosition) {
      await modal.showWarning('Sub posisi wajib dipilih')
      return
    }
  }

  session.workerId = worker.id
  session.workerName = worker.name

  session.positionId = position.id
  session.positionCode = position.code
  session.positionUnit = position.unit

  if (subPosition) {
    session.subPositionId = subPosition.id
    session.subPositionCode = subPosition.code
  } else {
    session.subPositionId = null
    session.subPositionCode = null
  }

  router.push('/production-input')
}

const goBack = () => {
  router.push('/production-menu')
}

</script>

<template>
  <div class="login-container">
    <div class="login-card">
      <button class="back-button" @click="goBack" type="button">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        Kembali
      </button>
      
      <div class="login-header">
        <h2>Data Diri Operator</h2>
        <p class="subtitle">Pilih posisi dan nama untuk melanjutkan</p>
      </div>
 
      <form @submit.prevent="submit" class="login-form">
        <div class="form-group">
          <label for="position">Posisi</label>
          <select id="position" v-model="positionId" @change="loadSubPositions" :disabled="isLoading"
            class="form-select" required>
            <option disabled value="">Pilih Posisi</option>
            <option v-for="p in positions" :key="p.id" :value="p.id">
              {{ p.code }}
            </option>
          </select>
        </div>

        <div class="form-group" v-if="hasSubPositions">
          <label for="subPosition">Mesin</label>
          <select id="subPosition" v-model="subPositionId" :disabled="isLoadingSubPositions" class="form-select"
            required>
            <option disabled value="">
              {{ isLoadingSubPositions ? 'Memuat...' : 'Pilih Mesin' }}
            </option>
            <option v-for="s in subPositions" :key="s.id" :value="s.id">
              {{ s.code }}
            </option>
          </select>
        </div>


        <div class="form-group">
          <label for="worker">Nama</label>
          <select
            id="worker"
            v-model="workerId"
            :disabled="isLoading"
            class="form-select"
            required
          >
            <option disabled value="">
              {{ filteredWorkers.length === 0 ? 'Tidak ada pekerja' : 'Pilih Nama Operator' }}
            </option>
            <option
              v-for="w in filteredWorkers"
              :key="w.id"
              :value="w.id"
              :class="{ 'matched-position': positionId && w.position_id === Number(positionId) }"
            >
              {{ w.name }}
            </option>
          </select>
          <!-- Debug info (development only) -->
          <!-- <div v-if="!isLoading && isDev" style="margin-top: 0.5rem; padding: 0.5rem; background: #f0f0f0; border-radius: 4px; font-size: 0.75rem; color: #666;">
            <strong>Debug:</strong> Total: {{ workers.length }}, 
            Operator: {{ filteredWorkers.length }},
            <span v-if="workers.length > 0">
              Sample Dept: {{ workers[0]?.department?.name || 'N/A' }}
            </span>
          </div> -->
        </div>


        <div class="action-buttons">
  <button
    type="submit"
    class="submit-button"
    :disabled="!canSubmit"
  >
    <span v-if="isLoading">Memuat...</span>
    <span v-else>Input Data</span>
  </button>

  <button
    type="button"
    class="edit-button"
    :disabled="!canEdit"
    @click="goToProductionLogs"
  >
  <span v-if="isLoading">Memuat...</span>
  <span v-else>Log Data</span>
  </button>
</div>

      </form>
    </div>
  </div>
</template>

<style scoped>
.back-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  margin-bottom: 1.5rem;
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

.action-buttons {
  display: flex;
  gap: 0.75rem;
}

/* .edit-button {
  flex: 1;
  padding: 1.125rem;
  border-radius: 12px;
  font-size: 1.05rem;
  font-weight: 600;
  cursor: pointer;
  background: white;
  border: 2px solid #333b5f;
  color: #333b5f;
  transition: all 0.3s ease;
}

.edit-button:hover {
  background: #f8f9fa;
  box-shadow: 0 4px 12px rgba(51, 59, 95, 0.15);
} */
/*  */
.edit-button {
  width: 100%;
  padding: 1.125rem;
  margin-top: 0.5rem;
  background: #333b5f;
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(51, 59, 95, 0.25);
  letter-spacing: 0.3px;
}

.edit-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(51, 59, 95, 0.35);
  background: #2a3250;
}

.edit-button:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(51, 59, 95, 0.25);
}

.edit-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  background: #beceea;
  color: #666;
  box-shadow: none;
}



/*  */
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  /* background: #beceea; */
}

.login-card {
  background: white;
  border-radius: 24px;
  box-shadow: 0 8px 32px rgba(51, 59, 95, 0.15);
  padding: 2.5rem;
  width: 100%;
  max-width: 500px;
  animation: slideUp 0.5s ease-out;
  border: 1px solid rgba(51, 59, 95, 0.1);
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.login-header {
  text-align: center;
  margin-bottom: 2.5rem;
}

.login-header h2 {
  margin: 0 0 0.75rem 0;
  font-size: 2rem;
  font-weight: 700;
  color: #333b5f;
  letter-spacing: -0.5px;
}

.subtitle {
  margin: 0;
  color: #333b5f;
  font-size: 0.95rem;
  opacity: 0.7;
  font-weight: 400;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.form-group label {
  font-weight: 600;
  color: #333b5f;
  font-size: 0.95rem;
  letter-spacing: 0.2px;
}

.form-select {
  width: 100%;
  padding: 1rem 1.125rem;
  border: 2px solid #beceea;
  border-radius: 12px;
  font-size: 1rem;
  font-family: inherit;
  background-color: white;
  color: #000;
  transition: all 0.3s ease;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23333b5f' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 1.125rem center;
  padding-right: 2.75rem;
}

.form-select:hover:not(:disabled) {
  border-color: #333b5f;
  background-color: #f8f9fa;
  box-shadow: 0 0 0 4px rgba(51, 59, 95, 0.08);
}

.form-select:focus {
  outline: none;
  border-color: #333b5f;
  background-color: white;
  box-shadow: 0 0 0 4px rgba(51, 59, 95, 0.15);
}

.form-select:disabled {
  background-color: #f0f2f5;
  color: #666;
  cursor: not-allowed;
  opacity: 0.6;
  border-color: #d0d5dc;
}

.form-select option {
  padding: 0.75rem;
  background-color: white;
  color: #000;
  font-size: 1rem;
}

.form-select option.matched-position {
  background-color: #d4edda;
  color: #155724;
  font-weight: 600;
}



.submit-button {
  width: 100%;
  padding: 1.125rem;
  margin-top: 0.5rem;
  background: #333b5f;
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(51, 59, 95, 0.25);
  letter-spacing: 0.3px;
}

.submit-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(51, 59, 95, 0.35);
  background: #2a3250;
}

.submit-button:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(51, 59, 95, 0.25);
}

.submit-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  background: #beceea;
  color: #666;
  box-shadow: none;
}

/* Responsive Design */
@media (max-width: 768px) {
  .login-container {
    padding: 1rem 0.75rem;
  }

  .login-card {
    padding: 2rem 1.75rem;
    border-radius: 20px;
    max-width: 100%;
  }

  .back-button {
    padding: 0.5625rem 0.875rem;
    font-size: 0.875rem;
    margin-bottom: 1.25rem;
  }

  .login-header h2 {
    font-size: 1.75rem;
  }

  .subtitle {
    font-size: 0.875rem;
  }

  .login-form {
    gap: 1.5rem;
  }

  .form-select {
    padding: 0.875rem 1rem;
    padding-right: 2.5rem;
    font-size: 0.95rem;
  }

  .submit-button {
    padding: 1rem;
    font-size: 1rem;
  }
}

@media (max-width: 480px) {
  .login-container {
    padding: 0.75rem 0.5rem;
  }

  .login-card {
    padding: 1.75rem 1.5rem;
    border-radius: 16px;
  }

  .back-button {
    padding: 0.5rem 0.75rem;
    font-size: 0.8125rem;
    margin-bottom: 1rem;
  }

  .back-button svg {
    width: 18px;
    height: 18px;
  }

  .login-header {
    margin-bottom: 2rem;
  }

  .login-header h2 {
    font-size: 1.5rem;
    margin-bottom: 0.5rem;
  }

  .subtitle {
    font-size: 0.8125rem;
  }

  .login-form {
    gap: 1.25rem;
  }

  .form-group {
    gap: 0.5rem;
  }

  .form-group label {
    font-size: 0.875rem;
  }

  .form-select {
    padding: 0.8125rem 0.9375rem;
    padding-right: 2.5rem;
    font-size: 0.9375rem;
  }

  .submit-button {
    padding: 0.9375rem;
    font-size: 0.95rem;
  }
}

/* Tablet */
@media (min-width: 769px) and (max-width: 1024px) {
  .login-card {
    max-width: 540px;
    padding: 3rem 2.5rem;
  }

  .login-header h2 {
    font-size: 2.125rem;
  }
}

/* Large screens */
@media (min-width: 1025px) {
  .login-card {
    max-width: 520px;
  }
}

/* Landscape mobile */
@media (max-height: 600px) and (orientation: landscape) {
  .login-container {
    padding: 1rem;
  }

  .login-card {
    padding: 1.5rem 2rem;
  }

  .login-header {
    margin-bottom: 1.5rem;
  }

  .login-header h2 {
    font-size: 1.5rem;
    margin-bottom: 0.5rem;
  }

  .subtitle {
    font-size: 0.8125rem;
  }

  .login-form {
    gap: 1rem;
  }
}
</style>
