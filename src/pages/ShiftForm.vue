<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { shiftsApi } from '../api/shifts'
import { modal } from '../plugins/modal'

const router = useRouter()
const route = useRoute()

const isEdit = ref(false)
const isLoading = ref(false)
const isSubmitting = ref(false)
const error = ref(null)

const formData = ref({
  name: ''
})

const loadShift = async () => {
  if (!route.params.id) return
  
  isEdit.value = true
  isLoading.value = true
  try {
    const res = await shiftsApi.getById(route.params.id)
    formData.value = {
      name: res.data.name
    }
  } catch (err) {
    error.value = err.response?.data?.detail || 'Gagal memuat data shift'
    console.error('Error loading shift:', err)
  } finally {
    isLoading.value = false
  }
}

const handleSubmit = async () => {
  if (!formData.value.name) {
    await modal.showWarning('Name wajib diisi')
    return
  }

  isSubmitting.value = true
  error.value = null

  try {
    if (isEdit.value) {
      await shiftsApi.update(route.params.id, formData.value)
      await modal.showSuccess('Shift berhasil diperbarui')
    } else {
      await shiftsApi.create(formData.value)
      await modal.showSuccess('Shift berhasil dibuat')
    }
    router.push('/shifts')
  } catch (err) {
    error.value = err.response?.data?.detail || 'Gagal menyimpan shift'
    await modal.showError(error.value)
  } finally {
    isSubmitting.value = false
  }
}

const goBack = () => {
  router.push('/shifts')
}

onMounted(() => {
  if (route.params.id) {
    loadShift()
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
        <h1>{{ isEdit ? 'Edit Shift' : 'Tambah Shift' }}</h1>
      </div>
    </div>

    <div v-if="error" class="error-message">{{ error }}</div>
    <div v-if="isLoading" class="loading">Memuat data...</div>

    <form v-else @submit.prevent="handleSubmit" class="form-container">
      <div class="form-group">
        <label for="name">Name *</label>
        <input
          id="name"
          v-model="formData.name"
          type="text"
          class="form-input"
          placeholder="Masukkan name"
          required
        />
      </div>

      <div class="form-actions">
        <button type="button" class="btn-secondary" @click="router.push('/shifts')">Batal</button>
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

.form-container {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.form-group {
  margin-bottom: 1.5rem;
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

  .page-header h1 {
    font-size: 1.5rem;
  }

  .form-container {
    padding: 1.5rem;
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

  .page-header h1 {
    font-size: 1.25rem;
  }

  .form-container {
    padding: 1rem;
  }

  .form-input,
  .form-select {
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

