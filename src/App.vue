<template>
  <NavigationBar />
  <div class="main-content" :class="{ 'with-navbar': !isHome }">
    <router-view />
  </div>
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
import NavigationBar from './components/NavigationBar.vue'
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const isHome = computed(() => route.path === '/')
</script>

<style>
.main-content {
  width: 100%;
  min-height: 100vh;
}

.main-content.with-navbar {
  padding-top: 64px;
}
</style>
