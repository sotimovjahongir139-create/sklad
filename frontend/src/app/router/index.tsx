import { Routes, Route, Navigate } from 'react-router-dom';
import { useAppSelector } from '@/app/store';
import DashboardLayout from '@/app/layouts/DashboardLayout';
import AuthLayout from '@/app/layouts/AuthLayout';
import LoginPage from '@/pages/Auth/Login';
import Dashboard from '@/pages/Dashboard';
import Models from '@/pages/Models';
import Inventory from '@/pages/Inventory';
import Inbound from '@/pages/Inbound';
import Outbound from '@/pages/Outbound';
import WarehouseMap from '@/pages/WarehouseMap';
import Analytics from '@/pages/Analytics';
import Notifications from '@/pages/Notifications';
import Settings from '@/pages/Settings';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAppSelector((s) => s.auth);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAppSelector((s) => s.auth);
  return isAuthenticated ? <Navigate to="/" replace /> : <>{children}</>;
};

export default function AppRouter() {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      </Route>

      <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/models" element={<Models />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/inbound" element={<Inbound />} />
        <Route path="/outbound" element={<Outbound />} />
        <Route path="/warehouse" element={<WarehouseMap />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/settings" element={<Settings />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
