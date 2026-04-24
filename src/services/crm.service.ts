import type {
  CrmDashboardSummary,
  LeadDetail,
  LeadStatus,
  LeadSummary,
  Opportunity,
  OpportunityStage,
  OpportunityStatus,
  TimelineEvent,
} from '@/types/crm';

const leadSummaries: LeadSummary[] = [
  {
    id: '1',
    name: 'Pizzattolog LTDA',
    email: 'contato@pizzattolog.com',
    company: 'Pizzattolog LTDA',
    segment: 'Logistica',
    owner: 'Caroline',
    status: 'ATIVO',
    createdAt: '2026-04-16T10:00:00.000Z',
  },
  {
    id: '2',
    name: 'Mercado Nova Era',
    email: 'compras@novaera.com',
    company: 'Mercado Nova Era',
    segment: 'Varejo',
    owner: 'Equipe Comercial',
    status: 'PENDENTE',
    createdAt: '2026-04-12T13:30:00.000Z',
  },
  {
    id: '3',
    name: 'Grupo Atlas',
    email: 'atlas@grupoatlas.com',
    company: 'Grupo Atlas',
    segment: 'Industria',
    owner: 'Mariana',
    status: 'ATIVO',
    createdAt: '2026-04-10T15:00:00.000Z',
  },
  {
    id: '4',
    name: 'Cliente Exemplo',
    email: 'cliente@exemplo.com',
    company: 'Cliente Exemplo SA',
    segment: 'Servicos',
    owner: 'Joao',
    status: 'INATIVO',
    createdAt: '2026-04-05T09:15:00.000Z',
  },
];

