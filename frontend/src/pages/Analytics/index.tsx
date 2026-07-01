import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { getMovementVolume, getDeadstock, getCategoryBreakdown } from '@/services/api/analytics';
import { MOVEMENT_TYPE_LABELS } from '@/constants';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function Analytics() {
  const [days, setDays] = useState(30);

  const { data: volumeRes } = useQuery({ queryKey: ['analytics', 'volume', days], queryFn: () => getMovementVolume(days).then((r) => r.data) });
  const { data: deadstockRes } = useQuery({ queryKey: ['analytics', 'deadstock'], queryFn: () => getDeadstock(90).then((r) => r.data) });
  const { data: categoryRes } = useQuery({ queryKey: ['analytics', 'category'], queryFn: () => getCategoryBreakdown().then((r) => r.data) });

  const volumeData = (volumeRes?.data ?? []).map((d: any) => ({ name: MOVEMENT_TYPE_LABELS[d.type] || d.type, count: d.count, qty: d.totalQty }));
  const categoryData = categoryRes?.data ?? [];
  const deadstock = deadstockRes?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tahlil</h1>
          <p className="text-sm text-gray-500 mt-0.5">Zaxira ko'rsatkichlari va trendlar</p>
        </div>
        <select value={days} onChange={(e) => setDays(Number(e.target.value))} className="px-3 py-1.5 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value={7}>So'nggi 7 kun</option>
          <option value={30}>So'nggi 30 kun</option>
          <option value={90}>So'nggi 90 kun</option>
        </select>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <h2 className="text-base font-semibold mb-4">Harakat turi bo'yicha hajm</h2>
          {volumeData.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Harakat ma'lumotlari yo'q</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={volumeData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="qty" name="Miqdor" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <h2 className="text-base font-semibold mb-4">Kategoriya bo'yicha zaxira</h2>
          {categoryData.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Ma'lumot yo'q</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={categoryData} dataKey="quantity" nameKey="category" cx="50%" cy="50%" outerRadius={90} label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {categoryData.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <h2 className="text-base font-semibold mb-4">Harakatsiz zaxira (90+ kun)</h2>
        {deadstock.length === 0 ? (
          <p className="text-sm text-gray-400">Harakatsiz zaxira topilmadi</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  {['MODEL', 'Nomi', 'Joy', 'Miqdor', 'Harakatsiz kunlar'].map((h) => (
                    <th key={h} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {deadstock.slice(0, 20).map((item: any, i: number) => (
                  <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-3 py-2 font-mono text-blue-600">{item.model?.modelCode}</td>
                    <td className="px-3 py-2 text-gray-900 dark:text-white">{item.model?.name}</td>
                    <td className="px-3 py-2 font-mono text-gray-500">{item.location?.code}</td>
                    <td className="px-3 py-2 font-semibold">{item.quantity}</td>
                    <td className="px-3 py-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${item.daysStagnant >= 180 ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{item.daysStagnant} kun</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
