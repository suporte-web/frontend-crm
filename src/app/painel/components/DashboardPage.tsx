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
import {
  LEAD_FUNNEL_STAGES,
  normalizeLeadFunnelStage,
} from "@/constants/lead-funnel";
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
                className="h-90 animate-pulse rounded-[24px] bg-slate-100"
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
                className="group relative min-h-95 overflow-hidden rounded-[22px] bg-[#343434] shadow-[0_20px_45px_rgba(52,52,52,0.18)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_26px_60px_rgba(52,52,52,0.24)]"
              >
                {item.coverImageUrl ? (
                  <div
                    className="absolute inset-0 bg-cover bg-center transition duration-700 group-hover:scale-105"
                    style={{ backgroundImage: `url(${item.coverImageUrl})` }}
                  />
                ) : (
                  <div
                    className={`absolute inset-0 bg-linear-to-br ${getClientFeedAccent(
                      item.type,
                    )}`}
                  />
                )}

                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(52,52,52,0.20)_0%,rgba(52,52,52,0.50)_45%,rgba(0,0,0,0.78)_100%)]" />

                <div className="relative flex min-h-95 flex-col justify-end p-6 text-white">
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

  const firstName = userName?.trim()?.split(" ")[0] || "Cliente";
  const highlights = contents.filter((item) => item.highlight);
  const featuredContent = highlights[0] ?? contents[0] ?? null;
  const summary = {
    highlights: highlights.length,
    news: contents.filter((item) => item.type === "NOTICIA").length,
    campaigns: contents.filter((item) => item.type === "INFORMACAO").length,
    videos: contents.filter((item) => item.type === "VLOG").length,
  };
  const clientMetrics: Array<{
    label: string;
    value: number;
    icon: LucideIcon;
    accent: string;
    softColor: string;
  }> = [
    {
      label: "Destaques",
      value: summary.highlights,
      icon: Flame,
      accent: dashboardPalette.red,
      softColor: "#fff1f2",
    },
    {
      label: "Notícias",
      value: summary.news,
      icon: FileText,
      accent: dashboardPalette.text,
      softColor: "#f8fafc",
    },
    {
      label: "Campanhas",
      value: summary.campaigns,
      icon: Megaphone,
      accent: dashboardPalette.yellow,
      softColor: "#fff7d6",
    },
    {
      label: "Vídeos",
      value: summary.videos,
      icon: Layers3,
      accent: "#7c3aed",
      softColor: "#f3e8ff",
    },
  ];

  return (
    <Box
      sx={{
        mx: "auto",
        width: "100%",
        maxWidth: 1440,
        display: "flex",
        flexDirection: "column",
        gap: 3,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          ...dashboardPaperSx,
          overflow: "hidden",
          bgcolor: "#343434",
          color: "#ffffff",
        }}
      >
        <Stack
          direction={{ xs: "column", lg: "row" }}
          spacing={0}
          sx={{ minHeight: { xs: "auto", lg: 360 } }}
        >
          <Box sx={{ flex: 1, p: { xs: 3, md: 4 }, display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <Chip
              icon={<Sparkles size={14} />}
              label="Canal do Cliente"
              sx={{
                alignSelf: "flex-start",
                border: "1px solid rgba(250,181,25,0.35)",
                bgcolor: "rgba(250,181,25,0.12)",
                color: dashboardPalette.yellow,
                fontSize: 12,
                fontWeight: 900,
                letterSpacing: ".08em",
                textTransform: "uppercase",
                "& .MuiChip-icon": { color: dashboardPalette.yellow },
              }}
            />

            <Typography
              component="h1"
              sx={{
                mt: 3,
                maxWidth: 680,
                fontSize: { xs: 32, md: 46 },
                fontWeight: 900,
                lineHeight: 1.08,
              }}
            >
              Olá, {firstName}. Seu portal em um só lugar.
            </Typography>

            <Typography
              sx={{
                mt: 2,
                maxWidth: 660,
                color: "#e2e8f0",
                fontSize: { xs: 14, md: 16 },
                lineHeight: 1.7,
              }}
            >
              Acompanhe comunicados, campanhas e vídeos publicados para sua empresa,
              com acesso rápido a rastreamentos e atendimento.
            </Typography>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mt: 3 }}>
              <Button
                component={Link}
                href="/rastreamentos"
                variant="contained"
                endIcon={<ArrowRight size={17} />}
                sx={{
                  minHeight: 46,
                  borderRadius: "12px",
                  px: 2.75,
                  bgcolor: dashboardPalette.yellow,
                  color: dashboardPalette.text,
                  fontWeight: 900,
                  textTransform: "none",
                  boxShadow: "none",
                  "&:hover": { bgcolor: "#ffd04f", boxShadow: "none" },
                }}
              >
                Consultar rastreamento
              </Button>

              <Button
                component={Link}
                href="/chamados"
                variant="outlined"
                sx={{
                  minHeight: 46,
                  borderRadius: "12px",
                  px: 2.75,
                  borderColor: "rgba(255,255,255,0.22)",
                  color: "#ffffff",
                  fontWeight: 800,
                  textTransform: "none",
                  "&:hover": {
                    borderColor: dashboardPalette.yellow,
                    bgcolor: "rgba(255,255,255,0.08)",
                  },
                }}
              >
                Abrir atendimento
              </Button>
            </Stack>
          </Box>

          <Box
            sx={{
              width: { xs: "100%", lg: 420 },
              p: { xs: 2, md: 3 },
              bgcolor: "rgba(255,255,255,0.06)",
              borderLeft: { lg: "1px solid rgba(255,255,255,0.10)" },
            }}
          >
            <Paper
              elevation={0}
              sx={{
                height: "100%",
                minHeight: 280,
                overflow: "hidden",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: "18px",
                bgcolor: "rgba(255,255,255,0.08)",
              }}
            >
              <Box
                sx={{
                  height: 170,
                  bgcolor: "rgba(250,181,25,0.18)",
                  backgroundImage: featuredContent?.coverImageUrl
                    ? `url(${featuredContent.coverImageUrl})`
                    : `linear-gradient(135deg, ${dashboardPalette.yellow} 0%, ${dashboardPalette.red} 100%)`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              />
              <Box sx={{ p: 2.5 }}>
                <Typography sx={{ color: dashboardPalette.yellow, fontSize: 12, fontWeight: 900, textTransform: "uppercase" }}>
                  {featuredContent ? getTypeLabel(featuredContent.type) : "Portal"}
                </Typography>
                <Typography sx={{ mt: 1, color: "#ffffff", fontSize: 22, fontWeight: 900, lineHeight: 1.15 }}>
                  {featuredContent?.title ?? "Nenhuma publicação em destaque"}
                </Typography>
                <Typography
                  sx={{
                    mt: 1,
                    color: "#cbd5e1",
                    fontSize: 14,
                    lineHeight: 1.6,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {featuredContent?.summary ?? "As novidades publicadas aparecerão aqui."}
                </Typography>
              </Box>
            </Paper>
          </Box>
        </Stack>
      </Paper>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", lg: "repeat(4, minmax(0, 1fr))" },
          gap: 2,
        }}
      >
        {clientMetrics.map(({ label, value, icon: Icon, accent, softColor }) => (
          <Paper key={label} elevation={0} sx={{ ...dashboardPaperSx, minHeight: 128, p: 2.5 }}>
            <Stack direction="row" spacing={2} sx={{ alignItems: "center", justifyContent: "space-between" }}>
              <Box>
                <Typography sx={{ color: dashboardPalette.muted, fontSize: 14, fontWeight: 800 }}>
                  {label}
                </Typography>
                <Typography sx={{ mt: 1, color: dashboardPalette.text, fontSize: 34, fontWeight: 900, lineHeight: 1 }}>
                  {value}
                </Typography>
              </Box>
              <Avatar
                variant="rounded"
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: "14px",
                  bgcolor: softColor,
                  color: accent,
                }}
              >
                <Icon size={22} />
              </Avatar>
            </Stack>
          </Paper>
        ))}
      </Box>

      {loading ? (
        <Paper elevation={0} sx={{ ...dashboardPaperSx, p: 3 }}>
          <Skeleton width={180} height={24} />
          <Skeleton width={320} height={38} />
          <Box sx={{ mt: 2, display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)", xl: "repeat(3, 1fr)" } }}>
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} variant="rounded" height={290} sx={{ borderRadius: "18px" }} />
            ))}
          </Box>
        </Paper>
      ) : error ? (
        <Alert severity="error" sx={{ borderRadius: "14px" }}>
          {error}
        </Alert>
      ) : contents.length === 0 ? (
        <Paper elevation={0} sx={{ ...dashboardPaperSx, p: 5, textAlign: "center" }}>
          <Typography sx={{ color: dashboardPalette.text, fontSize: 22, fontWeight: 900 }}>
            Ainda não há conteúdos publicados.
          </Typography>
          <Typography sx={{ mt: 1, color: dashboardPalette.muted }}>
            As publicações do portal do cliente aparecerão nesta página.
          </Typography>
        </Paper>
      ) : (
        <Paper elevation={0} sx={{ ...dashboardPaperSx, p: { xs: 2.5, md: 3 } }}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ alignItems: { xs: "flex-start", md: "flex-end" }, justifyContent: "space-between" }}>
            <Box>
              <Typography sx={{ color: dashboardPalette.red, fontSize: 12, fontWeight: 900, letterSpacing: ".16em", textTransform: "uppercase" }}>
                Novidades
              </Typography>
              <Typography component="h2" sx={{ mt: 0.5, color: dashboardPalette.text, fontSize: 28, fontWeight: 900 }}>
                Conteúdos do portal
              </Typography>
              <Typography sx={{ mt: 0.75, color: dashboardPalette.muted, fontSize: 14 }}>
                Comunicados, campanhas e vídeos publicados para clientes.
              </Typography>
            </Box>
          </Stack>

          <Box sx={{ mt: 3, display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))", xl: "repeat(3, minmax(0, 1fr))" } }}>
            {contents.map((item) => {
              const actionUrl = getPublishedActionUrl(item);

              return (
                <Paper
                  key={item.id}
                  elevation={0}
                  sx={{
                    overflow: "hidden",
                    border: `1px solid ${dashboardPalette.border}`,
                    borderRadius: "16px",
                    bgcolor: "#ffffff",
                    transition: "box-shadow 160ms ease, transform 160ms ease",
                    "&:hover": {
                      transform: "translateY(-2px)",
                      boxShadow: "0 20px 45px rgba(52,52,52,0.10)",
                    },
                  }}
                >
                  <Box
                    sx={{
                      height: 190,
                      bgcolor: "#f8fafc",
                      backgroundImage: item.coverImageUrl
                        ? `url(${item.coverImageUrl})`
                        : `linear-gradient(135deg, ${dashboardPalette.text} 0%, ${dashboardPalette.red} 58%, ${dashboardPalette.yellow} 100%)`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  />

                  <Stack spacing={1.5} sx={{ p: 2.5 }}>
                    <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                      <Chip
                        size="small"
                        label={getTypeLabel(item.type)}
                        sx={{ bgcolor: "#fff7d6", color: "#8a5a00", fontWeight: 900 }}
                      />
                      {item.highlight ? (
                        <Chip size="small" label="Destaque" color="warning" sx={{ fontWeight: 800 }} />
                      ) : null}
                    </Stack>

                    <Box>
                      <Typography sx={{ color: dashboardPalette.text, fontSize: 19, fontWeight: 900, lineHeight: 1.2 }}>
                        {item.title}
                      </Typography>
                      <Typography
                        sx={{
                          mt: 1,
                          color: dashboardPalette.muted,
                          fontSize: 14,
                          lineHeight: 1.6,
                          display: "-webkit-box",
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {item.summary}
                      </Typography>
                    </Box>

                    {actionUrl ? (
                      <>
                        <Divider />
                        <Button
                          href={actionUrl}
                          target="_blank"
                          rel="noreferrer"
                          endIcon={<ArrowRight size={16} />}
                          sx={{
                            alignSelf: "flex-start",
                            borderRadius: "10px",
                            color: dashboardPalette.red,
                            fontWeight: 900,
                            textTransform: "none",
                          }}
                        >
                          Acessar conteúdo
                        </Button>
                      </>
                    ) : null}
                  </Stack>
                </Paper>
              );
            })}
          </Box>
        </Paper>
      )}
    </Box>
  );
}

