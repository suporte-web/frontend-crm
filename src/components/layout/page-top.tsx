"use client";

import { createContext, useContext, useMemo, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react';
import { createPortal } from 'react-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { acaoOportunidadeSx, acaoPrincipalOportunidadeSx, acaoSecundariaOportunidadeSx } from '@/components/crm/estilos-oportunidades';

type PageTopContextValue = {
  target: HTMLDivElement | null;
  setTarget: Dispatch<SetStateAction<HTMLDivElement | null>>;
  sidebarWidth: number;
  setSidebarWidth: Dispatch<SetStateAction<number>>;
};
const PageTopContext = createContext<PageTopContextValue | null>(null);

export function PageTopProvider({ children }: { children: ReactNode }) {
  const [target, setTarget] = useState<HTMLDivElement | null>(null);
  const [sidebarWidth, setSidebarWidth] = useState(264);
  const value = useMemo(() => ({ target, setTarget, sidebarWidth, setSidebarWidth }), [target, sidebarWidth]);
  return <PageTopContext.Provider value={value}>{children}</PageTopContext.Provider>;
}

export function usePageTop() { return useContext(PageTopContext); }

type PageTopContentProps = { title: ReactNode; description?: string; aside?: ReactNode };

export function PageTopHeading({ title }: PageTopContentProps) {
  return <Box data-page-top-content sx={{ minWidth: 0, width: '100%' }}>
    <Typography component="h1" sx={{ color: '#343434', fontSize: { xs: 21, md: 24 }, fontWeight: 700, lineHeight: 1.25, overflowWrap: 'anywhere' }}>{title}</Typography>
  </Box>;
}

/** O título fica no topo; as ações permanecem no conteúdo da página. */
export function PageTopContent({ title, aside }: PageTopContentProps) {
  const context = usePageTop();
  return <>
    {context?.target && createPortal(<PageTopHeading title={title} />, context.target)}
    {aside && <Box data-page-actions sx={{
      minWidth: 0, width: '100%', maxWidth: '100%',
      '& > *': { minWidth: 0, maxWidth: '100%' },
      '&& .MuiButton-root': acaoOportunidadeSx,
      '&& .MuiButton-contained:not(.Mui-disabled):not(.MuiButton-colorError)': acaoPrincipalOportunidadeSx,
      '&& .MuiButton-outlined': acaoSecundariaOportunidadeSx,
      '&& .MuiButton-root.Mui-disabled': { bgcolor: '#f1f5f9', color: '#94a3b8', borderColor: '#e2e8f0' },
      '& .MuiPaper-root, & > section': { bgcolor: 'transparent', boxShadow: 'none', border: 0, p: 0 },
      '& > .MuiStack-root': { justifyContent: 'flex-end', mb: '0 !important' },
      '& button:not(.MuiButton-root)': { minHeight: 40, borderRadius: '8px', bgcolor: '#fff', color: '#d94100', px: 2, fontSize: 13, fontWeight: 600 },
      '& [data-cabecalho-cadastros], & [data-acoes-cadastros]': { minWidth: 0, maxWidth: '100%' },
      '& [data-cabecalho-cadastros]': { justifyContent: 'flex-end' },
    }}>{aside}</Box>}
  </>;
}
