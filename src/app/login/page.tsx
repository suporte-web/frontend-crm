'use client';

import { FormEvent, useState } from 'react';
import { ArrowRight, LockKeyhole, Mail } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';

export default function LoginPage() {
  const router = useRouter();
  const { signIn } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await signIn(email, password);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.16),transparent_22%),radial-gradient(circle_at_80%_20%,rgba(14,165,233,0.12),transparent_18%)]" />

      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center justify-center">
        <section className="w-full max-w-xl rounded-[32px] border border-white/80 bg-white/88 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur xl:p-8">
          <div>
            <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">
              Entrar
            </span>
            <h1 className="mt-4 text-3xl font-bold text-slate-950">
              Acesse sua conta
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Use seu email e senha para entrar no portal CRM.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 grid gap-5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                E-mail
              </label>
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 focus-within:border-blue-400 focus-within:bg-white">
                <Mail className="h-4 w-4 text-slate-400" />
                <input
                  className="w-full bg-transparent text-sm text-slate-900 outline-none"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@crm.com"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Senha
              </label>
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 focus-within:border-blue-400 focus-within:bg-white">
                <LockKeyhole className="h-4 w-4 text-slate-400" />
                <input
                  className="w-full bg-transparent text-sm text-slate-900 outline-none"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Digite sua senha"
                />
              </div>
            </div>

            {error ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#0f172a_0%,#2563eb_100%)] px-5 py-3.5 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(37,99,235,0.24)] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Entrando...' : 'Entrar no portal'}
              {!loading && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
