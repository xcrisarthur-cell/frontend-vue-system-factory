import { defineStore } from 'pinia'

export const useCoordinatorSessionStore = defineStore('coordinatorSession', {
  state: () => ({
    coordinatorId: null,
    coordinatorName: '',
    isAuthenticated: false
  }),
  actions: {
    setCoordinator(coordinator) {
      this.coordinatorId = coordinator.id
      this.coordinatorName = coordinator.name
      this.isAuthenticated = true
    },
    clearSession() {
      this.coordinatorId = null
      this.coordinatorName = ''
      this.isAuthenticated = false
    }
  }
})

