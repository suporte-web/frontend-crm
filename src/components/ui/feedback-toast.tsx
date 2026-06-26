'use client';

import { AlertCircle, CheckCircle2, Info, TriangleAlert, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

type FeedbackToastVariant = 'success' | 'error' | 'warning' | 'info';

type FeedbackToastProps = {
  open: boolean;
  title: string;
  message: string;
  variant?: FeedbackToastVariant;
  onClose: () => void;
  bottomClassName?: string;
};

const toastConfig: Record<
  FeedbackToastVariant,
  {
    icon: typeof CheckCircle2;
    className: string;
  }
> = {
  success: {
    icon: CheckCircle2,
    className: 'feedback-toast-success',
  },
  info: {
    icon: Info,
    className: 'feedback-toast-info',
  },
  warning: {
    icon: TriangleAlert,
    className: 'feedback-toast-warning',
  },
  error: {
    icon: AlertCircle,
    className: 'feedback-toast-error',
  },
};

export function FeedbackToast({
  open,
  title,
  message,
  variant = 'success',
  onClose,
  bottomClassName = 'bottom-6',
}: FeedbackToastProps) {
  if (!open) return null;

  const { icon: Icon, className } = toastConfig[variant];

  return (
    <div
      className={`fixed left-1/2 z-[9999] w-fit -translate-x-1/2 animate-[fadeInUp_.25s_ease-out] ${bottomClassName}`}
    >
      <div
        className={`flex min-w-[340px] max-w-[92vw] items-center gap-3 rounded-lg border bg-white/95 px-5 py-4 shadow-lg backdrop-blur ${className}`}
      >
        <Icon className="h-5 w-5 shrink-0" />

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-5">{title}</p>
          <p className="text-sm leading-5 opacity-90">{message}</p>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onClose}
          className="shrink-0 rounded-full opacity-70 hover:bg-current/10 hover:opacity-100"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