const leadDetails: LeadDetail[] = [
  {
    ...leadSummaries[0],
    document: '07.760.243/0001-77',
    phone: '(11) 99999-0101',
    source: 'Indicacao',
    notes: 'Conta com potencial para expandir operacao interestadual.',
    lastContactAt: '2026-04-22T14:10:00.000Z',
    opportunities: [
      {
        id: 'opp-101',
        leadId: '1',
        title: 'Contrato nacional de distribuicao',
        value: 125000,
        stage: 'NEGOCIACAO',
        status: 'OPEN',
        expectedCloseDate: '2026-05-10T00:00:00.000Z',
        lostReason: null,
        createdAt: '2026-04-18T10:00:00.000Z',
        updatedAt: '2026-04-22T14:10:00.000Z',
      },
      {
        id: 'opp-102',
        leadId: '1',
        title: 'Cross docking regional',
        value: 42000,
        stage: 'PROPOSTA',
        status: 'OPEN',
        expectedCloseDate: '2026-05-03T00:00:00.000Z',
        lostReason: null,
        createdAt: '2026-04-19T11:30:00.000Z',
        updatedAt: '2026-04-21T09:00:00.000Z',
      },
    ],
    timeline: [
      {
        id: 'evt-101',
        leadId: '1',
        type: 'LEAD_CREATED',
        title: 'Lead criado',
        description: 'Cadastro inicial do cliente no portal comercial.',
        createdAt: '2026-04-16T10:00:00.000Z',
        createdBy: 'Caroline',
      },
      {
        id: 'evt-102',
        leadId: '1',
        type: 'OPPORTUNITY_CREATED',
        title: 'Oportunidade criada',
        description: 'Contrato nacional de distribuicao iniciado.',
        createdAt: '2026-04-18T10:00:00.000Z',
        createdBy: 'Caroline',
      },
      {
        id: 'evt-103',
        leadId: '1',
        type: 'NOTE_ADDED',
        title: 'Observacao adicionada',
        description: 'Cliente pediu simulacao com prazo de implantacao reduzido.',
        createdAt: '2026-04-20T16:40:00.000Z',
        createdBy: 'Caroline',
      },
      {
        id: 'evt-104',
        leadId: '1',
        type: 'STAGE_CHANGED',
        title: 'Mudanca de etapa',
        description: 'Oportunidade principal avancou para Negociacao.',
        createdAt: '2026-04-22T14:10:00.000Z',
        createdBy: 'Caroline',
        metadata: {
          from: 'PROPOSTA',
          to: 'NEGOCIACAO',
        },
      },
    ],
  },
  {
    ...leadSummaries[1],
    document: '49.100.550/0001-11',
    phone: '(21) 98888-1212',
    source: 'Formulario do portal',
    notes: 'Conta em validacao comercial antes de formalizar proposta.',
    lastContactAt: '2026-04-21T12:15:00.000Z',
    opportunities: [
      {
        id: 'opp-201',
        leadId: '2',
        title: 'Operacao de abastecimento semanal',
        value: 18500,
        stage: 'QUALIFICADO',
        status: 'OPEN',
        expectedCloseDate: '2026-05-15T00:00:00.000Z',
        lostReason: null,
        createdAt: '2026-04-17T15:00:00.000Z',
        updatedAt: '2026-04-21T12:15:00.000Z',
      },
    ],
    timeline: [
      {
        id: 'evt-201',
        leadId: '2',
        type: 'LEAD_CREATED',
        title: 'Lead criado',
        description: 'Lead recebido via formulario do portal.',
        createdAt: '2026-04-12T13:30:00.000Z',
        createdBy: 'Sistema',
      },
      {
        id: 'evt-202',
        leadId: '2',
        type: 'LEAD_UPDATED',
        title: 'Lead atualizado',
        description: 'Dados de contato e segmento revisados pelo time comercial.',
        createdAt: '2026-04-14T10:00:00.000Z',
        createdBy: 'Equipe Comercial',
      },
      {
        id: 'evt-203',
        leadId: '2',
        type: 'OPPORTUNITY_CREATED',
        title: 'Oportunidade criada',
        description: 'Operacao de abastecimento semanal registrada.',
        createdAt: '2026-04-17T15:00:00.000Z',
        createdBy: 'Equipe Comercial',
      },
    ],
  },
  {
    ...leadSummaries[2],
    document: '10.222.333/0001-18',
    phone: '(31) 97777-4343',
    source: 'Outbound',
    notes: 'Conta madura, com bom historico de resposta do decisor.',
    lastContactAt: '2026-04-20T18:30:00.000Z',
    opportunities: [
      {
        id: 'opp-301',
        leadId: '3',
        title: 'Projeto de armazenagem dedicada',
        value: 89000,
        stage: 'GANHO',
        status: 'WON',
        expectedCloseDate: '2026-04-25T00:00:00.000Z',
        lostReason: null,
        createdAt: '2026-04-08T10:00:00.000Z',
        updatedAt: '2026-04-20T18:30:00.000Z',
      },
    ],
    timeline: [
      {
        id: 'evt-301',
        leadId: '3',
        type: 'LEAD_CREATED',
        title: 'Lead criado',
        description: 'Lead originado por prospeccao outbound.',
        createdAt: '2026-04-10T15:00:00.000Z',
        createdBy: 'Mariana',
      },
      {
        id: 'evt-302',
        leadId: '3',
        type: 'OPPORTUNITY_CREATED',
        title: 'Oportunidade criada',
        description: 'Projeto de armazenagem dedicada aberto.',
        createdAt: '2026-04-08T10:00:00.000Z',
        createdBy: 'Mariana',
      },
      {
        id: 'evt-303',
        leadId: '3',
        type: 'OPPORTUNITY_WON',
        title: 'Oportunidade ganha',
        description: 'Cliente aprovou proposta comercial final.',
        createdAt: '2026-04-20T18:30:00.000Z',
        createdBy: 'Mariana',
      },
    ],
  },
  {
    ...leadSummaries[3],
    document: '22.111.555/0001-30',
    phone: '(41) 96666-5454',
    source: 'Base antiga',
    notes: 'Relacionamento parado, usado como historico da carteira.',
    lastContactAt: '2026-04-09T11:20:00.000Z',
    opportunities: [
      {
        id: 'opp-401',
        leadId: '4',
        title: 'Distribuicao urbana',
        value: 23000,
        stage: 'PERDIDO',
        status: 'LOST',
        expectedCloseDate: '2026-04-14T00:00:00.000Z',
        lostReason: 'Preco fora do budget do cliente.',
        createdAt: '2026-04-06T10:00:00.000Z',
        updatedAt: '2026-04-09T11:20:00.000Z',
      },
    ],
    timeline: [
      {
        id: 'evt-401',
        leadId: '4',
        type: 'LEAD_CREATED',
        title: 'Lead criado',
        description: 'Conta antiga importada para acompanhamento interno.',
        createdAt: '2026-04-05T09:15:00.000Z',
        createdBy: 'Joao',
      },
      {
        id: 'evt-402',
        leadId: '4',
        type: 'OPPORTUNITY_LOST',
        title: 'Oportunidade perdida',
        description: 'Distribuicao urbana encerrada como perdida.',
        createdAt: '2026-04-09T11:20:00.000Z',
        createdBy: 'Joao',
        metadata: {
          reason: 'Preco fora do budget do cliente.',
        },
      },
    ],
  },
];

