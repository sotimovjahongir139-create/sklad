import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  LayoutDashboard, Package, Boxes, ArrowDownToLine, ArrowUpFromLine,
  Map, BarChart3, Bell, Settings, LogOut, Menu, X, ChevronRight,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/app/store';
import { logout } from '@/features/auth/authSlice';
import { useUnreadCount } from '@/hooks/useNotifications';

const nav = [
  { to: '/', label: 'Bosh sahifa', icon: LayoutDashboard, end: true },
  { to: '/models', label: 'Modellar', icon: Package },
  { to: '/inventory', label: 'Ombor', icon: Boxes },
  { to: '/inbound', label: 'Kirim', icon: ArrowDownToLine },
  { to: '/outbound', label: 'Chiqim', icon: ArrowUpFromLine },
  { to: '/warehouse', label: 'Ombor xaritasi', icon: Map },
  { to: '/analytics', label: 'Tahlil', icon: BarChart3 },
  { to: '/notifications', label: 'Bildirishnomalar', icon: Bell },
  { to: '/settings', label: 'Sozlamalar', icon: Settings },
];

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector((s) => s.auth);
  const { data: unreadData } = useUnreadCount();
  const unreadCount = unreadData?.data?.count ?? 0;

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const Sidebar = () => (
    <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 text-white flex flex-col transform transition-transform duration-200 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0`}>
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
        <span className="text-xl font-bold tracking-tight">SKLAD</span>
        <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 rounded hover:bg-gray-800">
          <X size={18} />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {nav.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`
            }
          >
            <Icon size={18} />
            <span>{label}</span>
            {label === 'Bildirishnomalar' && unreadCount > 0 && (
              <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-gray-800 px-4 py-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-semibold">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.name}</p>
            <p className="text-xs text-gray-400 truncate">{user?.role}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-2 text-gray-400 hover:text-white text-sm w-full px-2 py-1 rounded hover:bg-gray-800 transition-colors">
          <LogOut size={16} />
          Chiqish
        </button>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden">
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />}
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="lg:hidden flex items-center gap-4 px-4 py-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
            <Menu size={20} />
          </button>
          <span className="font-semibold">SKLAD</span>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
