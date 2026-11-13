/** Notificações antigas continuam legíveis, sem abrir telas retiradas. */
export function normalizeNotificationLink(link?: string | null): string | undefined {
  if (!link || /^\/(tickets|chamados|chat|chats|central-ajuda|fornecedores)(?:[/?#]|$)/.test(link)) return undefined;
  if (link.startsWith('/clients/')) return link.replace(/^\/clients/, '/clientes');
  if (link === '/clients') return '/clientes';
  return link;
}
