import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';
import Link from 'next/link';
import type { DashboardShortcut } from './dashboard-shortcuts';

export function DashboardShortcutCard({ shortcut }: { shortcut: DashboardShortcut }) {
  const Icon = shortcut.icone;
  return (
    <ButtonBase className="crm-cartao-atalho" component={Link} href={shortcut.href} focusRipple
      sx={{
        width: '100%', minWidth: 0, minHeight: 104, px: 1.5, py: 2,
        display: 'flex', flexDirection: 'column', gap: 1,
        color: '#334155', bgcolor: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px',
        cursor: 'pointer', textDecoration: 'none',
        boxShadow: 'none', transition: 'border-color 160ms ease, background-color 160ms ease',
        '&:hover': { borderColor: '#ff5805 !important', bgcolor: '#fffaf7 !important', boxShadow: 'none', transform: 'none' },
        '&.Mui-focusVisible': { outline: '3px solid #ff5805', outlineOffset: 3 },
        '@media (prefers-reduced-motion: reduce)': { transition: 'none', '&:hover': { transform: 'none' } },
      }}>
      <Box component="span" sx={{ width: 32, height: 32, display: 'grid', placeItems: 'center', borderRadius: '8px', bgcolor: '#fff4eb', color: '#ff5805', flexShrink: 0 }}>
        <Icon size={20} strokeWidth={1.8} aria-hidden="true" />
      </Box>
      <Typography component="span" sx={{ fontSize: 13, fontWeight: 500, lineHeight: 1.35, textAlign: 'center', maxWidth: '100%', overflowWrap: 'anywhere' }}>
        {shortcut.titulo}
      </Typography>
    </ButtonBase>
  );
}
