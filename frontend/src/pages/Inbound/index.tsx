import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Plus, Search, ArrowDownToLine, CheckCircle, XCircle } from 'lucide-react';
import { getInboundOrders, cancelInboundOrder } from '@/services/api/inbound';
import { queryClient } from '@/app/providers/queryClient';
import { useAuth } from '@/hooks/useAuth';
import { INBOUND_STATUS_LABELS, STATUS_COLORS } from '@/constants';
import { format } from 'date-fns';
import CreateInboundModal from './CreateInboundModal';
import ReceiveInboundModal from './ReceiveInboundModal';
import type { InboundOrder } from '@/types';

export default function Inbound() {
  const { isOperator, isManager } = useAuth();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [receiving, setReceiving] = useState<InboundOrder | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['inbound', { search, status, page }],
    queryFn: () => getInboundOrders({ search, status: status || undefined, page, limit: 20 }).then((r) => r.data),
  });

  const cancelMutation = useMutation({
    mutationFn: cancelInboundOrder,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['inbound'] }),
  });

  const orders = data?.data ?? [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Kirim</h1>
          <p className="text-sm text-gray-500 mt-0.5">Qabul qilish va zaxirani to'ldirish</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
          <Plus size={16} /> Kirim
        </button>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Buyurtma raqami yoki yetkazuvchi..." className="w-full pl-8 pr-3 py-1.5 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="px-3 py-1.5 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Barcha holat</option>
            {Object.entries(INBOUND_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Yuklanmoqda...</div>
        ) : orders.length === 0 ? (
          <div className="p-8 text-center"><ArrowDownToLine size={40} className="mx-auto text-gray-300 mb-2" /><p className="text-gray-500">Buyurtmalar topilmadi</p></div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {orders.map((order) => (
              <div key={order.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold font-mono text-gray-900 dark:text-white">{order.orderNumber}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[order.status]}`}>{INBOUND_STATUS_LABELS[order.status]}</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {order.supplier || 'Yetkazuvchi yo\'q'} · {order.items.length} ta mahsulot
                      {order.expectedAt && ` · Kutilgan sana: ${format(new Date(order.expectedAt), 'dd.MM.yyyy')}`}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {order.items.slice(0, 3).map((item) => (
                        <span key={item.id} className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded">
                          {item.model?.sku}: {item.receivedQty}/{item.expectedQty}
                        </span>
                      ))}
                      {order.items.length > 3 && <span className="text-xs text-gray-400">+{order.items.length - 3} ta</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isOperator && ['PENDING', 'IN_TRANSIT', 'RECEIVING'].includes(order.status) && (
                      <button onClick={() => setReceiving(order)} className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-medium transition-colors">
                        <CheckCircle size={13} /> Qabul qilish
                      </button>
                    )}
                    {isManager && !['COMPLETED', 'CANCELLED'].includes(order.status) && (
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

      {showCreate && <CreateInboundModal onClose={() => setShowCreate(false)} onSave={() => { queryClient.invalidateQueries({ queryKey: ['inbound'] }); setShowCreate(false); }} />}
      {receiving && <ReceiveInboundModal order={receiving} onClose={() => setReceiving(null)} onSave={() => { queryClient.invalidateQueries({ queryKey: ['inbound'] }); setReceiving(null); }} />}
    </div>
  );
}
