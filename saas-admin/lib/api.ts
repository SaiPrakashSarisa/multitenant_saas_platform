import axios from 'axios';
import { useAuthStore } from './store/auth-store';

const api = axios.create({
  baseURL: 'http://localhost:5000/api', // SaaS Backend URL
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
