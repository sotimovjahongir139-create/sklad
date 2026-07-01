import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { receiveInboundOrder } from '@/services/api/inbound';
import { getLocations } from '@/services/api/warehouse';
import type { InboundOrder } from '@/types';

interface Props { order: InboundOrder; onClose: () => void; onSave: () => void; }

export default function ReceiveInboundModal({ order, onClose, onSave }: Props) {
  const [items, setItems] = useState(order.items.map((item) => ({ modelId: item.modelId, locationId: '', quantity: item.expectedQty - item.receivedQty })));
  const [error, setError] = useState('');

  const { data: locRes } = useQuery({ queryKey: ['locations'], queryFn: () => getLocations({ isActive: true }).then((r) => r.data) });
  const locations = locRes?.data ?? [];

  const mutation = useMutation({
    mutationFn: (data: { items: { modelId: string; locationId: string; quantity: number }[] }) => receiveInboundOrder(order.id, data),
    onSuccess: onSave,
    onError: (err: any) => setError(err.response?.data?.message || 'Qabul qilishda xatolik'),
  });

  const updateItem = (i: number, field: string, value: string | number) => {
    const next = [...items];
    next[i] = { ...next[i], [field]: value };
    setItems(next);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const validItems = items.filter((it) => it.quantity > 0 && it.locationId);
    if (!validItems.length) { setError('Kamida bitta mahsulot uchun miqdor va joy kiriting'); return; }
    mutation.mutate({ items: validItems });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl w-full max-w-xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <div>
            <h2 className="text-lg font-semibold">Mahsulot qabul qilish</h2>
            <p className="text-sm text-gray-400">{order.orderNumber}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {order.items.map((orderItem, i) => (
            <div key={orderItem.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{orderItem.model?.name}</p>
                  <p className="text-xs text-gray-400 font-mono">{orderItem.model?.modelCode}</p>
                </div>
                <p className="text-xs text-gray-500">Kutilgan: {orderItem.expectedQty} · Qabul qilingan: {orderItem.receivedQty}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Qabul qilinadigan miqdor</label>
                  <input type="number" min={0} max={orderItem.expectedQty - orderItem.receivedQty} value={items[i]?.quantity ?? 0} onChange={(e) => updateItem(i, 'quantity', parseInt(e.target.value))} className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Joy (saqlash joyi)</label>
                  <select value={items[i]?.locationId ?? ''} onChange={(e) => updateItem(i, 'locationId', e.target.value)} className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Joy tanlang...</option>
                    {(locations as any[]).map((l: any) => <option key={l.id} value={l.id}>{l.code} ({l.zone?.name})</option>)}
                  </select>
                </div>
              </div>
            </div>
          ))}

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Bekor qilish</button>
            <button type="submit" disabled={mutation.isPending} className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white rounded-lg text-sm font-medium transition-colors">{mutation.isPending ? 'Qabul qilinmoqda...' : 'Qabulni tasdiqlash'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
