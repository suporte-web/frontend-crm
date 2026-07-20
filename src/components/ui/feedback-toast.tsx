'use client';

import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import IconButton from '@mui/material/IconButton';
import Snackbar from '@mui/material/Snackbar';
import { X } from 'lucide-react';

type FeedbackToastVariant = 'success' | 'error' | 'warning' | 'info';

type FeedbackToastProps = {
  open: boolean;
  title: string;
  message: string;
  variant?: FeedbackToastVariant;
  onClose: () => void;
  bottomClassName?: string;
};

const severityByVariant: Record<
  FeedbackToastVariant,
  'success' | 'error' | 'warning' | 'info'
> = {
  success: 'success',
  error: 'error',
  warning: 'error',
  info: 'info',
};

const alertSxByVariant: Record<FeedbackToastVariant, object> = {
  success: {
    bgcolor: '#edf7ed',
    color: '#1e4620',
    '& .MuiAlert-icon': {
      color: '#2e7d32',
    },
  },
  error: {
    bgcolor: '#fdeded',
    color: '#5f2120',
    '& .MuiAlert-icon': {
      color: '#d32f2f',
    },
  },
  warning: {
    bgcolor: '#fdeded',
    color: '#5f2120',
    '& .MuiAlert-icon': {
      color: '#d32f2f',
    },
  },
  info: {
    bgcolor: '#e5f6fd',
    color: '#014361',
    '& .MuiAlert-icon': {
      color: '#0288d1',
    },
  },
};

function getBottomOffset(bottomClassName?: string) {
  if (bottomClassName?.includes('bottom-24')) {
    return 96;
  }

  return 24;
}

export function FeedbackToast({
  open,
  title,
  message,
  variant = 'success',
  onClose,
  bottomClassName = 'bottom-6',
}: FeedbackToastProps) {
  return (
    <Snackbar
      open={open}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      sx={{
        bottom: { xs: getBottomOffset(bottomClassName), sm: getBottomOffset(bottomClassName) },
        zIndex: 9999,
      }}
    >
      <Alert
        severity={severityByVariant[variant]}
        variant="standard"
        action={
          <IconButton
            type="button"
            aria-label="Fechar alerta"
            size="small"
            onClick={onClose}
            sx={{
              color: 'inherit',
            }}
          >
            <X size={17} />
          </IconButton>
        }
        sx={{
          minWidth: { xs: 'calc(100vw - 32px)', sm: 360 },
          maxWidth: '92vw',
          alignItems: 'center',
          borderRadius: '8px',
          boxShadow: 'none',
          px: 2,
          py: 1,
          ...alertSxByVariant[variant],
          '& .MuiAlert-message': {
            minWidth: 0,
            py: 0,
          },
          '& .MuiAlert-action': {
            alignItems: 'center',
            pt: 0,
          },
        }}
      >
        <AlertTitle
          sx={{
            mb: 0.25,
            fontSize: 14,
            fontWeight: 900,
            lineHeight: 1.25,
          }}
        >
          {title}
        </AlertTitle>
        {message}
      </Alert>
    </Snackbar>
  );
}
