export type LeadFunnelStage =
  | "entrada_leads"
  | "conversao"
  | "homologacao"
  | "cotacao"
  | "venda_efetivada"
  | "pos_venda"
  | "perdido";

export type LeadFunnelStageInfo = {
  value: LeadFunnelStage;
  label: string;
  criterion: string;
  action: string;
};

export const LEAD_FUNNEL_STAGES: LeadFunnelStageInfo[] = [
  {
    value: "entrada_leads",
    label: "Entrada de Leads",
    criterion:
      "Contato identificado por indicação, site, redes sociais ou prospecção ativa, ainda sem diagnóstico da necessidade.",
    action:
      "Fazer o primeiro contato e identificar a necessidade de transporte e/ou armazenagem.",
  },
  {
    value: "conversao",
    label: "Conversão",
    criterion:
      "O lead demonstrou interesse real e forneceu informações suficientes para avaliação.",
    action: "Aprofundar o diagnóstico e apresentar a empresa formalmente.",
  },
  {
    value: "homologacao",
    label: "Homologação",
    criterion:
      "O cliente exige cadastro, documentação ou aprovação interna antes de operar.",
    action: "Enviar documentação e formulários exigidos; acompanhar a aprovação.",
  },
  {
    value: "cotacao",
    label: "Cotação",
    criterion:
      "O levantamento foi concluído; a proposta comercial está em elaboração ou já foi enviada.",
    action: "Enviar a cotação detalhada e negociar prazo e condições.",
  },
  {
    value: "venda_efetivada",
    label: "Venda Efetivada",
    criterion:
      "A proposta foi aceita e o contrato assinado; a operação ainda não iniciou ou começou recentemente.",
    action: "Iniciar a integração operacional.",
  },
  {
    value: "pos_venda",
    label: "Pós-venda",
    criterion:
      "Cliente em operação ativa, com acompanhamento de performance e novas oportunidades.",
    action:
      "Acompanhar performance, oferecer serviço complementar e agir diante de sinais de insatisfação.",
  },
  {
    value: "perdido",
    label: "Perdido",
    criterion:
      "O lead ou cliente não avançou no funil por preço, prazo, escopo ou falta de retorno.",
    action:
      "Registrar o motivo da perda e reavaliar contato futuro quando fizer sentido.",
  },
];

const LEGACY_STATUS_TO_FUNNEL_STAGE: Record<string, LeadFunnelStage> = {
  new: "entrada_leads",
  contacted: "conversao",
  qualified: "homologacao",
  converted: "venda_efetivada",
  converted_to_prospect: "venda_efetivada",
  archived: "perdido",
};

export function normalizeLeadFunnelStage(
  status?: string | null,
): LeadFunnelStage {
  const value = status?.trim().toLowerCase();

  if (!value) {
    return "entrada_leads";
  }

  if (LEAD_FUNNEL_STAGES.some((stage) => stage.value === value)) {
    return value as LeadFunnelStage;
  }

  return LEGACY_STATUS_TO_FUNNEL_STAGE[value] ?? "entrada_leads";
}

export function getLeadFunnelStageInfo(status?: string | null) {
  const normalized = normalizeLeadFunnelStage(status);
  return (
    LEAD_FUNNEL_STAGES.find((stage) => stage.value === normalized) ??
    LEAD_FUNNEL_STAGES[0]
  );
}

export function getLeadFunnelStageLabel(status?: string | null) {
  return getLeadFunnelStageInfo(status).label;
}
