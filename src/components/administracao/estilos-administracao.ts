import type { SxProps, Theme } from '@mui/material/styles';
import { campoOportunidadeSx, acaoOportunidadeSx, acaoPrincipalOportunidadeSx, acaoSecundariaOportunidadeSx, formularioOportunidadeSx } from '@/components/crm/estilos-oportunidades';

export const campoAdministracaoSx = campoOportunidadeSx;
export const paginaAdministracaoSx = {
  gap: 2.2, minWidth: 0, color: '#1f2937',
  '& > *': { minWidth: 0, maxWidth: '100%' },
  '&& .MuiPaper-root': { borderRadius: '12px', boxShadow: 'none' },
  '&& .MuiTextField-root': { ...campoAdministracaoSx, minWidth: undefined },
  '&& .MuiButton-root': acaoOportunidadeSx,
  '&& .MuiButton-contained:not(.Mui-disabled):not(.MuiButton-colorError)': acaoPrincipalOportunidadeSx,
  '&& .MuiButton-outlined': acaoSecundariaOportunidadeSx,
  '&& .MuiButton-root.Mui-disabled': { bgcolor: '#f8fafc', color: '#94a3b8', borderColor: '#e2e8f0' },
  '&& .MuiChip-root': { fontWeight: 500, borderRadius: '6px', maxWidth: '100%' },
  '& .MuiChip-label': { overflow: 'hidden', textOverflow: 'ellipsis' },
  '& .MuiAlert-root': { borderRadius: '8px', fontSize: 13 },
  '&& .crm-kpi-card': { minWidth: 0, minHeight: 104, p: 2, borderRadius: '12px', boxShadow: 'none' },
  '&& [data-cartao-valor]': { color: '#ff5805', fontSize: 28, fontWeight: 700, lineHeight: 1.25 },
  '&& [data-cartao-titulo]': { fontSize: 13, fontWeight: 500 },
  '& [data-cartao-icone]': { display: 'none' },
  '& .MuiPagination-ul': { flexWrap: 'wrap' },
} satisfies SxProps<Theme>;

export const dialogoAdministracaoSx = {
  ...formularioOportunidadeSx,
  '&& .MuiDialog-paper': { borderRadius: '12px', m: { xs: 1.5, sm: 4 }, width: { xs: 'calc(100% - 24px)', sm: '100%' } },
  '&& .MuiDialogTitle-root': { fontSize: 16, fontWeight: 600 },
  '&& .MuiDialogTitle-root h2': { fontSize: 17, fontWeight: 600 },
  '&& .MuiButton-contained.MuiButton-colorError': { bgcolor: '#dc2626', color: '#fff', '&:hover': { bgcolor: '#b91c1c' } },
  '&& .MuiButton-root.Mui-disabled': { bgcolor: '#f8fafc', color: '#94a3b8', borderColor: '#e2e8f0' },
} satisfies SxProps<Theme>;
