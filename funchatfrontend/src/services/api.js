import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  signup: (data) => api.post('/auth/signup', data),
  login: (data) => api.post('/auth/login', data),
  verifyEmail: (data) => api.post('/auth/verify-email', data),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  getCurrentUser: () => api.get('/auth/me'),
};

// Users API
export const usersAPI = {
  getAllUsers: (search) => api.get(`/users?search=${search || ''}`),
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  getUserById: (userId) => api.get(`/users/${userId}`),
};

// Friends API
export const friendsAPI = {
  sendRequest: (data) => api.post('/friends/request', data),
  getRequests: () => api.get('/friends/requests'),
  acceptRequest: (requestId) => api.put(`/friends/accept/${requestId}`),
  rejectRequest: (requestId) => api.delete(`/friends/reject/${requestId}`),
  blockUser: (data) => api.post('/friends/block', data),
  unblockUser: (data) => api.post('/friends/unblock', data),
  getFriends: () => api.get('/friends/list'),
  getBlockedUsers: () => api.get('/friends/blocked'),
};

// Chat API
export const chatAPI = {
  getHistory: (userId) => api.get(`/chat/history/${userId}`),
  sendMessage: (data) => api.post('/chat/send', data),
  markAsRead: (senderId) => api.put(`/chat/read/${senderId}`),
  getUnreadCount: () => api.get('/chat/unread-count'),
};

// Upload API
export const uploadAPI = {
  uploadFile: (formData) => api.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    // Required for file upload progress tracking
    onUploadProgress: (progressEvent) => {
      const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
      console.log('Upload progress:', percentCompleted);
    },
  }),
};

export default api;