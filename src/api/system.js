import api from './http'

export const getSystemStatus = () => {
  return api.get('/system/status')
}
