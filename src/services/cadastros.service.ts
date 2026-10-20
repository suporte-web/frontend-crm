import type { LeadFunnelStage } from '@/constants/lead-funnel';
import { apiFetch } from './api';
import { mapClientSummary, type BackendClient } from './crm.service';
import type { createClient } from './crm.service';
import type { Lead, UpdateLeadPayload } from '@/types/leads';

export type DadosComerciaisCadastro = { fotoUrl?: string; proximaAcao?: string; responsavel?: string; volumeMensalEstimado?: string };

export type ModalidadeCadastro = 'CLIENTE' | 'LEAD';
export type Cadastro = BackendClient & { modalidadeCadastro: ModalidadeCadastro; leadCadastro?: { id: string; source: string; status: string; email?: string | null } | null };

export function listarCadastros(token: string) {
  return apiFetch<Cadastro[]>('/cadastros', {}, token);
}

export async function getCadastrosResumos(token: string, _consultora = false) {
  const [cadastros, responsaveis] = await Promise.all([listarCadastros(token), _consultora ? Promise.resolve([]) : apiFetch<Array<{ owner: { id: string; name: string } }>>('/clients/owners/summary', {}, token)]);
  const nomes = new Map<string, string>(responsaveis.map(item => [item.owner.id, item.owner.name]));
  return cadastros.map(cadastro => mapClientSummary(cadastro, nomes));
}

export function criarCadastro(payload: Parameters<typeof createClient>[0] & { etapaFunil?: LeadFunnelStage } & DadosComerciaisCadastro, token: string, modalidadeCadastro: ModalidadeCadastro) {
  return apiFetch<{ id: string; client?: { id: string }; clientProfile?: { id: string } }>('/cadastros', { method: 'POST', body: JSON.stringify({ ...payload, modalidadeCadastro }) }, token);
}

export function alterarModalidade(id: string, modalidadeCadastro: ModalidadeCadastro, document: string | undefined, token: string) {
  return apiFetch<Cadastro>(`/cadastros/${id}/modalidade`, { method: 'PATCH', body: JSON.stringify({ modalidadeCadastro, document }) }, token);
}

export function obterDadosLead(id: string, token: string) {
  return apiFetch<Lead | null>(`/cadastros/${id}/lead`, {}, token);
}

export function atualizarDadosLead(id: string, payload: UpdateLeadPayload, token: string) {
  return apiFetch<Lead>(`/cadastros/${id}/lead`, { method: 'PATCH', body: JSON.stringify(payload) }, token);
}

export function registrarObservacaoCadastro(id: string, content: string, token: string) {
  return apiFetch(`/cadastros/${id}/observacoes`, { method: 'POST', body: JSON.stringify({ content }) }, token);
}

export function atualizarEtapaCadastro(id: string, etapa: LeadFunnelStage, token: string, dados: DadosComerciaisCadastro = {}) {
  return apiFetch<Lead>(`/cadastros/${id}/etapa`, { method: 'PATCH', body: JSON.stringify({ etapa, ...dados }) }, token);
}

export function atualizarFotoCadastro(id: string, fotoUrl: string, token: string) {
  return apiFetch<{ fotoUrl: string }>(`/cadastros/${id}/foto`, { method: 'PATCH', body: JSON.stringify({ fotoUrl }) }, token);
}
