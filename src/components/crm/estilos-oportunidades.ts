import type { OpportunityStage, OpportunityStatus } from '@/types/crm';
import type { SxProps, Theme } from '@mui/material/styles';

export const campoOportunidadeSx = {
  minWidth: 0,
  '& .MuiOutlinedInput-root': {
    borderRadius: '8px', bgcolor: '#fff', fontSize: 13.5, fontWeight: 400,
    '& fieldset': { borderColor: '#cbd5e1' },
    '&:hover fieldset': { borderColor: '#94a3b8' },
    '&.Mui-focused': { boxShadow: 'none' },
    '&.Mui-focused fieldset': { borderColor: '#ff5805' },
  },
  '& .MuiOutlinedInput-root:not(.MuiInputBase-multiline)': { minHeight: 40, height: 40 },
  '& .MuiInputBase-input, & .MuiSelect-select': { fontSize: 13.5, fontWeight: 400 },
  '& .MuiInputLabel-root': { fontSize: 13, fontWeight: 400 },
  '& .MuiInputLabel-root.Mui-focused': { color: '#ff5805' },
  '& .MuiSelect-select': { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
} satisfies SxProps<Theme>;

export const acaoOportunidadeSx = {
  minHeight: 40, borderRadius: '8px', px: 1.75, fontSize: 13,
  fontWeight: 600, textTransform: 'none', whiteSpace: 'nowrap', boxShadow: 'none',
  '&:hover': { boxShadow: 'none' },
} satisfies SxProps<Theme>;

export const acaoPrincipalOportunidadeSx = {
  ...acaoOportunidadeSx, bgcolor: '#ff5805', color: '#fff',
  '&:hover': { bgcolor: '#e94f00', boxShadow: 'none' },
} satisfies SxProps<Theme>;

export const acaoSecundariaOportunidadeSx = {
  ...acaoOportunidadeSx, borderColor: '#cbd5e1', color: '#475569',
  '&:hover': { borderColor: '#94a3b8', bgcolor: '#f8fafc', boxShadow: 'none' },
} satisfies SxProps<Theme>;

export const superficieOportunidadeSx = {
  minWidth: 0, p: { xs: 2, md: 2.5 }, borderRadius: '12px',
  border: '1px solid #e2e8f0', bgcolor: '#fff', boxShadow: 'none',
} satisfies SxProps<Theme>;

/** Aplicado também aos diálogos, renderizados fora do contêiner da página. */
export const formularioOportunidadeSx = {
  '&& .MuiPaper-root': { borderRadius: '10px', bgcolor: '#fff', boxShadow: 'none' },
  '&& .MuiTextField-root .MuiOutlinedInput-root': { borderRadius: '8px', bgcolor: '#fff', fontWeight: 400 },
  '&& .MuiTextField-root .MuiOutlinedInput-root:not(.MuiInputBase-multiline)': { height: 40, minHeight: 40 },
  '&& .MuiTextField-root .MuiInputBase-input, && .MuiSelect-select': { fontSize: 13.5, fontWeight: 400 },
  '&& .MuiInputLabel-root': { fontSize: 13, fontWeight: 400 },
  '&& .MuiOutlinedInput-root.Mui-focused': { boxShadow: 'none' },
  '&& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: '#ff5805' },
  '&& .MuiButton-root': acaoOportunidadeSx,
  '&& .MuiButton-contained:not(.Mui-disabled)': acaoPrincipalOportunidadeSx,
  '&& .MuiButton-outlined': acaoSecundariaOportunidadeSx,
  '&& .MuiChip-root': { fontWeight: 500, borderRadius: '6px' },
} satisfies SxProps<Theme>;

/** Mesma identificação visual em listas, cadastro e detalhes. */
export const coresSituacaoOportunidade = {
  OPEN: { background: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
  WON: { background: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
  LOST: { background: '#fef2f2', color: '#b91c1c', border: '#fecaca' },
} satisfies Record<OpportunityStatus, { background: string; color: string; border: string }>;

export function marcadorSituacaoOportunidadeSx(situacao: OpportunityStatus) {
  const cores = coresSituacaoOportunidade[situacao];
  return { bgcolor: cores.background, color: cores.color, border: '1px solid ' + cores.border };
}

export function marcadorEtapaOportunidadeSx(etapa: OpportunityStage) {
  return marcadorSituacaoOportunidadeSx(etapa === 'GANHO' ? 'WON' : etapa === 'PERDIDO' ? 'LOST' : 'OPEN');
}
