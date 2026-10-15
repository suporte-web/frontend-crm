export function getUserRoles<T extends string>(user: { role?: T; roles?: T[] } | null | undefined): T[] {
  return user?.roles?.length ? user.roles : user?.role ? [user.role] : [];
}
export function hasAnyRole(user: { role?: string; roles?: string[] } | null | undefined, allowed: readonly string[]): boolean {
  return getUserRoles(user).some((role) => allowed.includes(role));
}

export function canUseInternalChat(user: { role?: string; roles?: string[] } | null | undefined): boolean {
  return hasAnyRole(user, ['ADMIN', 'GESTAO', 'COMERCIAL', 'MARKETING']);
}

export function selecionarPerfis(atuais: string[], proximos: string[]): string[] {
  if (proximos.includes('CONSULTORA') && !atuais.includes('CONSULTORA')) return ['CONSULTORA'];
  return proximos.filter(perfil => perfil !== 'CONSULTORA');
}
export function validarPerfis(perfis: string[]): boolean {
  return perfis.length > 0 && (!perfis.includes('CONSULTORA') || perfis.length === 1);
}
