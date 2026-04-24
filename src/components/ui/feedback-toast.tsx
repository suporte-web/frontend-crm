'use client';

import { AlertCircle, CheckCircle2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

type FeedbackToastProps = {
  open: boolean;
  title: string;
  message: string;
  variant?: 'success' | 'error';
  onClose: () => void;
  bottomClassName?: string;
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

  const isSuccess = variant === 'success';
  const Icon = isSuccess ? CheckCircle2 : AlertCircle;
  const wrapClass = isSuccess
    ? 'border-emerald-200 bg-emerald-600 text-white'
    : 'border-rose-200 bg-rose-600 text-white';

  return (
    <div
      className={`fixed left-1/2 z-[9999] w-fit -translate-x-1/2 animate-[fadeInUp_.25s_ease-out] ${bottomClassName}`}
    >
      <div
        className={`flex min-w-[340px] max-w-[92vw] items-center gap-3 rounded-2xl border px-5 py-4 shadow-2xl ${wrapClass}`}
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
          <Icon className="h-5 w-5" />
        </div>

        <div className="flex-1">
          <p className="text-sm font-semibold">{title}</p>
          <p className="text-sm text-white/90">{message}</p>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onClose}
          className="rounded-full text-white/80 hover:bg-white/10 hover:text-white"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
