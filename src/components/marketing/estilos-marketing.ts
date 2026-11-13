import type { SxProps, Theme } from '@mui/material/styles';
import { campoOportunidadeSx, acaoOportunidadeSx, acaoPrincipalOportunidadeSx, acaoSecundariaOportunidadeSx, superficieOportunidadeSx, formularioOportunidadeSx } from '@/components/crm/estilos-oportunidades';

export const superficieMarketingSx = superficieOportunidadeSx;
export const campoMarketingSx = campoOportunidadeSx;

/** As prévias mantêm a aparência do conteúdo que será exibido no portal. */
export const paginaMarketingSx = {
  gap: 2.2, minWidth: 0, color: '#1f2937',
  '& > *': { minWidth: 0, maxWidth: '100%' },
  '&& > .MuiPaper-root': { borderRadius: '12px', boxShadow: 'none' },
  '&& .MuiTextField-root:not([data-marketing-preview] *)': campoMarketingSx,
  '&& .MuiFormControl-root:not([data-marketing-preview] *)': campoMarketingSx,
  '&& .MuiButton-root:not([data-marketing-preview] *)': acaoOportunidadeSx,
  '&& .MuiButton-contained:not(.Mui-disabled):not(.MuiButton-colorError):not([data-marketing-preview] *)': acaoPrincipalOportunidadeSx,
  '&& .MuiButton-outlined:not([data-marketing-preview] *)': acaoSecundariaOportunidadeSx,
  '&& .MuiButton-root.Mui-disabled:not([data-marketing-preview] *)': { bgcolor: '#f8fafc', color: '#94a3b8', borderColor: '#e2e8f0' },
  '&& .MuiChip-root:not([data-marketing-preview] *)': { fontWeight: 500, borderRadius: '6px', maxWidth: '100%' },
  '& .MuiChip-label': { overflow: 'hidden', textOverflow: 'ellipsis' },
  '& .MuiAlert-root': { borderRadius: '8px', fontSize: 13 },
  '&& .crm-kpi-card': { minWidth: 0, minHeight: 104, p: 2, borderRadius: '12px', boxShadow: 'none' },
  '&& [data-cartao-valor]': { color: '#ff5805', fontSize: 28, fontWeight: 700, lineHeight: 1.25 },
  '&& [data-cartao-titulo]': { fontSize: 13, fontWeight: 500 },
  '& [data-cartao-icone]': { display: 'none' },
  '&& .MuiTableContainer-root': { minWidth: 0, maxWidth: '100%', borderRadius: '8px', boxShadow: 'none' },
  '&& .MuiTableCell-head': { bgcolor: '#f8fafc', color: '#475569', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', borderBottom: '1px solid #e2e8f0' },
  '&& .MuiTableCell-body': { fontSize: 13, verticalAlign: 'top', py: 1.5, borderBottom: '1px solid #f1f5f9' },
  '& .MuiPagination-ul': { flexWrap: 'wrap' },
  '&& .MuiTabs-root': { minHeight: 42, px: 0.75, py: 0.75, borderBottomColor: '#e2e8f0' },
  '&& .MuiTabs-indicator': { display: 'none' },
  '&& .MuiTabs-list': { gap: 0.5 },
  '&& .MuiTab-root': { minHeight: 42, px: 2, borderRadius: '8px', fontSize: 13, fontWeight: 600, color: '#64748b', textTransform: 'none' },
  '&& .MuiTab-root.Mui-selected': { bgcolor: '#ff5805', color: '#fff' },
  '&& .MuiTab-root.Mui-focusVisible': { outline: '2px solid #ff5805', outlineOffset: '-2px' },
} satisfies SxProps<Theme>;

export const dialogoMarketingSx = {
  ...formularioOportunidadeSx,
  '&& .MuiDialogTitle-root': { fontSize: 16, fontWeight: 600 },
  '&& .MuiButton-contained.MuiButton-colorError': { bgcolor: '#dc2626', color: '#fff', '&:hover': { bgcolor: '#b91c1c' } },
  '&& .MuiButton-root.Mui-disabled': { bgcolor: '#f8fafc', color: '#94a3b8', borderColor: '#e2e8f0' },
} satisfies SxProps<Theme>;
