import { create } from 'zustand';
import axiosInstance, { setAccessToken } from '../api/axios';

export const useAuthStore = create((set, get) => ({
  user: null,
  loading: true,

  restoreSession: async () => {
    try {
      const response = await axiosInstance.post('/api/auth/refresh');
      const token = response.data.data.accessToken;
      const profile = response.data.data.user;

      setAccessToken(token);
      set({ user: profile, loading: false });
    } catch (error) {
      setAccessToken('');
      set({ user: null, loading: false });
    }
  },

  login: async (email, password) => {
    const response = await axiosInstance.post('/api/auth/login', { email, password });
    const token = response.data.data.accessToken;
    const profile = response.data.data.user;

    setAccessToken(token);
    set({ user: profile });
    return profile;
  },

  register: async (name, email, password, address, role) => {
    const response = await axiosInstance.post('/api/auth/register', {
      name,
      email,
      password,
      address,
      role
    });
    return response.data;
  },

  logout: async () => {
    try {
      await axiosInstance.post('/api/auth/logout');
    } catch (error) {
      console.error('Logout error on server:', error);
    } finally {
      setAccessToken('');
      set({ user: null });
    }
  },

  logoutAll: async () => {
    try {
      await axiosInstance.post('/api/auth/logout-all');
    } catch (error) {
      console.error('Logout all error on server:', error);
    } finally {
      setAccessToken('');
      set({ user: null });
    }
  }
}));

// Auto-run restoreSession on load
useAuthStore.getState().restoreSession();
