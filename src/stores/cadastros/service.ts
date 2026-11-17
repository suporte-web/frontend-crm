import { Api } from '@/utils/Api';
import { normalizarNomesCadastro, normalizarEmpresaLead } from '@/lib/nome-cadastro';
import type { LeadFunnelStage } from '@/constants/lead-funnel';
export async function buscarCadastroDoLead(id: string, token: string) {
  const { data } = await Api.get<{
    id: string;
  }>(`/cadastros/lead/${id}`, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
  return data;
}
import { mapClientSummary, type BackendClient } from '@/stores/crm/service';
import type { createClient } from '@/stores/crm/service';
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
export function listarCadastros(token: string) {
  return Api.get<Cadastro[]>('/cadastros', { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } }).then(({ data }) => data).then(registros => Array.isArray(registros) ? registros.map(registro => normalizarNomesCadastro(registro)) : registros);
}
export async function getCadastrosResumos(token: string, _consultora = false) {
  const [cadastros, responsaveis] = await Promise.all([listarCadastros(token), _consultora ? Promise.resolve([]) : Api.get<Array<{
      owner: {
        id: string;
        name: string;
      };
    }>>('/clients/owners/summary', { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } }).then(({ data }) => data)]);
  const nomes = new Map<string, string>(responsaveis.map(item => [item.owner.id, item.owner.name]));
  return cadastros.map(cadastro => mapClientSummary(cadastro, nomes));
}
export async function criarCadastro(payload: Parameters<typeof createClient>[0] & {
  etapaFunil?: LeadFunnelStage;
} & DadosComerciaisCadastro, token: string, modalidadeCadastro: ModalidadeCadastro) {
  const { data } = await Api.post<{
    id: string;
    client?: {
      id: string;
    };
    clientProfile?: {
      id: string;
    };
  }>('/cadastros', normalizarNomesCadastro({ ...payload, modalidadeCadastro }), { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
  return data;
}
export async function alterarModalidade(id: string, modalidadeCadastro: ModalidadeCadastro, document: string | undefined, token: string) {
  const { data } = await Api.patch<Cadastro>(`/cadastros/${id}/modalidade`, { modalidadeCadastro, document }, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
  return data;
}
export function obterDadosLead(id: string, token: string) {
  return Api.get<Lead | null>(`/cadastros/${id}/lead`, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } }).then(({ data }) => data).then(registro => registro ? normalizarEmpresaLead(registro) : registro);
}
export function atualizarDadosLead(id: string, payload: UpdateLeadPayload, token: string) {
  return Api.patch<Lead>(`/cadastros/${id}/lead`, normalizarEmpresaLead(payload), { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } }).then(({ data }) => data).then(normalizarEmpresaLead);
}
export async function registrarObservacaoCadastro(id: string, content: string, token: string) {
  const { data } = await Api.post(`/cadastros/${id}/observacoes`, { content }, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
  return data;
}
export function atualizarEtapaCadastro(id: string, etapa: LeadFunnelStage, token: string, dados: DadosComerciaisCadastro = {}) {
  return Api.patch<Lead>(`/cadastros/${id}/etapa`, { etapa, ...dados }, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } }).then(({ data }) => data).then(normalizarEmpresaLead);
}
export async function atualizarFotoCadastro(id: string, fotoUrl: string, token: string) {
  const { data } = await Api.patch<{
    fotoUrl: string;
  }>(`/cadastros/${id}/foto`, { fotoUrl }, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
  return data;
}

export type ResponsavelComercial = { id: string; name: string };
export async function listarResponsaveisCadastro(): Promise<ResponsavelComercial[]> {
  return (await Api.get<ResponsavelComercial[]>('/cadastros/responsaveis')).data;
}
