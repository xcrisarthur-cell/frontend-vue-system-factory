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

export function useModal() {
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
      if (type.value !== 'confirm') {
        closeModal()
      }
    }
  }

  const cancelModal = () => {
    if (resolvePromise) {
      resolvePromise('cancel')
      closeModal()
    }
  }

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

  // Helper functions for common use cases
  const showSuccess = (message, title = 'Berhasil') => {
    return showModal({ type: 'success', message, title })
  }

  const showError = (message, title = 'Error') => {
    return showModal({ type: 'error', message, title })
  }

  const showWarning = (message, title = 'Peringatan') => {
    return showModal({ type: 'warning', message, title })
  }

  const showInfo = (message, title = 'Pemberitahuan') => {
    return showModal({ type: 'info', message, title })
  }

  const showConfirm = (message, title = 'Konfirmasi') => {
    return showModal({ 
      type: 'confirm', 
      message, 
      title,
      showCancel: true,
      confirmText: 'Ya',
      cancelText: 'Tidak'
    })
  }

  return {
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
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showConfirm
  }
}

