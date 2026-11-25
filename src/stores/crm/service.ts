import { Api, ApiError } from '@/utils/Api';
import { normalizarNomesCadastro } from '@/lib/nome-cadastro';
import { MotivosPerdaService } from '@/stores/motivos-perda/service';
import { validarDocumentosOportunidade, OPPORTUNITY_DOCUMENT_LIMIT_MESSAGE } from '@/lib/opportunity-documents';
import type { ClientContact, ClientDocument, ClientDeletionRequest, ClientDeletionRequestStatus, CrmDashboardSummary, LeadDetail, LeadStatus, LeadSummary, Opportunity, OpportunityStage, OpportunityStatus, TimelineEvent, } from '@/types/crm';
type BackendUser = {
  id: string;
  name: string;
  email: string;
  role?: string;
};
export type BackendClient = {
  responsavelId?: string | null;
  empresaConsultoraId?: string | null;
  segmentoId?: string | null;
  segmentoOrigem?: string | null;
  siteUrl?: string | null;
  fotoUrl?: string | null;
  proximaAcao?: string | null;
  responsavel?: string | null;
  volumeMensalEstimado?: string | null;
  modalidadeCadastro?: 'CLIENTE' | 'LEAD';
  prospectedById?: string | null;
  prospectedByName?: string | null;
  sourceLeadId?: string | null;
  sourceProspectId?: string | null;
  id: string;
  document?: string | null;
  phone?: string | null;
  companyName?: string | null;
  legalName?: string | null;
  tradeName?: string | null;
  cnae?: string | null;
  stateRegistration?: string | null;
  businessActivity?: string | null;
  taxRegime?: string | null;
  address?: string | null;
  city?: string | null;
  bankDetails?: string | null;
  modality?: string | null;
  registrationDate?: string | null;
  paymentMethod?: string | null;
  paymentTerm?: string | null;
  contractValidity?: string | null;
  priceAdjustment?: string | null;
  invoiceContactName?: string | null;
  invoiceContactEmail?: string | null;
  invoiceContactPhone?: string | null;
  commercialTermsNotes?: string | null;
  segment?: string | null;
  notes?: string | null;
  status?: string | null;
  internalOwnerId?: string | null;
  createdAt: string;
  updatedAt: string;
  user?: BackendUser | null;
  opportunities?: BackendOpportunity[];
  documents?: ClientDocument[];
  contacts?: ClientContact[];
};
type BackendOpportunity = {
  valorPropostaComercial?: number | string | null;
  id: string;
  clientId: string;
  quoteId?: string | null;
  title: string;
  value?: number | string | null;
  stage: OpportunityStage;
  status: OpportunityStatus;
  preContract?: boolean;
  preContractNotes?: string | null;
  expectedCloseDate?: string | null;
  lostReason?: string | null;
  motivoPerda?: string | null;
  observacaoPerda?: string | null;
  createdAt: string;
  updatedAt: string;
};
type BackendTimelineEvent = {
  id: string;
  type: TimelineEvent['type'] | string;
  title: string;
  description: string;
  date?: string;
  createdAt?: string;
  createdBy?: {
    name?: string | null;
    role?: string | null;
  } | null;
  metadata?: Record<string, string | number | boolean | null> | null;
};
type BackendClientDetail = {
  client: BackendClient;
  opportunities: BackendOpportunity[];
  timeline: BackendTimelineEvent[];
};
type OwnerSummary = {
  owner: BackendUser;
  metrics: {
    totalClients: number;
    activeClients: number;
  };
};
function normalizeStatus(status?: string | null): LeadStatus {
  if (status === 'ATIVO' || status === 'PENDENTE' || status === 'INATIVO') {
    return status;
  }
  return 'PENDENTE';
}
function toNumber(value?: number | string | null) {
  if (value === null || value === undefined) {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
function isTechnicalNoAccessEmail(email?: string | null) {
  return Boolean(email?.trim().toLowerCase().endsWith('@sem-acesso.pizzattolog.com'));
}
function mapOpportunity(opportunity: BackendOpportunity): Opportunity {
  return {
    id: opportunity.id,
    leadId: opportunity.clientId,
    clientId: opportunity.clientId,
    quoteId: opportunity.quoteId ?? null,
    title: opportunity.title,
    value: toNumber(opportunity.value),
    valorPropostaComercial: toNumber(opportunity.valorPropostaComercial),
    stage: opportunity.stage,
    status: opportunity.status,
    preContract: opportunity.preContract ?? false,
    preContractNotes: opportunity.preContractNotes ?? null,
    expectedCloseDate: opportunity.expectedCloseDate ?? null,
    lostReason: opportunity.lostReason ?? null,
    motivoPerda: opportunity.motivoPerda ?? null,
    observacaoPerda: opportunity.observacaoPerda ?? null,
    createdAt: opportunity.createdAt,
    updatedAt: opportunity.updatedAt,
  };
}
function mapTimelineEvent(clientId: string, event: BackendTimelineEvent): TimelineEvent {
  const eventType = [
    'LEAD_CREATED',
    'LEAD_UPDATED',
    'OPPORTUNITY_CREATED',
    'STAGE_CHANGED',
    'NOTE_ADDED',
    'OPPORTUNITY_WON',
    'OPPORTUNITY_LOST',
    'QUOTE_CREATED',
    'QUOTE_STATUS',
  ].includes(event.type)
    ? (event.type as TimelineEvent['type'])
    : 'NOTE_ADDED';
  return {
    id: event.id,
    leadId: clientId,
    type: eventType,
    title: event.title,
    description: event.description,
    createdAt: event.createdAt ?? event.date ?? new Date().toISOString(),
    createdBy: event.createdBy?.name ?? null,
    createdByRole: event.createdBy?.role ?? null,
    metadata: event.metadata ?? null,
  };
}
function mapClientContact(contact: ClientContact, index: number): ClientContact {
  const name = contact.name ?? contact.nomeContato ?? null;
  const role = contact.role ?? contact.cargo ?? null;
  const phone = contact.phone ?? contact.telefone ?? null;
  return {
    ...contact,
    name,
    nomeContato: contact.nomeContato ?? name,
    role,
    cargo: contact.cargo ?? role,
    phone,
    telefone: contact.telefone ?? phone,
    isPrimary: contact.isPrimary ?? index === 0,
  };
}
type CreatedClientResponse = {
  id?: string;
  client?: {
    id: string;
  } | null;
  clientProfile?: {
    id: string;
  } | null;
};
const OPPORTUNITY_STATUS_LABELS = {
  OPEN: "ABERTA",
  WON: "GANHA",
  LOST: "PERDIDA",
} satisfies Record<OpportunityStatus, string>;

export const CrmService = {
  solicitarDownloadDocumentoCliente: async (clientId: string, documentId: string): Promise<Blob> => {
    const { data } = await Api.get<Blob>(`/clients/${clientId}/documents/${documentId}/download`, { responseType: 'blob' });
    return data;
  },

  solicitarExclusaoDocumentoCliente: async (clientId: string, documentId: string, justification: string): Promise<{
    message?: string;
  }> => {
    const { data } = await Api.delete<{
      message?: string;
    }>(`/clients/${clientId}/documents/${documentId}`, { data: { justification } });
    return data;
  },

  mapClientSummary: (client: BackendClient, owners: Map<string, string>): LeadSummary => {
    const clientName = client.tradeName ||
      client.legalName ||
      client.companyName ||
      client.user?.name ||
      client.document ||
      'Cliente';
    const clientEmail = client.contacts?.find(contato => contato.isPrimary)?.email || client.contacts?.[0]?.email || client.user?.email || '';
    return normalizarNomesCadastro({
      id: client.id,
      responsavel: client.responsavel?.trim() || null,
      responsavelId: client.responsavelId ?? null,
      modalidadeCadastro: client.modalidadeCadastro || 'CLIENTE',
      prospectedById: client.prospectedById,
      prospectedByName: client.prospectedByName,
      sourceLeadId: client.sourceLeadId,
      sourceProspectId: client.sourceProspectId,
      name: clientName,
      email: isTechnicalNoAccessEmail(clientEmail) ? '' : clientEmail,
      company: client.tradeName || client.legalName || client.companyName || clientName,
      document: client.document ?? null,
      phone: client.phone ?? null,
      city: client.city ?? "-",
      segment: client.segment || "-",
      segmentoId: client.segmentoId, segmentoOrigem: client.segmentoOrigem, siteUrl: client.siteUrl,
      owner: client.internalOwnerId
        ? owners.get(client.internalOwnerId) ?? 'Responsável interno'
        : 'Sem responsável',
      status: normalizeStatus(client.status),
      createdAt: client.createdAt,
    });
  },

  getCrmClientSummaries: async (consultora = false, filtros: Record<string, string | undefined> = {}): Promise<LeadSummary[]> => {
    const [clients, owners] = await Promise.all([
      Api.get<BackendClient[]>(`/clients?${new URLSearchParams(Object.entries(filtros).filter(([, v]) => v) as [
        string,
        string
      ][]).toString()}`).then(({ data }) => data),
      consultora ? Promise.resolve([] as OwnerSummary[]) : Api.get<OwnerSummary[]>('/clients/owners/summary').then(({ data }) => data),
    ]);
    const ownerMap = new Map(owners.map((item) => [item.owner.id, item.owner.name]));
    return clients.map((client) => CrmService.mapClientSummary(client, ownerMap));
  },

  getCrmLeadById: async (id: string, somenteOportunidades = false): Promise<LeadDetail | null> => {
    const endpoint = somenteOportunidades ? `/opportunities/clients/${id}/detail` : `/clients/${id}/detail`;
    const detail = await Api.get<BackendClientDetail>(endpoint).then(({ data }) => data);
    const summary = CrmService.mapClientSummary(detail.client, new Map());
    return normalizarNomesCadastro({
      ...summary,
      fotoUrl: detail.client.fotoUrl,
      proximaAcao: detail.client.proximaAcao,
      responsavel: detail.client.responsavel,
      responsavelId: detail.client.responsavelId,
      volumeMensalEstimado: detail.client.volumeMensalEstimado,
      userId: detail.client.user?.id ?? detail.client.id,
      internalOwnerId: detail.client.internalOwnerId ?? null,
      document: detail.client.document ?? null,
      phone: detail.client.phone ?? null,
      legalName: detail.client.legalName ?? null,
      tradeName: detail.client.tradeName ?? null,
      cnae: detail.client.cnae ?? null,
      stateRegistration: detail.client.stateRegistration ?? null,
      businessActivity: detail.client.businessActivity ?? null,
      taxRegime: detail.client.taxRegime ?? null,
      address: detail.client.address ?? null,
      bankDetails: detail.client.bankDetails ?? null,
      modality: detail.client.modality ?? null,
      registrationDate: detail.client.registrationDate ?? null,
      paymentMethod: detail.client.paymentMethod ?? null,
      paymentTerm: detail.client.paymentTerm ?? null,
      contractValidity: detail.client.contractValidity ?? null,
      priceAdjustment: detail.client.priceAdjustment ?? null,
      invoiceContactName: detail.client.invoiceContactName ?? null,
      invoiceContactEmail: detail.client.invoiceContactEmail ?? null,
      invoiceContactPhone: detail.client.invoiceContactPhone ?? null,
      commercialTermsNotes: detail.client.commercialTermsNotes ?? null,
      source: 'CRM',
      notes: detail.client.notes ?? null,
      lastContactAt: detail.client.updatedAt,
      timeline: (detail.timeline ?? []).map((event) => mapTimelineEvent(detail.client.id, event)),
      opportunities: (detail.opportunities ?? []).map(mapOpportunity),
      documents: detail.client.documents ?? [],
      contacts: (detail.client.contacts ?? []).map(mapClientContact),
    });
  },

  updateClient: async (id: string, payload: {
    name?: string;
    email?: string;
    companyName?: string;
    legalName?: string;
    tradeName?: string;
    cnae?: string;
    stateRegistration?: string;
    businessActivity?: string;
    taxRegime?: string;
    address?: string;
    city?: string;
    bankDetails?: string;
    modality?: string;
    registrationDate?: string;
    paymentMethod?: string;
    paymentTerm?: string;
    contractValidity?: string;
    priceAdjustment?: string;
    invoiceContactName?: string;
    invoiceContactEmail?: string;
    invoiceContactPhone?: string;
    commercialTermsNotes?: string;
    document?: string;
    phone?: string;
    segment?: string;
    segmentoId?: string | null;
    segmentoAutomatico?: boolean;
    siteUrl?: string;
    notes?: string;
    status?: LeadStatus;
    internalOwnerId?: string;
    contacts?: Array<{
      name?: string;
      role?: string;
      cargo?: string;
      email?: string;
      phone?: string;
      telefone?: string;
      notes?: string;
      isPrimary?: boolean;
    }>;
  }) => {
    const { data } = await Api.patch<BackendClient>(`/clients/${id}`, normalizarNomesCadastro(payload));
    return data;
  },

  createClient: async (payload: {
    name?: string;
    companyName?: string;
    legalName?: string;
    tradeName?: string;
    cnae?: string;
    stateRegistration?: string;
    businessActivity?: string;
    taxRegime?: string;
    address?: string;
    city?: string;
    bankDetails?: string;
    modality?: string;
    registrationDate?: string;
    paymentMethod?: string;
    paymentTerm?: string;
    contractValidity?: string;
    priceAdjustment?: string;
    invoiceContactName?: string;
    invoiceContactEmail?: string;
    invoiceContactPhone?: string;
    commercialTermsNotes?: string;
    document?: string;
    phone?: string;
    segment?: string;
    segmentoId?: string | null;
    segmentoAutomatico?: boolean;
    siteUrl?: string;
    notes?: string;
    status?: LeadStatus;
    internalOwnerId?: string;
    contacts?: Array<{
      name?: string;
      role?: string;
      cargo?: string;
      email?: string;
      phone?: string;
      telefone?: string;
      notes?: string;
      isPrimary?: boolean;
    }>;
  }): Promise<CreatedClientResponse> => {
    const { data } = await Api.post<CreatedClientResponse>('/clients', normalizarNomesCadastro(payload));
    return data;
  },

  uploadClientDocument: async (clientId: string, file: File, description?: string): Promise<ClientDocument> => {
    const [document] = await CrmService.uploadClientDocuments(clientId, [file], description);
    if (!document) {
      throw new Error('Erro ao enviar documento do cliente.');
    }
    return document;
  },

  uploadClientDocuments: async (clientId: string, files: File[], description?: string): Promise<ClientDocument[]> => {
    const body = new FormData();
    files.forEach((file) => {
      body.append('file', file);
    });
    if (description?.trim()) {
      body.append('description', description.trim());
    }
    const response = await Api.post(`/clients/${clientId}/documents`, body);
    const data = response.data;
    return Array.isArray(data) ? data as ClientDocument[] : [data as ClientDocument];
  },

  addClientContact: async (clientId: string, payload: {
    nomeContato: string;
    cargo?: string;
    email?: string;
    telefone?: string;
    whatsapp?: string;
    linkedin?: string;
  }): Promise<ClientContact> => {
    const data = await Api.post<{
      contact?: ClientContact;
      contacts?: ClientContact[];
    }>(`/clients/${clientId}/contacts`, payload).then(({ data }) => data);
    const contact = data.contact ?? data.contacts?.at(-1);
    if (!contact) {
      throw new Error('Contato não foi retornado pelo servidor.');
    }
    return mapClientContact(contact, 0);
  },

  updateClientContactRecord: async (clientId: string, contactId: string, payload: {
    nomeContato: string;
    cargo?: string;
    email?: string;
    telefone?: string;
    whatsapp?: string;
    linkedin?: string;
    notes?: string;
  }): Promise<ClientContact> => {
    const data = await Api.patch<{
      contact?: ClientContact;
    }>(`/clients/${clientId}/contacts/${contactId}`, payload).then(({ data }) => data);
    if (!data.contact) {
      throw new Error('Contato não foi retornado pelo servidor.');
    }
    return mapClientContact(data.contact, 0);
  },

  deleteClientContact: async (clientId: string, contactId: string) => {
    const { data } = await Api.delete<{
      message: string;
    }>(`/clients/${clientId}/contacts/${contactId}`);
    return data;
  },

  enviarDocumentosPropostaOportunidade: async (clientId: string, files: File[], description?: string): Promise<ClientDocument[]> => {
    const validationError = validarDocumentosOportunidade(files);
    if (validationError)
      throw new Error(validationError);
    const body = new FormData();
    files.forEach((file) => {
      body.append('file', file);
    });
    if (description?.trim()) {
      body.append('description', description.trim());
    }
    body.append('category', 'OPORTUNIDADE_PROPOSTA');
    try {
      const { data } = await Api.post<ClientDocument | ClientDocument[]>(`/clients/${clientId}/documents`, body);
      return Array.isArray(data) ? data : [data];
    }
    catch (error) {
      if (error instanceof ApiError && error.status === 413)
        throw new Error(OPPORTUNITY_DOCUMENT_LIMIT_MESSAGE);
      throw error;
    }
  },

  excluirDocumentoPropostaOportunidade: async (clientId: string, documentId: string, justification = 'Exclusao de anexo da proposta.') => {
    const { data } = await Api.delete<{
      message: string;
    }>(`/clients/${clientId}/documents/${documentId}`, { data: { justification } });
    return data;
  },

  createTimelineContact: async (clientId: string, payload: {
    title?: string;
    description: string;
    contactChannel?: string;
    contactPerson?: string;
    contactedAt?: string;
  }): Promise<TimelineEvent> => {
    const event = await Api.post<BackendTimelineEvent>(`/clients/${clientId}/timeline`, payload).then(({ data }) => data);
    return mapTimelineEvent(clientId, event);
  },

  getCrmDashboardSummary: async (): Promise<CrmDashboardSummary> => {
    const { data } = await Api.get<CrmDashboardSummary>('/clients/dashboard/summary');
    return data;
  },

  getClientDeletionRequests: async (status?: ClientDeletionRequestStatus | 'TODOS') => {
    const query = status && status !== 'TODOS'
      ? `?status=${encodeURIComponent(status)}`
      : '';
    const { data } = await Api.get<ClientDeletionRequest[]>(`/clients/deletion-requests${query}`);
    return data;
  },

  requestClientDeletion: async (clientId: string, payload: {
    reason?: string;
  }) => {
    const { data } = await Api.post<ClientDeletionRequest>(`/clients/${clientId}/deletion-request`, payload);
    return data;
  },

  decideClientDeletionRequest: async (requestId: string, payload: {
    action: 'APPROVE' | 'REJECT';
    message?: string;
  }) => {
    const { data } = await Api.post<{
      message: string;
      request: ClientDeletionRequest;
    }>(`/clients/deletion-requests/${requestId}/decision`, payload);
    return data;
  },

  atualizarEtapaOportunidade: async (oportunidadeId: string, etapa: OpportunityStage, motivoPerda?: string, observacaoPerda?: string) => {
    if (etapa === 'PERDIDO')
      await MotivosPerdaService.validarDadosPerda(motivoPerda, observacaoPerda);
    const { data } = await Api.patch<Opportunity>(`/opportunities/${oportunidadeId}/stage`, { stage: etapa, motivoPerda, observacaoPerda });
    return data;
  },

  atualizarOportunidade: async (opportunityId: string, payload: {
    quoteId?: string | null;
    title?: string;
    value?: number | null;
    stage?: OpportunityStage;
    expectedCloseDate?: string | null;
    preContract?: boolean;
    preContractNotes?: string | null;
    lostReason?: string | null;
    motivoPerda?: string | null;
    observacaoPerda?: string | null;
  }) => {
    if (payload.stage === 'PERDIDO' || (payload.stage === undefined && (payload.motivoPerda !== undefined || payload.lostReason !== undefined)))
      await MotivosPerdaService.validarDadosPerda(payload.motivoPerda ?? payload.lostReason, payload.observacaoPerda);
    const { data } = await Api.patch<Opportunity>(`/opportunities/${opportunityId}`, payload);
    return data;
  },

  excluirOportunidade: async (opportunityId: string) => {
    const { data } = await Api.delete<{
      message: string;
    }>(`/opportunities/${opportunityId}`);
    return data;
  },

  criarOportunidade: async (payload: {
    clientId: string;
    quoteId?: string;
    title: string;
    value?: number;
    stage?: OpportunityStage;
    motivoPerda?: string;
    lostReason?: string;
    observacaoPerda?: string;
    expectedCloseDate?: string;
    preContract?: boolean;
    preContractNotes?: string;
  }) => {
    if (payload.stage === 'PERDIDO')
      await MotivosPerdaService.validarDadosPerda(payload.motivoPerda ?? payload.lostReason, payload.observacaoPerda);
    const { data } = await Api.post<Opportunity>('/opportunities', payload);
    return data;
  },

  formatLeadStatus: (status: LeadStatus) => {
    const labels: Record<LeadStatus, string> = {
      ATIVO: 'Ativo',
      PENDENTE: 'Pendente',
      INATIVO: 'Inativo',
    };
    return labels[status];
  },

  formatarEtapaOportunidade: (stage: OpportunityStage) => {
    const labels: Record<OpportunityStage, string> = {
      NOVO: 'Novo',
      QUALIFICADO: 'Qualificado',
      PROPOSTA: 'Proposta',
      NEGOCIACAO: 'Negociação',
      GANHO: 'Ganho',
      PERDIDO: 'Perdido',
    };
    return labels[stage];
  },

  getOpportunityStatusFromStage: (stage: OpportunityStage) => {
    if (stage === 'GANHO') {
      return 'WON';
    }
    if (stage === 'PERDIDO') {
      return 'LOST';
    }
    return 'OPEN';
  },

  formatOpportunityStatus: (status: OpportunityStatus): string => {
    return OPPORTUNITY_STATUS_LABELS[status];
  },

  // Status da proposta
  updateOpportunityStatus: async (clientId: string, opportunityId: string, status: OpportunityStatus, perda: {
    motivoPerda?: string;
    observacaoPerda?: string;
  } = {}) => {
    if (status === 'LOST')
      await MotivosPerdaService.validarDadosPerda(perda.motivoPerda, perda.observacaoPerda);
    const response = await Api.patch(`/clients/${clientId}/opportunities/${opportunityId}/status`, {
      status,
      motivoPerda: perda.motivoPerda,
      observacaoPerda: perda.observacaoPerda,
    }, {
      headers: {
        "Content-Type": "application/json",
      }
    });
    const data = response.data;
    return data;
  },
};
