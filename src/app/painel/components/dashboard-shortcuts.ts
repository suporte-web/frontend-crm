import type { LucideIcon } from 'lucide-react';
import { screenIcons } from '@/components/layout/sidebar-config';
import { appScreens, isScreenEnabledForRole, type ScreenKey } from '@/config/screens';
import type { UserRole } from '@/types/user';

export const dashboardGroups = ['Começar', 'Relatórios', 'Marketing', 'Atendimento', 'Administração'] as const;
export type DashboardGroup = typeof dashboardGroups[number];

export type DashboardShortcut = {
  id: ScreenKey;
  titulo: string;
  href: string;
  icone: LucideIcon;
  grupo: DashboardGroup;
  roles: UserRole[];
};

const shortcutDefinitions: Array<{ id: ScreenKey; titulo?: string; grupo: DashboardGroup }> = [
  { id: 'leads', grupo: 'Começar' },
  { id: 'clients', grupo: 'Começar' },
  { id: 'quotes', grupo: 'Começar' },
  { id: 'trackings', titulo: 'Rastreamentos', grupo: 'Começar' },
  { id: 'siteRequests', titulo: 'Solicitações do Site', grupo: 'Começar' },
  { id: 'entregas', grupo: 'Começar' },
  { id: 'entradas', grupo: 'Começar' },
  { id: 'tickets', grupo: 'Começar' },
  { id: 'suppliers', grupo: 'Começar' },
  { id: 'bi', titulo: 'BI Comercial', grupo: 'Relatórios' },
  { id: 'marketingMetrics', titulo: 'Métricas', grupo: 'Marketing' },
  { id: 'entregas-por-placas', grupo: 'Relatórios' },
  { id: 'siteInstitutional', grupo: 'Marketing' },
  { id: 'marketing', grupo: 'Marketing' },
  { id: 'marketingIntegrations', grupo: 'Marketing' },
  { id: 'informativo', titulo: 'Informativo', grupo: 'Marketing' },
  { id: 'atendimentoSac', grupo: 'Atendimento' },
  { id: 'acoesSac', grupo: 'Atendimento' },
  { id: 'chat', grupo: 'Atendimento' },
  { id: 'helpCenter', grupo: 'Atendimento' },
  { id: 'users', grupo: 'Administração' },
  { id: 'logs', grupo: 'Administração' },
];

// Rotas, perfis e ícones vêm do cadastro já usado pelo CRM.
export const dashboardShortcuts: DashboardShortcut[] = shortcutDefinitions.flatMap(definition => {
  const screen = appScreens.find(item => item.key === definition.id);
  return screen ? [{
    id: definition.id,
    titulo: definition.titulo ?? screen.label,
    href: screen.href,
    icone: screenIcons[definition.id],
    grupo: definition.grupo,
    roles: screen.roles,
  }] : [];
});

export function getDashboardShortcuts(
  role?: UserRole | UserRole[],
  permissions?: Array<{ role?: UserRole; screenKey: string; isEnabled: boolean }>,
) {
  if (!role) return [];
  return dashboardShortcuts.filter(shortcut => {
    const screen = appScreens.find(item => item.key === shortcut.id)!;
    // A proteção atual escolhe a primeira rota correspondente, inclusive em subrotas.
    const protectedScreen = appScreens.find(item =>
      shortcut.href === item.href || shortcut.href.startsWith(`${item.href}/`),
    )!;
    return (Array.isArray(role) ? role : [role]).some(profile => shortcut.roles.includes(profile))
      && isScreenEnabledForRole(screen, role, permissions)
      && isScreenEnabledForRole(protectedScreen, role, permissions);
  });
}
