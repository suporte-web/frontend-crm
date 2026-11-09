export type TipoFeedbackCrm = 'success' | 'error' | 'warning' | 'info';
export type FeedbackCrm = { id: number; message: string; variant: TipoFeedbackCrm };
export const EVENTO_FEEDBACK_CRM = 'crm:feedback';
let sequencia = 0;

/** Confirma uma operação concluída; o aviso permanece visível ao navegar entre telas. */
export function notificarCrm(message: string, variant: TipoFeedbackCrm = 'success') {
  if (typeof window === 'undefined' || !message.trim()) return;
  window.dispatchEvent(new CustomEvent<FeedbackCrm>(EVENTO_FEEDBACK_CRM, { detail: { id: ++sequencia, message, variant } }));
}
