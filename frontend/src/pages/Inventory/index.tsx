import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Boxes, AlertTriangle } from 'lucide-react';
import { getInventory, getInventorySummary, getLowStock } from '@/services/api/inventory';

const SummaryCard = ({ label, value }: { label: string; value: string | number }) => (
  <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
    <p className="text-sm text-gray-500">{label}</p>
    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
  </div>
);

export default function Inventory() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [tab, setTab] = useState<'all' | 'low'>('all');

  const { data: summaryRes } = useQuery({ queryKey: ['inventory', 'summary'], queryFn: () => getInventorySummary().then((r) => r.data) });
  const { data: inventoryRes, isLoading } = useQuery({ queryKey: ['inventory', { search, page }], queryFn: () => getInventory({ search, page, limit: 20 }).then((r) => r.data), enabled: tab === 'all' });
  const { data: lowStockRes, isLoading: lowLoading } = useQuery({ queryKey: ['inventory', 'low-stock'], queryFn: () => getLowStock().then((r) => r.data), enabled: tab === 'low' });

  const summary = summaryRes?.data;
  const items = tab === 'all' ? (inventoryRes?.data ?? []) : (lowStockRes?.data ?? []);
  const pagination = tab === 'all' ? inventoryRes?.pagination : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ombor</h1>
        <p className="text-sm text-gray-500 mt-0.5">Barcha joylardagi joriy zaxira</p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <SummaryCard label="Jami miqdor" value={(summary?.totalQty ?? 0).toLocaleString()} />
        <SummaryCard label="Band joylar" value={summary?.occupiedSlots ?? 0} />
        <SummaryCard label="Noyob modellar" value={summary?.uniqueModels ?? 0} />
        <SummaryCard label="Foydalanilgan joylar" value={summary?.uniqueLocations ?? 0} />
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center gap-4">
          <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden text-sm">
            <button onClick={() => setTab('all')} className={`px-4 py-1.5 transition-colors ${tab === 'all' ? 'bg-blue-600 text-white' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`}>Hammasi</button>
            <button onClick={() => setTab('low')} className={`px-4 py-1.5 transition-colors flex items-center gap-1.5 ${tab === 'low' ? 'bg-red-600 text-white' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
              <AlertTriangle size={13} /> Kam zaxira
            </button>
          </div>

          {tab === 'all' && (
            <div className="relative flex-1 max-w-xs">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Model qidirish..." className="w-full pl-8 pr-3 py-1.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          )}
        </div>

        {(isLoading || lowLoading) ? (
          <div className="p-8 text-center text-gray-400">Yuklanmoqda...</div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center"><Boxes size={40} className="mx-auto text-gray-300 mb-2" /><p className="text-gray-500">Ma'lumot topilmadi</p></div>
        ) : tab === 'all' ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-gray-100 dark:border-gray-800">{['MODEL', 'Nomi', 'Joy', 'Zona', 'Miqdor', 'Band'].map((h) => (<th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>))}</tr></thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {(items as any[]).map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3 text-sm font-mono text-blue-600">{inv.model?.modelCode}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{inv.model?.name}</td>
                    <td className="px-4 py-3 text-sm font-mono text-gray-600">{inv.location?.code}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{inv.location?.zone?.name}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white">{inv.quantity.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-gray-400">{inv.reservedQty}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {(items as any[]).map((item, i) => (
              <div key={i} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{item.model?.name} <span className="font-mono text-xs text-gray-400">({item.model?.modelCode})</span></p>
                  <p className="text-xs text-gray-400 mt-0.5">Min zaxira: {item.minStock}</p>
                </div>
                <span className={`font-bold text-lg ${item.totalQty === 0 ? 'text-red-600' : 'text-orange-500'}`}>{item.totalQty}</span>
              </div>
            ))}
          </div>
        )}

        {pagination && pagination.pages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between text-sm text-gray-500">
            <span>Jami: {pagination.total}</span>
            <div className="flex gap-2">
              <button disabled={!pagination.hasPrev} onClick={() => setPage(page - 1)} className="px-3 py-1 border rounded disabled:opacity-40">Oldingi</button>
              <span className="px-2 py-1">{pagination.page} / {pagination.pages}</span>
              <button disabled={!pagination.hasNext} onClick={() => setPage(page + 1)} className="px-3 py-1 border rounded disabled:opacity-40">Keyingi</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
