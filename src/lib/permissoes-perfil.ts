import {
  cadastroModalidadePermissionItems,
  isPermissionEnabledForRole,
  montarPermissoesPerfil,
  profilePermissionItems,
} from '@/config/screens';
import type { RoleScreenPermissionsGroup, UserRole } from '@/types/user';

export type PermissaoPerfil = { screenKey: string; screenLabel?: string | null; isEnabled: boolean };
export type ItemPermissaoPerfil = { key: string; label: string };
export type GrupoPermissoesPerfil = { id: string; nome: string; itens: ItemPermissaoPerfil[] };

const itensOriginais = [...profilePermissionItems, ...cadastroModalidadePermissionItems];
const categorias = [
  { id: 'comercial', nome: 'Comercial', chaves: ['cadastros', 'clients', 'leads', 'bi', 'opportunities', 'quotes', 'prospectingManagement', 'commercialBi'] },
  { id: 'operacional', nome: 'Operacional', chaves: ['entregas', 'entregas-por-placas', 'trackings', 'visitas'] },
  { id: 'atendimento', nome: 'Atendimento', chaves: ['atendimentoSac', 'entradas'] },
  { id: 'administracao', nome: 'Administração', chaves: ['users', 'profilePermissions', 'marketingIntegrations', 'logs', 'marketingMetrics'] },
  { id: 'site', nome: 'Site e Comunicação', chaves: ['siteInstitutional', 'siteRequests', 'marketing', 'informativo'] },
  { id: 'geral', nome: 'Geral', chaves: ['dashboard', 'acoesSac'] },
];

const permissoesRetiradas = new Set(['tickets', 'helpCenter', 'chat', 'suppliers', 'virtualAssistant']);

/** Conserva chaves da API, exceto funcionalidades retiradas do CRM. */
export function listarPermissoesPerfil(perfis: readonly RoleScreenPermissionsGroup[]): ItemPermissaoPerfil[] {
  const itens = new Map<string, ItemPermissaoPerfil>(itensOriginais.map(item => [item.key, { key: item.key, label: item.label }]));
  for (const perfil of perfis) for (const item of perfil.screens) {
    if (!permissoesRetiradas.has(item.screenKey) && !itens.has(item.screenKey)) itens.set(item.screenKey, { key: item.screenKey, label: item.screenLabel || item.screenKey });
  }
  return [...itens.values()];
}

export function agruparPermissoesPerfil(itens: readonly ItemPermissaoPerfil[]): GrupoPermissoesPerfil[] {
  const porChave = new Map(itens.map(item => [item.key, item]));
  const grupos = categorias.map(({ id, nome, chaves }) => ({ id, nome, itens: chaves.flatMap(chave => porChave.has(chave) ? [porChave.get(chave)!] : []) }));
  const conhecidas = new Set(categorias.flatMap(item => item.chaves));
  const restantes = itens.filter(item => !conhecidas.has(item.key));
  if (restantes.length) grupos.push({ id: 'outras', nome: 'Outras funcionalidades', itens: restantes });
  return grupos.filter(grupo => grupo.itens.length);
}

const normalizarBusca = (valor: string) => valor.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR').trim();
export function filtrarGruposPermissoes(grupos: readonly GrupoPermissoesPerfil[], busca: string, grupo: string) {
  const texto = normalizarBusca(busca);
  return grupos.filter(item => !grupo || item.id === grupo)
    .map(item => ({ ...item, itens: item.itens.filter(permissao => normalizarBusca(permissao.label).includes(texto)) }))
    .filter(item => item.itens.length);
}

export function permissoesEfetivasPerfil(base: readonly PermissaoPerfil[], rascunho: readonly PermissaoPerfil[]) {
  const valores = new Map(base.map(item => [item.screenKey, item]));
  for (const item of rascunho) valores.set(item.screenKey, { ...valores.get(item.screenKey), ...item });
  return [...valores.values()];
}

export function permissaoPerfilHabilitada(item: ItemPermissaoPerfil, perfil: UserRole, valores: readonly PermissaoPerfil[]) {
  const original = itensOriginais.find(permissao => permissao.key === item.key);
  return original ? isPermissionEnabledForRole(original, perfil, [...valores])
    : valores.find(permissao => permissao.screenKey === item.key)?.isEnabled ?? false;
}

export function permissaoObrigatoriaAdmin(perfil: UserRole, chave: string) {
  return perfil === 'ADMIN' && ['users', 'profilePermissions'].includes(chave);
}

/** Retorna somente alterações explícitas e efeitos do vínculo já existente de Cadastros. */
export function alternarPermissaoPerfil(perfil: UserRole, base: readonly PermissaoPerfil[], rascunho: readonly PermissaoPerfil[], chave: string, catalogo: readonly ItemPermissaoPerfil[]): PermissaoPerfil[] {
  const item = catalogo.find(valor => valor.key === chave);
  if (!item || permissaoObrigatoriaAdmin(perfil, chave)) return [...rascunho];
  const efetivas = permissoesEfetivasPerfil(base, rascunho);
  const cadastro = catalogo.find(valor => valor.key === 'cadastros');
  if (['clients', 'leads'].includes(chave) && cadastro && !permissaoPerfilHabilitada(cadastro, perfil, efetivas)) return [...rascunho];
  const original = itensOriginais.find(valor => valor.key === chave);
  const proximas = original ? montarPermissoesPerfil(perfil, efetivas, chave)
    : [{ screenKey: chave, screenLabel: item.label, isEnabled: !permissaoPerfilHabilitada(item, perfil, efetivas) }];
  const alteracoes = new Map(rascunho.map(valor => [valor.screenKey, valor]));
  for (const proxima of proximas) {
    // O restante do catálogo não é materializado nem enviado com valores padrão.
    if (proxima.screenKey !== chave && !(chave === 'cadastros' && ['clients', 'leads'].includes(proxima.screenKey))) continue;
    const atual = efetivas.find(valor => valor.screenKey === proxima.screenKey);
    const itemAtual = catalogo.find(valor => valor.key === proxima.screenKey)!;
    const valorAtual = atual?.isEnabled ?? permissaoPerfilHabilitada(itemAtual, perfil, efetivas);
    if (proxima.screenKey === chave || proxima.isEnabled !== valorAtual) alteracoes.set(proxima.screenKey, proxima);
  }
  return [...alteracoes.values()].filter(valor => {
    const salvo = base.find(atual => atual.screenKey === valor.screenKey);
    const itemSalvo = catalogo.find(atual => atual.key === valor.screenKey)!;
    return valor.isEnabled !== (salvo?.isEnabled ?? permissaoPerfilHabilitada(itemSalvo, perfil, base));
  });
}
