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

      router.push(
        loginData.user.mustChangePassword ? '/change-password' : '/dashboard',
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer login');
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
                Portal interno
              </div>

              <h1 className="mt-8 text-3xl font-bold tracking-[-0.04em] text-white sm:text-4xl">
                Entrar no CRM
              </h1>

              <p className="mt-3 text-sm leading-6 text-white/60">
                Acesse sua conta para continuar no portal comercial.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-10 space-y-6">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-semibold text-white"
                >
                  E-mail
                </label>

                <div className="mt-2 flex h-12 items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 transition focus-within:border-[#fab519] focus-within:bg-white/8 focus-within:ring-4 focus-within:ring-[#fab519]/10">
                  <Mail className="h-4 w-4 text-white/40" />

                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="usuario@empresa.com"
                    className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/35"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between gap-4">
                  <label
                    htmlFor="password"
                    className="block text-sm font-semibold text-white"
                  >
                    Senha
                  </label>

                </div>

                <div className="mt-2 flex h-12 items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 transition focus-within:border-[#fab519] focus-within:bg-white/8 focus-within:ring-4 focus-within:ring-[#fab519]/10">
                  <LockKeyhole className="h-4 w-4 text-white/40" />

                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Digite sua senha"
                    className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/35"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-white/45 transition hover:bg-white/10 hover:text-white"
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
                <div className="rounded-xl border border-[#ec3139]/30 bg-[#ec3139]/10 px-4 py-3 text-sm font-medium text-red-100">
                  {error}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#ec3139] px-4 text-sm font-bold text-white shadow-[0_18px_38px_rgba(236,49,57,0.28)] transition hover:bg-[#d82931] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Entrando...' : 'Entrar no portal'}

                {!loading ? (
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                ) : null}
              </button>
            </form>

            <p className="mt-10 text-center text-xs text-white/35">
              © Pizzattolog CRM
            </p>
          </div>
        </section>

        <section className="relative hidden overflow-hidden bg-[#f6f0ea] lg:block">
          <img
            src="/office.jpg"
            alt="Ambiente de trabalho"
            className="h-full w-full object-cover"
          />

          <div className="flex h-full items-center justify-center bg-[radial-gradient(circle_at_center,rgba(250,181,25,0.20),transparent_35%),linear-gradient(135deg,#f6f0ea_0%,#fbf7f2_55%,#efe5da_100%)] px-12">
            <div className="max-w-md text-center">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-white shadow-[0_20px_50px_rgba(52,52,52,0.10)]">
                <ShieldCheck className="h-7 w-7 text-[#ec3139]" />
              </div>

              <h2 className="mt-6 text-3xl font-bold tracking-[-0.04em] text-[#343434]">
                Gestão comercial simples, segura e centralizada.
              </h2>

              <p className="mt-4 text-sm leading-6 text-[#343434]/60">
                Depois você pode substituir este bloco por uma imagem institucional ou foto do escritório.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}