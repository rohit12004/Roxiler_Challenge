import axios from 'axios';

let accessToken = '';

export const setAccessToken = (token) => {
  accessToken = token;
};

export const getAccessToken = () => {
  return accessToken;
};

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000',
  withCredentials: true, // Crucial for HttpOnly cookie passing
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request Interceptor: Attach Access Token if available
axiosInstance.interceptors.request.use(
  (config) => {
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Silent Token Refresh on 401
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Trigger refresh only if unauthorized, not retried yet, and not checking /refresh directly
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      originalRequest.url !== '/api/auth/refresh' &&
      originalRequest.url !== '/api/auth/login'
    ) {
      originalRequest._retry = true;

      try {
        const response = await axiosInstance.post('/api/auth/refresh');
        const token = response.data.data.accessToken;
        
        setAccessToken(token);
        
        // Retry the original failed request with the new access token
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // Refresh token revoked or expired
        setAccessToken('');
        
        // Return standard failure to calling contexts
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
