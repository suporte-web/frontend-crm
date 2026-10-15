import type { SxProps, Theme } from "@mui/material/styles";

// Mesma superfície dos cards de Visitas.
export const cartaoCrmSx = {
  bgcolor: "background.paper", border: "1px solid", borderColor: "divider",
  borderRadius: 3, boxShadow: "none",
} satisfies SxProps<Theme>;
export const indicadorCrmSx = {
  ...cartaoCrmSx, p: 2, textAlign: "left", minWidth: 0,
} satisfies SxProps<Theme>;
