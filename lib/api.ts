import axios from 'axios';

// Base URL from documentation
const API_BASE_URL = 'https://hiffi.alterwork.in/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add interceptor to inject token
api.interceptors.request.use(
  (config) => {
    // In a real app, we would get the token from Firebase Auth
    // const token = await auth.currentUser?.getIdToken();
    const token = typeof window !== 'undefined' ? localStorage.getItem('hiffi_token') : null;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Mock API for preview purposes since we don't have a real backend connection in this environment
// In a real deployment, remove this mock adapter logic
const MOCK_MODE = true;

if (MOCK_MODE && typeof window !== 'undefined') {
  // Simple mock implementation
  // @ts-ignore
  window.mockApi = {
    login: async (email: string, password: string) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      if (email === 'demo@hiffi.com' && password === 'password') {
        return {
          user: {
            uid: '123',
            email: 'demo@hiffi.com',
            username: 'hiffi_creator',
            name: 'Hiffi Creator',
            avatarUrl: '/diverse-avatars.png',
            followers: 1200,
            following: 45,
          },
          token: 'mock-jwt-token'
        };
      }
      throw new Error('Invalid credentials');
    },
    signup: async (data: any) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return {
        user: {
          uid: '123',
          ...data,
          avatarUrl: '/diverse-avatars.png',
          followers: 0,
          following: 0,
        },
        token: 'mock-jwt-token'
      };
    }
  };
}

export default api;
