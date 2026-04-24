'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { CreateLeadPayload } from '@/types/leads';

type LeadFormProps = {
  loading: boolean;
  onSubmit: (payload: CreateLeadPayload) => Promise<boolean>;
};

const initialState: CreateLeadPayload = {
  name: '',
  email: '',
  phone: '',
  company: '',
  source: 'manual',
  status: 'new',
  notes: '',
};

export function LeadForm({ loading, onSubmit }: LeadFormProps) {
  const [form, setForm] = useState<CreateLeadPayload>(initialState);
  const [error, setError] = useState('');

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.name.trim()) {
      setError('Informe o nome do lead.');
      return;
    }

    setError('');
    const success = await onSubmit({
      name: form.name.trim(),
      email: form.email?.trim() || undefined,
      phone: form.phone?.trim() || undefined,
      company: form.company?.trim() || undefined,
      source: form.source?.trim() || 'manual',
      status: form.status?.trim() || 'new',
      notes: form.notes?.trim() || undefined,
    });

    if (success) {
      setForm(initialState);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">Nome</label>
          <input
            type="text"
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white"
            placeholder="Ex: Maria Oliveira"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">Empresa</label>
          <input
            type="text"
            value={form.company}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, company: event.target.value }))
            }
            className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white"
            placeholder="Ex: Transportes Exemplo"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">E-mail</label>
          <input
            type="email"
            value={form.email}
            onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
            className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white"
            placeholder="contato@empresa.com"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">Telefone</label>
          <input
            type="text"
            value={form.phone}
            onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
            className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white"
            placeholder="(11) 99999-9999"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">Origem</label>
          <select
            value={form.source}
            onChange={(event) => setForm((prev) => ({ ...prev, source: event.target.value }))}
            className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white"
          >
            <option value="manual">manual</option>
            <option value="evento">evento</option>
            <option value="site">site</option>
            <option value="indicacao">indicacao</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">Status</label>
          <select
            value={form.status}
            onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value }))}
            className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white"
          >
            <option value="new">new</option>
            <option value="qualified">qualified</option>
            <option value="contacted">contacted</option>
            <option value="archived">archived</option>
          </select>
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">Observacoes</label>
        <textarea
          rows={4}
          value={form.notes}
          onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
          className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white"
          placeholder="Contexto inicial do lead."
        />
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="flex justify-end">
        <Button type="submit" disabled={loading} className="rounded-2xl px-5">
          {loading ? 'Salvando...' : 'Criar lead'}
        </Button>
      </div>
    </form>
  );
}
