import api from './http'

export const divisionsApi = {
  getAll: () => api.get('/divisions'),
  getById: (id) => api.get(`/divisions/${id}`),
  create: (data) => api.post('/divisions', data),
  update: (id, data) => api.put(`/divisions/${id}`, data),
  delete: (id) => api.delete(`/divisions/${id}`)
}

