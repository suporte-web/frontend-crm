import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';
import Link from 'next/link';
import type { DashboardShortcut } from './dashboard-shortcuts';

export function DashboardShortcutCard({ shortcut }: { shortcut: DashboardShortcut }) {
  const Icon = shortcut.icone;
  return (
    <ButtonBase component={Link} href={shortcut.href} focusRipple
      sx={{
        width: '100%', minWidth: 0, minHeight: 112, px: 1.5, py: 2,
        display: 'flex', flexDirection: 'column', gap: 1.5,
        color: '#111827', bgcolor: '#fff', border: '1px solid #e5e7eb', borderRadius: '14px',
        cursor: 'pointer', textDecoration: 'none',
        transition: 'border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease',
        '&:hover': { borderColor: '#fdba74', boxShadow: '0 8px 22px rgba(15,23,42,0.06)', transform: 'translateY(-2px)' },
        '&.Mui-focusVisible': { outline: '3px solid #ff5805', outlineOffset: 3 },
        '@media (prefers-reduced-motion: reduce)': { transition: 'none', '&:hover': { transform: 'none' } },
      }}>
      <Icon size={28} strokeWidth={1.8} aria-hidden="true" />
      <Typography component="span" sx={{ fontSize: 13, fontWeight: 650, lineHeight: 1.35, textAlign: 'center', maxWidth: 145 }}>
        {shortcut.titulo}
      </Typography>
    </ButtonBase>
  );
}