function LegacyClientDashboard({ userName }: { userName: string }) {
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
                          className={`absolute inset-0 bg-linear-to-br ${getClientFeedAccent(
                            item.type,
                          )}`}
                        />
                      )}

                      <div className="absolute inset-0 bg-linear-to-t from-slate-950/75 via-slate-950/10 to-transparent" />

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
                  className="group relative min-h-95 overflow-hidden rounded-[22px] bg-[#343434] shadow-[0_20px_45px_rgba(52,52,52,0.18)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_26px_60px_rgba(52,52,52,0.24)]"
                >
                  {item.coverImageUrl ? (
                    <div
                      className="absolute inset-0 bg-cover bg-center transition duration-700 group-hover:scale-105"
                      style={{ backgroundImage: `url(${item.coverImageUrl})` }}
                    />
                  ) : (
                    <div
                      className={`absolute inset-0 bg-linear-to-br ${getClientFeedAccent(
                        item.type,
                      )}`}
                    />
                  )}

                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(52,52,52,0.20)_0%,rgba(52,52,52,0.50)_45%,rgba(0,0,0,0.78)_100%)]" />

                  <div className="relative flex min-h-95 flex-col justify-end p-6 text-white">
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
  const leadFunnel = LEAD_FUNNEL_STAGES.map((stage) => {
    const summaryStage = crmSummary?.leadsByStage?.find(
      (item) => normalizeLeadFunnelStage(item.stage) === stage.value,
    );

    return {
      ...stage,
      count: summaryStage?.count ?? 0,
      monthlyEstimatedValue: summaryStage?.monthlyEstimatedValue ?? 0,
    };
  });
  const totalLeadFunnel = leadFunnel.reduce((total, stage) => total + stage.count, 0);
  const maxLeadFunnelCount = Math.max(...leadFunnel.map((stage) => stage.count), 1);

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

          <Paper
            elevation={0}
            sx={{
              mt: 3,
              p: { xs: 2, md: 2.5 },
              border: `1px solid ${dashboardPalette.border}`,
              borderRadius: "16px",
              bgcolor: "#f8fafc",
            }}
          >
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={2}
              sx={{
                alignItems: { xs: "flex-start", md: "center" },
                justifyContent: "space-between",
              }}
            >
              <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    display: "grid",
                    placeItems: "center",
                    borderRadius: "14px",
                    bgcolor: "rgba(236,49,57,0.10)",
                    color: dashboardPalette.red,
                  }}
                >
                  <Layers3 size={22} />
                </Box>
                <Box>
                  <Typography sx={{ color: dashboardPalette.text, fontSize: 16, fontWeight: 900 }}>
                    Funil de Vendas — Pizzattolog
                  </Typography>
                  <Typography sx={{ color: dashboardPalette.muted, fontSize: 13 }}>
                    Leads manuais e vindos do site por etapa.
                  </Typography>
                </Box>
              </Stack>

              <Chip
                label={`${totalLeadFunnel} lead(s) no funil`}
                sx={{
                  borderRadius: "10px",
                  bgcolor: "#ffffff",
                  color: dashboardPalette.text,
                  border: `1px solid ${dashboardPalette.border}`,
                  fontWeight: 900,
                }}
              />
            </Stack>

            <Box
              sx={{
                mt: 2.5,
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, minmax(0, 1fr))",
                  xl: "repeat(7, minmax(0, 1fr))",
                },
                gap: 1.25,
              }}
            >
              {leadFunnel.map((stage, index) => {
                const percentage =
                  maxLeadFunnelCount > 0
                    ? Math.max((stage.count / maxLeadFunnelCount) * 100, stage.count > 0 ? 12 : 0)
                    : 0;

                return (
                  <Paper
                    key={stage.value}
                    elevation={0}
                    sx={{
                      p: 1.5,
                      minHeight: 154,
                      border: `1px solid ${dashboardPalette.border}`,
                      borderRadius: "14px",
                      bgcolor: "#ffffff",
                    }}
                  >
                    <Stack spacing={1.25} sx={{ height: "100%" }}>
                      <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
                        <Box
                          sx={{
                            width: 28,
                            height: 28,
                            display: "grid",
                            placeItems: "center",
                            borderRadius: "8px",
                            bgcolor: index === 6 ? "#fef2f2" : "#fff3ed",
                            color: index === 6 ? "#b91c1c" : dashboardPalette.red,
                            fontSize: 12,
                            fontWeight: 900,
                          }}
                        >
                          {index + 1}
                        </Box>
                        <Typography sx={{ color: dashboardPalette.text, fontSize: 24, fontWeight: 900, lineHeight: 1 }}>
                          {stage.count}
                        </Typography>
                      </Stack>

                      <Box sx={{ minWidth: 0 }}>
                        <Typography sx={{ color: dashboardPalette.text, fontSize: 13, fontWeight: 900, lineHeight: 1.25 }}>
                          {stage.label}
                        </Typography>
                        <Typography
                          sx={{
                            mt: 0.6,
                            color: dashboardPalette.muted,
                            fontSize: 11.5,
                            lineHeight: 1.45,
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {stage.action}
                        </Typography>
                      </Box>

                      <Box sx={{ mt: "auto" }}>
                        <LinearProgress
                          variant="determinate"
                          value={percentage}
                          sx={{
                            height: 7,
                            borderRadius: 999,
                            bgcolor: "#f1f5f9",
                            "& .MuiLinearProgress-bar": {
                              borderRadius: 999,
                              bgcolor: index === 6 ? "#ef4444" : dashboardPalette.red,
                            },
                          }}
                        />
                      </Box>
                    </Stack>
                  </Paper>
                );
              })}
            </Box>
          </Paper>

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

type ModernMetricCardProps = {
  title: string;
  value: string;
  detail: string;
  icon: LucideIcon;
  color: string;
  background: string;
};

function ModernMetricCard({
  title,
  value,
  detail,
  icon: Icon,
  color,
  background,
}: ModernMetricCardProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        minHeight: 142,
        border: `1px solid ${dashboardPalette.border}`,
        borderRadius: "16px",
        bgcolor: "#ffffff",
        boxShadow: "0 16px 40px rgba(15,23,42,0.05)",
      }}
    >
      <Stack spacing={2} sx={{ height: "100%", justifyContent: "space-between" }}>
        <Stack direction="row" sx={{ alignItems: "flex-start", justifyContent: "space-between", gap: 2 }}>
          <Box>
            <Typography sx={{ color: dashboardPalette.muted, fontSize: 13, fontWeight: 800 }}>
              {title}
            </Typography>
            <Typography sx={{ mt: 1, color: dashboardPalette.text, fontSize: 32, fontWeight: 900, lineHeight: 1 }}>
              {value}
            </Typography>
          </Box>
          <Box
            sx={{
              width: 44,
              height: 44,
              display: "grid",
              placeItems: "center",
              flex: "0 0 auto",
              borderRadius: "12px",
              color,
              bgcolor: background,
            }}
          >
            <Icon size={22} />
          </Box>
        </Stack>
        <Typography sx={{ color: dashboardPalette.muted, fontSize: 13.5, lineHeight: 1.45 }}>
          {detail}
        </Typography>
      </Stack>
    </Paper>
  );
}

