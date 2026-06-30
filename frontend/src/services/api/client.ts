import axios from 'axios';
import { store } from '@/app/store';
import { setToken, logout } from '@/features/auth/authSlice';
import { API_BASE } from '@/constants';

const client = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

client.interceptors.request.use((config) => {
  const token = store.getState().auth.accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshing = false;
let queue: Array<{ resolve: (v: string) => void; reject: (e: unknown) => void }> = [];

client.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original = error.config;
    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    if (refreshing) {
      return new Promise((resolve, reject) => {
        queue.push({ resolve, reject });
      }).then((token) => {
        original.headers.Authorization = `Bearer ${token}`;
        return client(original);
      });
    }

    original._retry = true;
    refreshing = true;

    try {
      const res = await axios.post(`${API_BASE}/auth/refresh`, {}, { withCredentials: true });
      const newToken = res.data.data.accessToken;
      store.dispatch(setToken(newToken));
      queue.forEach((p) => p.resolve(newToken));
      queue = [];
      original.headers.Authorization = `Bearer ${newToken}`;
      return client(original);
    } catch (err) {
      queue.forEach((p) => p.reject(err));
      queue = [];
      store.dispatch(logout());
      return Promise.reject(err);
    } finally {
      refreshing = false;
    }
  }
);

export default client;
