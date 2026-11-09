import { appScreens, isScreenEnabledForRole } from '@/config/screens';
import type { AuthUser } from '@/types/auth';

type UsuarioEntrada = Pick<AuthUser, 'role' | 'roles' | 'screenPermissions' | 'mustChangePassword'>;

/** Prefere Início sem conceder acesso a telas bloqueadas para o perfil. */
export function getRotaInicial(user?: UsuarioEntrada | null): string {
  if (!user) return '/entrar';
  if (user.mustChangePassword) return '/alterar-senha';
  const perfis = user.roles?.length ? user.roles : user.role;
  const inicio = appScreens.find(screen => screen.key === 'dashboard');
  if (inicio && isScreenEnabledForRole(inicio, perfis, user.screenPermissions)) return inicio.href;
  return appScreens.find(screen => isScreenEnabledForRole(screen, perfis, user.screenPermissions))?.href ?? '/alterar-senha';
}
