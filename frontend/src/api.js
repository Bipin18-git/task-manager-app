import axios from 'axios';

const api = axios.create({
  baseURL: 'https://task-manager-app-production-0f42.up.railway.app', // FastAPI Server
});

// Har request me JWT token attach karne ka jugaad
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
