<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '../api/http'
import { modal } from '../plugins/modal'

const route = useRoute()
const router = useRouter()
const targetId = route.params.id
const isLoading = ref(false)
const isSubmitting = ref(false)
const error = ref(null)

// Master data
const positions = ref([])
const subPositions = ref([])
const hasSubPositions = ref(false)

const form = ref({
  target: 0,
  position_id: '',
  sub_position_id: ''
})

const fetchMasterData = async () => {
  try {
    const res = await api.get('/positions')
    positions.value = res.data
  } catch (err) {
    console.error('Error loading positions:', err)
  }
}

const loadSubPositions = async () => {
  // Don't reset sub_position_id here immediately if we are loading initial data
  // logic handled in fetchTarget
  
  if (!form.value.position_id) {
    subPositions.value = []
    hasSubPositions.value = false
    form.value.sub_position_id = ''
    return
  }
  
  try {
    const res = await api.get(`/sub-positions/by-position/${form.value.position_id}`)
    subPositions.value = res.data
    hasSubPositions.value = subPositions.value.length > 0
    
    // If current sub_position_id is not in the new list, clear it
    if (form.value.sub_position_id && !subPositions.value.find(sp => sp.id === form.value.sub_position_id)) {
      form.value.sub_position_id = ''
    }
  } catch (err) {
    console.error('Error loading sub positions:', err)
  }
}

const handlePositionChange = async () => {
  form.value.sub_position_id = ''
  await loadSubPositions()
}

const fetchTarget = async () => {
  if (!targetId) return
  
  isLoading.value = true
  try {
    const res = await api.get(`/production-targets/${targetId}`)
    const target = res.data
    
    form.value = {
      target: target.target,
      position_id: target.position_id || '',
      sub_position_id: target.sub_position_id || ''
    }

    // Load sub positions if position is selected
    if (form.value.position_id) {
      // Manually load subpositions without clearing the form.value.sub_position_id
      const spRes = await api.get(`/sub-positions/by-position/${form.value.position_id}`)
      subPositions.value = spRes.data
      hasSubPositions.value = subPositions.value.length > 0
    }
  } catch (err) {
    error.value = err.response?.data?.detail || 'Gagal memuat data production target'
    console.error('Error loading production target:', err)
  } finally {
    isLoading.value = false
  }
}

const handleSubmit = async () => {
  if (!form.value.position_id) {
    await modal.showWarning('Pilih Position')
    return
  }

  isSubmitting.value = true
  error.value = null

  try {
    const payload = {
      target: Number(form.value.target),
      position_id: Number(form.value.position_id),
      sub_position_id: form.value.sub_position_id ? Number(form.value.sub_position_id) : null
    }

    if (targetId) {
      await api.put(`/production-targets/${targetId}`, payload)
      await modal.showSuccess('Production target berhasil diperbarui')
    } else {
      await api.post('/production-targets/', payload)
      await modal.showSuccess('Production target berhasil ditambahkan')
    }
    
    router.push('/production-coordinator')
  } catch (err) {
    error.value = err.response?.data?.detail || `Gagal ${targetId ? 'memperbarui' : 'menambahkan'} production target`
  } finally {
    isSubmitting.value = false
  }
}

const goBack = () => {
  router.push('/production-coordinator')
}

onMounted(async () => {
  await fetchMasterData()
  await fetchTarget()
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
        <h1>Edit Production Target</h1>
      </div>
    </div>

    <div v-if="isLoading" class="loading">Memuat data...</div>
    <div v-else-if="error" class="error-message">{{ error }}</div>
    
    <div v-else class="form-card">
      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label>Position <span class="required">*</span></label>
          <select v-model="form.position_id" @change="handlePositionChange" required class="form-input">
            <option value="" disabled>Pilih Position</option>
            <option v-for="pos in positions" :key="pos.id" :value="pos.id">
              {{ pos.code }} - {{ pos.name }}
            </option>
          </select>
        </div>

        <div class="form-group" v-if="hasSubPositions">
          <label>Sub Position</label>
          <select v-model="form.sub_position_id" class="form-input">
            <option value="">Pilih Sub Position (Opsional)</option>
            <option v-for="sp in subPositions" :key="sp.id" :value="sp.id">
              {{ sp.code }} - {{ sp.name }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label>Target Value <span class="required">*</span></label>
          <input 
            type="number" 
            v-model="form.target" 
            step="0.01" 
            min="0" 
            required 
            class="form-input"
            placeholder="Masukkan nilai target"
          />
        </div>

        <div class="form-actions">
          <button type="button" class="btn-cancel" @click="goBack">Batal</button>
          <button type="submit" class="btn-submit" :disabled="isSubmitting">
            {{ isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan' }}
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
