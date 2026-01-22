import api from './http'

export const getSystemStatus = () => {
  return api.get('/system/status')
}

export const getDeviceStatus = () => {
  return api.get('/devices/status')
}
