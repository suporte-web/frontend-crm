import { Api } from '@/utils/Api';
import { normalizarNomesCadastro, normalizarEmpresaLead } from '@/lib/nome-cadastro';
import type { LeadFunnelStage } from '@/constants/lead-funnel';
import { CrmService, type BackendClient } from '@/stores/crm/service';

import type { Lead, UpdateLeadPayload } from '@/types/leads';
export type DadosComerciaisCadastro = {
  responsavelId?: string | null;
  fotoUrl?: string;
  proximaAcao?: string;
  responsavel?: string;
  volumeMensalEstimado?: string;
};
export type ModalidadeCadastro = 'CLIENTE' | 'LEAD';
export type Cadastro = BackendClient & {
  modalidadeCadastro: ModalidadeCadastro;
  etapaFunil?: LeadFunnelStage | null;
  metadata?: Record<string, unknown> | null;
  lastInteractionAt?: string | null;
  leadCadastro?: Pick<Lead, 'id' | 'source' | 'status'> & Partial<Lead> | null;
};

export type ResponsavelComercial = { id: string; name: string };

export const CadastrosService = {
  buscarCadastroDoLead: async (id: string) => {
    const { data } = await Api.get<{
      id: string;
    }>(`/cadastros/lead/${id}`);
    return data;
  },

  listarCadastros: () => {
    return Api.get<Cadastro[]>('/cadastros').then(({ data }) => data).then(registros => Array.isArray(registros) ? registros.map(registro => normalizarNomesCadastro(registro)) : registros);
  },

  getCadastrosResumos: async (_consultora = false) => {
    const [cadastros, responsaveis] = await Promise.all([CadastrosService.listarCadastros(), _consultora ? Promise.resolve([]) : Api.get<Array<{
        owner: {
          id: string;
          name: string;
        };
      }>>('/clients/owners/summary').then(({ data }) => data)]);
    const nomes = new Map<string, string>(responsaveis.map(item => [item.owner.id, item.owner.name]));
    return cadastros.map(cadastro => CrmService.mapClientSummary(cadastro, nomes));
  },

  criarCadastro: async (payload: Parameters<typeof CrmService.createClient>[0] & {
    etapaFunil?: LeadFunnelStage;
  } & DadosComerciaisCadastro, modalidadeCadastro: ModalidadeCadastro) => {
    const { data } = await Api.post<{
      id: string;
      client?: {
        id: string;
      };
      clientProfile?: {
        id: string;
      };
    }>('/cadastros', normalizarNomesCadastro({ ...payload, modalidadeCadastro }));
    return data;
  },

  alterarModalidade: async (id: string, modalidadeCadastro: ModalidadeCadastro, document: string | undefined) => {
    const { data } = await Api.patch<Cadastro>(`/cadastros/${id}/modalidade`, { modalidadeCadastro, document });
    return data;
  },

  obterDadosLead: (id: string) => {
    return Api.get<Lead | null>(`/cadastros/${id}/lead`).then(({ data }) => data).then(registro => registro ? normalizarEmpresaLead(registro) : registro);
  },

  atualizarDadosLead: (id: string, payload: UpdateLeadPayload) => {
    return Api.patch<Lead>(`/cadastros/${id}/lead`, normalizarEmpresaLead(payload)).then(({ data }) => data).then(normalizarEmpresaLead);
  },

  registrarObservacaoCadastro: async (id: string, content: string) => {
    const { data } = await Api.post(`/cadastros/${id}/observacoes`, { content });
    return data;
  },

  atualizarEtapaCadastro: (id: string, etapa: LeadFunnelStage, dados: DadosComerciaisCadastro = {}) => {
    return Api.patch<Lead>(`/cadastros/${id}/etapa`, { etapa, ...dados }).then(({ data }) => data).then(normalizarEmpresaLead);
  },

  atualizarFotoCadastro: async (id: string, fotoUrl: string) => {
    const { data } = await Api.patch<{
      fotoUrl: string;
    }>(`/cadastros/${id}/foto`, { fotoUrl });
    return data;
  },

  listarResponsaveisCadastro: async (): Promise<ResponsavelComercial[]> => {
    return (await Api.get<ResponsavelComercial[]>('/cadastros/responsaveis')).data;
  },
};
