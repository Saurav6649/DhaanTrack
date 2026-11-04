import axios from 'axios';

// Resolve API base URL from Vite environment variables (fallback to localhost:5000/api for local dev)
const rawBaseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
// Normalize: ensure it ends with /api to match backend routes
let normalizedBase = rawBaseURL.replace(/\/+$/, '');
if (!normalizedBase.endsWith('/api')) {
  normalizedBase = `${normalizedBase}/api`;
}
export const API_BASE_URL = normalizedBase;

// Cookie extractor helper (for CSRF token)
export const getCookie = (name) => {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
  return match ? decodeURIComponent(match[3]) : null;
};

// In-memory CSRF token fallback for cross-origin / modern browser cookie isolation
let memoryCsrfToken = null;

export const getCsrfToken = () => {
  return memoryCsrfToken || getCookie('dhaantrack_csrf');
};

export const setCsrfToken = (token) => {
  if (token && typeof token === 'string') {
    memoryCsrfToken = token;
  }
};

export const clearCsrfToken = () => {
  memoryCsrfToken = null;
};

// Cross-domain authentication fallback (persists token in memory & sessionStorage for refresh survival)
const AUTH_STORAGE_KEY = 'dhaantrack_auth_token';
let memoryAuthToken = null;

export const getAuthToken = () => {
  if (memoryAuthToken) return memoryAuthToken;
  if (typeof window !== 'undefined' && window.sessionStorage) {
    try {
      const stored = window.sessionStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        memoryAuthToken = stored;
        return stored;
      }
    } catch (e) {
      // Ignore storage access errors
    }
  }
  return null;
};

export const setAuthToken = (token) => {
  if (token && typeof token === 'string') {
    memoryAuthToken = token;
    if (typeof window !== 'undefined' && window.sessionStorage) {
      try {
        window.sessionStorage.setItem(AUTH_STORAGE_KEY, token);
      } catch (e) {}
    }
  }
};

export const clearAuthToken = () => {
  memoryAuthToken = null;
  if (typeof window !== 'undefined' && window.sessionStorage) {
    try {
      window.sessionStorage.removeItem(AUTH_STORAGE_KEY);
    } catch (e) {}
  }
};

// Shared promise to prevent redundant parallel requests for CSRF token
let csrfFetchPromise = null;

/**
 * Fetch a fresh CSRF token directly from backend without triggering request interceptors
 */
export const fetchCsrfToken = async () => {
  if (csrfFetchPromise) {
    return csrfFetchPromise;
  }

  csrfFetchPromise = (async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/auth/csrf-token`, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const token =
        response.headers?.['x-csrf-token'] ||
        response.headers?.['X-CSRF-Token'] ||
        response.data?.csrfToken ||
        response.data?.data?.csrfToken ||
        getCookie('dhaantrack_csrf');

      if (token) {
        setCsrfToken(token);
        return token;
      }
      return null;
    } catch (err) {
      console.warn('Unable to fetch CSRF token from server:', err?.message || err);
      return null;
    } finally {
      csrfFetchPromise = null;
    }
  })();

  return csrfFetchPromise;
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
  async (config) => {
    // If baseURL ends with /api and requested URL starts with /api/, strip redundant /api
    if (config.url) {
      if (config.url === '/api') {
        config.url = '/';
      } else if (config.url.startsWith('/api/')) {
        config.url = config.url.replace(/^\/api/, '');
      }
    }

    const method = (config.method || 'get').toLowerCase();
    const isStateChanging = ['post', 'put', 'patch', 'delete'].includes(method);

    // Attach Bearer token for cross-domain cookie isolation fallback
    const authToken = getAuthToken();
    if (authToken) {
      config.headers = config.headers || {};
      if (!config.headers['Authorization']) {
        config.headers['Authorization'] = `Bearer ${authToken}`;
      }
    }

    // Normalize endpoint path to check for exemptions
    const cleanUrl = (config.url || '').split('?')[0].replace(/\/+$/, '');
    const isExempt =
      cleanUrl === '/auth/login' ||
      cleanUrl === '/auth/bootstrap' ||
      cleanUrl === '/auth/logout';

    if (isStateChanging) {
      let csrfToken = getCsrfToken();

      // If token is missing and endpoint is not exempt, fetch one first
      if (!csrfToken && !isExempt) {
        csrfToken = await fetchCsrfToken();
      }

      if (csrfToken) {
        config.headers = config.headers || {};
        config.headers['X-CSRF-Token'] = csrfToken;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: capture fresh CSRF tokens, retry once on CSRF error, and centralize error formatting
api.interceptors.response.use(
  (response) => {
    // Synchronize CSRF token if backend sent it in response headers or body
    const freshToken =
      response.headers?.['x-csrf-token'] ||
      response.headers?.['X-CSRF-Token'] ||
      response.data?.csrfToken ||
      response.data?.data?.csrfToken;

    if (freshToken) {
      setCsrfToken(freshToken);
    }

    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Check if error is a 403 CSRF error and hasn't been retried yet
    const isCsrfError =
      error.response?.status === 403 &&
      (error.response?.data?.code === 'CSRF_INVALID' ||
        /csrf/i.test(error.response?.data?.message || ''));

    if (isCsrfError && originalRequest && !originalRequest._retryCsrf) {
      originalRequest._retryCsrf = true;
      clearCsrfToken();

      try {
        const newToken = await fetchCsrfToken();
        if (newToken) {
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers['X-CSRF-Token'] = newToken;
          return api(originalRequest);
        }
      } catch (retryError) {
        console.error('CSRF token refresh and retry failed:', retryError);
      }
    }

    // If session is unauthenticated/expired, clear stored tokens
    if (error.response?.status === 401) {
      clearAuthToken();
      clearCsrfToken();
    }

    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'An unexpected error occurred.';

    const formattedError = new Error(message);
    formattedError.response = error.response;
    formattedError.status = error.response?.status;
    return Promise.reject(formattedError);
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
