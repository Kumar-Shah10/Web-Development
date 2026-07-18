import axios from 'axios';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  register: (email, password, username) =>
    api.post('/auth/register', { email, password, username }),
  login: (email, password) =>
    api.post('/auth/login', { email, password }),
  forgotPassword: (email) =>
    api.post('/auth/forgot-password', { email }),
  resetPassword: (token, newPassword) =>
    api.post('/auth/reset-password', { token, newPassword }),
  getProfile: () =>
    api.get('/profile'),
  updateProfile: (fullName, username, avatarUrl) =>
    api.put('/profile', { fullName, username, avatarUrl }),
  updateTheme: (theme) =>
    api.put('/theme', { theme }),
  changePassword: (currentPassword, newPassword) =>
    api.put('/auth/change-password', { currentPassword, newPassword }),
};

export const notesAPI = {
  createNote: (title, content, type = 'note') =>
    api.post('/notes', { title, content, type }),
  getNotes: (filters = {}) =>
    api.get('/notes', { params: filters }),
  getNote: (id) =>
    api.get(`/notes/${id}`),
  updateNote: (id, title, content, color) =>
    api.put(`/notes/${id}`, { title, content, color }),
  togglePin: (id) =>
    api.put(`/notes/${id}/pin`),
  toggleArchive: (id) =>
    api.put(`/notes/${id}/archive`),
  toggleFavorite: (id) =>
    api.put(`/notes/${id}/favorite`),
  deleteNote: (id) =>
    api.delete(`/notes/${id}`),
  restoreNote: (id) =>
    api.post(`/notes/${id}/restore`),
  permanentlyDeleteNote: (id) =>
    api.delete(`/notes/${id}/permanent`),
  getDeletedNotes: () =>
    api.get('/deleted-notes'),
  exportToPDF: (id) =>
    api.get(`/notes/${id}/export-pdf`, { responseType: 'blob' }),
};

export default api;