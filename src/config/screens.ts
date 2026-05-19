import type { UserRole } from '@/types/user';

export type ScreenKey =
  | 'dashboard'
  | 'bi'
  | 'entregas'
  | 'trackings'
  | 'quotes'
  | 'clients'
  | 'leads'
  | 'entradas'
  | 'tickets'
  | 'chat'
  | 'suppliers'
  | 'users'
  | 'marketing'
  | 'logs';

export type AppScreen = {
  key: ScreenKey;
  href: string;
  label: string;
  roles: UserRole[];
};

export const appScreens: AppScreen[] = [
  {
    key: 'dashboard',
    href: '/dashboard',
    label: 'Dashboard',
    roles: ['ADMIN', 'GESTAO', 'COMERCIAL', 'MARKETING', 'CLIENTE'],
  },
  {
    key: 'bi',
    href: '/bi',
    label: 'BI Comercial',
    roles: ['ADMIN', 'GESTAO', 'COMERCIAL'],
  },
  {
    key: 'entregas',
    href: '/entregas',
    label: 'Entregas',
    roles: ['ADMIN', 'GESTAO', 'COMERCIAL', 'MARKETING', 'CLIENTE'],
  },
  {
    key: 'trackings',
    href: '/trackings',
    label: 'Rastreamento',
    roles: ['ADMIN', 'GESTAO', 'COMERCIAL', 'MARKETING', 'CLIENTE'],
  },
  {
    key: 'quotes',
    href: '/quotes',
    label: 'Cotações',
    roles: ['ADMIN', 'GESTAO', 'COMERCIAL', 'CLIENTE'],
  },
  {
    key: 'clients',
    href: '/clients',
    label: 'Clientes',
    roles: ['ADMIN', 'GESTAO', 'COMERCIAL', 'MARKETING'],
  },
  {
    key: 'leads',
    href: '/leads',
    label: 'Leads',
    roles: ['ADMIN', 'GESTAO', 'COMERCIAL', 'MARKETING'],
  },
  {
    key: 'entradas',
    href: '/entradas',
    label: 'Central de Entradas',
    roles: ['ADMIN', 'GESTAO', 'COMERCIAL'],
  },
  {
    key: 'tickets',
    href: '/tickets',
    label: 'Tickets',
    roles: ['ADMIN', 'GESTAO', 'COMERCIAL', 'CLIENTE'],
  },
  {
    key: 'chat',
    href: '/chat',
    label: 'Chat',
    roles: ['ADMIN', 'GESTAO', 'COMERCIAL', 'MARKETING', 'CLIENTE'],
  },
  {
    key: 'suppliers',
    href: '/suppliers',
    label: 'Fornecedores',
    roles: ['ADMIN', 'GESTAO', 'COMERCIAL'],
  },
  {
    key: 'users',
    href: '/users',
    label: 'Usuários',
    roles: ['ADMIN', 'GESTAO'],
  },
  {
    key: 'marketing',
    href: '/marketing',
    label: 'Marketing',
    roles: ['ADMIN', 'GESTAO', 'MARKETING'],
  },
  {
    key: 'logs',
    href: '/logs',
    label: 'Logs',
    roles: ['ADMIN', 'GESTAO'],
  },
];

export function isScreenEnabledForRole(
  screen: AppScreen,
  role?: UserRole,
  permissions?: Array<{ screenKey: string; isEnabled: boolean }>,
) {
  if (!role) {
    return false;
  }

  const permission = permissions?.find((item) => item.screenKey === screen.key);

  return permission ? permission.isEnabled : screen.roles.includes(role);
}
