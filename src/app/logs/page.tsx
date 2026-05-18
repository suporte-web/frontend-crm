'use client';

import { useEffect, useMemo, useState } from 'react';
import { Download, History, ShieldAlert } from 'lucide-react';
import { AppLayout } from '@/components/layout/app-layout';
import { useAuth } from '@/context/auth-context';
import {
  exportAuditLogs,
  getAuditLogSummary,
  getAuditLogs,
} from '@/services/audit-logs.service';
import { getUsers } from '@/services/users.service';
import type { AuditLog, AuditLogCategory, AuditLogSummary } from '@/types/audit-logs';
import type { User } from '@/types/user';

const allowedRoles = new Set(['ADMIN', 'GESTAO']);

const categories: Array<'TODOS' | AuditLogCategory> = [
  'TODOS',
  'AUTH',
  'USER',
  'CLIENT',
  'QUOTE',
  'TICKET',
  'TRACKING',
  'SYSTEM',
];

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

export default function LogsPage() {
  const { user, token, loading: authLoading } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [summary, setSummary] = useState<AuditLogSummary>({
    total: 0,
    successCount: 0,
    errorCount: 0,
    byCategory: [],
  });
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const [filters, setFilters] = useState({
    dateFrom: new Date().toISOString().slice(0, 10),
    dateTo: new Date().toISOString().slice(0, 10),
    category: 'TODOS',
    userId: '',
    q: '',
  });

  const isAllowed = user ? allowedRoles.has(user.role) : false;

  const apiFilters = useMemo(() => ({
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    category: filters.category === 'TODOS' ? '' : filters.category,
    userId: filters.userId,
    q: filters.q,
  }), [filters]);

  async function loadLogs() {
    if (!token || !isAllowed) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setPageError('');
      const [logData, summaryData, userData] = await Promise.all([
        getAuditLogs(token, apiFilters),
        getAuditLogSummary(token, apiFilters),
        getUsers(),
      ]);
      setLogs(logData);
      setSummary(summaryData);
      setUsers(userData);
    } catch (error) {
      setPageError(error instanceof Error ? error.message : 'Erro ao carregar logs.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!authLoading) {
      loadLogs();
    }
  }, [authLoading, token, isAllowed, apiFilters]);

  if (!authLoading && !isAllowed) {
    return (
      <AppLayout>
        <div className="rounded-[28px] border border-amber-200 bg-amber-50 p-6 text-amber-900">
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-0.5 h-5 w-5" />
            <div>
              <h1 className="text-xl font-semibold">Acesso restrito</h1>
              <p className="mt-2 text-sm leading-6">
                Esta tela está disponível apenas para ADMIN e GESTÃO.
              </p>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <section className="crm-shell-card p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="crm-eyebrow">Auditoria</p>
              <h1 className="crm-page-title">Logs operacionais</h1>
              <p className="crm-page-copy">
                Ações de usuários, autenticação, clientes, cotações e tickets com filtro por data de referência.
              </p>
            </div>
            <button
              type="button"
              onClick={() => token && exportAuditLogs(token, apiFilters)}
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              <Download className="h-4 w-4" />
              Extrair relatorio
            </button>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            ['Eventos filtrados', summary.total, 'text-slate-950'],
            ['Sucesso', summary.successCount, 'text-emerald-600'],
            ['Alertas/erros', summary.errorCount, 'text-rose-600'],
            ['Categorias', summary.byCategory.length, 'text-blue-600'],
          ].map(([label, value, color]) => (
            <article key={label} className="crm-kpi-card">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-slate-500">{label}</p>
                  <h2 className={`mt-2 text-3xl font-bold ${color}`}>{value}</h2>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                  <History className="h-5 w-5" />
                </div>
              </div>
            </article>
          ))}
        </section>

        <section className="crm-shell-card p-5">
          <div className="grid gap-4 lg:grid-cols-5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Data inicial
              </label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(event) =>
                  setFilters((current) => ({ ...current, dateFrom: event.target.value }))
                }
                className="crm-input"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Data final
              </label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(event) =>
                  setFilters((current) => ({ ...current, dateTo: event.target.value }))
                }
                className="crm-input"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Categoria
              </label>
              <select
                value={filters.category}
                onChange={(event) =>
                  setFilters((current) => ({ ...current, category: event.target.value }))
                }
                className="crm-input"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Usuário
              </label>
              <select
                value={filters.userId}
                onChange={(event) =>
                  setFilters((current) => ({ ...current, userId: event.target.value }))
                }
                className="crm-input"
              >
                <option value="">Todos</option>
                {users.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Busca
              </label>
              <input
                value={filters.q}
                onChange={(event) =>
                  setFilters((current) => ({ ...current, q: event.target.value }))
                }
                className="crm-input"
                placeholder="Mensagem ou alvo"
              />
            </div>
          </div>
        </section>

        <section className="crm-shell-card overflow-hidden">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-lg font-semibold text-slate-900">Linha do tempo</h2>
            <p className="mt-1 text-sm text-slate-500">Eventos mais recentes no filtro aplicado.</p>
          </div>

          {loading ? (
            <div className="p-10 text-center text-sm text-slate-500">Carregando logs...</div>
          ) : pageError ? (
            <div className="p-10 text-center text-sm text-rose-600">{pageError}</div>
          ) : logs.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-500">Nenhum log encontrado.</div>
          ) : (
            <div className="divide-y divide-slate-200">
              {logs.map((log) => (
                <div key={log.id} className="grid gap-4 px-5 py-5 lg:grid-cols-[180px_1fr_180px]">
                  <div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                      {log.category}
                    </span>
                    <p className="mt-2 text-xs text-slate-400">{log.action}</p>
                  </div>
                  <div>
                    <p className="text-base font-semibold text-slate-950">{log.message}</p>
                    <p className="mt-2 text-sm text-slate-500">
                      {log.user?.name ?? 'Sistema'} {log.user?.email ? `(${log.user.email})` : ''}
                    </p>
                    {log.targetType || log.targetId ? (
                      <p className="mt-1 text-xs text-slate-400">
                        Alvo: {[log.targetType, log.targetId].filter(Boolean).join(' - ')}
                      </p>
                    ) : null}
                  </div>
                  <div className="text-sm text-slate-500 lg:text-right">
                    <p>{formatDateTime(log.createdAt)}</p>
                    <p className={log.success ? 'mt-2 text-emerald-600' : 'mt-2 text-rose-600'}>
                      {log.success ? 'Sucesso' : 'Falha'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppLayout>
  );
}
