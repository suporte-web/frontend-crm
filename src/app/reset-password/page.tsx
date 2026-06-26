'use client';

import { FormEvent, Suspense, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Eye, EyeOff, LockKeyhole, ShieldCheck } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { resetPassword } from '@/services/auth.service';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const token = searchParams.get('token') ?? '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    setLoading(true);
    setSuccessMessage('');
    setError('');

    if (!token) {
      setError('Link de recuperação inválido ou ausente.');
      setLoading(false);
      return;
    }

    if (newPassword.trim().length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('As senhas não conferem.');
      setLoading(false);
      return;
    }

    try {
      const response = await resetPassword({
        token,
        newPassword: newPassword.trim(),
      });

      setSuccessMessage(response.message);

      setTimeout(() => {
        router.push('/login');
      }, 1800);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Erro ao redefinir senha.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#343434] text-white">
      <div className="grid min-h-screen lg:grid-cols-[45%_55%]">
        <section className="flex items-center justify-center px-6 py-12 sm:px-10 lg:px-16">
          <div className="w-full max-w-[430px]">
            <div>
              <img
                src="/logobranca-transparente.png"
                alt="Pizzattolog"
                className="h-auto w-full max-w-[240px] object-contain"
              />

              <div className="mt-10 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-[#fab519]">
                <ShieldCheck className="h-4 w-4" />
                Nova senha
              </div>

              <h1 className="mt-8 text-3xl font-bold tracking-[-0.04em] text-white sm:text-4xl">
                Redefinir senha
              </h1>

              <p className="mt-3 text-sm leading-6 text-white/60">
                Crie uma nova senha para acessar sua conta no CRM.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-10 space-y-6">
              <div>
                <label
                  htmlFor="newPassword"
                  className="block text-sm font-semibold text-white"
                >
                  Nova senha
                </label>

                <div className="mt-2 flex h-12 items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 transition focus-within:border-[#fab519] focus-within:bg-white/8 focus-within:ring-4 focus-within:ring-[#fab519]/10">
                  <LockKeyhole className="h-4 w-4 text-white/40" />

                  <input
                    id="newPassword"
                    name="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Digite a nova senha"
                    className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/35"
                  />

                  <button
                    type="button"
                    onClick={() => setShowNewPassword((current) => !current)}
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-white/45 transition hover:bg-white/10 hover:text-white"
                    aria-label={
                      showNewPassword ? 'Ocultar senha' : 'Mostrar senha'
                    }
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-semibold text-white"
                >
                  Confirmar senha
                </label>

                <div className="mt-2 flex h-12 items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 transition focus-within:border-[#fab519] focus-within:bg-white/8 focus-within:ring-4 focus-within:ring-[#fab519]/10">
                  <LockKeyhole className="h-4 w-4 text-white/40" />

                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirme a nova senha"
                    className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/35"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword((current) => !current)
                    }
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-white/45 transition hover:bg-white/10 hover:text-white"
                    aria-label={
                      showConfirmPassword ? 'Ocultar senha' : 'Mostrar senha'
                    }
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {successMessage ? (
                <div className="rounded-xl border border-green-400/30 bg-green-500/10 px-4 py-3 text-sm font-medium text-green-100">
                  {successMessage} Redirecionando para o login...
                </div>
              ) : null}

              {error ? (
                <div className="rounded-xl border border-[#ec3139]/30 bg-[#ec3139]/10 px-4 py-3 text-sm font-medium text-red-100">
                  {error}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className="flex h-12 w-full items-center justify-center rounded-xl bg-[#ec3139] px-4 text-sm font-bold text-white shadow-[0_18px_38px_rgba(236,49,57,0.28)] transition hover:bg-[#d82931] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Salvando...' : 'Salvar nova senha'}
              </button>

              <Link
                href="/login"
                className="flex items-center justify-center gap-2 text-sm font-semibold text-white/60 transition hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar para o login
              </Link>
            </form>

            <p className="mt-10 text-center text-xs text-white/35">
              © Pizzattolog CRM
            </p>
          </div>
        </section>

        <section className="relative hidden overflow-hidden bg-[#f6f0ea] lg:block">
          <div className="flex h-full items-center justify-center bg-[radial-gradient(circle_at_center,rgba(250,181,25,0.20),transparent_35%),linear-gradient(135deg,#f6f0ea_0%,#fbf7f2_55%,#efe5da_100%)] px-12">
            <div className="max-w-md text-center">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-white shadow-[0_20px_50px_rgba(52,52,52,0.10)]">
                <ShieldCheck className="h-7 w-7 text-[#ec3139]" />
              </div>

              <h2 className="mt-6 text-3xl font-bold tracking-[-0.04em] text-[#343434]">
                Crie uma senha segura.
              </h2>

              <p className="mt-4 text-sm leading-6 text-[#343434]/60">
                Depois de redefinir sua senha, você poderá acessar novamente o
                portal.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#343434] text-white">
          Carregando...
        </main>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}