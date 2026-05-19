'use client';

import { FormEvent, useState } from 'react';
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';

export default function LoginPage() {
  const router = useRouter();
  const { signIn } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const loginData = await signIn(email, password);
      router.push(loginData.user.mustChangePassword ? '/change-password' : '/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f6f0ea] text-[#343434]">
      <div className="flex min-h-screen">
        <aside className="hidden w-[42%] flex-col items-center justify-center bg-[#343434] px-10 py-8 text-white lg:flex xl:px-14">
          <div className="flex w-full max-w-lg flex-col items-center text-center">
            <img
              src="/logobranca-transparente.png"
              alt="Pizzattolog"
              className="mb-14 h-auto w-full max-w-[340px] object-contain"
            />
            <span className="inline-flex rounded-md border border-white/15 bg-white/8 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#fab519]">
              Portal interno
            </span>
            <h2 className="mt-5 text-4xl font-bold leading-tight text-white">
              Operação comercial em um único acesso!
            </h2>
          </div>
        </aside>

        <section className="flex flex-1 items-center justify-center px-4 py-8 sm:px-6 lg:px-10">
          <div className="w-full max-w-[460px]">
            <div className="mb-8 flex justify-center lg:hidden">
              <img
                src="/logopizzatto.png"
                alt="Pizzattolog"
                className="h-auto w-full max-w-[240px] object-contain"
              />
            </div>

            <div className="rounded-md border border-slate-200/80 bg-white p-6 shadow-[0_24px_70px_rgba(52,52,52,0.08)] sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.20em] text-[#ec3139]">
                    Acesso seguro
                  </p>
                  <h1 className="mt-3 text-3xl font-bold text-[#343434]">
                    Entrar no CRM
                  </h1>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Use seu e-mail e senha para continuar.
                  </p>
                </div>

                <div className="grid h-11 w-11 place-items-center rounded-md bg-[#fab519]/18 text-[#343434] ring-1 ring-[#fab519]/40">
                  <ShieldCheck className="h-5 w-5" />
                </div>
              </div>

              <form onSubmit={handleSubmit} className="mt-8 grid gap-5">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#343434]">
                    E-mail
                  </label>
                  <div className="flex h-12 items-center gap-3 rounded-md border border-slate-300 bg-slate-50 px-4 transition focus-within:border-[#ec3139] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#ec3139]/10">
                    <Mail className="h-4 w-4 text-slate-400" />
                    <input
                      className="w-full bg-transparent text-sm text-[#343434] outline-none placeholder:text-slate-400"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="usuario@empresa.com"
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#343434]">
                    Senha
                  </label>
                  <div className="flex h-12 items-center gap-3 rounded-md border border-slate-300 bg-slate-50 px-4 transition focus-within:border-[#ec3139] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#ec3139]/10">
                    <LockKeyhole className="h-4 w-4 text-slate-400" />
                    <input
                      className="w-full bg-transparent text-sm text-[#343434] outline-none placeholder:text-slate-400"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Digite sua senha"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-slate-500 transition hover:bg-slate-200 hover:text-[#343434]"
                      aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {error ? (
                  <div className="rounded-md border border-[#ec3139]/25 bg-[#ec3139]/10 px-4 py-3 text-sm font-medium text-[#ec3139]">
                    {error}
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-[#ec3139] px-5 text-sm font-bold text-white shadow-[0_16px_32px_rgba(236,49,57,0.24)] transition hover:bg-[#d82931] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? 'Entrando...' : 'Entrar no portal'}
                  {!loading ? <ArrowRight className="h-4 w-4" /> : null}
                </button>
              </form>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
