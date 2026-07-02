import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Lock, CheckCircle, Plus, Trash2, Package } from 'lucide-react';
import { updateProfile, changePassword } from '@/services/api/auth';
import { createModel } from '@/services/api/models';
import { adjustInventory } from '@/services/api/inventory';
import { getLocations } from '@/services/api/warehouse';
import { queryClient } from '@/app/providers/queryClient';
import { useAppDispatch } from '@/app/store';
import { logout } from '@/features/auth/authSlice';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

/* ─ schemas ──────────────────────────────────────────────────────── */
const profileSchema  = z.object({ name: z.string().min(1, 'Ism kiritish shart') });
const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Majburiy maydon'),
  newPassword:     z.string().min(8, 'Kamida 8 ta belgi'),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'Parollar mos kelmaydi', path: ['confirmPassword'],
});
const singleModelSchema = z.object({
  modelCode:  z.string().min(1, 'Model raqami majburiy'),
  name:       z.string().min(1, 'Nomi majburiy'),
  category:   z.string().optional(),
  locationId: z.string().optional(),
  quantity:   z.coerce.number().min(0).default(0),
});

type ProfileForm     = z.infer<typeof profileSchema>;
type PasswordForm    = z.infer<typeof passwordSchema>;
type SingleModelForm = z.infer<typeof singleModelSchema>;

const PW_LABELS: Record<string, string> = {
  currentPassword: 'Joriy parol',
  newPassword:     'Yangi parol',
  confirmPassword: 'Yangi parolni tasdiqlang',
};

/* ─ empty bulk row ───────────────────────────────────────────────── */
type BulkRow = { modelCode: string; name: string; category: string; locationId: string; quantity: string };
const emptyRow = (): BulkRow => ({ modelCode: '', name: '', category: '', locationId: '', quantity: '' });

