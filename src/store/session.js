import { defineStore } from 'pinia'

export const useSessionStore = defineStore('session', {
  state: () => ({
    workerId: null,
    workerName: '',
    positionId: null,
    positionCode: '',
    positionUnit: '',
    subPositionId: null,
    subPositionCode: ''
  })
})
