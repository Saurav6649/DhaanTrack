import axios from 'axios';

// Resolve API base URL from Vite environment variables (fallback to localhost:5000/api for local dev)
const rawBaseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
export const API_BASE_URL = rawBaseURL.replace(/\/+$/, '');

// Cookie extractor helper (for CSRF token)
export const getCookie = (name) => {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
  return match ? decodeURIComponent(match[3]) : null;
};

// Centralized Axios client instance
export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach CSRF token and normalize redundant /api prefix
api.interceptors.request.use(
  (config) => {
    // If baseURL ends with /api and requested URL starts with /api/, strip redundant /api
    if (config.url) {
      if (config.url === '/api') {
        config.url = '/';
      } else if (config.url.startsWith('/api/')) {
        config.url = config.url.replace(/^\/api/, '');
      }
    }

    // Attach CSRF protection header
    const csrfToken = getCookie('dhaantrack_csrf');
    if (csrfToken && ['post', 'put', 'patch', 'delete'].includes(config.method?.toLowerCase() || '')) {
      config.headers['X-CSRF-Token'] = csrfToken;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: centralized error message formatting
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'An unexpected error occurred.';
    return Promise.reject(new Error(message));
  }
);

/**
 * Helper to construct full backend API URL (useful for window.open, export downloads, etc.)
 * Ensures correct domain and port from environment configuration without duplicate /api prefixes.
 * @param {string} endpoint - e.g. '/reports/work/export' or '/api/reports/work/export'
 * @returns {string} full API URL
 */
export const getApiUrl = (endpoint = '') => {
  const cleanEndpoint = String(endpoint).replace(/^\/?(api\/)?/, '');
  return `${API_BASE_URL}/${cleanEndpoint}`;
};

export default api;
