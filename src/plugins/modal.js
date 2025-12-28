import { ref } from 'vue'

const isOpen = ref(false)
const type = ref('info')
const title = ref('Pemberitahuan')
const message = ref('')
const confirmText = ref('OK')
const cancelText = ref('Batal')
const showCancel = ref(false)
const showCloseButton = ref(true)

let resolvePromise = null

const getDefaultTitle = (modalType) => {
  const titles = {
    success: 'Berhasil',
    error: 'Error',
    warning: 'Peringatan',
    info: 'Pemberitahuan',
    confirm: 'Konfirmasi'
  }
  return titles[modalType] || 'Pemberitahuan'
}

const showModal = (options) => {
  return new Promise((resolve) => {
    type.value = options.type || 'info'
    title.value = options.title || getDefaultTitle(options.type || 'info')
    message.value = options.message || ''
    confirmText.value = options.confirmText || 'OK'
    cancelText.value = options.cancelText || 'Batal'
    showCancel.value = options.showCancel || false
    showCloseButton.value = options.showCloseButton !== false
    isOpen.value = true
    resolvePromise = resolve
  })
}

const closeModal = () => {
  isOpen.value = false
  if (resolvePromise) {
    resolvePromise('close')
    resolvePromise = null
  }
}

const confirmModal = () => {
  if (resolvePromise) {
    resolvePromise('confirm')
    closeModal()
  }
}

const cancelModal = () => {
  if (resolvePromise) {
    resolvePromise('cancel')
    closeModal()
  }
}

export const modal = {
  isOpen,
  type,
  title,
  message,
  confirmText,
  cancelText,
  showCancel,
  showCloseButton,
  showModal,
  closeModal,
  confirmModal,
  cancelModal,
  showSuccess: (message, title = 'Berhasil') => showModal({ type: 'success', message, title }),
  showError: (message, title = 'Error') => showModal({ type: 'error', message, title }),
  showWarning: (message, title = 'Peringatan') => showModal({ type: 'warning', message, title }),
  showInfo: (message, title = 'Pemberitahuan') => showModal({ type: 'info', message, title }),
  showConfirm: (message, title = 'Konfirmasi') => showModal({ 
    type: 'confirm', 
    message, 
    title,
    showCancel: true,
    confirmText: 'Ya',
    cancelText: 'Tidak'
  }),
  // Helper untuk replace confirm() - returns true if confirmed
  confirm: async (message, title = 'Konfirmasi') => {
    const result = await showModal({ 
      type: 'confirm', 
      message, 
      title,
      showCancel: true,
      confirmText: 'Ya',
      cancelText: 'Tidak'
    })
    return result === 'confirm'
  }
}

