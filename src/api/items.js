import api from './http'

export const itemsApi = {
  getAll: () => api.get('/items'),
  getById: (id) => api.get(`/items/${id}`),
  getByNumber: (itemNumber) => api.get(`/items/number/${itemNumber}`),
  create: (data) => api.post('/items', data),
  update: (id, data) => api.put(`/items/${id}`, data),
  delete: (id) => api.delete(`/items/${id}`)
}

