import { podeAcessarRota } from '@/config/screens';
import type { UserRole } from '@/types/auth';

/** Reutiliza as permissões reais do CRM, incluindo as rotas de detalhe. */
export function canAccessRoute(pathname: string, userRoles: string[] = []) {
  return podeAcessarRota(pathname, userRoles as UserRole[]);
}
