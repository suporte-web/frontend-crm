import { alpha } from "@mui/material/styles";
import type { SxProps, Theme } from "@mui/material/styles";

// Superfície padrão dos cards do CRM.
export const cartaoCrmSx = {
  position: "relative",
  overflow: "hidden",

  bgcolor: "background.paper",

  backgroundImage: (theme: Theme) =>
    `linear-gradient(
      145deg,
      ${theme.palette.background.paper} 0%,
      ${alpha(theme.palette.primary.main, 0.025)} 100%
    )`,

  border: "1px solid",
  borderColor: "divider",
  borderRadius: 3,

  boxShadow: (theme: Theme) =>
    `0 2px 4px ${alpha(theme.palette.common.black, 0.025)}, 0 10px 28px ${alpha(theme.palette.common.black, 0.035)}`,

  transition: `
    transform 0.25s ease,
    box-shadow 0.25s ease,
    border-color 0.25s ease
  `,

  "@media (hover: hover) and (pointer: fine)": {
    "&:hover": {
      transform: "translateY(-2px)",
      borderColor: (theme: Theme) =>
        alpha(theme.palette.primary.main, 0.35),
      boxShadow: (theme: Theme) =>
        `0 8px 24px ${alpha(theme.palette.common.black, 0.08)}`,
    },
  },

  "@media (prefers-reduced-motion: reduce)": {
    transition: "none",
    "&:hover": {
      transform: "none",
    },
  },
} satisfies SxProps<Theme>;

// Superfície dos cards de indicadores do CRM.
export const indicadorCrmSx = {
  ...cartaoCrmSx,

  p: { xs: 2, sm: 2.5 },
  textAlign: "left",
  minWidth: 0,
  height: "100%",
  boxSizing: "border-box",

  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  gap: 0.75,

  "&::before": {
    content: '""',
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 3,

    background: (theme: Theme) =>
      `linear-gradient(
        90deg,
        ${theme.palette.primary.main},
        ${alpha(theme.palette.primary.main, 0.15)}
      )`,

    opacity: 0.8,
    transition: "opacity 0.25s ease",
  },

  "&:hover::before": {
    opacity: 1,
  },
} satisfies SxProps<Theme>;
