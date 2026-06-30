import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { User } from '@/types';
import * as authApi from '@/services/api/auth';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

const savedToken = localStorage.getItem('accessToken');
const savedUserRaw = localStorage.getItem('user');
let savedUser: User | null = null;
try { savedUser = savedUserRaw ? JSON.parse(savedUserRaw) : null; } catch { localStorage.removeItem('user'); }

const initialState: AuthState = {
  user: savedUser,
  accessToken: savedToken,
  isAuthenticated: !!savedToken,
  loading: false,
  error: null,
};

export const loginThunk = createAsyncThunk('auth/login', async (creds: { email: string; password: string }, { rejectWithValue }) => {
  try {
    const res = await authApi.login(creds);
    return res.data;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Login failed');
  }
});

export const logoutThunk = createAsyncThunk('auth/logout', async () => {
  try { await authApi.logoutApi(); } catch {}
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setToken: (state, action: PayloadAction<string>) => {
      state.accessToken = action.payload;
      state.isAuthenticated = true;
      localStorage.setItem('accessToken', action.payload);
    },
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.isAuthenticated = false;
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginThunk.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.isAuthenticated = true;
        localStorage.setItem('accessToken', action.payload.accessToken);
        localStorage.setItem('user', JSON.stringify(action.payload.user));
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(logoutThunk.fulfilled, (state) => {
        state.user = null;
        state.accessToken = null;
        state.isAuthenticated = false;
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
      });
  },
});

export const { setToken, logout } = authSlice.actions;
export default authSlice.reducer;
