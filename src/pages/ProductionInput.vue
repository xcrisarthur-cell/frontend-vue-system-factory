<script setup>
import { ref, onMounted, computed } from 'vue'
import api from '../api/http'
import { useSessionStore } from '../store/session'
import { useRouter } from 'vue-router'
import { modal } from '../plugins/modal'

const session = useSessionStore()
const router = useRouter()

/* ===== state ===== */
const shifts = ref([])
const suppliers = ref([])
const comments = ref([])

const shiftId = ref('')
const supplierId = ref('')
const itemNumber = ref('')
const itemDetail = ref(null)
const isLoadingItem = ref(false)

const qtyOutput = ref('')
const qtyReject = ref('')
const selectedCommentIds = ref([])
const manualComment = ref('')
const problemMinutes = ref('')

const isSubmitting = ref(false)
const isLoading = ref(false)

/* ===== guard: session wajib ada ===== */
onMounted(async () => {
  if (!session.workerId || !session.positionId) {
    await modal.showError('Session tidak valid, ulangi login produksi')
    router.push('/')
    return
  }

  isLoading.value = true

  try {
    const [shiftRes, supplierRes, commentRes] = await Promise.all([
      api.get('/shifts'),
      api.get('/suppliers'),
      api.get('/problem-comments')
    ])

    shifts.value = shiftRes.data
    suppliers.value = supplierRes.data
    comments.value = commentRes.data
    
  } catch (error) {
    console.error('Error loading data:', error)
    await modal.showError('Gagal memuat data. Silakan refresh halaman.')
  } finally {
    isLoading.value = false
  }
})

/* ===== unit otomatis (pcs / lmbr) ===== */
const unitLabel = computed(() => {
  return session.positionUnit || ''
})

/* ===== ambil item detail ===== */
const loadItem = async () => {
  if (!itemNumber.value) {
    itemDetail.value = null
    return
  }

  isLoadingItem.value = true
  try {
    const res = await api.get(`/items/${itemNumber.value}`)
    itemDetail.value = res.data
  } catch {
    await modal.showError('Item number tidak ditemukan')
    itemDetail.value = null
  } finally {
    isLoadingItem.value = false
  }
}

const validateBusinessRules = async () => {
  const output = Number(qtyOutput.value || 0)
  const reject = Number(qtyReject.value || 0)
  const duration = Number(problemMinutes.value || 0)
  const hasComments = selectedCommentIds.value.length > 0 || manualComment.value.trim()

  if (output < 0 || reject < 0) {
    await modal.showWarning('Qty tidak boleh negatif')
    return false
  }

  if (reject > output) {
    await modal.showWarning('Qty reject tidak boleh lebih besar dari qty output')
    return false
  }

  if (hasComments && duration <= 0) {
    await modal.showWarning('Durasi kendala wajib diisi jika ada kendala')
    return false
  }

  if (!hasComments && duration > 0) {
    await modal.showWarning('Pilih atau masukkan jenis kendala jika durasi diisi')
    return false
  }

  return true
}

/* ===== submit production log ===== */
const submit = async () => {
  if (!shiftId.value || !itemDetail.value) {
    await modal.showWarning('Shift dan item wajib diisi')
    return
  }

  if (!(await validateBusinessRules())) return

  isSubmitting.value = true
  try {
    // Create manual comment if provided
    let finalCommentIds = [...selectedCommentIds.value]
    
    if (manualComment.value.trim()) {
      try {
        const newCommentRes = await api.post('/problem-comments', {
          description: manualComment.value.trim()
        })
        finalCommentIds.push(newCommentRes.data.id)
      } catch (err) {
        // If comment already exists, try to find it
        if (err.response?.status === 400) {
          // Try to get existing comment
          const allComments = await api.get('/problem-comments')
          const existing = allComments.data.find(c => 
            c.description.toLowerCase() === manualComment.value.trim().toLowerCase()
          )
          if (existing) {
            finalCommentIds.push(existing.id)
          } else {
            await modal.showError('Gagal membuat kendala baru. Silakan coba lagi.')
            isSubmitting.value = false
            return
          }
        } else {
          await modal.showError('Gagal membuat kendala baru. Silakan coba lagi.')
          isSubmitting.value = false
          return
        }
      }
    }

    await api.post('/production-logs', {
      worker_id: session.workerId,
      position_id: session.positionId,
      sub_position_id: session.subPositionId || null,
      shift_id: shiftId.value,
      supplier_id: supplierId.value || null,
      item_id: itemDetail.value.id,
      qty_output: Number(qtyOutput.value || 0),
      qty_reject: Number(qtyReject.value || 0),
      problem_comment_ids: finalCommentIds.length > 0 ? finalCommentIds : null,
      problem_duration_minutes: Number(problemMinutes.value || 0)
    })

    await modal.showSuccess('Data produksi berhasil disimpan')

    // Reset form
    qtyOutput.value = ''
    qtyReject.value = ''
    selectedCommentIds.value = []
    manualComment.value = ''
    problemMinutes.value = ''
  } catch (error) {
    console.error('Error submitting:', error)
    await modal.showError('Gagal menyimpan data. Silakan coba lagi.')
  } finally {
    isSubmitting.value = false
  }
}

