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
  login: (data) => api.post('/login', data),
  signupRequestOTP: (data) => api.post('/auth/signup/request', data),
  signupVerifyOTP: (data) => api.post('/auth/signup/verify', data),
  signupComplete: (data) => api.post('/auth/signup/complete', data),
  passwordResetRequest: (data) => api.post('/auth/password-reset/request', data),
  passwordResetVerify: (data) => api.post('/auth/password-reset/verify', data),
  passwordResetComplete: (data) => api.post('/auth/password-reset/complete', data),
  getProfile: () => api.get('/profile'),
  updateProfile: (data) => api.put('/profile', data),
}

/** Hồ sơ công khai + đánh giá chuyên gia (theo `id` user). */
export const userAPI = {
  getById: (id) => api.get(`/users/${id}`),
  setExpertRating: (id, score) => api.post(`/users/${id}/expert-rating`, { score }),
}

export const journalAPI = {
  getAll: () => api.get('/journals'),
  create: (data) => api.post('/journals', data),
  update: (id, data) => api.put(`/journals/${id}`, data),
  delete: (id) => api.delete(`/journals/${id}`),
}

/** Checklist rule templates for journal entries (user-defined). */
export const journalChecklistTemplateAPI = {
  getAll: () => api.get('/journal-checklist-templates'),
  getById: (id) => api.get(`/journal-checklist-templates/${id}`),
  create: (data) => api.post('/journal-checklist-templates', data),
  /** Soft-delete (archived) on server. */
  delete: (id) => api.delete(`/journal-checklist-templates/${id}`),
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

export const notificationAPI = {
  list: () => api.get('/notifications'),
  unreadCount: () => api.get('/notifications/unread-count'),
  markRead: (id) => api.post(`/notifications/${id}/read`),
  markAllRead: () => api.post('/notifications/read-all'),
}

export default api
