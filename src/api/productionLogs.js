import api from './http'

export const productionLogsApi = {
  getAll: () => api.get('/production-logs'),
  getById: (id) => api.get(`/production-logs/${id}`),
  create: (data) => api.post('/production-logs', data),
  update: (id, data) => api.put(`/production-logs/${id}`, data),
  delete: (id) => api.delete(`/production-logs/${id}`),
  bulkIncrementStatus: (ids) => api.post('/production-logs/bulk-increment-status', ids)
}

