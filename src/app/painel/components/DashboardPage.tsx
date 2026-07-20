"use client";

import Avatar from "@mui/material/Avatar";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import LinearProgress from "@mui/material/LinearProgress";
import Paper from "@mui/material/Paper";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  FileText,
  Flame,
  Layers3,
  Megaphone,
  ShieldCheck,
  Sparkles,
  Ticket,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { useAuth } from "@/context/auth-context";
import {
  formatOpportunityStage,
  getCrmDashboardSummary,
} from "@/services/crm.service";
import {
  getPortalContents,
  getPublishedPortalContents,
} from "@/services/portal-content.service";
import type { CrmDashboardSummary } from "@/types/crm";
import type { ContentType, PortalContent } from "@/types/portal-content";

const internalShortcuts: Array<{
  label: string;
  href: string;
  helper: string;
  icon: LucideIcon;
  accent: string;
}> = [
  {
    label: "Clientes",
    href: "/clientes",
    helper: "Relação comercial e base ativa",
    icon: Building2,
    accent: "from-[#ec3139] to-[#eb2c38]",
  },
  {
    label: "Cotações",
    href: "/cotacoes",
    helper: "Pipeline e resposta comercial",
    icon: FileText,
    accent: "from-[#fab519] to-[#ec3139]",
  },
  {
    label: "Rastreamento",
    href: "/rastreamentos",
    helper: "Consulta operacional e andamento",
    icon: Activity,
    accent: "from-[#343434] to-[#ec3139]",
  },
  {
    label: "Tickets",
    href: "/chamados",
    helper: "Suporte e atendimento",
    icon: Ticket,
    accent: "from-[#fab519] to-[#eb2c38]",
  },
  {
    label: "Portal",
    href: "/portal-content",
    helper: "Comunicação, campanhas e publicações",
    icon: Megaphone,
    accent: "from-[#ec3139] to-[#fab519]",
  },
];

