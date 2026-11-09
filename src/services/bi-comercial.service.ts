import { appScreens, isScreenEnabledForRole } from '@/config/screens';
import { normalizarOportunidadesBi, type CadastroBi, type OportunidadeFonteBi } from '@/lib/bi-comercial';
import { apiFetch } from '@/services/api';
import { listarCadastros, obterDadosLead } from '@/services/cadastros.service';
import { getLeads } from '@/services/leads.service';
import type { AuthUser } from '@/types/auth';
import type { Lead } from '@/types/leads';

type UsuarioBi = Pick<AuthUser, 'role' | 'roles' | 'screenPermissions'>;
function permiteTela(usuario: UsuarioBi, chave: string) {
  const tela = appScreens.find(item => item.key === chave);
  return Boolean(tela && isScreenEnabledForRole(tela, usuario.roles?.length ? usuario.roles : usuario.role, usuario.screenPermissions));
}

/** Carrega apenas campos usados pelos indicadores, sem observações ou payloads livres. */
function dadosComerciais(lead: Lead, origem: NonNullable<CadastroBi['leadCadastro']>) {
  const metadata: Record<string, unknown> = {};
  for (const chave of ['nextAction', 'responsible', 'monthlyEstimatedValue', 'lastInteractionDate', 'currentStatus']) {
    if (lead.metadata && Object.prototype.hasOwnProperty.call(lead.metadata, chave)) metadata[chave] = lead.metadata[chave];
  }
  return {
    ...origem, id: lead.id, source: lead.source, status: lead.status,
    metadata, lastInteractionAt: lead.lastInteractionAt,
    convertidoParaCliente: lead.convertidoParaCliente,
  };
}

export async function carregarCadastrosBi(token: string, usuario: UsuarioBi) {
  const resposta = await listarCadastros(token);
  if (!Array.isArray(resposta)) throw new Error('Não foi possível carregar os cadastros do BI Comercial.');
  const cadastros: CadastroBi[] = Array.from(new Map(resposta.map(item => [item.id, item])).values());
  const leads = new Map<string, Lead>();
  if (cadastros.some(item => item.leadCadastro?.id) && permiteTela(usuario, 'leads')) {
    const lotes = await Promise.allSettled([
      getLeads(token, { convertidoParaCliente: false }),
      getLeads(token, { convertidoParaCliente: true }),
    ]);
    for (const lote of lotes) {
      if (lote.status === 'fulfilled' && Array.isArray(lote.value)) {
        for (const lead of lote.value) leads.set(lead.id, lead);
      }
    }
  }

  // Alternativa somente de leitura, limitada a quatro consultas simultâneas.
  // O endpoint do cadastro verifica a modalidade e a autoria antes de devolver o Lead.
  let proximo = 0;
  let indisponiveis = 0;
  async function carregarProximo() {
    while (proximo < cadastros.length) {
      const indice = proximo++;
      const cadastro = cadastros[indice];
      const origem = cadastro.leadCadastro;
      if (!origem?.id) {
        cadastros[indice] = { ...cadastro, dadosAcompanhamentoDisponiveis: true };
        continue;
      }
      try {
        const lead = leads.get(origem.id) ?? await obterDadosLead(cadastro.id, token);
        if (!lead || lead.id !== origem.id) throw new Error('Dados de acompanhamento indisponíveis.');
        cadastros[indice] = { ...cadastro, leadCadastro: dadosComerciais(lead, origem), dadosAcompanhamentoDisponiveis: true };
      } catch {
        indisponiveis++;
        cadastros[indice] = { ...cadastro, dadosAcompanhamentoDisponiveis: false };
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(4, cadastros.length) }, () => carregarProximo()));
  return {
    cadastros,
    avisos: indisponiveis ? [`O acompanhamento de ${indisponiveis} cadastro(s) está indisponível. Os indicadores dependentes desses dados estão parciais; nenhum contato foi presumido.`] : [],
  };
}

export async function carregarOportunidadesBi(token: string, usuario: UsuarioBi) {
  if (!permiteTela(usuario, 'opportunities')) throw new Error('Seu perfil não tem permissão para consultar oportunidades.');
  const resposta = await apiFetch<OportunidadeFonteBi[]>('/opportunities', {}, token);
  if (!Array.isArray(resposta)) throw new Error('Não foi possível carregar as oportunidades do BI Comercial.');
  return normalizarOportunidadesBi(resposta);
}