const backToLogin = async () => {
  const confirmed = await modal.confirm('Data yang belum disimpan akan hilang. Lanjutkan?')
  if (!confirmed) return

  session.$reset()   // PENTING
  router.push('/ProductionLogin') // atau route LoginPage lo
}


const logout = async () => {
  const confirmed = await modal.confirm('Yakin ingin logout?')
  if (confirmed) {
    router.push('/')
  }
}

</script>

<template>
  <div class="input-container">
    <div class="input-card">
      <!-- Header Section -->
      <div class="header-section">


        <div class="header-content">
          <h2>Input Produksi</h2>

          <div class="header-actions">
            <button class="back-button" @click="backToLogin">
              Ganti Data Diri
            </button>

            <button class="logout-button" @click="logout" title="Logout">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
            </button>
          </div>


        </div>

        <!-- Session Info Card -->
        <div class="session-info">
          <div class="info-item">
            <span class="info-label">Nama:</span>
            <span class="info-value">{{ session.workerName }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Posisi:</span>
            <span class="info-value">{{ session.positionCode }} ({{ session.subPositionCode }})</span>
          </div>
          <div class="info-item">
            <span class="info-label">Unit:</span>
            <span class="info-value">{{ session.positionUnit }}</span>
          </div>
        </div>
      </div>

      <!-- Form Section -->
      <form @submit.prevent="submit" class="production-form">
        <!-- Basic Info Section -->
        <div class="form-section">
          <h3 class="section-title">Informasi Dasar</h3>

          <div class="form-row">
            <div class="form-group">
              <label for="shift">Shift</label>
              <select id="shift" v-model="shiftId" :disabled="isLoading" class="form-select" required>
                <option disabled value="">Pilih Shift</option>
                <option v-for="s in shifts" :key="s.id" :value="s.id">
                  {{ s.name }}
                </option>
              </select>
            </div>

            <div class="form-group">
              <label for="supplier">Supplier</label>
              <select
  id="supplier"
  v-model="supplierId"
  :disabled="isLoading"
  class="form-select"
>
  <option value="">Tanpa Supplier</option>
  <option v-for="s in suppliers" :key="s.id" :value="s.id">
    {{ s.name }}
  </option>
</select>

            </div>
          </div>

          <div class="form-group">
            <label for="itemNumber">Item Number</label>
            <div class="input-with-loader">
              <input id="itemNumber" v-model="itemNumber" placeholder="Masukkan Item Number" @blur="loadItem"
                class="form-input" required />
              <div v-if="isLoadingItem" class="loader-spinner"></div>
            </div>
          </div>

          <!-- Item Detail Card -->
          <div v-if="itemDetail" class="item-detail-card">
            <div class="item-detail-header">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path
                  d="M20 7h-4V4c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v3H4c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2z">
                </path>
              </svg>
              <span>Detail Item</span>
            </div>
            <div class="item-detail-content">
              <div class="detail-row">
                <span class="detail-label">Nama Item:</span>
                <span class="detail-value">{{ itemDetail.item_name }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Spec:</span>
                <span class="detail-value">{{ itemDetail.spec }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Production Data Section -->
        <div class="form-section">
          <h3 class="section-title">Data Produksi</h3>

          <div class="form-row">
            <div class="form-group">
              <label for="qtyOutput">Qty Output</label>
              <div class="input-with-unit">
                <input id="qtyOutput" v-model="qtyOutput" type="number" min="0" placeholder="0" class="form-input"
                  required />
                <span class="unit-badge">{{ unitLabel }}</span>
              </div>
            </div>

            <div class="form-group">
              <label for="qtyReject">Qty Reject</label>
              <div class="input-with-unit">
                <input id="qtyReject" v-model="qtyReject" type="number" min="0" placeholder="0" class="form-input"
                  required />
                <span class="unit-badge">{{ unitLabel }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Problem Section -->
        <div class="form-section">
          <h3 class="section-title">Kendala Produksi</h3>

          <div class="form-group">
            <label for="comments">Jenis Kendala (Bisa pilih lebih dari 1)</label>
            <div class="checkbox-group">
              <label v-for="c in comments" :key="c.id" class="checkbox-label">
                <input
                  type="checkbox"
                  :value="c.id"
                  v-model="selectedCommentIds"
                  :disabled="isLoading"
                  class="checkbox-input"
                />
                <span>{{ c.description }}</span>
              </label>
            </div>
          </div>

          <div class="form-group">
            <label for="manualComment">Atau Tambahkan Kendala Manual</label>
            <input
              id="manualComment"
              v-model="manualComment"
              type="text"
              class="form-input"
              placeholder="Ketik kendala baru jika tidak ada di daftar"
            />
          </div>

          <div class="form-group">
            <label for="problemMinutes">Durasi Kendala (menit)</label>
            <input
              id="problemMinutes"
              v-model="problemMinutes"
              type="number"
              min="0"
              placeholder="0"
              :disabled="selectedCommentIds.length === 0 && !manualComment.trim()"
              class="form-input"
            />
          </div>

          <div v-if="selectedCommentIds.length > 0 || manualComment.trim()" class="selected-comments">
            <strong>Kendala yang dipilih:</strong>
            <div class="selected-tags">
              <span v-for="id in selectedCommentIds" :key="id" class="tag">
                {{ comments.find(c => c.id === id)?.description }}
                <button type="button" @click="selectedCommentIds = selectedCommentIds.filter(i => i !== id)" class="tag-remove">×</button>
              </span>
              <span v-if="manualComment.trim()" class="tag">
                {{ manualComment }}
                <button type="button" @click="manualComment = ''" class="tag-remove">×</button>
              </span>
            </div>
          </div>
        </div>

        <!-- Submit Button -->
         <button
  type="submit"
  class="submit-button"
  :disabled="isSubmitting || isLoading || !shiftId || !itemDetail"
>
          <span v-if="isSubmitting">
            <span class="button-spinner"></span>
            Menyimpan...
          </span>
          <span v-else>Simpan Data Produksi</span>
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.input-container {
  min-height: 100vh;
  padding: 1.5rem 1rem;
  /* background: #beceea; */
}

.input-card {
  max-width: 800px;
  margin: 0 auto;
  background: white;
  border-radius: 24px;
  box-shadow: 0 8px 32px rgba(51, 59, 95, 0.15);
  padding: 2rem;
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

.header-section {
  margin-bottom: 2rem;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.header-content h2 {
  margin: 0;
  font-size: 2rem;
  font-weight: 700;
  color: #333b5f;
  letter-spacing: -0.5px;
}

.logout-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: 2px solid #beceea;
  border-radius: 10px;
  background: white;
  color: #333b5f;
  cursor: pointer;
  transition: all 0.3s ease;
  padding: 0;
}

.logout-button:hover {
  border-color: #333b5f;
  color: #333b5f;
  background: #f8f9fa;
}

.session-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  padding: 1.25rem;
  background: rgba(190, 206, 234, 0.2);
  border-radius: 12px;
  border: 1px solid rgba(51, 59, 95, 0.15);
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.info-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #333b5f;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  opacity: 0.7;
}

.info-value {
  font-size: 0.95rem;
  font-weight: 600;
  color: #000;
}

.production-form {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  width: 100%;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  width: 100%;
}

.section-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #333b5f;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid #beceea;
  letter-spacing: 0.2px;
}

.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-height: 200px;
  overflow-y: auto;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  border: 2px solid #beceea;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  transition: background 0.2s ease;
}

.checkbox-label:hover {
  background: rgba(190, 206, 234, 0.2);
}

.checkbox-input {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #333b5f;
}

.selected-comments {
  margin-top: 1rem;
  padding: 1rem;
  background: rgba(190, 206, 234, 0.15);
  border-radius: 8px;
  border: 2px solid #beceea;
}

.selected-comments strong {
  display: block;
  margin-bottom: 0.75rem;
  color: #333b5f;
  font-size: 0.95rem;
}

.selected-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tag {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: #333b5f;
  color: white;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
}

.tag-remove {
  background: rgba(255, 255, 255, 0.3);
  border: none;
  color: white;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1.2rem;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s ease;
}

.tag-remove:hover {
  background: rgba(255, 255, 255, 0.5);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
  width: 100%;
  min-width: 0;
}

.form-group label {
  font-weight: 600;
  color: #333b5f;
  font-size: 0.95rem;
  letter-spacing: 0.2px;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.25rem;
  width: 100%;
  align-items: start;
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

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: #333b5f;
  background-color: white;
  box-shadow: 0 0 0 4px rgba(51, 59, 95, 0.15);
}

.form-input:hover:not(:disabled),
.form-select:hover:not(:disabled) {
  border-color: #333b5f;
  background-color: #f8f9fa;
  box-shadow: 0 0 0 4px rgba(51, 59, 95, 0.08);
}

.form-input:disabled,
.form-select:disabled {
  background-color: #f0f2f5;
  color: #666;
  cursor: not-allowed;
  opacity: 0.6;
  border-color: #d0d5dc;
}

.input-with-loader {
  position: relative;
  width: 100%;
  box-sizing: border-box;
}

.input-with-loader .form-input {
  width: 100%;
  box-sizing: border-box;
}

.loader-spinner {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 20px;
  border: 2px solid #beceea;
  border-top-color: #333b5f;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to {
    transform: translateY(-50%) rotate(360deg);
  }
}

.input-with-unit {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  box-sizing: border-box;
}

.input-with-unit .form-input {
  padding-right: 4rem;
  width: 100%;
  box-sizing: border-box;
}

.unit-badge {
  position: absolute;
  right: 1rem;
  padding: 0.25rem 0.75rem;
  background: rgba(190, 206, 234, 0.3);
  color: #333b5f;
  font-size: 0.875rem;
  font-weight: 600;
  border-radius: 8px;
  pointer-events: none;
}

.item-detail-card {
  margin-top: 0.5rem;
  padding: 1.25rem;
  background: rgba(190, 206, 234, 0.15);
  border-radius: 12px;
  border: 2px solid #beceea;
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.item-detail-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  font-weight: 600;
  color: #333b5f;
}

.item-detail-content {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.detail-row {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.detail-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #333b5f;
  opacity: 0.8;
}

.detail-value {
  font-size: 1rem;
  color: #000;
  font-weight: 500;
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
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
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

.button-spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

.header-actions {
  display: flex;
  gap: 0.75rem;
}

.back-button {
  padding: 0.5rem 0.75rem;
  border: 2px solid #beceea;
  border-radius: 10px;
  background: white;
  color: #333b5f;
  font-weight: 600;
  cursor: pointer;
}

.back-button:hover {
  border-color: #333b5f;
  background: #f8f9fa;
}


@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Responsive Design */
@media (max-width: 768px) {
  .input-container {
    padding: 1rem 0.75rem;
  }

  .input-card {
    padding: 1.75rem;
    border-radius: 20px;
  }

  .header-content h2 {
    font-size: 1.75rem;
  }

  .session-info {
    grid-template-columns: 1fr;
    gap: 0.75rem;
    padding: 1rem;
  }

  .form-row {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .production-form {
    gap: 1.5rem;
  }

  .form-section {
    gap: 1rem;
  }

  .form-select,
  .form-input {
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
  .input-container {
    padding: 0.75rem 0.5rem;
  }

  .input-card {
    padding: 1.5rem 1.25rem;
    border-radius: 16px;
  }

  .header-content h2 {
    font-size: 1.5rem;
  }

  .section-title {
    font-size: 1.1rem;
  }

  .form-group {
    gap: 0.5rem;
  }

  .form-group label {
    font-size: 0.875rem;
  }

  .form-select,
  .form-input {
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
  .input-card {
    max-width: 850px;
    padding: 2.5rem;
  }
}

/* Large screens */
@media (min-width: 1025px) {
  .input-card {
    max-width: 800px;
  }
}

/* Landscape mobile */
@media (max-height: 600px) and (orientation: landscape) {
  .input-container {
    padding: 1rem;
  }

  .input-card {
    padding: 1.5rem 2rem;
  }

  .header-section {
    margin-bottom: 1.5rem;
  }

  .header-content h2 {
    font-size: 1.5rem;
  }

  .production-form {
    gap: 1rem;
  }
}
</style>