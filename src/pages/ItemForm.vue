<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { itemsApi } from '../api/items'
import { modal } from '../plugins/modal'

const router = useRouter()
const route = useRoute()

const isEdit = ref(false)
const isLoading = ref(false)
const isSubmitting = ref(false)
const error = ref(null)

const formData = ref({
  item_number: '',
  item_name: '',
  spec: ''
})

const loadItem = async () => {
  if (!route.params.id) return
  
  isEdit.value = true
  isLoading.value = true
  try {
    const res = await itemsApi.getById(route.params.id)
    formData.value = {
      item_number: res.data.item_number,
      item_name: res.data.item_name || '',
      spec: res.data.spec || ''
    }
  } catch (err) {
    error.value = err.response?.data?.detail || 'Gagal memuat data item'
    console.error('Error loading item:', err)
  } finally {
    isLoading.value = false
  }
}

const handleSubmit = async () => {
  if (!formData.value.item_number) {
    await modal.showWarning('Item Number wajib diisi')
    return
  }

  isSubmitting.value = true
  error.value = null

  try {
    const data = {
      item_number: formData.value.item_number,
      item_name: formData.value.item_name || null,
      spec: formData.value.spec || null
    }
    
    if (isEdit.value) {
      await itemsApi.update(route.params.id, data)
      await modal.showSuccess('Item berhasil diperbarui')
    } else {
      await itemsApi.create(data)
      await modal.showSuccess('Item berhasil dibuat')
    }
    router.push('/items')
  } catch (err) {
    error.value = err.response?.data?.detail || 'Gagal menyimpan item'
    await modal.showError(error.value)
  } finally {
    isSubmitting.value = false
  }
}

const goBack = () => {
  router.push('/items')
}

onMounted(() => {
  if (route.params.id) {
    loadItem()
  }
})
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <h1>{{ isEdit ? 'Edit Item' : 'Tambah Item' }}</h1>
      <button class="btn-secondary" @click="router.push('/items')">Kembali</button>
    </div>

    <div v-if="error" class="error-message">{{ error }}</div>
    <div v-if="isLoading" class="loading">Memuat data...</div>

    <form v-else @submit.prevent="handleSubmit" class="form-container">
      <div class="form-group">
        <label for="item_number">Item Number *</label>
        <input
          id="item_number"
          v-model="formData.item_number"
          type="text"
          class="form-input"
          placeholder="Masukkan item number"
          required
        />
      </div>

      <div class="form-group">
        <label for="item_name">Item Name</label>
        <input
          id="item_name"
          v-model="formData.item_name"
          type="text"
          class="form-input"
          placeholder="Masukkan item name"
        />
      </div>

      <div class="form-group">
        <label for="spec">Spec</label>
        <textarea
          id="spec"
          v-model="formData.spec"
          class="form-input"
          placeholder="Masukkan spec"
          rows="4"
        />
      </div>

      <div class="form-actions">
        <button type="button" class="btn-secondary" @click="router.push('/items')">Batal</button>
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
  font-family: inherit;
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

