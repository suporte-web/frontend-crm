import { VisualizadorDocumento } from "@/components/anexos/VisualizadorDocumento";
import type { LeadAnexo } from "@/stores/lead-anexos/service";
export function LeadAttachmentPreview({ token, leadId, anexo, onClose }: {
 token: string; leadId: string; anexo: LeadAnexo | null; onClose: () => void;
}) {
 return <VisualizadorDocumento token={token} caminho={anexo ? `/leads/${leadId}/anexos/${anexo.id}` : ""} anexo={anexo} onClose={onClose} />;
}
