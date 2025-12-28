import api from './http'

export const problemCommentsApi = {
  getAll: () => api.get('/problem-comments'),
  getById: (id) => api.get(`/problem-comments/${id}`),
  create: (data) => api.post('/problem-comments', data),
  update: (id, data) => api.put(`/problem-comments/${id}`, data),
  delete: (id) => api.delete(`/problem-comments/${id}`)
}