function getStatusLabel(status: LeadStatus) {
  const labels: Record<LeadStatus, string> = {
    ATIVO: 'Ativo',
    PENDENTE: 'Pendente',
    INATIVO: 'Inativo',
  };

  return labels[status];
}

function normalizeOpportunityStatus(stage: OpportunityStage): OpportunityStatus {
  if (stage === 'GANHO') {
    return 'WON';
  }

  if (stage === 'PERDIDO') {
    return 'LOST';
  }

  return 'OPEN';
}

function cloneTimeline(events: TimelineEvent[]) {
  return events.map((event) => ({
    ...event,
    metadata: event.metadata ? { ...event.metadata } : null,
  }));
}

function cloneOpportunities(opportunities: Opportunity[]) {
  return opportunities.map((opportunity) => ({ ...opportunity }));
}

export async function getCrmClientSummaries(): Promise<LeadSummary[]> {
  return leadSummaries.map((lead) => ({ ...lead }));
}

export async function getCrmLeadById(id: string): Promise<LeadDetail | null> {
  const lead = leadDetails.find((item) => item.id === id);

  if (!lead) {
    return null;
  }

  return {
    ...lead,
    timeline: cloneTimeline(lead.timeline),
    opportunities: cloneOpportunities(lead.opportunities),
  };
}

export async function getCrmDashboardSummary(): Promise<CrmDashboardSummary> {
  const opportunities = leadDetails.flatMap((lead) => lead.opportunities);
  const totalLeads = leadDetails.length;
  const openOpportunities = opportunities.filter(
    (opportunity) => opportunity.status === 'OPEN',
  );
  const wonOpportunities = opportunities.filter(
    (opportunity) => opportunity.status === 'WON',
  );
  const opportunitiesByStage = [
    'NOVO',
    'QUALIFICADO',
    'PROPOSTA',
    'NEGOCIACAO',
    'GANHO',
    'PERDIDO',
  ].map((stage) => {
    const stageItems = opportunities.filter((item) => item.stage === stage);

    return {
      stage,
      count: stageItems.length,
      value: stageItems.reduce((total, item) => total + (item.value ?? 0), 0),
    };
  }) as CrmDashboardSummary['opportunitiesByStage'];

  return {
    totalLeads,
    openOpportunities: openOpportunities.length,
    wonOpportunities: wonOpportunities.length,
    conversionRate:
      opportunities.length === 0
        ? 0
        : Number(((wonOpportunities.length / opportunities.length) * 100).toFixed(1)),
    openValue: openOpportunities.reduce(
      (total, opportunity) => total + (opportunity.value ?? 0),
      0,
    ),
    opportunitiesByStage,
  };
}

export function formatLeadStatus(status: LeadStatus) {
  return getStatusLabel(status);
}

export function formatOpportunityStage(stage: OpportunityStage) {
  const labels: Record<OpportunityStage, string> = {
    NOVO: 'Novo',
    QUALIFICADO: 'Qualificado',
    PROPOSTA: 'Proposta',
    NEGOCIACAO: 'Negociacao',
    GANHO: 'Ganho',
    PERDIDO: 'Perdido',
  };

  return labels[stage];
}

export function getOpportunityStatusFromStage(stage: OpportunityStage) {
  return normalizeOpportunityStatus(stage);
}
