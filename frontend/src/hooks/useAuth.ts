import { useAppSelector, useAppDispatch } from '@/app/store';
import { loginThunk, logoutThunk } from '@/features/auth/authSlice';

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const { user, isAuthenticated, loading, error } = useAppSelector((s) => s.auth);

  const login = (email: string, password: string) => dispatch(loginThunk({ email, password }));
  const logout = () => dispatch(logoutThunk());
  const hasRole = (...roles: string[]) => user ? roles.includes(user.role) : false;
  const isAdmin = user?.role === 'ADMIN';
  const isManager = ['ADMIN', 'MANAGER'].includes(user?.role ?? '');
  const isOperator = ['ADMIN', 'MANAGER', 'OPERATOR'].includes(user?.role ?? '');

  return { user, isAuthenticated, loading, error, login, logout, hasRole, isAdmin, isManager, isOperator };
};
