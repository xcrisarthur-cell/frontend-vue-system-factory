import { defineStore } from 'pinia'

export const useAdminProduksiSessionStore = defineStore('adminProduksiSession', {
  state: () => ({
    adminProduksiId: null,
    adminProduksiName: '',
    isAuthenticated: false
  }),
  actions: {
    setAdminProduksi(adminProduksi) {
      this.adminProduksiId = adminProduksi.id
      this.adminProduksiName = adminProduksi.name
      this.isAuthenticated = true
    },
    clearSession() {
      this.adminProduksiId = null
      this.adminProduksiName = ''
      this.isAuthenticated = false
    }
  }
})

