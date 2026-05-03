// frontend/src/lib/axios.js
import axios from 'axios';
import { store } from '@/store';
import { setCredentials, logout } from '@/store/slices/authSlice';

const api = axios.create({
  baseURL     : process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
  timeout     : 10000,
});

// ── Request: attach access token ──
api.interceptors.request.use((config) => {
  const token = store.getState().auth.accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Response: auto-refresh on 401 ──
let isRefreshing = false;
let failedQueue  = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  failedQueue = [];
};

api.interceptors.response.use(
  (res) => res,
  async (error) => {

    // ✅ FIX 1: Bail out immediately for canceled / aborted requests.
    // When GlobalSearch calls abortRef.current.abort(), axios throws a
    // CanceledError (code: 'ERR_CANCELED'). Without this guard, the code
    // below tries to read `error.config._retry` which is undefined on
    // abort errors — causing an uncaught TypeError that bypasses the
    // `axios.isCancel` check in GlobalSearch's catch block, and ultimately
    // surfaces as "Search failed. Please try again."
    if (axios.isCancel(error) || error.code === 'ERR_CANCELED') {
      return Promise.reject(error);
    }

    // ✅ FIX 2: Guard against missing config (network-down / timeout errors).
    // `error.config` can be undefined for errors that never made it to the
    // network layer. Without this, `!originalRequest._retry` throws TypeError.
    const originalRequest = error.config;
    if (!originalRequest) return Promise.reject(error);

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data }        = await api.post('/auth/refresh-token');
        const { accessToken } = data.data;
        store.dispatch(setCredentials({ accessToken }));
        processQueue(null, accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (err) {
        processQueue(err, null);
        store.dispatch(logout());
        window.location.href = '/login';
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;