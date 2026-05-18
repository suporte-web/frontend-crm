'use client';

import { FormEvent, useState } from 'react';
import { KeyRound, LockKeyhole } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/app-layout';
import { useAuth } from '@/context/auth-context';

export default function ChangePasswordPage() {
  const router = useRouter();
  const { changePassword } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('A nova senha precisa ter pelo menos 6 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('A confirmação da senha não confere.');
      return;
    }

    try {
      setSaving(true);
      await changePassword(currentPassword, newPassword);
      router.replace('/dashboard');
    } catch (changeError) {
      setError(
        changeError instanceof Error
          ? changeError.message
          : 'Erro ao alterar senha.',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppLayout>
      <div className="mx-auto flex min-h-[calc(100vh-9rem)] w-full max-w-3xl items-center">
        <section className="w-full rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <p className="crm-eyebrow">Primeiro acesso</p>
              <h1 className="mt-2 text-2xl font-bold text-slate-950">
                Alterar senha inicial
              </h1>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Defina uma senha propria para continuar usando o portal.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-7 grid gap-4">
            {[
              ['Senha atual', currentPassword, setCurrentPassword],
              ['Nova senha', newPassword, setNewPassword],
              ['Confirmar nova senha', confirmPassword, setConfirmPassword],
            ].map(([label, value, setter]) => (
              <label key={label as string} className="grid gap-2">
                <span className="text-sm font-semibold text-slate-700">
                  {label as string}
                </span>
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 focus-within:border-blue-400 focus-within:bg-white">
                  <LockKeyhole className="h-4 w-4 text-slate-400" />
                  <input
                    type="password"
                    value={value as string}
                    onChange={(event) =>
                      (setter as (nextValue: string) => void)(event.target.value)
                    }
                    className="w-full bg-transparent text-sm text-slate-900 outline-none"
                  />
                </div>
              </label>
            ))}

            {error ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
            >
              {saving ? 'Salvando...' : 'Salvar nova senha'}
            </button>
          </form>
        </section>
      </div>
    </AppLayout>
  );
}
