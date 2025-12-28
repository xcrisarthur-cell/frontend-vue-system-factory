<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="isOpen" class="modal-overlay" @click.self="handleClose">
        <div class="modal-container" :class="modalType">
          <div class="modal-header">
            <div class="modal-icon" v-if="type === 'success' || type === 'error' || type === 'warning' || type === 'info'">
              <svg v-if="type === 'success'" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
              <svg v-else-if="type === 'error'" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <svg v-else-if="type === 'warning'" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
            </div>
            <h3 class="modal-title">{{ title }}</h3>
            <button class="modal-close" @click="handleClose" v-if="showCloseButton">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          <div class="modal-body">
            <p>{{ message }}</p>
          </div>
          <div class="modal-footer">
            <button v-if="showCancel" class="btn-cancel" @click="handleCancel">
              {{ cancelText }}
            </button>
            <button class="btn-confirm" :class="confirmButtonClass" @click="handleConfirm">
              {{ confirmText }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  type: {
    type: String,
    default: 'info', // success, error, warning, info, confirm
    validator: (value) => ['success', 'error', 'warning', 'info', 'confirm'].includes(value)
  },
  title: {
    type: String,
    default: 'Pemberitahuan'
  },
  message: {
    type: String,
    required: true
  },
  confirmText: {
    type: String,
    default: 'OK'
  },
  cancelText: {
    type: String,
    default: 'Batal'
  },
  showCancel: {
    type: Boolean,
    default: false
  },
  showCloseButton: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['close', 'confirm', 'cancel'])

const modalType = computed(() => {
  return `modal-${props.type}`
})

const confirmButtonClass = computed(() => {
  return {
    'btn-success': props.type === 'success',
    'btn-error': props.type === 'error',
    'btn-warning': props.type === 'warning',
    'btn-info': props.type === 'info' || props.type === 'confirm'
  }
})

const handleClose = () => {
  emit('close')
}

const handleConfirm = () => {
  emit('confirm')
  emit('close')
}

const handleCancel = () => {
  emit('cancel')
  emit('close')
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
  backdrop-filter: blur(4px);
}

.modal-container {
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  animation: modalSlideUp 0.3s ease-out;
}

@keyframes modalSlideUp {
  from {
    opacity: 0;
    transform: translateY(30px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.modal-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  border-bottom: 1px solid #e9ecef;
  position: relative;
}

.modal-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  flex-shrink: 0;
}

.modal-success .modal-icon {
  background: #d4edda;
  color: #155724;
}

.modal-error .modal-icon {
  background: #f8d7da;
  color: #721c24;
}

.modal-warning .modal-icon {
  background: #fff3cd;
  color: #856404;
}

.modal-info .modal-icon,
.modal-confirm .modal-icon {
  background: #d1ecf1;
  color: #0c5460;
}

.modal-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #333b5f;
  flex: 1;
}

.modal-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: transparent;
  border: none;
  color: #666;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-close:hover {
  background: #f0f0f0;
  color: #333;
}

.modal-body {
  padding: 1.5rem;
  color: #495057;
  line-height: 1.6;
  flex: 1;
  overflow-y: auto;
}

.modal-body p {
  margin: 0;
  font-size: 1rem;
}

.modal-footer {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  padding: 1.5rem;
  border-top: 1px solid #e9ecef;
}

.btn-confirm,
.btn-cancel {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.9375rem;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 100px;
}

.btn-confirm {
  color: white;
}

.btn-success {
  background: #28a745;
}

.btn-success:hover {
  background: #218838;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
}

.btn-error {
  background: #dc3545;
}

.btn-error:hover {
  background: #c82333;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(220, 53, 69, 0.3);
}

.btn-warning {
  background: #ffc107;
  color: #212529;
}

.btn-warning:hover {
  background: #e0a800;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(255, 193, 7, 0.3);
}

.btn-info {
  background: #333b5f;
}

.btn-info:hover {
  background: #2a3250;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(51, 59, 95, 0.3);
}

.btn-cancel {
  background: white;
  color: #333b5f;
  border: 2px solid #beceea;
}

.btn-cancel:hover {
  background: #f8f9fa;
  border-color: #333b5f;
}

/* Modal Transitions */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

/* Responsive */
@media (max-width: 768px) {
  .modal-container {
    max-width: 100%;
    margin: 1rem;
    border-radius: 12px;
  }

  .modal-header {
    padding: 1.25rem;
  }

  .modal-title {
    font-size: 1.1rem;
  }

  .modal-body {
    padding: 1.25rem;
  }

  .modal-footer {
    padding: 1.25rem;
    flex-direction: column-reverse;
  }

  .btn-confirm,
  .btn-cancel {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .modal-container {
    margin: 0.5rem;
  }

  .modal-header {
    padding: 1rem;
  }

  .modal-icon {
    width: 36px;
    height: 36px;
  }

  .modal-title {
    font-size: 1rem;
  }

  .modal-body {
    padding: 1rem;
  }

  .modal-body p {
    font-size: 0.9375rem;
  }

  .modal-footer {
    padding: 1rem;
  }
}
</style>

