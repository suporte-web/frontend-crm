'use client';

import { useEffect, useState } from 'react';
import { Copy, Send } from 'lucide-react';
import { AppLayout } from '@/components/layout/app-layout';
import { FeedbackToast } from '@/components/ui/feedback-toast';
import { useAuth } from '@/context/auth-context';
import {
  createSupplierInvite,
  getSupplierInvites,
} from '@/services/suppliers.service';
import type { SupplierInvite } from '@/types/suppliers';

const statusLabels: Record<string, string> = {
  PENDING: 'Pendente',
  ACCEPTED: 'Aceito',
  EXPIRED: 'Expirado',
  CANCELLED: 'Cancelado',
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

export default function SuppliersPage() {
  const { token, user } = useAuth();
  const [invites, setInvites] = useState<SupplierInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    notes: '',
  });
  const [toast, setToast] = useState<{
    title: string;
    message: string;
    variant: 'success' | 'error';
  } | null>(null);

  const canAccess = user?.role && ['ADMIN', 'GESTAO', 'COMERCIAL'].includes(user.role);

  async function loadInvites() {
    if (!token || !canAccess) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setPageError('');
      setInvites(await getSupplierInvites(token));
    } catch (error) {
      setPageError(error instanceof Error ? error.message : 'Erro ao carregar fornecedores.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInvites();
  }, [token, canAccess]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token) {
      return;
    }

    try {
      setSaving(true);
      const invite = await createSupplierInvite(
        {
          companyName: form.companyName.trim(),
          email: form.email.trim(),
          contactName: form.contactName.trim() || undefined,
          phone: form.phone.trim() || undefined,
          notes: form.notes.trim() || undefined,
        },
        token,
      );
      setInvites((current) => [invite, ...current]);
      setForm({
        companyName: '',
        contactName: '',
        email: '',
        phone: '',
        notes: '',
      });
      setToast({
        title: 'Convite criado',
        message: 'Link de cadastro do fornecedor gerado.',
        variant: 'success',
      });
    } catch (error) {
      setToast({
        title: 'Falha no convite',
        message: error instanceof Error ? error.message : 'Erro ao convidar fornecedor.',
        variant: 'error',
      });
    } finally {
      setSaving(false);
    }
  }

  if (!canAccess) {
    return (
      <AppLayout>
        <div className="rounded-[28px] border border-amber-200 bg-amber-50 p-6 text-amber-900">
          área restrita aos perfis internos do CRM.
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <section className="crm-shell-card p-6">
          <div>
            <p className="crm-eyebrow">Fornecedores</p>
            <h1 className="crm-page-title">Convites de cadastro</h1>
            <p className="crm-page-copy">
              Gere um convite para o fornecedor se cadastrar dentro da plataforma.
            </p>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
          <article className="crm-shell-card p-6">
            <h2 className="text-xl font-semibold text-slate-950">Enviar convite</h2>
            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <input
                value={form.companyName}
                onChange={(event) =>
                  setForm((current) => ({ ...current, companyName: event.target.value }))
                }
                className="crm-input"
                placeholder="Empresa fornecedora"
              />
              <input
                value={form.contactName}
                onChange={(event) =>
                  setForm((current) => ({ ...current, contactName: event.target.value }))
                }
                className="crm-input"
                placeholder="Contato"
              />
              <input
                type="email"
                value={form.email}
                onChange={(event) =>
                  setForm((current) => ({ ...current, email: event.target.value }))
                }
                className="crm-input"
                placeholder="E-mail"
              />
              <input
                value={form.phone}
                onChange={(event) =>
                  setForm((current) => ({ ...current, phone: event.target.value }))
                }
                className="crm-input"
                placeholder="Telefone"
              />
              <textarea
                value={form.notes}
                onChange={(event) =>
                  setForm((current) => ({ ...current, notes: event.target.value }))
                }
                className="crm-textarea"
                rows={4}
                placeholder="Observações internas"
              />
              <button
                type="submit"
                disabled={saving}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
              >
                <Send className="h-4 w-4" />
                {saving ? 'Enviando...' : 'Gerar convite'}
              </button>
            </form>
          </article>

          <article className="crm-shell-card overflow-hidden">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="text-xl font-semibold text-slate-950">Convites enviados</h2>
            </div>

            {loading ? (
              <div className="p-10 text-center text-sm text-slate-500">Carregando convites...</div>
            ) : pageError ? (
              <div className="p-10 text-center text-sm text-rose-600">{pageError}</div>
            ) : invites.length === 0 ? (
              <div className="p-10 text-center text-sm text-slate-500">Nenhum convite enviado.</div>
            ) : (
              <div className="divide-y divide-slate-200">
                {invites.map((invite) => (
                  <div key={invite.id} className="px-5 py-5">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <p className="text-base font-semibold text-slate-950">
                          {invite.companyName}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {invite.email} {invite.phone ? `- ${invite.phone}` : ''}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          Criado em {formatDate(invite.createdAt)}
                        </p>
                      </div>
                      <span className="w-fit rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                        {statusLabels[invite.status] ?? invite.status}
                      </span>
                    </div>
                    <div className="mt-4 flex flex-col gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-between">
                      <p className="truncate text-sm text-slate-600">{invite.inviteUrl}</p>
                      <button
                        type="button"
                        onClick={() => navigator.clipboard.writeText(invite.inviteUrl)}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                      >
                        <Copy className="h-4 w-4" />
                        Copiar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </article>
        </section>
      </div>

      <FeedbackToast
        open={!!toast}
        title={toast?.title ?? ''}
        message={toast?.message ?? ''}
        variant={toast?.variant ?? 'success'}
        onClose={() => setToast(null)}
      />
    </AppLayout>
  );
}
