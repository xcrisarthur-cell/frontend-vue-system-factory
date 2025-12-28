import { defineStore } from 'pinia'

export const useMasterDataSessionStore = defineStore('masterDataSession', {
  state: () => ({
    superadminId: null,
    superadminName: '',
    isAuthenticated: false
  }),
  actions: {
    setSuperadmin(superadmin) {
      this.superadminId = superadmin.id
      this.superadminName = superadmin.name
      this.isAuthenticated = true
    },
    clearSession() {
      this.superadminId = null
      this.superadminName = ''
      this.isAuthenticated = false
    }
  }
})

