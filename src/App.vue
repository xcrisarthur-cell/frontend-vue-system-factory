<template>
  <router-view />
  <Modal
    :isOpen="modal.isOpen.value"
    :type="modal.type.value"
    :title="modal.title.value"
    :message="modal.message.value"
    :confirmText="modal.confirmText.value"
    :cancelText="modal.cancelText.value"
    :showCancel="modal.showCancel.value"
    :showCloseButton="modal.showCloseButton.value"
    @close="modal.closeModal"
    @confirm="modal.confirmModal"
    @cancel="modal.cancelModal"
  />
</template>

<script setup>
import { modal } from './plugins/modal'
import Modal from './components/Modal.vue'
</script>