/* ─ helpers ──────────────────────────────────────────────────────── */
function InputField({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

const inputCls = 'w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500';

/* ─ Settings page ────────────────────────────────────────────────── */
export default function Settings() {
  const { user, isManager } = useAuth();
  const dispatch    = useAppDispatch();
  const navigate    = useNavigate();
  const [profileOk, setProfileOk]   = useState(false);
  const [pwOk,      setPwOk]        = useState(false);
  const [addMode,   setAddMode]     = useState<'single' | 'bulk'>('single');
  const [singleOk,  setSingleOk]    = useState('');
  const [singleErr, setSingleErr]   = useState('');
  const [bulkRows,  setBulkRows]    = useState<BulkRow[]>([emptyRow(), emptyRow()]);
  const [bulkMsg,   setBulkMsg]     = useState('');
  const [bulkErr,   setBulkErr]     = useState('');

  /* locations for slot dropdown */
  const { data: locRes } = useQuery({
    queryKey: ['locations'],
    queryFn: () => getLocations({ isActive: true }).then((r) => r.data),
    enabled: isManager,
  });
  const locations: any[] = locRes?.data ?? [];

  /* profile form */
  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name || '' },
  });
  const profileMut = useMutation({
    mutationFn: (d: ProfileForm) => updateProfile(d),
    onSuccess: () => { setProfileOk(true); setTimeout(() => setProfileOk(false), 3000); },
  });

  /* password form */
  const pwForm = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) });
  const pwMut  = useMutation({
    mutationFn: (d: PasswordForm) => changePassword({ currentPassword: d.currentPassword, newPassword: d.newPassword }),
    onSuccess: () => {
      setPwOk(true);
      setTimeout(() => { dispatch(logout()); navigate('/login'); }, 2000);
    },
  });

  /* single model add */
  const singleForm = useForm<SingleModelForm>({ resolver: zodResolver(singleModelSchema) });
  const singleMut  = useMutation({
    mutationFn: async (d: SingleModelForm) => {
      const res = await createModel({ modelCode: d.modelCode, name: d.name, category: d.category || undefined, unit: 'dona', minStock: 0 });
      const modelId = (res.data as any).data?.id;
      if (modelId && d.locationId && d.quantity > 0)
        await adjustInventory({ modelId, locationId: d.locationId, quantity: d.quantity });
      return res;
    },
    onSuccess: () => {
      setSingleOk('Model muvaffaqiyatli qo\'shildi!');
      setSingleErr('');
      singleForm.reset();
      setTimeout(() => setSingleOk(''), 3000);
      queryClient.invalidateQueries({ queryKey: ['warehouse', 'map'] });
      queryClient.invalidateQueries({ queryKey: ['models'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
    onError: (e: any) => {
      setSingleErr(e?.response?.data?.message || 'Xatolik yuz berdi');
      setSingleOk('');
    },
  });

  /* bulk add */
  const updateRow = (i: number, field: keyof BulkRow, val: string) => {
    setBulkRows((prev) => prev.map((r, idx) => idx === i ? { ...r, [field]: val } : r));
  };
  const addRow    = () => setBulkRows((prev) => [...prev, emptyRow()]);
  const removeRow = (i: number) => setBulkRows((prev) => prev.filter((_, idx) => idx !== i));

  const submitBulk = async () => {
    setBulkMsg(''); setBulkErr('');
    const valid = bulkRows.filter((r) => r.modelCode.trim() && r.name.trim());
    if (!valid.length) { setBulkErr('Kamida bitta to\'liq qator kiriting'); return; }
    let ok = 0; const errors: string[] = [];
    for (const row of valid) {
      try {
        const res = await createModel({ modelCode: row.modelCode.trim(), name: row.name.trim(), category: row.category || undefined, unit: 'dona', minStock: 0 });
        const modelId = (res.data as any).data?.id;
        if (modelId && row.locationId && Number(row.quantity) > 0)
          await adjustInventory({ modelId, locationId: row.locationId, quantity: Number(row.quantity) });
        ok++;
      } catch (e: any) {
        errors.push(`${row.modelCode}: ${e?.response?.data?.message || 'xatolik'}`);
      }
    }
    queryClient.invalidateQueries({ queryKey: ['warehouse', 'map'] });
    queryClient.invalidateQueries({ queryKey: ['models'] });
    queryClient.invalidateQueries({ queryKey: ['inventory'] });
    if (errors.length) setBulkErr(errors.join(' | '));
    if (ok) { setBulkMsg(`${ok} ta model qo'shildi!`); setBulkRows([emptyRow(), emptyRow()]); }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sozlamalar</h1>
        <p className="text-sm text-gray-500 mt-0.5">Hisob, afzalliklar va mahsulot boshqaruvi</p>
      </div>

      {/* ── Profile ──────────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <div className="flex items-center gap-3 mb-5">
          <User size={18} className="text-gray-500" />
          <h2 className="text-base font-semibold">Profil</h2>
        </div>
        <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm space-y-1">
          <p className="text-gray-500">Email: <span className="text-gray-900 dark:text-white font-medium">{user?.email}</span></p>
          <p className="text-gray-500">Rol: <span className="text-gray-900 dark:text-white font-medium">{user?.role}</span></p>
        </div>
        <form onSubmit={profileForm.handleSubmit((d) => profileMut.mutate(d))} className="space-y-4">
          <InputField label="Ko'rsatiladigan ism" error={profileForm.formState.errors.name?.message}>
            <input {...profileForm.register('name')} className={inputCls} />
          </InputField>
          {profileOk && <div className="flex items-center gap-2 text-sm text-green-600"><CheckCircle size={16} /> Profil yangilandi</div>}
          <button type="submit" disabled={profileMut.isPending} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg text-sm font-medium transition-colors">
            {profileMut.isPending ? 'Saqlanmoqda…' : 'Saqlash'}
          </button>
        </form>
      </div>

      {/* ── Password ─────────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <div className="flex items-center gap-3 mb-5">
          <Lock size={18} className="text-gray-500" />
          <h2 className="text-base font-semibold">Parolni o'zgartirish</h2>
        </div>
        <form onSubmit={pwForm.handleSubmit((d) => pwMut.mutate(d))} className="space-y-4">
          {(['currentPassword', 'newPassword', 'confirmPassword'] as const).map((field) => (
            <InputField key={field} label={PW_LABELS[field]} error={pwForm.formState.errors[field]?.message}>
              <input {...pwForm.register(field)} type="password" className={inputCls} />
            </InputField>
          ))}
          {pwMut.error && <p className="text-sm text-red-500">{(pwMut.error as any)?.response?.data?.message || 'Xatolik yuz berdi'}</p>}
          {pwOk && <p className="text-sm text-green-600">Parol o'zgartirildi — kirish sahifasiga yo'naltirilmoqda…</p>}
          <button type="submit" disabled={pwMut.isPending} className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white rounded-lg text-sm font-medium transition-colors">
            {pwMut.isPending ? 'O\'zgartirilmoqda…' : 'Parolni o\'zgartirish'}
          </button>
        </form>
      </div>

      {/* ── Model qo'shish (only for managers+) ──────────────── */}
      {isManager && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <div className="flex items-center gap-3 mb-5">
            <Package size={18} className="text-gray-500" />
            <h2 className="text-base font-semibold">Model qo'shish</h2>
          </div>

          {/* mode tabs */}
          <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg mb-6 w-fit">
            {(['single', 'bulk'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setAddMode(m)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${addMode === m ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
              >
                {m === 'single' ? 'Bitta qo\'shish' : 'Ko\'p qo\'shish'}
              </button>
            ))}
          </div>

          {/* ── single add ── */}
          {addMode === 'single' && (
            <form onSubmit={singleForm.handleSubmit((d) => singleMut.mutate(d))} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputField label="Model raqami *" error={singleForm.formState.errors.modelCode?.message}>
                  <input {...singleForm.register('modelCode')} placeholder="masalan: 1030" className={inputCls} />
                </InputField>
                <InputField label="Nomi *" error={singleForm.formState.errors.name?.message}>
                  <input {...singleForm.register('name')} placeholder="masalan: Model 1030" className={inputCls} />
                </InputField>
                <InputField label="Kategoriya">
                  <input {...singleForm.register('category')} placeholder="masalan: Padosh" className={inputCls} />
                </InputField>
                <InputField label="Joy (ixtiyoriy)">
                  <select {...singleForm.register('locationId')} className={inputCls}>
                    <option value="">Joy tanlanmagan</option>
                    {locations.map((l: any) => (
                      <option key={l.id} value={l.id}>{l.code} {l.zone?.name ? `(${l.zone.name})` : ''}</option>
                    ))}
                  </select>
                </InputField>
                <InputField label="Miqdor (dona)">
                  <input {...singleForm.register('quantity')} type="number" min={0} placeholder="0" className={inputCls} />
                </InputField>
              </div>
              {singleErr && <p className="text-sm text-red-500">{singleErr}</p>}
              {singleOk  && <div className="flex items-center gap-2 text-sm text-green-600"><CheckCircle size={16} />{singleOk}</div>}
              <button type="submit" disabled={singleMut.isPending} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg text-sm font-medium transition-colors">
                <Plus size={16} /> {singleMut.isPending ? 'Saqlanmoqda…' : 'Model qo\'shish'}
              </button>
            </form>
          )}

          {/* ── bulk add ── */}
          {addMode === 'bulk' && (
            <div className="space-y-4">
              <p className="text-xs text-gray-500">Barcha qatorlarni to'ldiring va "Saqlash" tugmasini bosing. Model raqami va nomi majburiy.</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      {['Model raqami *', 'Nomi *', 'Kategoriya', 'Joy', 'Miqdor', ''].map((h) => (
                        <th key={h} className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {bulkRows.map((row, i) => (
                      <tr key={i}>
                        <td className="px-1 py-1.5">
                          <input
                            value={row.modelCode}
                            onChange={(e) => updateRow(i, 'modelCode', e.target.value)}
                            placeholder={i === 0 ? 'masalan: 1030' : ''}
                            className={`${inputCls} py-1.5`}
                          />
                        </td>
                        <td className="px-1 py-1.5">
                          <input
                            value={row.name}
                            onChange={(e) => updateRow(i, 'name', e.target.value)}
                            placeholder={i === 0 ? 'masalan: Model 1030' : ''}
                            className={`${inputCls} py-1.5`}
                          />
                        </td>
                        <td className="px-1 py-1.5">
                          <input
                            value={row.category}
                            onChange={(e) => updateRow(i, 'category', e.target.value)}
                            placeholder={i === 0 ? 'Padosh' : ''}
                            className={`${inputCls} py-1.5`}
                          />
                        </td>
                        <td className="px-1 py-1.5">
                          <select value={row.locationId} onChange={(e) => updateRow(i, 'locationId', e.target.value)} className={`${inputCls} py-1.5`}>
                            <option value="">—</option>
                            {locations.map((l: any) => <option key={l.id} value={l.id}>{l.code}</option>)}
                          </select>
                        </td>
                        <td className="px-1 py-1.5 w-24">
                          <input
                            type="number"
                            min={0}
                            value={row.quantity}
                            onChange={(e) => updateRow(i, 'quantity', e.target.value)}
                            placeholder="0"
                            className={`${inputCls} py-1.5`}
                          />
                        </td>
                        <td className="px-1 py-1.5">
                          <button onClick={() => removeRow(i)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={addRow} className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 dark:border-gray-700 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <Plus size={14} /> Qator qo'shish
                </button>
                <button onClick={submitBulk} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
                  <CheckCircle size={15} /> Saqlash ({bulkRows.filter((r) => r.modelCode.trim()).length} ta)
                </button>
              </div>
              {bulkErr && <p className="text-sm text-red-500">{bulkErr}</p>}
              {bulkMsg && <div className="flex items-center gap-2 text-sm text-green-600"><CheckCircle size={16} />{bulkMsg}</div>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
