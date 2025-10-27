import axios from 'axios';
import { toast } from 'react-hot-toast';

// Create axios instance
const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
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
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      
      if (status === 401) {
        // Unauthorized - clear token and redirect to login
        localStorage.removeItem('token');
        window.location.href = '/login';
        toast.error('Session expired. Please log in again.');
      } else if (status === 403) {
        toast.error('Access denied. Insufficient permissions.');
      } else if (status >= 500) {
        toast.error('Server error. Please try again later.');
      } else {
        toast.error(data.message || 'An error occurred');
      }
    } else if (error.request) {
      // Network error
      toast.error('Network error. Please check your connection.');
    } else {
      // Other error
      toast.error('An unexpected error occurred');
    }
    
    return Promise.reject(error);
  }
);

// API functions
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
  logout: () => api.post('/auth/logout'),
};

export const dashboardAPI = {
  getStats: () => api.get('/dashboard'),
  getBlockchainVisual: () => api.get('/dashboard/blockchain-visual'),
  getAlerts: () => api.get('/dashboard/alerts'),
};

export const transactionAPI = {
  getAll: (params) => api.get('/transactions', { params }),
  create: (data) => api.post('/transactions', data),
  getById: (id) => api.get(`/transactions/${id}`),
  getStats: () => api.get('/transactions/stats/summary'),
  exportCSV: () => api.get('/transactions/export/csv', { responseType: 'blob' }),
};

export const blockchainAPI = {
  getBlocks: (params) => api.get('/blockchain/blocks', { params }),
  getBlock: (index) => api.get(`/blockchain/blocks/${index}`),
  verify: () => api.get('/blockchain/verify'),
  getStats: () => api.get('/blockchain/stats'),
  search: (params) => api.get('/blockchain/search', { params }),
  getNetwork: () => api.get('/blockchain/network'),
};

export const contractAPI = {
  getAll: (params) => api.get('/contracts', { params }),
  create: (data) => api.post('/contracts', data),
  getById: (id) => api.get(`/contracts/${id}`),
  execute: (id) => api.post(`/contracts/${id}/execute`),
  cancel: (id, data) => api.post(`/contracts/${id}/cancel`, data),
  getStats: () => api.get('/contracts/stats/summary'),
};

export const auditAPI = {
  getAll: (params) => api.get('/audit', { params }),
  getById: (id) => api.get(`/audit/${id}`),
  getStats: () => api.get('/audit/stats/summary'),
  exportCSV: (params) => api.get('/audit/export/csv', { params, responseType: 'blob' }),
  getEntityTrail: (type, id) => api.get(`/audit/entity/${type}/${id}`),
};

export default api;