<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '../api/http'
import { useMasterDataSessionStore } from '../store/masterDataSession'
import { modal } from '../plugins/modal'

const router = useRouter()
const masterDataSession = useMasterDataSessionStore()

const workers = ref([])
const selectedWorkerId = ref('')
const password = ref('')
const isLoading = ref(false)
const isSubmitting = ref(false)
const error = ref(null)

const fetchSuperadmins = async () => {
  isLoading.value = true
  error.value = null
  try {
    const res = await api.get('/workers')
    // Filter hanya workers dengan department.name = 5 (Superadmin)
    workers.value = res.data.filter(worker => worker.department.name === 'Superadmin')
  } catch (err) {
    error.value = err.response?.data?.detail || 'Gagal memuat data superadmin'
    console.error('Error fetching superadmins:', err)
  } finally {
    isLoading.value = false
  }
}

const handleLogin = async () => {
  if (!selectedWorkerId.value || !password.value) {
    await modal.showWarning('Pilih superadmin dan masukkan password')
    return
  }

  isSubmitting.value = true
  error.value = null

  try {
    const res = await api.post('/workers/login', {
      worker_id: Number(selectedWorkerId.value),
      password: password.value
    })

    // Simpan session superadmin
    masterDataSession.setSuperadmin(res.data)
    
    await modal.showSuccess('Login berhasil')
    router.push('/master-data')
  } catch (err) {
    error.value = err.response?.data?.detail || 'Login gagal. Password salah atau superadmin tidak ditemukan.'
    await modal.showError(error.value)
  } finally {
    isSubmitting.value = false
  }
}

const goBack = () => {
  router.push('/')
}

onMounted(() => {
  fetchSuperadmins()
})
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
        <h2>Login Master Data</h2>
        <p class="subtitle">Pilih nama superadmin dan masukkan password</p>
      </div>

      <div v-if="error" class="error-message">{{ error }}</div>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label for="superadmin">Nama Superadmin</label>
          <select
            id="superadmin"
            v-model="selectedWorkerId"
            :disabled="isLoading"
            class="form-select"
            required
          >
            <option disabled value="">
              {{ isLoading ? 'Memuat...' : (workers.length === 0 ? 'Tidak ada superadmin' : 'Pilih Superadmin') }}
            </option>
            <option
              v-for="worker in workers"
              :key="worker.id"
              :value="worker.id"
            >
              {{ worker.name }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label for="password">Password</label>
          <input
            id="password"
            v-model="password"
            type="password"
            class="form-input"
            placeholder="Masukkan password"
            required
            :disabled="isSubmitting"
          />
        </div>

        <div class="action-buttons">
          <button
            type="submit"
            class="submit-button"
            :disabled="isSubmitting || !selectedWorkerId || !password"
          >
            <span v-if="isSubmitting">Memproses...</span>
            <span v-else>Login</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem 1rem;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.login-card {
  background: white;
  border-radius: 24px;
  box-shadow: 0 8px 32px rgba(51, 59, 95, 0.15);
  padding: 3rem;
  width: 100%;
  max-width: 500px;
  animation: slideUp 0.5s ease-out;
  border: 1px solid rgba(51, 59, 95, 0.1);
  position: relative;
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

.login-header {
  text-align: center;
  margin-bottom: 2rem;
}

.login-header h2 {
  margin: 0 0 0.5rem 0;
  font-size: 2rem;
  font-weight: 700;
  color: #333b5f;
  letter-spacing: -0.5px;
}

.subtitle {
  margin: 0;
  color: #666;
  font-size: 1rem;
  font-weight: 400;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 600;
  color: #333b5f;
  font-size: 0.9375rem;
}

.form-select,
.form-input {
  width: 100%;
  padding: 1rem;
  border: 2px solid #beceea;
  border-radius: 12px;
  font-size: 1rem;
  transition: all 0.3s ease;
  box-sizing: border-box;
  background-color: white;
}

.form-select {
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23333b5f' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 1rem center;
  padding-right: 2.5rem;
}

.form-select:focus,
.form-input:focus {
  outline: none;
  border-color: #333b5f;
  box-shadow: 0 0 0 4px rgba(51, 59, 95, 0.1);
}

.form-select:hover,
.form-input:hover {
  border-color: #333b5f;
  background-color: #f8f9fa;
}

.form-select:disabled,
.form-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background-color: #f5f5f5;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
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

.error-message {
  padding: 1rem;
  background: #f8d7da;
  color: #721c24;
  border-radius: 8px;
  margin-bottom: 1rem;
  text-align: center;
}

/* Responsive Design */
@media (max-width: 768px) {
  .login-card {
    padding: 2rem 1.75rem;
    border-radius: 20px;
  }

  .login-header h2 {
    font-size: 1.75rem;
  }
}

@media (max-width: 480px) {
  .login-card {
    padding: 1.75rem 1.5rem;
    border-radius: 16px;
  }

  .login-header h2 {
    font-size: 1.5rem;
  }

  .back-button {
    padding: 0.5rem 0.75rem;
    font-size: 0.8125rem;
  }

  .back-button svg {
    width: 18px;
    height: 18px;
  }
}
</style>

