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
  | 'marketingIntegrations'
  | 'siteRequests'
  | 'siteInstitutional'
  | 'logs'
  | 'entregas-por-placas';

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
    href: '/painel',
    label: 'Dashboard',
    roles: ['ADMIN', 'GESTAO', 'COMERCIAL', 'MARKETING', 'CLIENTE'],
  },
  {
    key: 'bi',
    href: '/bi',
    label: 'Funil de Vendas',
    roles: ['ADMIN', 'GESTAO', 'COMERCIAL'],
  },
  {
    key: 'entregas',
    href: '/entregas',
    label: 'Entregas',
    roles: ['ADMIN', 'GESTAO', 'COMERCIAL', 'OPERACAO', 'MARKETING', 'CLIENTE'],


  },
  {
    key: 'trackings',
    href: '/rastreamentos',
    label: 'Rastreamento',
    roles: ['ADMIN', 'GESTAO', 'COMERCIAL', 'OPERACAO','CLIENTE'],
  },

    {

      key: 'entregas-por-placas',
      href: '/entregas-por-placas',
      label: 'Entregas por Placas',
      roles: ['ADMIN', 'GESTAO', 'COMERCIAL', 'OPERACAO','CLIENTE'],

    },

  {
    key: 'quotes',
    href: '/cotacoes',
    label: 'Cotações',
    roles: ['ADMIN', 'GESTAO', 'COMERCIAL', 'CLIENTE'],
  },
  {
    key: 'clients',
    href: '/clientes',
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
    href: '/chamados',
    label: 'Chamados',
    roles: ['ADMIN', 'GESTAO', 'COMERCIAL', 'CLIENTE'],
  },
  {
    key: 'helpCenter',
    href: '/central-ajuda',
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
    href: '/fornecedores',
    label: 'Fornecedores',
    roles: ['ADMIN', 'GESTAO', 'COMERCIAL'],
  },
  {
    key: 'users',
    href: '/usuarios',
    label: 'Usuários',
    roles: ['ADMIN', 'GESTAO'],
  },
  {
    key: 'marketing',
    href: '/marketing',
    label: 'Criação de conteúdo',
    roles: ['ADMIN', 'GESTAO', 'MARKETING'],
  },
  {
    key: 'marketingIntegrations',
    href: '/marketing/integracoes',
    label: 'Integrações',
    roles: ['ADMIN', 'MARKETING'],
  },
{
  key: 'siteInstitutional',
  href: '/site-institucional',
  label: 'Site Institucional',
  roles: ['ADMIN', 'MARKETING'],
},

  {
    key: 'siteRequests',
    href: '/solicitacoes-site',
    label: 'Fila do site',
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
