import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Lock, CheckCircle } from 'lucide-react';
import { updateProfile, changePassword } from '@/services/api/auth';
import { useAppDispatch } from '@/app/store';
import { logout } from '@/features/auth/authSlice';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

const profileSchema = z.object({ name: z.string().min(1, 'Ism kiritish shart') });
const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Majburiy maydon'),
  newPassword: z.string().min(8, 'Kamida 8 ta belgi'),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, { message: 'Parollar mos kelmaydi', path: ['confirmPassword'] });

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

const FIELD_LABELS: Record<string, string> = {
  currentPassword: 'Joriy parol',
  newPassword: 'Yangi parol',
  confirmPassword: 'Yangi parolni tasdiqlang',
};

export default function Settings() {
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [pwSuccess, setPwSuccess] = useState(false);

  const profileForm = useForm<ProfileForm>({ resolver: zodResolver(profileSchema), defaultValues: { name: user?.name || '' } });
  const passwordForm = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) });

  const profileMutation = useMutation({
    mutationFn: (data: ProfileForm) => updateProfile(data),
    onSuccess: () => { setProfileSuccess(true); setTimeout(() => setProfileSuccess(false), 3000); },
  });

  const passwordMutation = useMutation({
    mutationFn: (data: PasswordForm) => changePassword({ currentPassword: data.currentPassword, newPassword: data.newPassword }),
    onSuccess: () => {
      setPwSuccess(true);
      setTimeout(() => { dispatch(logout()); navigate('/login'); }, 2000);
    },
  });

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sozlamalar</h1>
        <p className="text-sm text-gray-500 mt-0.5">Hisob va afzalliklar</p>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <div className="flex items-center gap-3 mb-5">
          <User size={18} className="text-gray-500" />
          <h2 className="text-base font-semibold">Profil</h2>
        </div>

        <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm space-y-1">
          <p className="text-gray-500">Email: <span className="text-gray-900 dark:text-white font-medium">{user?.email}</span></p>
          <p className="text-gray-500">Rol: <span className="text-gray-900 dark:text-white font-medium">{user?.role}</span></p>
        </div>

        <form onSubmit={profileForm.handleSubmit((d) => profileMutation.mutate(d))} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ko'rsatiladigan ism</label>
            <input {...profileForm.register('name')} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            {profileForm.formState.errors.name && <p className="mt-1 text-xs text-red-500">{profileForm.formState.errors.name.message}</p>}
          </div>

          {profileSuccess && <div className="flex items-center gap-2 text-sm text-green-600"><CheckCircle size={16} /> Profil yangilandi</div>}

          <button type="submit" disabled={profileMutation.isPending} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg text-sm font-medium transition-colors">
            {profileMutation.isPending ? 'Saqlanmoqda...' : 'Saqlash'}
          </button>
        </form>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <div className="flex items-center gap-3 mb-5">
          <Lock size={18} className="text-gray-500" />
          <h2 className="text-base font-semibold">Parolni o'zgartirish</h2>
        </div>

        <form onSubmit={passwordForm.handleSubmit((d) => passwordMutation.mutate(d))} className="space-y-4">
          {(['currentPassword', 'newPassword', 'confirmPassword'] as const).map((field) => (
            <div key={field}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{FIELD_LABELS[field]}</label>
              <input {...passwordForm.register(field)} type="password" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              {passwordForm.formState.errors[field] && <p className="mt-1 text-xs text-red-500">{passwordForm.formState.errors[field]?.message}</p>}
            </div>
          ))}

          {passwordMutation.error && <p className="text-sm text-red-500">{(passwordMutation.error as any)?.response?.data?.message || 'Xatolik yuz berdi'}</p>}
          {pwSuccess && <p className="text-sm text-green-600">Parol o'zgartirildi — kirish sahifasiga yo'naltirilmoqda...</p>}

          <button type="submit" disabled={passwordMutation.isPending} className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white rounded-lg text-sm font-medium transition-colors">
            {passwordMutation.isPending ? 'O\'zgartirilmoqda...' : 'Parolni o\'zgartirish'}
          </button>
        </form>
      </div>
    </div>
  );
}
