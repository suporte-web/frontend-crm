'use client';

import { useEffect, useState } from 'react';
import { EVENTO_FEEDBACK_CRM, type FeedbackCrm } from '@/lib/feedback-crm';
import { FeedbackToast } from './feedback-toast';

export function GlobalFeedback() {
  const [fila, setFila] = useState<FeedbackCrm[]>([]);
  useEffect(() => {
    const receber = (evento: Event) => {
      const feedback = (evento as CustomEvent<FeedbackCrm>).detail;
      setFila(atual => [...atual, feedback]);
    };
    window.addEventListener(EVENTO_FEEDBACK_CRM, receber);
    return () => window.removeEventListener(EVENTO_FEEDBACK_CRM, receber);
  }, []);
  const atual = fila[0];
  if (!atual) return null;
  return <FeedbackToast key={atual.id} open title="" message={atual.message} variant={atual.variant} onClose={() => setFila(fila => fila.slice(1))} />;
}
