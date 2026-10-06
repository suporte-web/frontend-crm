'use client';

import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import { AppLayout } from '@/components/layout/app-layout';
import { useAuth } from '@/context/auth-context';
import { dashboardGroups, getDashboardShortcuts } from './dashboard-shortcuts';
import { DashboardBanner } from './DashboardBanner';
import { DashboardShortcutSection } from './DashboardShortcutSection';

export default function DashboardPage() {
  const { user } = useAuth();
  const shortcuts = getDashboardShortcuts(user?.roles?.length ? user.roles : user?.role, user?.screenPermissions);

  return (
    <AppLayout>
      <Stack spacing={{ xs: 3.5, md: 4.5 }} sx={{ width: '100%', pb: 2 }}>
        <DashboardBanner />
        {dashboardGroups.map(grupo => (
          <DashboardShortcutSection key={grupo} grupo={grupo} shortcuts={shortcuts.filter(shortcut => shortcut.grupo === grupo)} />
        ))}
        {user && shortcuts.length === 0 ? <Alert severity="info">Nenhum atalho disponível para seu perfil.</Alert> : null}
      </Stack>
    </AppLayout>
  );
}
