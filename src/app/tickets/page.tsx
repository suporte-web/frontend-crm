'use client';

import { AppLayout } from '@/components/layout/app-layout';

const ticketStatusStyles: Record<string, string> = {
  Aberto: 'bg-blue-100 text-blue-700',
  'Em andamento': 'bg-amber-100 text-amber-700',
  Resolvido: 'bg-emerald-100 text-emerald-700',
  Fechado: 'bg-slate-100 text-slate-700',
};

const mockTickets = [
  {
    id: '1',
    title: 'Erro ao consultar rastreamento',
    client: 'Pizzattolog LTDA',
    category: 'Logística',
    priority: 'Alta',
    status: 'Aberto',
    owner: 'Caroline',
    createdAt: '16/04/2026',
  },
  {
    id: '2',
    title: 'Dúvida sobre cotação expirada',
    client: 'Grupo Atlas',
    category: 'Comercial',
    priority: 'Média',
    status: 'Em andamento',
    owner: 'Equipe Comercial',
    createdAt: '15/04/2026',
  },
  {
    id: '3',
    title: 'Atualização de cadastro do cliente',
    client: 'Mercado Nova Era',
    category: 'Cadastro',
    priority: 'Baixa',
    status: 'Resolvido',
    owner: 'Mariana',
    createdAt: '13/04/2026',
  },
  {
    id: '4',
    title: 'Solicitação de novo acesso',
    client: 'Cliente Exemplo SA',
    category: 'Usuários',
    priority: 'Alta',
    status: 'Fechado',
    owner: 'João',
    createdAt: '12/04/2026',
  },
];

function getInitials(title: string) {
  const parts = title.trim().split(' ').filter(Boolean);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
}

export default function TicketsPage() {
  return (
    <AppLayout>
      <div className="min-h-screen bg-slate-100">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 p-4 md:p-6">
          <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
            <div className="grid gap-6 p-6 lg:grid-cols-[1.3fr_.7fr] lg:p-8">
              <div>
                <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
                  Atendimento
                </span>

                <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
                  Gestão de tickets
                </h1>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 md:text-base">
                  Acompanhe solicitações, priorize chamados e organize o fluxo de
                  atendimento em um painel mais claro e moderno.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700">
                    Novo ticket
                  </button>

                  <button className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                    Exportar tickets
                  </button>
                </div>
              </div>

              <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-medium text-slate-500">
                  Visão rápida
                </p>

                <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                  <div className="rounded-2xl bg-white p-4 shadow-sm">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      Em aberto
                    </p>
                    <p className="mt-2 text-2xl font-bold text-blue-600">8</p>
                  </div>

                  <div className="rounded-2xl bg-white p-4 shadow-sm">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      Resolvidos
                    </p>
                    <p className="mt-2 text-2xl font-bold text-emerald-600">14</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-500">Total de tickets</p>
                  <h2 className="mt-2 text-3xl font-bold text-slate-900">22</h2>
                </div>
                <div className="rounded-2xl bg-blue-50 px-3 py-2 text-blue-600">
                  🎫
                </div>
              </div>
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-500">Abertos</p>
                  <h2 className="mt-2 text-3xl font-bold text-blue-600">8</h2>
                </div>
                <div className="rounded-2xl bg-blue-50 px-3 py-2 text-blue-600">
                  ⚡
                </div>
              </div>
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-500">Em andamento</p>
                  <h2 className="mt-2 text-3xl font-bold text-amber-600">5</h2>
                </div>
                <div className="rounded-2xl bg-amber-50 px-3 py-2 text-amber-600">
                  ⏳
                </div>
              </div>
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-500">Resolvidos</p>
                  <h2 className="mt-2 text-3xl font-bold text-emerald-600">
                    14
                  </h2>
                </div>
                <div className="rounded-2xl bg-emerald-50 px-3 py-2 text-emerald-600">
                  ✔
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_.8fr_.8fr]">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Buscar ticket
                </label>
                <input
                  type="text"
                  placeholder="Título, cliente, categoria ou responsável"
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Categoria
                </label>
                <select className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white">
                  <option>Todas as categorias</option>
                  <option>Logística</option>
                  <option>Comercial</option>
                  <option>Cadastro</option>
                  <option>Usuários</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Status
                </label>
                <select className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white">
                  <option>Todos os status</option>
                  <option>Aberto</option>
                  <option>Em andamento</option>
                  <option>Resolvido</option>
                  <option>Fechado</option>
                </select>
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4 md:px-6">
              <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Tickets recentes
                  </h2>
                  <p className="text-sm text-slate-500">
                    Visualização inicial da futura área de atendimento.
                  </p>
                </div>

                <span className="inline-flex w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  {mockTickets.length} ticket(s)
                </span>
              </div>
            </div>

            <div className="divide-y divide-slate-200">
              {mockTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="grid gap-5 px-5 py-5 transition hover:bg-slate-50 md:grid-cols-[1.5fr_.9fr_.7fr_.8fr_.8fr_1fr] md:px-6"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-sm font-bold text-blue-700">
                      {getInitials(ticket.title)}
                    </div>

                    <div>
                      <p className="text-base font-semibold text-slate-900">
                        {ticket.title}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {ticket.client}
                      </p>
                    </div>
                  </div>

                  <div className="text-sm text-slate-600">
                    <p className="font-medium text-slate-700 md:hidden">
                      Categoria
                    </p>
                    <p>{ticket.category}</p>
                  </div>

                  <div className="text-sm text-slate-600">
                    <p className="font-medium text-slate-700 md:hidden">
                      Prioridade
                    </p>
                    <p>{ticket.priority}</p>
                  </div>

                  <div>
                    <p className="font-medium text-slate-700 md:hidden">Status</p>
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                        ticketStatusStyles[ticket.status]
                      }`}
                    >
                      {ticket.status}
                    </span>
                  </div>

                  <div className="text-sm text-slate-600">
                    <p className="font-medium text-slate-700 md:hidden">
                      Responsável
                    </p>
                    <p>{ticket.owner}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {ticket.createdAt}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-start gap-2 md:justify-end">
                    <button className="rounded-2xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100">
                      Ver detalhes
                    </button>

                    <button className="rounded-2xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-100">
                      Atualizar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </AppLayout>
  );
}