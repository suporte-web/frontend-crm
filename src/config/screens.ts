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
  | 'helpCenter'
  | 'chat'
  | 'suppliers'
  | 'users'
  | 'marketing'
  | 'logs';

export type ProfilePermissionKey = ScreenKey | 'virtualAssistant';

export type AppScreen = {
  key: ScreenKey;
  href: string;
  label: string;
  roles: UserRole[];
};

export type ProfilePermissionItem = {
  key: ProfilePermissionKey;
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
    key: 'helpCenter',
    href: '/help-center',
    label: 'Central de Ajuda',
    roles: ['ADMIN', 'GESTAO', 'COMERCIAL', 'MARKETING'],
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

export const profilePermissionItems: ProfilePermissionItem[] = [
  ...appScreens.map(({ key, label, roles }) => ({
    key,
    label,
    roles,
  })),
  {
    key: 'virtualAssistant',
    label: 'Assistente Virtual',
    roles: ['ADMIN', 'CLIENTE'],
  },
];

export const virtualAssistantPermission = profilePermissionItems.find(
  (item) => item.key === 'virtualAssistant',
)!;

export function isPermissionEnabledForRole(
  permissionItem: ProfilePermissionItem,
  role?: UserRole,
  permissions?: Array<{ screenKey: string; isEnabled: boolean }>,
) {
  if (!role) {
    return false;
  }

  const permission = permissions?.find(
    (item) => item.screenKey === permissionItem.key,
  );

  return permission ? permission.isEnabled : permissionItem.roles.includes(role);
}

export function isScreenEnabledForRole(
  screen: AppScreen,
  role?: UserRole,
  permissions?: Array<{ screenKey: string; isEnabled: boolean }>,
) {
  return isPermissionEnabledForRole(screen, role, permissions);
}
