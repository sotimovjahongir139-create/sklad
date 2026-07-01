import { useQuery } from '@tanstack/react-query';
import { Layers, Box, ArrowDownToLine, ArrowUpFromLine, Activity, AlertTriangle } from 'lucide-react';
import { getDashboardStats, getRecentActivity, getDashboardAlerts } from '@/services/api/dashboard';
import { MOVEMENT_TYPE_LABELS } from '@/constants';
import { formatDistanceToNow } from 'date-fns';
import { uz } from 'date-fns/locale';

const StatCard = ({ label, value, icon: Icon, color }: { label: string; value: number | string; icon: React.ElementType; color: string }) => (
  <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
      </div>
      <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center`}>
        <Icon size={24} className="text-white" />
      </div>
    </div>
  </div>
);

export default function Dashboard() {
  const { data: statsRes, isLoading: statsLoading } = useQuery({ queryKey: ['dashboard', 'stats'], queryFn: () => getDashboardStats().then((r) => r.data) });
  const { data: activityRes } = useQuery({ queryKey: ['dashboard', 'activity'], queryFn: () => getRecentActivity().then((r) => r.data) });
  const { data: alertsRes } = useQuery({ queryKey: ['dashboard', 'alerts'], queryFn: () => getDashboardAlerts().then((r) => r.data) });

  const stats = statsRes?.data;
  const activity = activityRes?.data ?? [];
  const alerts = alertsRes?.data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Bosh sahifa</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Ombor umumiy ko'rinishi</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <StatCard label="Jami mahsulot" value={statsLoading ? '...' : (stats?.totalInventoryQty ?? 0).toLocaleString()} icon={Layers} color="bg-blue-500" />
        <StatCard label="Modellar soni" value={statsLoading ? '...' : stats?.totalModels ?? 0} icon={Box} color="bg-purple-500" />
        <StatCard label="Kirim kutilmoqda" value={statsLoading ? '...' : stats?.inboundPending ?? 0} icon={ArrowDownToLine} color="bg-green-500" />
        <StatCard label="Chiqim kutilmoqda" value={statsLoading ? '...' : stats?.outboundPending ?? 0} icon={ArrowUpFromLine} color="bg-orange-500" />
        <StatCard label="Bugungi harakatlar" value={statsLoading ? '...' : stats?.todayMovements ?? 0} icon={Activity} color="bg-indigo-500" />
        <StatCard label="Kam qolgan mahsulotlar" value={statsLoading ? '...' : stats?.lowStockCount ?? 0} icon={AlertTriangle} color="bg-red-500" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">So'nggi harakatlar</h2>
          {activity.length === 0 ? (
            <p className="text-sm text-gray-400">Harakatlar yo'q</p>
          ) : (
            <div className="space-y-3">
              {activity.map((m: any) => (
                <div key={m.id} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                    <Activity size={14} className="text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 dark:text-white">
                      <span className="font-medium">{MOVEMENT_TYPE_LABELS[m.type]}</span>{' '}
                      <span className="text-gray-500">· {m.model?.name}</span>
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {m.quantity} dona · {m.performedBy?.name} · {formatDistanceToNow(new Date(m.createdAt), { addSuffix: true, locale: uz })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Ogohlantirishlar</h2>
          {alerts.length === 0 ? (
            <p className="text-sm text-gray-400">Ogohlantirishlar yo'q</p>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert: any, i: number) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30">
                  <AlertTriangle size={16} className={alert.severity === 'critical' ? 'text-red-600' : 'text-yellow-600'} />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{alert.model.name}</p>
                    <p className="text-xs text-gray-500">{alert.currentQty} / {alert.minStock} dona (min)</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${alert.severity === 'critical' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {alert.severity === 'critical' ? 'Kritik' : 'Ogohlantirish'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
