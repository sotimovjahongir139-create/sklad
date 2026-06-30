import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Plus, Search, ArrowUpFromLine, Truck, XCircle } from 'lucide-react';
import { getOutboundOrders, cancelOutboundOrder, shipOutboundOrder } from '@/services/api/outbound';
import { queryClient } from '@/app/providers/queryClient';
import { useAuth } from '@/hooks/useAuth';
import { OUTBOUND_STATUS_LABELS, PRIORITY_LABELS, STATUS_COLORS, PRIORITY_COLORS } from '@/constants';
import { format } from 'date-fns';
import CreateOutboundModal from './CreateOutboundModal';
import type { OutboundOrder } from '@/types';

export default function Outbound() {
  const { isOperator, isManager } = useAuth();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['outbound', { search, status, page }],
    queryFn: () => getOutboundOrders({ search, status: status || undefined, page, limit: 20 }).then((r) => r.data),
  });

  const cancelMutation = useMutation({ mutationFn: cancelOutboundOrder, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['outbound'] }) });
  const shipMutation = useMutation({ mutationFn: shipOutboundOrder, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['outbound'] }) });

  const orders = data?.data ?? [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Chiqim buyurtmalari</h1>
          <p className="text-sm text-gray-500 mt-0.5">Yig'ish, qadoqlash va jo'natish</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
          <Plus size={16} /> Chiqim
        </button>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Buyurtma raqami yoki mijoz..." className="w-full pl-8 pr-3 py-1.5 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="px-3 py-1.5 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Barcha holat</option>
            {Object.entries(OUTBOUND_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Yuklanmoqda...</div>
        ) : orders.length === 0 ? (
          <div className="p-8 text-center"><ArrowUpFromLine size={40} className="mx-auto text-gray-300 mb-2" /><p className="text-gray-500">Buyurtmalar topilmadi</p></div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {orders.map((order: OutboundOrder) => (
              <div key={order.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold font-mono text-gray-900 dark:text-white">{order.orderNumber}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[order.status]}`}>{OUTBOUND_STATUS_LABELS[order.status]}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${PRIORITY_COLORS[order.priority]}`}>{PRIORITY_LABELS[order.priority]}</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {order.customer || 'Mijoz yo\'q'} · {order.items.length} ta mahsulot
                      {order.requestedAt && ` · So'ralgan sana: ${format(new Date(order.requestedAt), 'dd.MM.yyyy')}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {isOperator && ['PICKING', 'PACKING'].includes(order.status) && (
                      <button onClick={() => { if (confirm("Jo'natildi deb belgilansinmi?")) shipMutation.mutate(order.id); }} className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium transition-colors">
                        <Truck size={13} /> Jo'natish
                      </button>
                    )}
                    {isManager && !['SHIPPED', 'CANCELLED'].includes(order.status) && (
                      <button onClick={() => { if (confirm('Buyurtmani bekor qilasizmi?')) cancelMutation.mutate(order.id); }} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-gray-400 hover:text-red-500 transition-colors">
                        <XCircle size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {pagination && pagination.pages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between text-sm text-gray-500">
            <span>Jami: {pagination.total} ta buyurtma</span>
            <div className="flex gap-2">
              <button disabled={!pagination.hasPrev} onClick={() => setPage(page - 1)} className="px-3 py-1 border rounded disabled:opacity-40">Oldingi</button>
              <span className="px-2 py-1">{pagination.page} / {pagination.pages}</span>
              <button disabled={!pagination.hasNext} onClick={() => setPage(page + 1)} className="px-3 py-1 border rounded disabled:opacity-40">Keyingi</button>
            </div>
          </div>
        )}
      </div>

      {showCreate && <CreateOutboundModal onClose={() => setShowCreate(false)} onSave={() => { queryClient.invalidateQueries({ queryKey: ['outbound'] }); setShowCreate(false); }} />}
    </div>
  );
}
