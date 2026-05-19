import axios from 'axios';

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000', // Tumhara FastAPI Server
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