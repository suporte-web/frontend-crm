import {
  LEAD_FUNNEL_STAGES,
  normalizeLeadFunnelStage,
} from "@/constants/lead-funnel";
import type { Lead } from "@/types/leads";

export const CORES_ETAPAS = [
  "#258dc8",
  "#ff751d",
  "#8052ca",
  "#00a7b5",
  "#24a779",
  "#245777",
  "#94a3b8",
];
export const moeda = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 2,
  }).format(value);
export const numero = (value: number) =>
  new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(value);

export function valorMonetario(value: unknown) {
  if (typeof value === "number")
    return Number.isFinite(value) ? Math.max(0, value) : 0;
  if (typeof value !== "string") return 0;
  let text = value.replace(/[^\d,.-]/g, "");
  if (text.includes(",")) {
    text =
      text.lastIndexOf(",") > text.lastIndexOf(".")
        ? text.replace(/\./g, "").replace(",", ".")
        : text.replace(/,/g, "");
  }
  if (/^\d{1,3}(\.\d{3})+$/.test(text)) text = text.replace(/\./g, "");
  const number = Number(text);
  return Number.isFinite(number) ? Math.max(0, number) : 0;
}
const texto = (lead: Lead, key: string) =>
  typeof lead.metadata?.[key] === "string"
    ? String(lead.metadata[key]).trim()
    : "";
const data = (value?: string | null) => {
  if (!value) return null;
  const time = new Date(
    value.length === 10 ? `${value}T00:00:00-03:00` : value,
  ).getTime();
  return Number.isFinite(time) ? time : null;
};
function limite(value?: string) {
  if (!value) return null;
  const time = data(value);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    time === null ||
    new Date(time).toISOString().slice(0, 10) !== value
  )
    throw new Error("Período de cadastro inválido.");
  return time;
}

export function montarBiComercial(
  leads: Lead[],
  filters: { de?: string; ate?: string; agora?: Date } = {},
) {
  const start = limite(filters.de);
  const end = limite(filters.ate);
  if (start !== null && end !== null && start > end)
    throw new Error("Período de cadastro inválido.");
  const now = (filters.agora ?? new Date()).getTime();
  const records = Array.from(
    new Map(leads.map((lead) => [lead.id, lead])).values(),
  )
    .filter((lead) => {
      const created = data(lead.createdAt);
      return (
        created !== null &&
        (start === null || created >= start) &&
        (end === null || created < end + 86400000)
      );
    })
    .map((lead) => {
      const stage = normalizeLeadFunnelStage(lead.status);
      const converted =
        Boolean(lead.convertidoParaCliente) ||
        ["venda_efetivada", "pos_venda"].includes(stage);
      const contactDates = [
        data(texto(lead, "lastInteractionDate")),
        data(lead.lastInteractionAt),
      ].filter((value): value is number => value !== null);
      const contact = contactDates.length ? Math.max(...contactDates) : null;
      return {
        ...lead,
        etapa: stage,
        convertido: converted,
        ativo: !converted && stage !== "perdido",
        nome: lead.company || lead.name,
        valor: valorMonetario(lead.metadata?.monthlyEstimatedValue),
        proximaAcao: texto(lead, "nextAction"),
        responsavel: texto(lead, "responsible") || "Não informado",
        diasSemContato:
          contact === null
            ? null
            : Math.max(0, Math.floor((now - contact) / 86400000)),
      };
    });
  const active = records.filter((lead) => lead.ativo);
  const knownContacts = active.flatMap((lead) =>
    lead.diasSemContato === null ? [] : [lead.diasSemContato],
  );
  const total = records.length;
  const converted = records.filter((lead) => lead.convertido).length;
  return {
    total,
    ativos: active.length,
    convertidos: converted,
    conversao: total ? (converted / total) * 100 : 0,
    emConversao: records.filter((lead) => lead.etapa === "conversao").length,
    emHomologacao: records.filter((lead) => lead.etapa === "homologacao")
      .length,
    semProximaAcao: active.filter((lead) => !lead.proximaAcao).length,
    semInteracao: active.filter((lead) => lead.diasSemContato === null).length,
    tempoMedioSemContato: knownContacts.length
      ? knownContacts.reduce((sum, value) => sum + value, 0) /
        knownContacts.length
      : null,
    valorMensal: records.reduce((sum, lead) => sum + lead.valor, 0),
    etapas: LEAD_FUNNEL_STAGES.map((stage, index) => {
      const items = records.filter((lead) => lead.etapa === stage.value);
      return {
        ...stage,
        cor: CORES_ETAPAS[index],
        quantidade: items.length,
        valor: items.reduce((sum, lead) => sum + lead.valor, 0),
        percentual: total ? (items.length / total) * 100 : 0,
      };
    }),
    prioridades: active
      .filter(
        (lead) =>
          !lead.proximaAcao ||
          lead.diasSemContato === null ||
          lead.diasSemContato >= 7,
      )
      .sort(
        (a, b) =>
          (b.diasSemContato ?? Number.MAX_SAFE_INTEGER) -
            (a.diasSemContato ?? Number.MAX_SAFE_INTEGER) ||
          a.nome.localeCompare(b.nome, "pt-BR"),
      ),
  };
}