function ModernInternalDashboard({
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

  const leadFunnel = LEAD_FUNNEL_STAGES.map((stage) => {
    const summaryStage = crmSummary?.leadsByStage?.find(
      (item) => normalizeLeadFunnelStage(item.stage) === stage.value,
    );

    return {
      ...stage,
      count: summaryStage?.count ?? 0,
      monthlyEstimatedValue: summaryStage?.monthlyEstimatedValue ?? 0,
    };
  });
  const totalLeadFunnel = leadFunnel.reduce((total, stage) => total + stage.count, 0);
  const maxLeadFunnelCount = Math.max(...leadFunnel.map((stage) => stage.count), 1);
  const maxStageCount = Math.max(
    ...(crmSummary?.opportunitiesByStage.map((item) => item.count) ?? [1]),
    1,
  );

  const metrics = [
    {
      title: "Leads no funil",
      value: String(crmSummary?.totalLeads ?? 0),
      detail: `${crmSummary?.newLeads ?? 0} na entrada de leads`,
      icon: Users,
      color: dashboardPalette.red,
      background: "rgba(236,49,57,0.08)",
    },
    {
      title: "Clientes ativos",
      value: String(crmSummary?.activeClients ?? 0),
      detail: `${crmSummary?.totalClients ?? 0} cliente(s) cadastrados`,
      icon: Building2,
      color: dashboardPalette.text,
      background: "rgba(52,52,52,0.08)",
    },
    {
      title: "Cotações abertas",
      value: String(crmSummary?.openQuotes ?? 0),
      detail: `${crmSummary?.answeredQuotes ?? 0} cotação(ões) respondidas`,
      icon: FileText,
      color: "#b45309",
      background: "rgba(250,181,25,0.16)",
    },
    {
      title: "Tickets abertos",
      value: String(crmSummary?.openTickets ?? 0),
      detail: `${crmSummary?.closedTickets ?? 0} chamado(s) fechado(s)`,
      icon: Ticket,
      color: "#0f766e",
      background: "rgba(20,184,166,0.10)",
    },
  ];

  const commercialSummary = [
    {
      label: "Taxa de conversão",
      value: `${crmSummary?.conversionRate ?? 0}%`,
    },
    {
      label: "Valor em aberto",
      value: formatCurrency(crmSummary?.openValue ?? 0),
    },
    {
      label: "Oportunidades ganhas",
      value: String(crmSummary?.wonOpportunities ?? 0),
    },
    {
      label: "Usuários com acesso",
      value: String(crmSummary?.usersWithAccess ?? 0),
    },
  ];

  return (
    <Box
      sx={{
        mx: "auto",
        width: "100%",
        maxWidth: 1540,
        display: "flex",
        flexDirection: "column",
        gap: 2.5,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          ...dashboardPaperSx,
          p: { xs: 2.25, md: 3 },
          borderRadius: "18px",
        }}
      >
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          sx={{ alignItems: { xs: "flex-start", md: "center" }, justifyContent: "space-between" }}
        >
          <Box>
            <Chip
              label="Dashboard comercial"
              size="small"
              sx={{
                height: 24,
                bgcolor: "rgba(236,49,57,0.08)",
                color: dashboardPalette.red,
                fontSize: 11,
                fontWeight: 900,
                letterSpacing: 0.8,
                textTransform: "uppercase",
              }}
            />
            <Typography
              component="h1"
              sx={{ mt: 1.5, color: dashboardPalette.text, fontSize: { xs: 28, md: 36 }, fontWeight: 900, lineHeight: 1.05 }}
            >
              Olá, {firstName}
            </Typography>
            <Typography sx={{ mt: 1, color: dashboardPalette.muted, fontSize: 15.5 }}>
              Indicadores comerciais, funil de vendas e operação em uma visão objetiva.
            </Typography>
          </Box>
        </Stack>
      </Paper>

      {summaryError ? <Alert severity="warning">{summaryError}</Alert> : null}

      {isLoadingSummary ? (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2,1fr)", xl: "repeat(4,1fr)" }, gap: 2 }}>
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} variant="rounded" height={142} sx={{ borderRadius: "16px" }} />
          ))}
        </Box>
      ) : crmSummary ? (
        <>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2,1fr)", xl: "repeat(4,1fr)" }, gap: 2 }}>
            {metrics.map((metric) => (
              <ModernMetricCard key={metric.title} {...metric} />
            ))}
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", xl: "1.35fr .65fr" }, gap: 2 }}>
            <Paper elevation={0} sx={{ ...dashboardPaperSx, p: { xs: 2, md: 2.5 }, borderRadius: "18px" }}>
              <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} sx={{ justifyContent: "space-between", alignItems: { xs: "flex-start", md: "center" } }}>
                <Box>
                  <Typography sx={{ color: dashboardPalette.text, fontSize: 21, fontWeight: 900 }}>
                    Funil de Vendas — Pizzattolog
                  </Typography>
                  <Typography sx={{ mt: 0.5, color: dashboardPalette.muted, fontSize: 14 }}>
                    {totalLeadFunnel} lead(s) distribuídos nas etapas comerciais.
                  </Typography>
                </Box>
                <Button
                  component={Link}
                  href="/leads"
                  variant="outlined"
                  endIcon={<ArrowRight size={17} />}
                  sx={{ borderRadius: "12px", borderColor: dashboardPalette.border, color: dashboardPalette.text, fontWeight: 800 }}
                >
                  Abrir leads
                </Button>
              </Stack>

              <Stack spacing={1.25} sx={{ mt: 2.5 }}>
                {leadFunnel.map((stage, index) => {
                  const percentage = maxLeadFunnelCount > 0 ? (stage.count / maxLeadFunnelCount) * 100 : 0;
                  const isLost = stage.value === "perdido";

                  return (
                    <Box
                      key={stage.value}
                      sx={{
                        p: 1.5,
                        border: `1px solid ${dashboardPalette.border}`,
                        borderRadius: "14px",
                        bgcolor: "#ffffff",
                      }}
                    >
                      <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                        <Box
                          sx={{
                            width: 30,
                            height: 30,
                            display: "grid",
                            placeItems: "center",
                            borderRadius: "10px",
                            bgcolor: isLost ? "rgba(100,116,139,0.10)" : "rgba(236,49,57,0.08)",
                            color: isLost ? "#64748b" : dashboardPalette.red,
                            fontSize: 12,
                            fontWeight: 900,
                            flex: "0 0 auto",
                          }}
                        >
                          {index + 1}
                        </Box>
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Stack direction="row" spacing={1} sx={{ alignItems: "center", justifyContent: "space-between", gap: 2 }}>
                            <Box sx={{ minWidth: 0 }}>
                              <Typography sx={{ color: dashboardPalette.text, fontSize: 14.5, fontWeight: 900 }}>
                                {stage.label}
                              </Typography>
                              <Typography sx={{ mt: 0.25, color: dashboardPalette.muted, fontSize: 12.5, fontWeight: 700 }}>
                                {formatCurrency(stage.monthlyEstimatedValue)} estimado/mês
                              </Typography>
                            </Box>
                            <Typography sx={{ color: dashboardPalette.text, fontSize: 14, fontWeight: 900 }}>
                              {stage.count}
                            </Typography>
                          </Stack>
                          <LinearProgress
                            variant="determinate"
                            value={percentage}
                            sx={{
                              mt: 1,
                              height: 7,
                              borderRadius: 999,
                              bgcolor: "#f1f5f9",
                              "& .MuiLinearProgress-bar": {
                                borderRadius: 999,
                                bgcolor: isLost ? "#64748b" : dashboardPalette.red,
                              },
                            }}
                          />
                        </Box>
                      </Stack>
                    </Box>
                  );
                })}
              </Stack>
            </Paper>

            <Stack spacing={2}>
              <Paper elevation={0} sx={{ ...dashboardPaperSx, p: 2.5, borderRadius: "18px" }}>
                <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                  <Box sx={{ width: 42, height: 42, display: "grid", placeItems: "center", borderRadius: "12px", color: dashboardPalette.red, bgcolor: "rgba(236,49,57,0.08)" }}>
                    <TrendingUp size={21} />
                  </Box>
                  <Box>
                    <Typography sx={{ color: dashboardPalette.text, fontSize: 18, fontWeight: 900 }}>
                      Resumo comercial
                    </Typography>
                    <Typography sx={{ color: dashboardPalette.muted, fontSize: 13 }}>
                      Conversão, oportunidades e acesso.
                    </Typography>
                  </Box>
                </Stack>

                <Stack spacing={0} sx={{ mt: 2 }}>
                  {commercialSummary.map((item) => (
                    <Stack
                      key={item.label}
                      direction="row"
                      sx={{
                        py: 1.35,
                        alignItems: "center",
                        justifyContent: "space-between",
                        borderTop: `1px solid ${dashboardPalette.border}`,
                      }}
                    >
                      <Typography sx={{ color: dashboardPalette.muted, fontSize: 13.5, fontWeight: 700 }}>
                        {item.label}
                      </Typography>
                      <Typography sx={{ color: dashboardPalette.text, fontSize: 14, fontWeight: 900 }}>
                        {item.value}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
              </Paper>

              <Paper elevation={0} sx={{ ...dashboardPaperSx, p: 2.5, borderRadius: "18px" }}>
                <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                  <Box sx={{ width: 42, height: 42, display: "grid", placeItems: "center", borderRadius: "12px", color: "#b45309", bgcolor: "rgba(250,181,25,0.16)" }}>
                    <BriefcaseBusiness size={21} />
                  </Box>
                  <Box>
                    <Typography sx={{ color: dashboardPalette.text, fontSize: 18, fontWeight: 900 }}>
                      Oportunidades
                    </Typography>
                    <Typography sx={{ color: dashboardPalette.muted, fontSize: 13 }}>
                      {crmSummary.openOpportunities} oportunidade(s) em aberto.
                    </Typography>
                  </Box>
                </Stack>

                <Stack spacing={1.25} sx={{ mt: 2 }}>
                  {crmSummary.opportunitiesByStage.length > 0 ? (
                    crmSummary.opportunitiesByStage.map((item) => {
                      const percentage = maxStageCount > 0 ? (item.count / maxStageCount) * 100 : 0;

                      return (
                        <Box key={item.stage}>
                          <Stack direction="row" sx={{ justifyContent: "space-between", gap: 2 }}>
                            <Typography sx={{ color: dashboardPalette.text, fontSize: 13.5, fontWeight: 800 }}>
                              {formatOpportunityStage(item.stage)}
                            </Typography>
                            <Typography sx={{ color: dashboardPalette.muted, fontSize: 13, fontWeight: 800 }}>
                              {item.count}
                            </Typography>
                          </Stack>
                          <LinearProgress
                            variant="determinate"
                            value={percentage}
                            sx={{
                              mt: 0.75,
                              height: 6,
                              borderRadius: 999,
                              bgcolor: "#f1f5f9",
                              "& .MuiLinearProgress-bar": {
                                borderRadius: 999,
                                bgcolor: dashboardPalette.yellow,
                              },
                            }}
                          />
                        </Box>
                      );
                    })
                  ) : (
                    <Typography sx={{ color: dashboardPalette.muted, fontSize: 14 }}>
                      Nenhuma oportunidade registrada.
                    </Typography>
                  )}
                </Stack>
              </Paper>
            </Stack>
          </Box>
        </>
      ) : null}
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
        <ModernInternalDashboard
          userName={user?.name ?? "Usuário do portal"}
          userRole={user?.role ?? "-"}
          token={token}
        />
      )}
    </AppLayout>
  );
}
