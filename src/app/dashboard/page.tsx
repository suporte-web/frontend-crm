'use client';

import { AppLayout } from '@/components/layout/app-layout';
import { useAuth } from '@/context/auth-context';

function StatCard({
  title,
  value,
  icon,
  accentClass,
}: {
  title: string;
  value: string;
  icon: string;
  accentClass: string;
}) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <h3 className="mt-2 text-3xl font-bold text-slate-900">{value}</h3>
        </div>

        <div className={`rounded-2xl px-3 py-2 ${accentClass}`}>{icon}</div>
      </div>
    </div>
  );
}

function QuickActionCard({
  title,
  description,
  buttonLabel,
}: {
  title: string;
  description: string;
  buttonLabel: string;
}) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>

      <button className="mt-5 inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
        {buttonLabel}
      </button>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <AppLayout>
      <div className="min-h-screen bg-slate-100">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 p-4 md:p-6">
          <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
            <div className="grid gap-6 p-6 lg:grid-cols-[1.3fr_.7fr] lg:p-8">
              <div>
                <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
                  Dashboard
                </span>

                <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
                  Bem-vinda, {user?.name ?? 'usuária'}
                </h1>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 md:text-base">
                  Aqui está uma visão geral do portal. Você está logada como{' '}
                  <span className="font-semibold text-slate-700">
                    {user?.role ?? '-'}
                  </span>{' '}
                  e pode acompanhar os principais módulos do sistema a partir deste painel.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700">
                    Ver usuários
                  </button>

                  <button className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                    Acessar clientes
                  </button>
                </div>
              </div>

              <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-medium text-slate-500">Sessão atual</p>

                <div className="mt-5 space-y-3">
                  <div className="rounded-2xl bg-white p-4 shadow-sm">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      Perfil logado
                    </p>
                    <p className="mt-2 text-xl font-bold text-slate-900">
                      {user?.role ?? '-'}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white p-4 shadow-sm">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      Status da sessão
                    </p>
                    <p className="mt-2 text-xl font-bold text-emerald-600">
                      Online
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Perfil logado"
              value={user?.role ?? '-'}
              icon="👤"
              accentClass="bg-blue-50 text-blue-600"
            />
            <StatCard
              title="Módulo atual"
              value="CRM Portal"
              icon="🧩"
              accentClass="bg-violet-50 text-violet-600"
            />
            <StatCard
              title="Status"
              value="Online"
              icon="✔"
              accentClass="bg-emerald-50 text-emerald-600"
            />
            <StatCard
              title="Ambiente"
              value="Desenvolvimento"
              icon="⚙"
              accentClass="bg-amber-50 text-amber-600"
            />
          </section>

          <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_.8fr]">
            <div className="rounded-[24px] border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-5 py-4 md:px-6">
                <h2 className="text-lg font-semibold text-slate-900">
                  Resumo do portal
                </h2>
                <p className="text-sm text-slate-500">
                  Estrutura inicial do CRM para acompanhamento das áreas principais.
                </p>
              </div>

              <div className="grid gap-4 p-5 md:grid-cols-2 md:p-6">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-700">Usuários</p>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Gestão de acesso, perfis e status dos usuários internos e clientes.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-700">Clientes</p>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Organização da base comercial, empresas, segmentos e responsáveis.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-700">Cotações</p>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Fluxo de solicitações, status comerciais e respostas enviadas.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-700">Tickets</p>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Atendimento, acompanhamento de chamados e histórico de suporte.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-4">
              <QuickActionCard
                title="Gestão de usuários"
                description="Acesse a área de usuários para cadastrar novos perfis, editar permissões e controlar status."
                buttonLabel="Abrir módulo"
              />

              <QuickActionCard
                title="Base de clientes"
                description="Visualize sua estrutura comercial e prepare a futura integração com dados reais da carteira."
                buttonLabel="Ver clientes"
              />

              <QuickActionCard
                title="Rastreamento"
                description="Acompanhe a evolução da área de tracking e centralize as futuras consultas em um único fluxo."
                buttonLabel="Abrir rastreio"
              />
            </div>
          </section>
        </div>
      </div>
    </AppLayout>
  );
}