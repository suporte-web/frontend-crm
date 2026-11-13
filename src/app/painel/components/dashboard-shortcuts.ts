import type { LucideIcon } from 'lucide-react';
import { screenIcons } from '@/components/layout/sidebar-config';
import { appScreens, podeAcessarRota, type ScreenKey } from '@/config/screens';
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

const shortcutDefinitions: Array<{ id: ScreenKey; grupo: DashboardGroup }> = [
  { id: 'cadastros', grupo: 'Começar' },
  { id: 'opportunities', grupo: 'Começar' },
  { id: 'quotes', grupo: 'Começar' },
  { id: 'trackings', grupo: 'Começar' },
  { id: 'siteRequests', grupo: 'Começar' },
  { id: 'entregas', grupo: 'Começar' },
  { id: 'entradas', grupo: 'Começar' },
  { id: 'bi', grupo: 'Relatórios' },
  { id: 'commercialBi', grupo: 'Relatórios' },
  { id: 'marketingMetrics', grupo: 'Marketing' },
  { id: 'entregas-por-placas', grupo: 'Relatórios' },
  { id: 'siteInstitutional', grupo: 'Marketing' },
  { id: 'marketing', grupo: 'Marketing' },
  { id: 'marketingIntegrations', grupo: 'Marketing' },
  { id: 'informativo', grupo: 'Marketing' },
  { id: 'atendimentoSac', grupo: 'Atendimento' },
  { id: 'acoesSac', grupo: 'Atendimento' },
  { id: 'users', grupo: 'Administração' },
  { id: 'logs', grupo: 'Administração' },
];

// Rotas, perfis e ícones vêm do cadastro já usado pelo CRM.
export const dashboardShortcuts: DashboardShortcut[] = shortcutDefinitions.flatMap(definition => {
  const screen = appScreens.find(item => item.key === definition.id);
  return screen ? [{
    id: definition.id,
    titulo: screen.label,
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
  return dashboardShortcuts.filter(shortcut => podeAcessarRota(shortcut.href, role, permissions));
}
