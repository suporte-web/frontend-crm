'use client';

import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'danger' | 'default';
  onCancel: () => void;
  onConfirm: () => void;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  tone = 'default',
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  if (!open) return null;

  const toneClasses =
    tone === 'danger'
      ? 'border-rose-100 bg-rose-50 text-rose-600'
      : 'border-blue-100 bg-blue-50 text-blue-600';

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[2px]">
      <div className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex items-start gap-4">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${toneClasses}`}
          >
            <AlertTriangle className="h-5 w-5" />
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-semibold text-slate-950">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onCancel}>
            {cancelLabel}
          </Button>

          <Button
            type="button"
            variant={tone === 'danger' ? 'destructive' : 'default'}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
