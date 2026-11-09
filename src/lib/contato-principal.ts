import type { ClientContact, LeadDetail } from '@/types/crm';

function emailVisivel(email?: string | null) {
  const valor = email?.trim() || '';
  return valor.toLowerCase().endsWith('@sem-acesso.pizzattolog.com') ? '' : valor;
}

function dataCriacao(contato: ClientContact) {
  const data = Date.parse(contato.createdAt || '');
  return Number.isFinite(data) ? data : Number.POSITIVE_INFINITY;
}

/** Mantém todos os dados do cabeçalho vinculados à mesma pessoa. */
export function obterContatoPrincipal(cadastro: Pick<LeadDetail, 'contacts' | 'email' | 'phone'>) {
  const contatos = cadastro.contacts ?? [];
  const marcados = contatos.filter(contato => contato.isPrimary);
  const candidatos = marcados.length ? marcados : contatos;
  const principal = candidatos.reduce<ClientContact | undefined>((atual, contato) =>
    !atual || dataCriacao(contato) < dataCriacao(atual) ? contato : atual,
  undefined);

  if (!principal) {
    return { nome: '', email: emailVisivel(cadastro.email), telefone: cadastro.phone?.trim() || '' };
  }

  return {
    nome: principal.name?.trim() || principal.nomeContato?.trim() || '',
    email: emailVisivel(principal.email),
    telefone: principal.phone?.trim() || principal.telefone?.trim() || '',
  };
}
