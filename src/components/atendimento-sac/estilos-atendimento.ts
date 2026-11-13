import type { SxProps, Theme } from '@mui/material/styles';
import {
  campoOportunidadeSx,
  acaoOportunidadeSx,
  acaoPrincipalOportunidadeSx,
  acaoSecundariaOportunidadeSx,
  superficieOportunidadeSx,
} from '@/components/crm/estilos-oportunidades';

export const superficieAtendimentoSx = superficieOportunidadeSx;
export const campoAtendimentoSx = campoOportunidadeSx;
export const acaoPrincipalAtendimentoSx = acaoPrincipalOportunidadeSx;
export const acaoSecundariaAtendimentoSx = acaoSecundariaOportunidadeSx;

export const camposAtendimentoSx = {
  display: 'grid', minWidth: 0,
  gridTemplateColumns: { xs: 'minmax(0, 1fr)', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(3, minmax(0, 1fr))' },
  gap: 1.5, alignItems: 'start',
} satisfies SxProps<Theme>;

export const abasAtendimentoSx = {
  minHeight: 42,
  '& .MuiTabs-indicator': { display: 'none' },
  '& .MuiTabs-list': { gap: 0.5 },
  '& .MuiTab-root': { minHeight: 42, borderRadius: '8px', textTransform: 'none', fontSize: 13, fontWeight: 600, px: 2, color: '#64748b' },
  '& .MuiTab-root:hover': { bgcolor: '#fff4eb', color: '#e94f00' },
  '& .MuiTab-root.Mui-selected': { bgcolor: '#ff5805', color: '#fff' },
  '& .MuiTab-root.Mui-focusVisible': { outline: '2px solid #ff5805', outlineOffset: '-2px' },
} satisfies SxProps<Theme>;

export const paginaAtendimentoSx = {
  gap: 2.2, minWidth: 0, color: '#1f2937',
  '& > *': { minWidth: 0, maxWidth: '100%' },
  '&& .MuiTextField-root': campoAtendimentoSx,
  '&& .MuiButton-root': acaoOportunidadeSx,
  '&& .MuiButton-contained:not(.Mui-disabled)': acaoPrincipalAtendimentoSx,
  '&& .MuiButton-outlined': acaoSecundariaAtendimentoSx,
  '&& .MuiButton-root.Mui-disabled': { bgcolor: '#f8fafc', color: '#94a3b8', borderColor: '#e2e8f0' },
  '& .MuiChip-root': { maxWidth: '100%', borderRadius: '6px', fontWeight: 500 },
  '& .MuiChip-label': { overflow: 'hidden', textOverflow: 'ellipsis' },
  '& .MuiAlert-root': { borderRadius: '8px', fontSize: 13 },
  '& .MuiTableContainer-root': { minWidth: 0, maxWidth: '100%', border: '1px solid #e2e8f0', borderRadius: '8px' },
  '& .MuiTableCell-head': { bgcolor: '#f8fafc', color: '#475569', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', borderBottom: '1px solid #e2e8f0' },
  '& .MuiTableCell-body': { fontSize: 13, verticalAlign: 'top', py: 1.5, borderBottom: '1px solid #f1f5f9' },
  '& .MuiTableCell-body .MuiTypography-root': { fontSize: 13 },
  '& .MuiTableRow-root:hover .MuiTableCell-body': { bgcolor: '#fffaf5' },
  '& .MuiPagination-ul': { flexWrap: 'wrap' },
  '& [data-tarefa-sac]': { minWidth: 0, py: 1.75, borderBottom: '1px solid #e2e8f0', '&:last-child': { borderBottom: 0 }, '& .MuiTypography-root': { fontSize: 13, overflowWrap: 'anywhere' }, '& > .MuiStack-root': { minWidth: 0, gap: 0.75 } },
} satisfies SxProps<Theme>;
