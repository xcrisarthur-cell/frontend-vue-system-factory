import api from './http'

export const subPositionsApi = {
  getAll: () => api.get('/sub-positions'),
  getById: (id) => api.get(`/sub-positions/${id}`),
  getByPosition: (positionId) => api.get(`/sub-positions/by-position/${positionId}`),
  create: (data) => api.post('/sub-positions', data),
  update: (id, data) => api.put(`/sub-positions/${id}`, data),
  delete: (id) => api.delete(`/sub-positions/${id}`)
}

