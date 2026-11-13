"use client";

import { PageTopContent, usePageTop } from "@/components/layout/page-top";

import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { SxProps, Theme } from "@mui/material/styles";
import { campoOportunidadeSx, acaoPrincipalOportunidadeSx, acaoSecundariaOportunidadeSx, superficieOportunidadeSx } from "@/components/crm/estilos-oportunidades";

// Reutiliza os estilos do Comercial sem mudar seus componentes globais.
export const campoOperacaoSx = campoOportunidadeSx;
export const superficieOperacaoSx = superficieOportunidadeSx;
export const acaoPrincipalOperacaoSx = acaoPrincipalOportunidadeSx;
export const acaoSecundariaOperacaoSx = acaoSecundariaOportunidadeSx;

export const operacaoPageSx = {
  gap: 2.2, minWidth: 0, color: "#1f2937",
  "& > *": { minWidth: 0, maxWidth: "100%" },
  "& .MuiTableContainer-root": { maxWidth: "100%" },
  "& .MuiTableCell-root": { fontSize: 13 },
  "& .MuiTableCell-head": { whiteSpace: "nowrap" },
  "& .MuiTableCell-body .MuiTypography-root": { fontSize: 13 },
  "& .MuiChip-label": { overflow: "hidden", textOverflow: "ellipsis" },
  "& .MuiButton-root": { textTransform: "none", fontSize: 13, fontWeight: 600, boxShadow: "none", borderRadius: "8px" },
  "& .MuiButton-contained:not(.Mui-disabled)": acaoPrincipalOperacaoSx,
  "& .MuiButton-outlined": acaoSecundariaOperacaoSx,
  "& .MuiChip-root": { fontWeight: 500, borderRadius: "6px", maxWidth: "100%" },
  "& .crm-kpi-card": { height: "100%", borderRadius: "12px", p: 2 },
  "& [data-cartao-valor]": { fontSize: 28, fontWeight: 700 },
  "& [data-cartao-titulo]": { fontSize: 13 },
} satisfies SxProps<Theme>;

export function OperacaoPageHeader({ title, description, aside }: { title: string; description?: string; aside?: ReactNode }) {
  const pageTop = usePageTop();
  if (pageTop) return <PageTopContent title={title} description={description} aside={aside} />;
  return (
    <Paper elevation={0} sx={superficieOperacaoSx}>
      <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ alignItems: { md: "center" }, justifyContent: "space-between" }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography component="h1" sx={{ fontSize: { xs: 22, md: 24 }, fontWeight: 700, lineHeight: 1.3 }}>{title}</Typography>
          {description && <Typography sx={{ mt: 0.75, color: "#64748b", fontSize: 13 }}>{description}</Typography>}
        </Box>
        {aside && <Box sx={{ minWidth: 0, flexShrink: 0, width: { xs: "100%", md: "auto" } }}>{aside}</Box>}
      </Stack>
    </Paper>
  );
}
