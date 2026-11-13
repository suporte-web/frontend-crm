import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { DashboardGroup, DashboardShortcut } from './dashboard-shortcuts';
import { DashboardShortcutCard } from './DashboardShortcutCard';

export function DashboardShortcutSection({ grupo, shortcuts }: { grupo: DashboardGroup; shortcuts: DashboardShortcut[] }) {
  if (shortcuts.length === 0) return null;
  const headingId = `dashboard-section-${shortcuts[0].id}`;
  return (
    <Box component="section" aria-labelledby={headingId} sx={{ minWidth: 0 }}>
      <Typography id={headingId} component="h2" sx={{ mb: 1.5, fontSize: 15, fontWeight: 600, color: '#343434' }}>{grupo}</Typography>
      <Box sx={{
        display: 'grid', gap: 1.5,
        gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', sm: 'repeat(3, minmax(0, 1fr))', lg: 'repeat(5, minmax(0, 1fr))', xl: 'repeat(6, minmax(0, 1fr))' },
      }}>
        {shortcuts.map(shortcut => <DashboardShortcutCard key={shortcut.id} shortcut={shortcut} />)}
      </Box>
    </Box>
  );
}
