import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { createModel, updateModel } from '@/services/api/models';
import type { ProductModel } from '@/types';

const schema = z.object({
  sku: z.string().min(1, 'Majburiy'),
  name: z.string().min(1, 'Majburiy'),
  description: z.string().optional(),
  category: z.string().optional(),
  unit: z.string().default('dona'),
  minStock: z.coerce.number().min(0).default(0),
  maxStock: z.coerce.number().optional(),
  weight: z.coerce.number().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  model: ProductModel | null;
  onClose: () => void;
  onSave: () => void;
}

export default function ModelFormModal({ model, onClose, onSave }: Props) {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: model
      ? { sku: model.sku, name: model.name, description: model.description, category: model.category, unit: model.unit, minStock: model.minStock, maxStock: model.maxStock, weight: model.weight }
      : { unit: 'dona', minStock: 0 },
  });

  const mutation = useMutation({
    mutationFn: (data: FormData) => model ? updateModel(model.id, data) : createModel(data),
    onSuccess: onSave,
  });

  const Field = ({ name, label, type = 'text' }: { name: keyof FormData; label: string; type?: string }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
      <input {...register(name)} type={type} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      {errors[name] && <p className="mt-1 text-xs text-red-500">{String(errors[name]?.message)}</p>}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-semibold">{model ? 'Modelni tahrirlash' : 'Yangi model'}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field name="sku" label="SKU *" />
            <Field name="unit" label="Birlik" />
          </div>
          <Field name="name" label="Nomi *" />
          <Field name="description" label="Tavsif" />
          <Field name="category" label="Kategoriya" />
          <div className="grid grid-cols-3 gap-4">
            <Field name="minStock" label="Min zaxira" type="number" />
            <Field name="maxStock" label="Maks zaxira" type="number" />
            <Field name="weight" label="Og'irligi (kg)" type="number" />
          </div>

          {mutation.error && <p className="text-sm text-red-500">{(mutation.error as any)?.response?.data?.message || 'Saqlashda xatolik'}</p>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              Bekor qilish
            </button>
            <button type="submit" disabled={mutation.isPending} className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg text-sm font-medium transition-colors">
              {mutation.isPending ? 'Saqlanmoqda...' : 'Saqlash'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
