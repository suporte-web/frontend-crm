import { converterValorTotalOportunidade } from '@/lib/valor-oportunidade';
import type { OpportunityStatus } from '@/types/crm';
import {
  LEAD_FUNNEL_STAGES,
  normalizeLeadFunnelStage,
} from "@/constants/lead-funnel";
import type { Lead } from "@/types/leads";
import type {
  Cadastro,
  ModalidadeCadastro,
} from "@/services/cadastros.service";

export type CadastroBi = Cadastro & { dadosAcompanhamentoDisponiveis?: boolean };

type RegistroComercial = Lead & {
  segmento?: string | null;
  dadosAcompanhamentoDisponiveis?: boolean;
  modalidadeCadastro?: ModalidadeCadastro;
  statusCadastro?: string | null;
  etapaNaoInformada?: boolean;
  href?: string;
};

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
  leads: RegistroComercial[],
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
      return created === null
        ? start === null && end === null
        : (start === null || created >= start) &&
            (end === null || created < end + 86400000);
    })
    .map((lead) => {
      const original = lead.status?.trim().toLowerCase();
      const reconhecida = LEAD_FUNNEL_STAGES.some(item => item.value === original)
        || ['new', 'contacted', 'qualified', 'converted', 'converted_to_prospect', 'archived'].includes(original);
      const stage = lead.etapaNaoInformada || !reconhecida ? null : normalizeLeadFunnelStage(original);
      let valorInformado: number | null = null;
      const valorOriginal = lead.metadata?.monthlyEstimatedValue;
      if (typeof valorOriginal === 'number' && Number.isFinite(valorOriginal) && valorOriginal >= 0) valorInformado = valorOriginal;
      else if (typeof valorOriginal === 'string') {
        try { valorInformado = converterValorTotalOportunidade(valorOriginal); } catch { /* Dado inválido permanece não informado. */ }
      }
      const converted =
        Boolean(lead.convertidoParaCliente) ||
        (!lead.modalidadeCadastro &&
          stage !== null &&
          ["venda_efetivada", "pos_venda"].includes(stage));
      const contactDates = [
        data(texto(lead, "lastInteractionDate")),
        data(lead.lastInteractionAt),
      ].filter((value): value is number => value !== null);
      const contact = contactDates.length ? Math.max(...contactDates) : null;
      return {
        ...lead,
        etapa: stage,
        convertido: converted,
        ativo: lead.modalidadeCadastro
          ? lead.statusCadastro?.trim().toUpperCase() !== "INATIVO" &&
            stage !== "perdido"
          : !converted && stage !== "perdido",
        nome: lead.company || lead.name,
        valor: valorInformado ?? 0,
        valorInformado,
        acompanhamentoDisponivel: lead.dadosAcompanhamentoDisponiveis !== false,
        situacaoContato: texto(lead, "currentStatus") || null,
        proximaAcao: texto(lead, "nextAction"),
        responsavel: texto(lead, "responsible") || "Não informado",
        diasSemContato:
          contact === null
            ? null
            : Math.max(0, Math.floor((now - contact) / 86400000)),
      };
    });
  const active = records.filter((lead) => lead.ativo);
  const acompanhaveis = active.filter(lead => lead.acompanhamentoDisponivel);
  const knownContacts = acompanhaveis.flatMap((lead) =>
    lead.diasSemContato === null ? [] : [lead.diasSemContato],
  );
  const total = records.length;
  const converted = records.filter((lead) => lead.convertido).length;
  const clientes = records.filter(
    (record) => record.modalidadeCadastro === "CLIENTE",
  ).length;
  const etapas = LEAD_FUNNEL_STAGES.map((stage, index) => ({
    ...stage,
    cor: CORES_ETAPAS[index],
  }));
  const etapasVisiveis = records.some((record) => record.etapa === null)
    ? [
        ...etapas,
        {
          value: "sem_etapa" as const,
          label: "Etapa não informada",
          cor: "#64748b",
          criterion: "Etapa ainda não preenchida no cadastro.",
          action: "Preencher a etapa do funil no cadastro.",
        },
      ]
    : etapas;
  const gruposSegmento = new Map<string | null, number>();
  for (const registro of records) {
    const segmento = registro.segmento?.trim() || null;
    gruposSegmento.set(segmento, (gruposSegmento.get(segmento) ?? 0) + 1);
  }
  const segmentos = Array.from(gruposSegmento, ([segmento, quantidade]) => ({
    segmento, label: segmento ?? 'Segmento não informado', quantidade,
    percentual: total ? quantidade / total * 100 : 0,
  })).sort((a, b) => a.segmento === null ? 1 : b.segmento === null ? -1 : b.quantidade - a.quantidade || a.label.localeCompare(b.label, 'pt-BR'));
  return {
    segmentos,
    acompanhamentosDisponiveis: acompanhaveis.length,
    acompanhamentosIndisponiveis: active.length - acompanhaveis.length,
    cadastrosComValorMensal: records.filter(lead => lead.valorInformado !== null).length,
    total,
    leads: total - clientes,
    clientes,
    percentualClientes: total ? (clientes / total) * 100 : 0,
    ativos: active.length,
    convertidos: converted,
    conversao: total ? (converted / total) * 100 : 0,
    emConversao: records.filter((lead) => lead.etapa === "conversao").length,
    emHomologacao: records.filter((lead) => lead.etapa === "homologacao")
      .length,
    semProximaAcao: acompanhaveis.filter((lead) => !lead.proximaAcao).length,
    semInteracao: acompanhaveis.filter((lead) => lead.diasSemContato === null).length,
    tempoMedioSemContato: knownContacts.length
      ? knownContacts.reduce((sum, value) => sum + value, 0) /
        knownContacts.length
      : null,
    valorMensal: records.reduce((sum, lead) => sum + lead.valor, 0),
    etapas: etapasVisiveis.map((stage) => {
      const items = records.filter((lead) =>
        stage.value === "sem_etapa"
          ? lead.etapa === null
          : lead.etapa === stage.value,
      );
      return {
        ...stage,
        quantidade: items.length,
        valoresInformados: items.filter(lead => lead.valorInformado !== null).length,
        valoresIndisponiveis: items.filter(lead => !lead.acompanhamentoDisponivel && lead.valorInformado === null).length,
        valor: items.reduce((sum, lead) => sum + lead.valor, 0),
        percentual: total ? (items.length / total) * 100 : 0,
      };
    }),
    prioridades: acompanhaveis
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

export function montarBiCadastros(
  cadastros: CadastroBi[],
  filters: Parameters<typeof montarBiComercial>[1] = {},
) {
  const registros: RegistroComercial[] = cadastros.map((cadastro) => {
    const origem = cadastro.leadCadastro;
    const metadata = { ...origem?.metadata, ...cadastro.metadata };
    const etapa =
      "etapaFunil" in cadastro ? cadastro.etapaFunil : origem?.status;
    return {
      id: cadastro.id,
      segmento: cadastro.segment?.trim() || null,
      dadosAcompanhamentoDisponiveis: cadastro.dadosAcompanhamentoDisponiveis,
      name:
        cadastro.tradeName ||
        cadastro.legalName ||
        cadastro.companyName ||
        cadastro.user?.name ||
        cadastro.document ||
        "Cadastro",
      company: cadastro.tradeName || cadastro.legalName || cadastro.companyName,
      source: origem?.source ?? "cadastro",
      status: etapa ?? "",
      modalidadeCadastro: cadastro.modalidadeCadastro || "CLIENTE",
      statusCadastro: cadastro.status,
      etapaNaoInformada: !etapa,
      createdAt: cadastro.createdAt,
      updatedAt: cadastro.updatedAt,
      lastInteractionAt:
        cadastro.lastInteractionAt ?? origem?.lastInteractionAt,
      convertidoParaCliente: origem?.convertidoParaCliente,
      href: `/cadastros/${cadastro.id}`,
      metadata: {
        ...metadata,
        nextAction:
          "proximaAcao" in cadastro
            ? (cadastro.proximaAcao ?? "")
            : metadata.nextAction,
        responsible:
          "responsavel" in cadastro
            ? (cadastro.responsavel ?? "")
            : metadata.responsible,
        monthlyEstimatedValue:
          "volumeMensalEstimado" in cadastro
            ? cadastro.volumeMensalEstimado
            : metadata.monthlyEstimatedValue,
      },
    };
  });
  return montarBiComercial(registros, filters);
}


export type OportunidadeFonteBi = {
  clientId?: string; client?: { id?: string } | null;
  id: string; status: OpportunityStatus; createdAt: string;
  motivoPerda?: string | null; preContractNotes?: string | null;
};
export type OportunidadeBi = {
  cadastroId?: string;
  id: string; status: OpportunityStatus; createdAt: string;
  motivoPerda: string | null; propostaCadastrada: boolean;
};

/** Usa a marcação gravada pelo formulário Nova proposta, nunca o status/etapa. */
export function normalizarOportunidadesBi(registros: readonly OportunidadeFonteBi[]): OportunidadeBi[] {
  return Array.from(new Map(registros.map(item => {
    const tipo = item.preContractNotes?.match(/^\s*Tipo de proposta:\s*(.+)$/im)?.[1]?.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const registro: OportunidadeBi = {
      id: item.id, status: item.status, createdAt: item.createdAt,
      cadastroId: item.clientId ?? item.client?.id,
      motivoPerda: item.motivoPerda ?? null,
      propostaCadastrada: tipo === 'armazenagem' || tipo === 'transporte rodoviario',
    };
    return [item.id, registro] as const;
  })).values());
}

export function montarBiOportunidades(registros: readonly OportunidadeBi[], filtros: { de?: string; ate?: string } = {}) {
  const inicio = limite(filtros.de), fim = limite(filtros.ate);
  if (inicio !== null && fim !== null && inicio > fim) throw new Error('Período de cadastro inválido.');
  const unicos = Array.from(new Map(registros.map(item => [item.id, item])).values()).filter(item => {
    const criacao = data(item.createdAt);
    return criacao === null ? inicio === null && fim === null
      : (inicio === null || criacao >= inicio) && (fim === null || criacao < fim + 86400000);
  });
  return {
    total: unicos.length,
    abertas: unicos.filter(item => item.status === 'OPEN').length,
    ganhas: unicos.filter(item => item.status === 'WON').length,
    perdidas: unicos.filter(item => item.status === 'LOST').length,
    propostas: unicos.filter(item => item.propostaCadastrada).length,
  };
}

function responsavelCadastroBi(cadastro: CadastroBi) {
  const metadata = { ...cadastro.leadCadastro?.metadata, ...cadastro.metadata };
  const valor = 'responsavel' in cadastro ? cadastro.responsavel : metadata.responsible;
  return typeof valor === 'string' ? valor.trim().replace(/\s+/g, ' ') : '';
}
function chaveResponsavelBi(nome: string) {
  return nome ? 'nome:' + nome.toLocaleLowerCase('pt-BR') : 'sem-responsavel';
}
export type ResponsavelBi = { valor: string; rotulo: string };
export function listarResponsaveisBi(cadastros: readonly CadastroBi[]): ResponsavelBi[] {
  const opcoes = new Map<string, string>();
  for (const cadastro of cadastros) {
    const nome = responsavelCadastroBi(cadastro);
    const chave = chaveResponsavelBi(nome);
    if (!opcoes.has(chave)) opcoes.set(chave, nome || 'Sem responsável');
  }
  return Array.from(opcoes, ([valor, rotulo]) => ({ valor, rotulo })).sort((a, b) => a.rotulo.localeCompare(b.rotulo, 'pt-BR'));
}
/** O mesmo filtro alimenta todas as abas; oportunidades seguem seu cadastro de origem. */
export function filtrarBiPorResponsavel(cadastros: CadastroBi[], oportunidades: OportunidadeBi[] | null, responsavel: string) {
  if (!responsavel) return { cadastros, oportunidades };
  const filtrados = cadastros.filter(cadastro => chaveResponsavelBi(responsavelCadastroBi(cadastro)) === responsavel);
  const ids = new Set(filtrados.map(cadastro => cadastro.id));
  return { cadastros: filtrados, oportunidades: oportunidades === null ? null : oportunidades.filter(item => Boolean(item.cadastroId && ids.has(item.cadastroId))) };
}
