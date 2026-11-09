'use client';

import Alert from '@mui/material/Alert';
import IconButton from '@mui/material/IconButton';
import Portal from '@mui/material/Portal';
import Snackbar from '@mui/material/Snackbar';
import { X } from 'lucide-react';

export type FeedbackToastVariant = 'success' | 'error' | 'warning' | 'info';

type FeedbackToastProps = {
  open: boolean;
  title: string;
  message: string;
  variant?: FeedbackToastVariant;
  onClose: () => void;
  bottomClassName?: string;
};

const cores: Record<FeedbackToastVariant, string> = {
  success: '#2e7d32',
  error: '#d32f2f',
  warning: '#ed6c02',
  info: '#0288d1',
};

export function FeedbackToast({ open, title, message, variant = 'success', onClose, bottomClassName }: FeedbackToastProps) {
  const deslocamento = bottomClassName?.includes('bottom-24') ? 96 : 24;
  return (
    <Portal>
      <Snackbar
        key={`${variant}:${title}:${message}`}
        open={open}
        autoHideDuration={5000}
        onClose={(_event, reason) => { if (reason !== 'clickaway') onClose(); }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        sx={{ bottom: { xs: 16, sm: deslocamento }, right: { xs: 16, sm: 24 }, left: 'auto', maxWidth: 'calc(100vw - 32px)', zIndex: 9999 }}
      >
        <Alert
          severity={variant}
          variant="filled"
          aria-label={title || undefined}
          action={<IconButton type="button" aria-label="Fechar alerta" size="small" onClick={onClose} sx={{ color: 'inherit' }}><X size={18} /></IconButton>}
          sx={{
            boxSizing: 'border-box', width: { xs: 'calc(100vw - 32px)', sm: 'auto' }, minWidth: { sm: 320 }, maxWidth: { xs: '100%', sm: 480 },
            bgcolor: cores[variant], color: '#fff', alignItems: 'center', border: 0, borderRadius: '10px',
            boxShadow: '0 12px 30px rgba(15, 23, 42, 0.18)', px: 2, py: 1.25, fontSize: 14, fontWeight: 700,
            '& .MuiAlert-icon': { color: 'inherit' },
            '& .MuiAlert-message': { minWidth: 0, py: 0, overflowWrap: 'anywhere', whiteSpace: 'pre-line' },
            '& .MuiAlert-action': { alignItems: 'center', pt: 0, pl: 1.5 },
          }}
        >
          {message || title}
        </Alert>
      </Snackbar>
    </Portal>
  );
}
