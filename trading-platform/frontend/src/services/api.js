import axios from 'axios'

/** Cơ sở REST; đường dẫn giữ nguyên để khớp backend. */
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api'

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export const authAPI = {
  register: (data) => api.post('/register', data),
  login: (data) => api.post('/login', data),
  getProfile: () => api.get('/profile'),
  updateProfile: (data) => api.put('/profile', data),
}

export const journalAPI = {
  getAll: () => api.get('/journals'),
  create: (data) => api.post('/journals', data),
  update: (id, data) => api.put(`/journals/${id}`, data),
  delete: (id) => api.delete(`/journals/${id}`),
}

export const postAPI = {
  /** Lấy dòng thời gian bài viết; có thể truyền after_id để phân trang. */
  getFeed: (params) =>
    api.get('/feed', {
      params: params?.after_id != null ? { after_id: params.after_id } : {},
    }),
  getById: (id) => api.get(`/posts/${id}`),
  create: (data) => api.post('/posts', data),
  deletePost: (id) => api.delete(`/posts/${id}`),
  deleteComment: (postId, commentId) => api.delete(`/posts/${postId}/comments/${commentId}`),
  like: (id) => api.post(`/posts/${id}/like`),
  unlike: (id) => api.delete(`/posts/${id}/like`),
  comment: (id, content, parentId) =>
    api.post(`/posts/${id}/comments`, { content, parent_id: parentId }),
}

export const followAPI = {
  follow: (userId) => api.post(`/follow/${userId}`),
  unfollow: (userId) => api.delete(`/follow/${userId}`),
}

export default api
