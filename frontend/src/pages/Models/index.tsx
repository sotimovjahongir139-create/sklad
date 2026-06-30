import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Plus, Search, Edit2, Trash2, Package } from 'lucide-react';
import { getModels, createModel, updateModel, deleteModel } from '@/services/api/models';
import { queryClient } from '@/app/providers/queryClient';
import { useAuth } from '@/hooks/useAuth';
import type { ProductModel } from '@/types';
import ModelFormModal from './ModelFormModal';

export default function Models() {
  const { isManager } = useAuth();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedModel, setSelectedModel] = useState<ProductModel | null>(null);
  const [showForm, setShowForm] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['models', { search, page }],
    queryFn: () => getModels({ search, page, limit: 20 }).then((r) => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteModel,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['models'] }),
  });

  const models = data?.data ?? [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Modellar</h1>
          <p className="text-sm text-gray-500 mt-0.5">SKU va mahsulot katalogini boshqarish</p>
        </div>
        {isManager && (
          <button onClick={() => { setSelectedModel(null); setShowForm(true); }} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
            <Plus size={16} /> Yangi model
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Nom yoki SKU bo'yicha qidirish..."
              className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Yuklanmoqda...</div>
        ) : models.length === 0 ? (
          <div className="p-8 text-center">
            <Package size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">Modellar topilmadi</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  {['SKU', 'Nomi', 'Kategoriya', 'Birlik', 'Min zaxira', 'Holati', ''].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {models.map((model) => (
                  <tr key={model.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 py-3 text-sm font-mono font-medium text-blue-600">{model.sku}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{model.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{model.category || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{model.unit}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{model.minStock}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${model.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {model.isActive ? 'Faol' : 'Nofaol'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {isManager && (
                        <div className="flex items-center gap-2">
                          <button onClick={() => { setSelectedModel(model); setShowForm(true); }} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-gray-500 hover:text-blue-600 transition-colors">
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => { if (confirm(`${model.sku} ni o'chirilsinmi?`)) deleteMutation.mutate(model.id); }} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-gray-500 hover:text-red-600 transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pagination && pagination.pages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between text-sm text-gray-500">
            <span>Jami: {pagination.total}</span>
            <div className="flex gap-2">
              <button disabled={!pagination.hasPrev} onClick={() => setPage(page - 1)} className="px-3 py-1 border rounded disabled:opacity-40 hover:bg-gray-50">Oldingi</button>
              <span className="px-3 py-1">{pagination.page} / {pagination.pages}</span>
              <button disabled={!pagination.hasNext} onClick={() => setPage(page + 1)} className="px-3 py-1 border rounded disabled:opacity-40 hover:bg-gray-50">Keyingi</button>
            </div>
          </div>
        )}
      </div>

      {showForm && (
        <ModelFormModal
          model={selectedModel}
          onClose={() => setShowForm(false)}
          onSave={() => { queryClient.invalidateQueries({ queryKey: ['models'] }); setShowForm(false); }}
        />
      )}
    </div>
  );
}