function formatDate(date?: string | null) {
  if (!date) {
    return "-";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(date));
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function getUserInitials(name: string) {
  return name
    .trim()
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getTypeLabel(type: ContentType) {
  const labels: Record<ContentType, string> = {
    NOTICIA: "Noticia",
    INFORMACAO: "Campanha",
    VLOG: "Vídeo",
  };

  return labels[type];
}

function getTypeBadgeClass(type: ContentType) {
  const classes: Record<ContentType, string> = {
    NOTICIA: "bg-[#fab519] text-[#343434]",
    INFORMACAO: "bg-[#fab519] text-[#343434]",
    VLOG: "bg-[#fab519] text-[#343434]",
  };

  return classes[type];
}

function getClientFeedAccent(type: ContentType) {
  const classes: Record<ContentType, string> = {
    NOTICIA: "from-[#343434] via-[#ec3139] to-[#eb2c38]",
    INFORMACAO: "from-[#343434] via-[#fab519] to-[#ec3139]",
    VLOG: "from-[#343434] via-[#eb2c38] to-[#fab519]",
  };

  return classes[type];
}

const dashboardPalette = {
  text: "#343434",
  title: "#020617",
  muted: "#64748b",
  border: "#e2e8f0",
  red: "#ec3139",
  redDark: "#eb2c38",
  yellow: "#fab519",
  yellowSoft: "rgba(250,181,25,0.12)",
  surface: "#ffffff",
};

const dashboardPaperSx = {
  border: `1px solid ${dashboardPalette.border}`,
  borderRadius: "18px",
  bgcolor: dashboardPalette.surface,
  boxShadow: "0 18px 45px rgba(52,52,52,0.06)",
};

function gradientForAccent(accent: string) {
  if (accent.includes("fab519") && accent.includes("343434")) {
    return `linear-gradient(135deg, ${dashboardPalette.yellow} 0%, ${dashboardPalette.text} 100%)`;
  }

  if (accent.includes("fab519")) {
    return `linear-gradient(135deg, ${dashboardPalette.yellow} 0%, ${dashboardPalette.red} 100%)`;
  }

  if (accent.includes("343434")) {
    return `linear-gradient(135deg, ${dashboardPalette.text} 0%, ${dashboardPalette.red} 100%)`;
  }

  return `linear-gradient(135deg, ${dashboardPalette.red} 0%, ${dashboardPalette.redDark} 100%)`;
}

function getPublishedActionUrl(item: PortalContent) {
  return item.ctaUrl || item.videoUrl || null;
}

function MarketingDashboard({ userName }: { userName: string }) {
  const [contents, setContents] = useState<PortalContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadContents() {
      try {
        setLoading(true);
        setError("");
        const data = await getPortalContents();
        setContents(data);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Erro ao carregar publicações.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadContents();
  }, []);

  const summary = useMemo(() => {
    return {
      total: contents.length,
      published: contents.filter((item) => item.isPublished).length,
      drafts: contents.filter((item) => !item.isPublished).length,
      highlights: contents.filter((item) => item.highlight).length,
      videos: contents.filter((item) => item.type === "VLOG").length,
    };
  }, [contents]);

  const firstName = userName?.trim()?.split(" ")[0] || "Marketing";

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <section className="relative overflow-hidden rounded-[34px] bg-[#343434] p-6 text-white shadow-[0_28px_80px_rgba(52,52,52,0.22)] lg:p-8">
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[#ec3139]/35 blur-3xl" />
        <div className="absolute bottom-0 left-10 h-44 w-44 rounded-full bg-[#fab519]/25 blur-3xl" />

        <div className="relative grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.20em] text-[#fab519]">
              <Megaphone className="h-3.5 w-3.5" />
              Dashboard Marketing
            </span>

            <h1 className="mt-5 max-w-3xl text-3xl font-black leading-tight md:text-5xl">
              Ola, {firstName}. Suas publicações em primeiro plano.
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/80 md:text-base">
              Acompanhe conteúdos publicados, rascunhos, destaques e vídeos do
              canal do cliente sem misturar indicadores comerciais.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/marketing"
                className="inline-flex items-center gap-2 rounded-2xl bg-[#fab519] px-5 py-3 text-sm font-extrabold text-[#343434] transition hover:scale-[1.02]"
              >
                Gerenciar publicações
                <ArrowRight className="h-4 w-4" />
              </Link>

              <Link
                href="/painel"
                className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
              >
                Ver canal do cliente
              </Link>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ["Publicados", summary.published],
              ["Rascunhos", summary.drafts],
              ["Destaques", summary.highlights],
              ["Vídeos", summary.videos],
            ].map(([label, value]) => (
              <article
                key={label}
                className="rounded-[24px] border border-white/10 bg-white/10 p-4 backdrop-blur"
              >
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/60">
                  {label}
                </p>
                <p className="mt-3 text-4xl font-black text-white">{value}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-[30px] border border-slate-200/70 bg-white/95 p-6 shadow-[0_18px_50px_rgba(52,52,52,0.06)]">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.20em] text-[#ec3139]">
              Publicações
            </p>
            <h2 className="mt-2 text-2xl font-black text-[#343434]">
              Conteúdos do canal do cliente
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#343434]/70">
              {summary.total} conteúdo(s) cadastrados no portal.
            </p>
          </div>

          <Link
            href="/marketing"
            className="inline-flex items-center gap-2 rounded-2xl bg-[#ec3139] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#eb2c38]"
          >
            Nova publicação
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {loading ? (
          <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="h-[360px] animate-pulse rounded-[24px] bg-slate-100"
              />
            ))}
          </div>
        ) : error ? (
          <div className="mt-6 rounded-[24px] border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
            {error}
          </div>
        ) : contents.length === 0 ? (
          <div className="mt-6 rounded-[24px] border border-slate-200 bg-slate-50 p-10 text-center text-sm text-slate-500">
            Nenhuma publicação cadastrada ainda.
          </div>
        ) : (
          <div className="mt-6 grid gap-7 md:grid-cols-2 xl:grid-cols-3">
            {contents.map((item) => (
              <article
                key={item.id}
                className="group relative min-h-[380px] overflow-hidden rounded-[22px] bg-[#343434] shadow-[0_20px_45px_rgba(52,52,52,0.18)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_26px_60px_rgba(52,52,52,0.24)]"
              >
                {item.coverImageUrl ? (
                  <div
                    className="absolute inset-0 bg-cover bg-center transition duration-700 group-hover:scale-105"
                    style={{ backgroundImage: `url(${item.coverImageUrl})` }}
                  />
                ) : (
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${getClientFeedAccent(
                      item.type,
                    )}`}
                  />
                )}

                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(52,52,52,0.20)_0%,rgba(52,52,52,0.50)_45%,rgba(0,0,0,0.78)_100%)]" />

                <div className="relative flex min-h-[380px] flex-col justify-end p-6 text-white">
                  <div className="mb-5 flex items-center justify-between gap-3">
                    <span
                      className={`inline-flex rounded-full px-4 py-2 text-sm font-extrabold shadow-[0_10px_24px_rgba(0,0,0,0.18)] ${getTypeBadgeClass(
                        item.type,
                      )}`}
                    >
                      {getTypeLabel(item.type)}
                    </span>

                    <span className="rounded-full bg-white/18 px-3 py-1 text-xs font-bold text-white backdrop-blur">
                      {item.isPublished ? "Publicado" : "Rascunho"}
                    </span>
                  </div>

                  <h3 className="max-w-[18rem] text-2xl font-black leading-tight drop-shadow md:text-[1.65rem]">
                    {item.title}
                  </h3>

                  <p className="mt-3 line-clamp-2 max-w-[18rem] text-sm font-semibold leading-6 text-white/90">
                    {item.summary}
                  </p>

                  <div className="mt-6 flex items-center justify-between gap-4">
                    {getPublishedActionUrl(item) ? (
                      <a
                        href={getPublishedActionUrl(item) ?? undefined}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 text-base font-extrabold text-white transition hover:text-[#fab519]"
                      >
                        Saiba mais
                        <ArrowRight className="h-5 w-5 -rotate-45" />
                      </a>
                    ) : (
                      <Link
                        href="/marketing"
                        className="inline-flex items-center gap-2 text-base font-extrabold text-white transition hover:text-[#fab519]"
                      >
                        Editar
                        <ArrowRight className="h-5 w-5 -rotate-45" />
                      </Link>
                    )}

                    {item.highlight ? (
                      <span className="rounded-full bg-white/18 px-3 py-1 text-xs font-bold text-white backdrop-blur">
                        Destaque
                      </span>
                    ) : null}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function ClientDashboard({ userName }: { userName: string }) {
  const [contents, setContents] = useState<PortalContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadContents() {
      try {
        setLoading(true);
        setError("");
        const data = await getPublishedPortalContents();
        setContents(data);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Erro ao carregar o conteúdo do portal.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadContents();
  }, []);

  const grouped = useMemo(() => {
    return {
      noticias: contents.filter((item) => item.type === "NOTICIA"),
      informacoes: contents.filter((item) => item.type === "INFORMACAO"),
      vlogs: contents.filter((item) => item.type === "VLOG"),
      highlights: contents.filter((item) => item.highlight),
    };
  }, [contents]);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <section className="relative overflow-hidden rounded-[34px] border border-[#fab519]/20 bg-white/90 p-6 shadow-[0_22px_60px_rgba(52,52,52,0.06)] backdrop-blur">
        <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-[#ec3139]/10 blur-3xl" />
        <div className="absolute -bottom-16 left-10 h-40 w-40 rounded-full bg-[#fab519]/18 blur-3xl" />

        <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-[#fab519]/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#ec3139]">
              <Sparkles className="h-3.5 w-3.5" />
              Canal do Cliente
            </span>

            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">
              Olá, {userName}. Veja novidades, campanhas, vídeos e notícias
              selecionadas para você.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/rastreamentos"
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-100"
            >
              Consultar rastreamento
            </Link>

            <Link
              href="/chamados"
              className="inline-flex items-center justify-center rounded-2xl bg-[#343434] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#eb2c38]"
            >
              Abrir atendimento
            </Link>
          </div>
        </div>
      </section>

      {loading ? (
        <section className="rounded-[30px] border border-slate-200/70 bg-white/90 p-6 shadow-[0_18px_45px_rgba(52,52,52,0.06)]">
          <div className="animate-pulse space-y-4">
            <div className="h-5 w-44 rounded bg-slate-200" />
            <div className="h-8 w-72 rounded bg-slate-200" />
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="h-72 rounded-[28px] bg-slate-100" />
              ))}
            </div>
          </div>
        </section>
      ) : error ? (
        <section className="rounded-[28px] border border-rose-200 bg-rose-50 p-10 text-center text-sm text-rose-700 shadow-sm">
          {error}
        </section>
      ) : contents.length === 0 ? (
        <section className="rounded-[28px] border border-slate-200 bg-white p-10 text-center text-sm text-slate-500 shadow-sm">
          Ainda não ha conteúdos publicados para clientes.
        </section>
      ) : (
        <div className="space-y-8">
          {grouped.highlights.length > 0 ? (
            <section className="rounded-[30px] border border-white/80 bg-white/90 p-5 shadow-[0_18px_50px_rgba(52,52,52,0.06)]">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#fab519_0%,#ec3139_100%)] text-white shadow-[0_12px_28px_rgba(236,49,57,0.20)]">
                  <Flame className="h-5 w-5" />
                </div>

                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#ec3139]">
                    Destaques
                  </p>

                  <h2 className="text-2xl font-bold text-[#343434]">
                    Stories e campanhas em evidência
                  </h2>
                </div>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {grouped.highlights.map((item) => (
                  <article
                    key={item.id}
                    className="group overflow-hidden rounded-[26px] border border-slate-200 bg-slate-50 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_45px_rgba(52,52,52,0.10)]"
                  >
                    <div className="relative h-52 overflow-hidden">
                      {item.coverImageUrl ? (
                        <div
                          className="absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-105"
                          style={{
                            backgroundImage: `url(${item.coverImageUrl})`,
                          }}
                        />
                      ) : (
                        <div
                          className={`absolute inset-0 bg-gradient-to-br ${getClientFeedAccent(
                            item.type,
                          )}`}
                        />
                      )}

                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/10 to-transparent" />

                      <div className="absolute left-4 top-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${getTypeBadgeClass(
                            item.type,
                          )}`}
                        >
                          {getTypeLabel(item.type)}
                        </span>
                      </div>

                      <div className="absolute bottom-4 left-4 right-4 text-white">
                        <p className="text-xs uppercase tracking-[0.18em] text-white/75">
                          {item.campaignName || "Portal do cliente"}
                        </p>

                        <h3 className="mt-2 text-xl font-bold leading-tight">
                          {item.title}
                        </h3>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          <section className="space-y-8 rounded-[28px] bg-white px-4 py-8 shadow-[0_18px_50px_rgba(52,52,52,0.06)] sm:px-6">
            <div className="mx-auto max-w-4xl text-center">
              <h2 className="inline bg-[linear-gradient(180deg,transparent_58%,#fab519_58%)] px-2 text-3xl font-black tracking-tight text-[#343434] md:text-4xl">
                Novidades do Portal
              </h2>
              <p className="mx-auto mt-5 max-w-3xl text-base leading-7 text-[#343434]/80">
                Conheça as últimas tendências em logística, transformação
                digital e gestão estratégica pizzattolog.
              </p>
            </div>

            <div className="grid gap-7 md:grid-cols-2 xl:grid-cols-3">
              {contents.map((item) => (
                <article
                  key={item.id}
                  className="group relative min-h-[380px] overflow-hidden rounded-[22px] bg-[#343434] shadow-[0_20px_45px_rgba(52,52,52,0.18)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_26px_60px_rgba(52,52,52,0.24)]"
                >
                  {item.coverImageUrl ? (
                    <div
                      className="absolute inset-0 bg-cover bg-center transition duration-700 group-hover:scale-105"
                      style={{ backgroundImage: `url(${item.coverImageUrl})` }}
                    />
                  ) : (
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${getClientFeedAccent(
                        item.type,
                      )}`}
                    />
                  )}

                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(52,52,52,0.20)_0%,rgba(52,52,52,0.50)_45%,rgba(0,0,0,0.78)_100%)]" />

                  <div className="relative flex min-h-[380px] flex-col justify-end p-6 text-white">
                    <div className="mb-5">
                      <span
                        className={`inline-flex rounded-full px-4 py-2 text-sm font-extrabold shadow-[0_10px_24px_rgba(0,0,0,0.18)] ${getTypeBadgeClass(
                          item.type,
                        )}`}
                      >
                        {getTypeLabel(item.type)}
                      </span>
                    </div>

                    <h3 className="max-w-[18rem] text-2xl font-black leading-tight drop-shadow md:text-[1.65rem]">
                      {item.title}
                    </h3>

                    <p className="mt-3 line-clamp-2 max-w-[18rem] text-sm font-semibold leading-6 text-white/90">
                      {item.summary}
                    </p>

                    <div className="mt-6 flex items-center justify-between gap-4">
                      {getPublishedActionUrl(item) ? (
                        <a
                          href={getPublishedActionUrl(item) ?? undefined}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 text-base font-extrabold text-white transition hover:text-[#fab519]"
                        >
                          Saiba mais
                          <ArrowRight className="h-5 w-5 -rotate-45" />
                        </a>
                      ) : null}

                      {item.highlight ? (
                        <span className="rounded-full bg-white/18 px-3 py-1 text-xs font-bold text-white backdrop-blur">
                          Destaque
                        </span>
                      ) : null}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function InternalDashboard({
  userName,
  userRole,
  token,
}: {
  userName: string;
  userRole: string;
  token: string | null;
}) {
  const [crmSummary, setCrmSummary] = useState<CrmDashboardSummary | null>(
    null,
  );
  const [summaryError, setSummaryError] = useState("");
  const [isLoadingSummary, setIsLoadingSummary] = useState(true);

  useEffect(() => {
    async function loadCrmSummary() {
      if (!token) {
        setIsLoadingSummary(false);
        return;
      }

      try {
        setIsLoadingSummary(true);
        const data = await getCrmDashboardSummary(token);
        setCrmSummary(data);
        setSummaryError("");
      } catch (error) {
        setSummaryError(
          error instanceof Error
            ? error.message
            : "Erro ao carregar dashboard.",
        );
      } finally {
        setIsLoadingSummary(false);
      }
    }

    loadCrmSummary();
  }, [token]);

  const firstName = userName?.trim()?.split(" ")[0] || "Usuário";

  const internalMetrics = useMemo(
    () => [
      {
        title: "Clientes ativos",
        value: String(crmSummary?.activeClients ?? 0),
        detail: `${crmSummary?.totalClients ?? 0} cliente(s) na base`,
        icon: Building2,
        accent: "from-[#ec3139] to-[#eb2c38]",
      },
      {
        title: "Cotações abertas",
        value: String(crmSummary?.openQuotes ?? 0),
        detail: `${crmSummary?.totalQuotes ?? 0} cotação(ões) no total`,
        icon: FileText,
        accent: "from-[#fab519] to-[#ec3139]",
      },
      {
        title: "Tickets em aberto",
        value: String(crmSummary?.openTickets ?? 0),
        detail: `${crmSummary?.closedTickets ?? 0} fechado(s)`,
        icon: Ticket,
        accent: "from-[#fab519] to-[#eb2c38]",
      },
      {
        title: "Usuários com acesso",
        value: String(crmSummary?.usersWithAccess ?? 0),
        detail: "Usuários ativos na plataforma",
        icon: ShieldCheck,
        accent: "from-[#343434] to-[#ec3139]",
      },
    ],
    [crmSummary],
  );

  const pipelineTotal =
    crmSummary?.opportunitiesByStage.reduce(
      (acc, item) => acc + item.count,
      0,
    ) ?? 0;

  const maxStageCount = Math.max(
    ...(crmSummary?.opportunitiesByStage.map((item) => item.count) ?? [1]),
  );

  const heroQuickStats = [
    {
      label: "Clientes ativos",
      value: String(crmSummary?.activeClients ?? 0),
      icon: Building2,
    },
    {
      label: "Cotações abertas",
      value: String(crmSummary?.openQuotes ?? 0),
      icon: FileText,
    },
    {
      label: "Tickets em aberto",
      value: String(crmSummary?.openTickets ?? 0),
      icon: Ticket,
    },
  ];

  const heroPipeline = crmSummary?.opportunitiesByStage.slice(0, 4) ?? [];

  const maxHeroPipelineCount = Math.max(
    ...(heroPipeline.map((item) => item.count) ?? [1]),
    1,
  );

  const heroHighlights = [
    {
      label: "Clientes ativos",
      value: String(crmSummary?.activeClients ?? 0),
      icon: Building2,
    },
    {
      label: "Cotações abertas",
      value: String(crmSummary?.openQuotes ?? 0),
      icon: FileText,
    },
    {
      label: "Tickets em aberto",
      value: String(crmSummary?.openTickets ?? 0),
      icon: Ticket,
    },
  ];

  const topStages = crmSummary?.opportunitiesByStage.slice(0, 3) ?? [];

  return (
    <Box
      sx={{
        mx: "auto",
        width: "100%",
        maxWidth: 1680,
        display: "flex",
        flexDirection: "column",
        gap: 3,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          position: "relative",
          overflow: "hidden",
          p: { xs: 2.5, md: 4 },
          border: "1px solid rgba(250,181,25,0.25)",
          borderRadius: "22px",
          color: "#ffffff",
          bgcolor: dashboardPalette.text,
          background:
            "linear-gradient(135deg,#343434 0%,#2b2b2b 44%,#eb2c38 100%)",
          boxShadow: "0 30px 90px rgba(52,52,52,0.28)",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            right: -72,
            top: -72,
            width: 220,
            height: 220,
            borderRadius: "50%",
            bgcolor: "rgba(250,181,25,0.18)",
            filter: "blur(28px)",
          }}
        />
        <Box
          sx={{
            position: "absolute",
            left: 40,
            bottom: -76,
            width: 180,
            height: 180,
            borderRadius: "50%",
            bgcolor: "rgba(236,49,57,0.20)",
            filter: "blur(30px)",
          }}
        />

        <Stack
          direction={{ xs: "column", lg: "row" }}
          spacing={4}
          sx={{ position: "relative", alignItems: { xs: "flex-start", lg: "center" }, justifyContent: "space-between" }}
        >
          <Box sx={{ maxWidth: 760 }}>
            <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", rowGap: 1 }}>
              <Chip
                icon={<Sparkles size={14} />}
                label="Ambiente online"
                sx={{
                  height: 30,
                  border: "1px solid rgba(250,181,25,0.25)",
                  bgcolor: "rgba(250,181,25,0.10)",
                  color: dashboardPalette.yellow,
                  fontSize: 12,
                  fontWeight: 900,
                  letterSpacing: ".08em",
                  textTransform: "uppercase",
                  "& .MuiChip-icon": { color: dashboardPalette.yellow },
                }}
              />
            </Stack>

            <Typography
              component="h1"
              sx={{
                mt: 3,
                color: "#ffffff",
                fontSize: { xs: 32, md: 48 },
                fontWeight: 900,
                lineHeight: 1.08,
              }}
            >
              Olá, {firstName}.
            </Typography>

            <Typography
              sx={{
                mt: 2,
                maxWidth: 680,
                color: "#e2e8f0",
                fontSize: { xs: 14, md: 16 },
                lineHeight: 1.7,
              }}
            >
              Acompanhe clientes, cotações e oportunidades em uma visão comercial centralizada.
            </Typography>

            <Button
              component={Link}
              href="/clientes"
              variant="contained"
              endIcon={<ArrowRight size={17} />}
              sx={{
                mt: 3,
                minHeight: 46,
                borderRadius: "12px",
                px: 2.75,
                bgcolor: dashboardPalette.yellow,
                color: dashboardPalette.text,
                fontWeight: 900,
                textTransform: "none",
                boxShadow: "none",
                "&:hover": {
                  bgcolor: "#ffd04f",
                  boxShadow: "none",
                },
              }}
            >
              Abrir CRM comercial
            </Button>
          </Box>

          <Paper
            elevation={0}
            sx={{
              width: { xs: "100%", lg: 360 },
              p: 2,
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "18px",
              bgcolor: "rgba(255,255,255,0.10)",
              backdropFilter: "blur(10px)",
            }}
          >
            <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
              <Avatar
                variant="rounded"
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: "16px",
                  border: "1px solid rgba(255,255,255,0.22)",
                  bgcolor: dashboardPalette.red,
                  color: "#ffffff",
                  fontWeight: 900,
                }}
              >
                {getUserInitials(userName)}
              </Avatar>

              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ color: "#cbd5e1", fontSize: 13 }}>
                  Sessão atual
                </Typography>
                <Typography noWrap sx={{ color: "#ffffff", fontSize: 20, fontWeight: 900 }}>
                  {userName}
                </Typography>
                <Typography sx={{ mt: 0.25, color: dashboardPalette.yellow, fontSize: 13, fontWeight: 800 }}>
                  {userRole}
                </Typography>
              </Box>
            </Stack>

            <Divider sx={{ my: 2, borderColor: "rgba(255,255,255,0.12)" }} />

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: 1.5,
              }}
            >
              {heroHighlights.slice(0, 2).map((item) => {
                const Icon = item.icon;
                return (
                  <Paper
                    key={item.label}
                    elevation={0}
                    sx={{
                      p: 1.5,
                      border: "1px solid rgba(255,255,255,0.10)",
                      borderRadius: "14px",
                      bgcolor: "rgba(52,52,52,0.30)",
                    }}
                  >
                    <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
                      <Typography sx={{ color: "#cbd5e1", fontSize: 11, fontWeight: 800 }}>
                        {item.label}
                      </Typography>
                      <Icon size={16} color={dashboardPalette.yellow} />
                    </Stack>
                    <Typography sx={{ mt: 1, color: "#ffffff", fontSize: 28, fontWeight: 900 }}>
                      {item.value}
                    </Typography>
                  </Paper>
                );
              })}
            </Box>
          </Paper>
        </Stack>
      </Paper>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            md: "repeat(2, minmax(0, 1fr))",
            xl: "repeat(4, minmax(0, 1fr))",
          },
          gap: 2,
        }}
      >
        {internalMetrics.map((item) => {
          const Icon = item.icon;

          return (
            <Paper
              key={item.title}
              elevation={0}
              sx={{
                position: "relative",
                minHeight: 152,
                p: 2.5,
                overflow: "hidden",
                ...dashboardPaperSx,
                "&:before": {
                  content: '""',
                  position: "absolute",
                  insetInline: 0,
                  top: 0,
                  height: 4,
                  background: gradientForAccent(item.accent),
                },
              }}
            >
              <Stack direction="row" spacing={2} sx={{ alignItems: "flex-start", justifyContent: "space-between" }}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ color: dashboardPalette.muted, fontSize: 14, fontWeight: 700 }}>
                    {item.title}
                  </Typography>
                  <Typography sx={{ mt: 1.25, color: dashboardPalette.text, fontSize: 36, fontWeight: 900, lineHeight: 1 }}>
                    {item.value}
                  </Typography>
                  <Typography sx={{ mt: 1, color: dashboardPalette.muted, fontSize: 13, lineHeight: 1.55 }}>
                    {item.detail}
                  </Typography>
                </Box>

                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    display: "grid",
                    placeItems: "center",
                    flexShrink: 0,
                    borderRadius: "14px",
                    color: "#ffffff",
                    background: gradientForAccent(item.accent),
                    boxShadow: "0 12px 28px rgba(52,52,52,0.16)",
                  }}
                >
                  <Icon size={22} />
                </Box>
              </Stack>
            </Paper>
          );
        })}
      </Box>

      {isLoadingSummary ? (
        <Paper elevation={0} sx={{ ...dashboardPaperSx, p: 3 }}>
          <Skeleton width={160} height={22} />
          <Skeleton width={300} height={42} />
          <Box
            sx={{
              mt: 2,
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)", xl: "repeat(5, 1fr)" },
              gap: 2,
            }}
          >
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} variant="rounded" height={112} sx={{ borderRadius: "18px" }} />
            ))}
          </Box>
        </Paper>
      ) : crmSummary ? (
        <Paper elevation={0} sx={{ ...dashboardPaperSx, p: { xs: 2.5, md: 3 } }}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            sx={{ alignItems: { xs: "flex-start", md: "flex-end" }, justifyContent: "space-between" }}
          >
            <Box>
              <Typography sx={{ color: dashboardPalette.red, fontSize: 12, fontWeight: 900, letterSpacing: ".16em", textTransform: "uppercase" }}>
                CRM comercial
              </Typography>
              <Typography sx={{ mt: 0.5, color: dashboardPalette.text, fontSize: 26, fontWeight: 900 }}>
                Resumo de pipeline e conversão
              </Typography>
              <Typography sx={{ mt: 0.75, color: dashboardPalette.muted, fontSize: 14 }}>
                Performance e valor comercial em aberto.
              </Typography>
            </Box>

            <Button
              component={Link}
              href="/bi"
              variant="outlined"
              endIcon={<ArrowRight size={16} />}
              sx={{
                minHeight: 42,
                borderRadius: "12px",
                borderColor: dashboardPalette.border,
                color: dashboardPalette.text,
                fontWeight: 800,
                textTransform: "none",
                "&:hover": {
                  borderColor: dashboardPalette.yellow,
                  bgcolor: dashboardPalette.yellowSoft,
                },
              }}
            >
              Abrir BI comercial
            </Button>
          </Stack>

          <Box
            sx={{
              mt: 3,
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)", xl: "repeat(5, 1fr)" },
              gap: 2,
            }}
          >
            {[
              ["Total de leads", crmSummary.totalLeads, "default"],
              ["Oportunidades abertas", crmSummary.openOpportunities, "default"],
              ["Oportunidades ganhas", crmSummary.wonOpportunities, "yellow"],
              ["Taxa de conversão", `${crmSummary.conversionRate}%`, "red"],
              ["Valor em aberto", formatCurrency(crmSummary.openValue), "dark"],
            ].map(([label, value, tone]) => (
              <Paper
                key={String(label)}
                elevation={0}
                sx={{
                  p: 2,
                  border: "1px solid",
                  borderColor:
                    tone === "yellow"
                      ? "rgba(250,181,25,0.40)"
                      : tone === "red"
                        ? "rgba(236,49,57,0.20)"
                        : tone === "dark"
                          ? "rgba(52,52,52,0.15)"
                          : dashboardPalette.border,
                  borderRadius: "16px",
                  bgcolor:
                    tone === "yellow"
                      ? dashboardPalette.yellowSoft
                      : tone === "red"
                        ? "rgba(236,49,57,0.10)"
                        : tone === "dark"
                          ? "rgba(52,52,52,0.10)"
                          : "#f8fafc",
                }}
              >
                <Typography sx={{ color: dashboardPalette.muted, fontSize: 13 }}>
                  {label}
                </Typography>
                <Typography
                  sx={{
                    mt: 1,
                    color: tone === "red" || tone === "yellow" ? dashboardPalette.red : dashboardPalette.text,
                    fontSize: 28,
                    fontWeight: 900,
                    lineHeight: 1.1,
                  }}
                >
                  {value}
                </Typography>
              </Paper>
            ))}
          </Box>

          <Box
            sx={{
              mt: 3,
              display: "grid",
              gridTemplateColumns: { xs: "1fr", lg: "1.25fr .75fr" },
              gap: 2,
            }}
          >
            <Paper elevation={0} sx={{ p: 2.5, border: `1px solid ${dashboardPalette.border}`, borderRadius: "16px", bgcolor: "#f8fafc" }}>
              <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                <Box sx={{ width: 44, height: 44, display: "grid", placeItems: "center", borderRadius: "14px", bgcolor: "rgba(236,49,57,0.10)", color: dashboardPalette.red }}>
                  <BriefcaseBusiness size={22} />
                </Box>
                <Box>
                  <Typography sx={{ color: dashboardPalette.text, fontSize: 16, fontWeight: 900 }}>
                    Oportunidades por etapa
                  </Typography>
                  <Typography sx={{ color: dashboardPalette.muted, fontSize: 13 }}>
                    Distribuição atual do funil.
                  </Typography>
                </Box>
              </Stack>

              <Stack spacing={1.5} sx={{ mt: 2.5 }}>
                {crmSummary.opportunitiesByStage.map((item) => {
                  const percentage = maxStageCount > 0 ? (item.count / maxStageCount) * 100 : 0;

                  return (
                    <Paper key={item.stage} elevation={0} sx={{ p: 2, border: "1px solid #ffffff", borderRadius: "14px", bgcolor: "#ffffff" }}>
                      <Stack direction="row" spacing={2} sx={{ justifyContent: "space-between", alignItems: "flex-start" }}>
                        <Box>
                          <Typography sx={{ color: dashboardPalette.text, fontSize: 14, fontWeight: 900 }}>
                            {formatOpportunityStage(item.stage)}
                          </Typography>
                          <Typography sx={{ mt: 0.25, color: dashboardPalette.muted, fontSize: 13 }}>
                            {item.count} oportunidade(s)
                          </Typography>
                        </Box>
                        <Typography sx={{ color: dashboardPalette.text, fontSize: 13, fontWeight: 900 }}>
                          {formatCurrency(item.value)}
                        </Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={percentage}
                        sx={{
                          mt: 1.5,
                          height: 8,
                          borderRadius: 999,
                          bgcolor: "#f1f5f9",
                          "& .MuiLinearProgress-bar": {
                            borderRadius: 999,
                            background: `linear-gradient(90deg, ${dashboardPalette.red}, ${dashboardPalette.yellow})`,
                          },
                        }}
                      />
                    </Paper>
                  );
                })}
              </Stack>
            </Paper>

            <Paper elevation={0} sx={{ p: 2.5, border: `1px solid ${dashboardPalette.border}`, borderRadius: "16px", bgcolor: "#f8fafc" }}>
              <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                <Box sx={{ width: 44, height: 44, display: "grid", placeItems: "center", borderRadius: "14px", bgcolor: dashboardPalette.text, color: "#ffffff" }}>
                  <Activity size={22} />
                </Box>
                <Box>
                  <Typography sx={{ color: dashboardPalette.text, fontSize: 16, fontWeight: 900 }}>
                    Leitura operacional
                  </Typography>
                  <Typography sx={{ color: dashboardPalette.muted, fontSize: 13 }}>
                    Indicadores rápidos.
                  </Typography>
                </Box>
              </Stack>

              <Stack spacing={1.5} sx={{ mt: 2.5 }}>
                {[
                  ["Volume do pipeline", pipelineTotal, "Soma total das oportunidades distribuídas nas etapas."],
                  ["Conversão atual", `${crmSummary.conversionRate}%`, "Relação entre oportunidades ganhas e trabalhadas."],
                  ["Receita em aberto", formatCurrency(crmSummary.openValue), "Valor potencial ainda em negociação."],
                ].map(([label, value, helper]) => (
                  <Paper key={String(label)} elevation={0} sx={{ p: 2, border: "1px solid #ffffff", borderRadius: "14px", bgcolor: "#ffffff" }}>
                    <Typography sx={{ color: "#94a3b8", fontSize: 11, fontWeight: 900, letterSpacing: ".12em", textTransform: "uppercase" }}>
                      {label}
                    </Typography>
                    <Typography sx={{ mt: 0.75, color: label === "Conversão atual" ? dashboardPalette.red : dashboardPalette.text, fontSize: 24, fontWeight: 900 }}>
                      {value}
                    </Typography>
                    <Typography sx={{ mt: 0.5, color: dashboardPalette.muted, fontSize: 13, lineHeight: 1.55 }}>
                      {helper}
                    </Typography>
                  </Paper>
                ))}
              </Stack>
            </Paper>
          </Box>
        </Paper>
      ) : summaryError ? (
        <Alert severity="error" sx={{ borderRadius: "14px" }}>
          {summaryError}
        </Alert>
      ) : null}

      <Paper elevation={0} sx={{ ...dashboardPaperSx, p: { xs: 2.5, md: 3 } }}>
        <Typography sx={{ color: dashboardPalette.red, fontSize: 12, fontWeight: 900, letterSpacing: ".16em", textTransform: "uppercase" }}>
          Navegação rápida
        </Typography>
        <Typography sx={{ mt: 0.5, color: dashboardPalette.text, fontSize: 26, fontWeight: 900 }}>
          Módulos principais do CRM
        </Typography>
        <Typography sx={{ mt: 0.75, color: dashboardPalette.muted, fontSize: 14 }}>
          Acesso rápido aos fluxos da operação.
        </Typography>

        <Box
          sx={{
            mt: 3,
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))", xl: "repeat(3, minmax(0, 1fr))" },
            gap: 2,
          }}
        >
          {internalShortcuts.map((item) => {
            const Icon = item.icon;

            return (
              <Paper
                key={item.href}
                component={Link}
                href={item.href}
                elevation={0}
                sx={{
                  p: 2.5,
                  display: "block",
                  border: `1px solid ${dashboardPalette.border}`,
                  borderRadius: "16px",
                  bgcolor: "#f8fafc",
                  color: "inherit",
                  textDecoration: "none",
                  transition: "box-shadow 160ms ease, transform 160ms ease, border-color 160ms ease, background-color 160ms ease",
                  "&:hover": {
                    transform: "translateY(-2px)",
                    borderColor: "rgba(250,181,25,0.60)",
                    bgcolor: "#ffffff",
                    boxShadow: "0 20px 45px rgba(52,52,52,0.08)",
                  },
                }}
              >
                <Stack direction="row" sx={{ alignItems: "flex-start", justifyContent: "space-between" }}>
                  <Box sx={{ width: 48, height: 48, display: "grid", placeItems: "center", borderRadius: "14px", color: "#ffffff", background: gradientForAccent(item.accent), boxShadow: "0 12px 28px rgba(52,52,52,0.14)" }}>
                    <Icon size={22} />
                  </Box>
                  <ArrowRight size={20} color="#94a3b8" />
                </Stack>

                <Typography sx={{ mt: 2, color: dashboardPalette.text, fontSize: 18, fontWeight: 900 }}>
                  {item.label}
                </Typography>
                <Typography sx={{ mt: 0.5, color: dashboardPalette.muted, fontSize: 14, lineHeight: 1.6 }}>
                  {item.helper}
                </Typography>
              </Paper>
            );
          })}
        </Box>
      </Paper>
    </Box>
  );

}

export default function DashboardPage() {
  const { user, token } = useAuth();

  return (
    <AppLayout>
      {user?.role === "CLIENTE" ? (
        <ClientDashboard userName={user.name} />
      ) : user?.role === "MARKETING" ? (
        <MarketingDashboard userName={user.name} />
      ) : (
        <InternalDashboard
          userName={user?.name ?? "Usuário do portal"}
          userRole={user?.role ?? "-"}
          token={token}
        />
      )}
    </AppLayout>
  );
}
