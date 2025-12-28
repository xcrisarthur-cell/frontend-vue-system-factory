import { defineStore } from 'pinia'

export const useSupervisorSessionStore = defineStore('supervisorSession', {
  state: () => ({
    supervisorId: null,
    supervisorName: '',
    isAuthenticated: false
  }),
  actions: {
    setSupervisor(supervisor) {
      this.supervisorId = supervisor.id
      this.supervisorName = supervisor.name
      this.isAuthenticated = true
    },
    clearSession() {
      this.supervisorId = null
      this.supervisorName = ''
      this.isAuthenticated = false
    }
  }
})

