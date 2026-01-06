<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '../api/http'
import { useAdminProduksiSessionStore } from '../store/adminProduksiSession'
import { modal } from '../plugins/modal'

const router = useRouter()
const adminProduksiSession = useAdminProduksiSessionStore()

const workers = ref([])
const selectedWorkerId = ref('')
const password = ref('')
const isLoading = ref(false)
const isSubmitting = ref(false)
const error = ref(null)

const fetchAdminProduksi = async () => {
  isLoading.value = true
  error.value = null
  try {
    const res = await api.get('/workers')
    // Filter hanya workers dengan department.name = 4 (Admin Produksi)
    workers.value = res.data.filter(worker => worker.department.name === 'Admin Produksi')
  } catch (err) {
    error.value = err.response?.data?.detail || 'Gagal memuat data admin produksi'
    console.error('Error fetching admin produksi:', err)
  } finally {
    isLoading.value = false
  }
}

const handleLogin = async () => {
  if (!selectedWorkerId.value || !password.value) {
    await modal.showWarning('Pilih admin produksi dan masukkan password')
    return
  }

  isSubmitting.value = true
  error.value = null

  try {
    const res = await api.post('/workers/login', {
      worker_id: Number(selectedWorkerId.value),
      password: password.value
    })

    // Simpan session admin produksi
    adminProduksiSession.setAdminProduksi(res.data)
    
    await modal.showSuccess('Login berhasil')
    router.push('/production-admin-produksi')
  } catch (err) {
    error.value = err.response?.data?.detail || 'Login gagal. Password salah atau admin produksi tidak ditemukan.'
    await modal.showError(error.value)
  } finally {
    isSubmitting.value = false
  }
}

onMounted(() => {
  fetchAdminProduksi()
})
</script>

<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <h2>Login Admin Produksi</h2>
        <p class="subtitle">Pilih nama admin produksi dan masukkan password</p>
      </div>

      <div v-if="error" class="error-message">{{ error }}</div>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label for="admin">Nama Admin Produksi</label>
          <select
            id="admin"
            v-model="selectedWorkerId"
            :disabled="isLoading"
            class="form-select"
            required
          >
            <option disabled value="">
              {{ isLoading ? 'Memuat...' : (workers.length === 0 ? 'Tidak ada admin produksi' : 'Pilih Admin Produksi') }}
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
          />
        </div>

        <div class="action-buttons">
          <button
            type="submit"
            class="submit-button"
            :disabled="isSubmitting || isLoading || !selectedWorkerId || !password"
          >
            <span v-if="isSubmitting">Memproses...</span>
            <span v-else>Login</span>
          </button>

          <button
            type="button"
            class="back-button"
            @click="router.push('/production-menu')"
          >
            Kembali
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
  padding: 1rem;
  background: #f4f6fb;
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

.form-select,
.form-input {
  width: 100%;
  padding: 1rem 1.125rem;
  border: 2px solid #beceea;
  border-radius: 12px;
  font-size: 1rem;
  font-family: inherit;
  background-color: white;
  color: #000;
  transition: all 0.3s ease;
  box-sizing: border-box;
}

.form-select {
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23333b5f' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 1.125rem center;
  padding-right: 2.75rem;
}

.form-select:hover:not(:disabled),
.form-input:hover:not(:disabled) {
  border-color: #333b5f;
  background-color: #f8f9fa;
  box-shadow: 0 0 0 4px rgba(51, 59, 95, 0.08);
}

.form-select:focus,
.form-input:focus {
  outline: none;
  border-color: #333b5f;
  background-color: white;
  box-shadow: 0 0 0 4px rgba(51, 59, 95, 0.15);
}

.form-select:disabled,
.form-input:disabled {
  background-color: #f0f2f5;
  color: #666;
  cursor: not-allowed;
  opacity: 0.6;
  border-color: #d0d5dc;
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

.back-button {
  width: 100%;
  padding: 1.125rem;
  background: white;
  color: #333b5f;
  border: 2px solid #beceea;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.back-button:hover {
  border-color: #333b5f;
  background: #f8f9fa;
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
}
</style>

