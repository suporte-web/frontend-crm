import { alpha, Avatar, Box, Paper, Stack, Typography } from "@mui/material";
import { cartaoCrmSx, indicadorCrmSx } from "./estilos-cartoes-crm";
import type { SxProps, Theme } from "@mui/material/styles";
import type { ReactNode } from "react";

// ======================================================
// PALETA DE CORES
// ======================================================

export const crmPalette = {
  text: "#343434",
  muted: "#64748b",
  border: "#e2e8f0",
  orange: "#ff4d00",
  orangeDark: "#ec3f12",
  yellow: "#fab519",
  surface: "#ffffff",
  page: "#fbf7ef",
  green: "#1f8f46",
  red: "#dc2626",
  blue: "#1f76c9",
};

export const crmPaperSx: SxProps<Theme> = cartaoCrmSx;

// ======================================================
// UTILITÁRIOS
// ======================================================

function mergeSx(base: SxProps<Theme>, sx?: SxProps<Theme>): SxProps<Theme> {
  if (!sx) return base;

  return [
    ...(Array.isArray(base) ? base : [base]),
    ...(Array.isArray(sx) ? sx : [sx]),
  ] as SxProps<Theme>;
}

// ======================================================
// CONTAINER PRINCIPAL
// ======================================================

type CrmPageShellProps = {
  children: ReactNode;
  sx?: SxProps<Theme>;
};

export function CrmPageShell({ children, sx }: CrmPageShellProps) {
  return (
    <Box
      sx={mergeSx(
        {
          mx: "auto",
          width: "100%",
          maxWidth: 1680,
          minWidth: 0,

          display: "flex",
          flexDirection: "column",

          gap: {
            xs: 2,
            sm: 2.5,
            lg: 3,
          },

          pb: 3,
          boxSizing: "border-box",
        },
        sx,
      )}
    >
      {children}
    </Box>
  );
}

// ======================================================
// SEÇÃO PADRÃO
// ======================================================

type CrmSectionProps = {
  "data-cartao-grupo"?: boolean;
  className?: string;
  children: ReactNode;
  sx?: SxProps<Theme>;
};

export function CrmSection({
  children,
  sx,
  className,
  "data-cartao-grupo": grupoIndicador,
}: CrmSectionProps) {
  return (
    <Paper
      data-crm-primitive="section"
      className={className}
      data-cartao-grupo={grupoIndicador}
      elevation={0}
      sx={mergeSx(
        {
          ...cartaoCrmSx,

          position: "relative",
          minWidth: 0,
          maxWidth: "100%",
          overflow: "hidden",

          bgcolor: "background.paper",
          borderRadius: { xs: 3, md: 3.5 },

          // Seções grandes não precisam se movimentar.
          "&:hover": {
            transform: "none",
            borderColor: "divider",
          },
        },
        sx,
      )}
    >
      {children}
    </Paper>
  );
}

// ======================================================
// CABEÇALHO DAS PÁGINAS
// ======================================================

type CrmPageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  icon: ReactNode;
  aside?: ReactNode;
};

export function CrmPageHeader({
  eyebrow,
  title,
  description,
  icon,
  aside,
}: CrmPageHeaderProps) {
  return (
    <CrmSection
      sx={{
        p: { xs: 2.5, sm: 3, md: 3.5 },
        borderColor: alpha(crmPalette.orange, 0.16),

        isolation: "isolate",

        backgroundImage: (theme: Theme) =>
          `linear-gradient(
            115deg,
            ${theme.palette.background.paper} 45%,
            ${alpha(crmPalette.orange, 0.045)} 100%
          )`,

        // Faixa superior de identidade visual.
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 4,

          background: `linear-gradient(
            90deg,
            ${crmPalette.orange} 0%,
            ${crmPalette.yellow} 55%,
            transparent 100%
          )`,

          pointerEvents: "none",
        },

        // Elemento decorativo no fundo.
        "&::after": {
          content: '""',
          position: "absolute",
          width: 280,
          height: 280,
          right: -100,
          top: -150,
          borderRadius: "50%",
          bgcolor: alpha(crmPalette.orange, 0.035),
          pointerEvents: "none",
          zIndex: -1,
        },
      }}
    >
      <Stack
        direction={{ xs: "column", lg: "row" }}
        spacing={3}
        sx={{
          position: "relative",
          alignItems: {
            xs: "flex-start",
            lg: "center",
          },
          justifyContent: "space-between",
        }}
      >
        <Stack
          direction="row"
          spacing={{ xs: 1.5, md: 2.5 }}
          sx={{
            alignItems: "center",
            minWidth: 0,
            flex: 1,
          }}
        >
          <Avatar
            variant="rounded"
            sx={{
              width: { xs: 46, md: 60 },
              height: { xs: 46, md: 60 },

              flexShrink: 0,

              bgcolor: alpha(crmPalette.orange, 0.09),
              color: crmPalette.orange,

              backgroundImage: `linear-gradient(
                145deg,
                ${alpha(crmPalette.orange, 0.06)},
                ${alpha(crmPalette.orange, 0.14)}
              )`,

              border: "1px solid",
              borderColor: alpha(crmPalette.orange, 0.18),
              borderRadius: { xs: 3, md: 4 },

              boxShadow: `0 6px 20px ${alpha(crmPalette.orange, 0.12)}`,

              "& .MuiSvgIcon-root": {
                fontSize: { xs: 26, md: 34 },
              },
            }}
          >
            {icon}
          </Avatar>

          <Box sx={{ minWidth: 0 }}>
            {eyebrow && (
              <Stack
                direction="row"
                spacing={0.75}
                sx={{ mb: 0.75, alignItems: "center" }}
              >
                <Box
                  sx={{
                    width: 7,
                    height: 7,
                    flexShrink: 0,
                    borderRadius: "50%",
                    bgcolor: crmPalette.orange,

                    boxShadow: `0 0 0 3px ${alpha(crmPalette.orange, 0.12)}`,
                  }}
                />

                <Typography
                  component="p"
                  sx={{
                    color: crmPalette.orangeDark,
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: ".13em",
                    textTransform: "uppercase",
                  }}
                >
                  {eyebrow}
                </Typography>
              </Stack>
            )}

            <Typography
              component="h1"
              sx={{
                color: "text.primary",

                fontSize: {
                  xs: 24,
                  sm: 30,
                  md: 32,
                },

                fontWeight: 750,
                lineHeight: 1.2,
                letterSpacing: "-0.035em",
                overflowWrap: "anywhere",
              }}
            >
              {title}
            </Typography>

            {description && (
              <Typography
                sx={{
                  mt: 1,
                  color: "text.secondary",
                  fontSize: { xs: 13, md: 14 },
                  lineHeight: 1.65,
                  maxWidth: 800,
                }}
              >
                {description}
              </Typography>
            )}
          </Box>
        </Stack>

        {aside && (
          <Box
            sx={{
              width: { xs: "100%", lg: "auto" },
              flexShrink: 0,

              display: "flex",
              alignItems: "center",
              minWidth: 0,
              flexWrap: "wrap",
              gap: 1,
              "& > .MuiStack-root": {
                flexWrap: "wrap",
                rowGap: 1,
                maxWidth: "100%",
              },

              justifyContent: {
                xs: "flex-start",
                lg: "flex-end",
              },

              "& .MuiButton-root": {
                borderRadius: 2.5,
                textTransform: "none",
                fontWeight: 700,
                minHeight: 42,
              },
            }}
          >
            {aside}
          </Box>
        )}
      </Stack>
    </CrmSection>
  );
}

// ======================================================
// CARD DE INDICADORES
// ======================================================

type CrmKpiCardProps = {
  title: string;
  value: ReactNode;
  caption?: ReactNode;
  icon: ReactNode;
  accent?: string;
  softColor?: string;
  active?: boolean;
  hideAccentBar?: boolean;
  onClick?: () => void;
  ariaLabel?: string;
  ariaPressed?: boolean;
  sx?: SxProps<Theme>;
};

export function CrmKpiCard({
  title,
  value,
  caption,
  icon,
  accent = crmPalette.orange,
  softColor,
  active = false,
  hideAccentBar = false,
  onClick,
  ariaLabel,
  ariaPressed,
  sx,
}: CrmKpiCardProps) {
  const backgroundSoft = softColor ?? alpha(accent, 0.08);

  const card = (
    <Paper
      className="crm-kpi-card"
      data-crm-primitive="kpi"
      elevation={0}
      data-cartao-ativo={!!active}
      data-cartao-interativo={!!onClick}
      sx={mergeSx(
        {
          ...indicadorCrmSx,

          position: "relative",
          overflow: "hidden",

          minWidth: 0,
          minHeight: 148,
          height: "100%",
          boxSizing: "border-box",

          p: { xs: 2, md: 2.5 },

          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          gap: 1.5,

          borderRadius: 3,

          borderColor: active ? accent : "divider",

          bgcolor: "background.paper",

          backgroundImage: (theme: Theme) =>
            `linear-gradient(
              145deg,
              ${theme.palette.background.paper} 35%,
              ${alpha(accent, active ? 0.075 : 0.018)} 100%
            )`,

          boxShadow: active
            ? `0 0 0 1px ${accent},
               0 6px 20px ${alpha(accent, 0.12)}`
            : "0 2px 8px rgba(0, 0, 0, 0.035)",

          cursor: onClick ? "pointer" : "default",

          transition: `
            transform 0.22s ease,
            box-shadow 0.22s ease,
            border-color 0.22s ease
          `,

          // Barra superior individual do indicador.
          "&::before": {
            content: hideAccentBar ? "none" : '""',
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: active ? 4 : 3,

            background: `linear-gradient(
              90deg,
              ${accent} 0%,
              ${alpha(accent, 0.4)} 65%,
              ${alpha(accent, 0.05)} 100%
            )`,

            pointerEvents: "none",
          },

          "@media (hover: hover) and (pointer: fine)": {
            "&:hover": {
              transform: onClick ? "translateY(-2px)" : "none",
              borderColor: active
                ? accent
                : onClick
                  ? alpha(accent, 0.45)
                  : "divider",
              boxShadow: onClick
                ? `0 8px 24px ${alpha(accent, 0.13)}`
                : undefined,
              "& .crm-kpi-icon": {
                transform: onClick ? "scale(1.08)" : "none",
              },
            },
          },

          "@media (prefers-reduced-motion: reduce)": {
            transition: "none",

            "&:hover": {
              transform: "none",

              "& .crm-kpi-icon": {
                transform: "none",
              },
            },
          },
        },
        sx,
      )}
    >
      {/* Título e ícone */}
      <Stack
        direction="row"
        spacing={1.5}
        sx={{ alignItems: "center", justifyContent: "space-between", minWidth: 0 }}
      >
        <Typography
          variant="body2"
          data-cartao-titulo
          sx={{
            color: "text.secondary",
            fontSize: { xs: 12, md: 13 },
            fontWeight: 700,
            lineHeight: 1.5,
            minWidth: 0,
            overflowWrap: "anywhere",
          }}
        >
          {title}
        </Typography>

        <Avatar
          className="crm-kpi-icon"
          variant="rounded"
          sx={{
            width: { xs: 38, md: 44 },
            height: { xs: 38, md: 44 },

            flexShrink: 0,

            bgcolor: backgroundSoft,
            color: accent,

            borderRadius: 2.5,
            border: "1px solid",
            borderColor: alpha(accent, 0.12),

            transition: "transform 0.22s ease",

            "& .MuiSvgIcon-root": {
              fontSize: { xs: 20, md: 23 },
            },

            "@media (prefers-reduced-motion: reduce)": {
              transition: "none",
            },
          }}
        >
          {icon}
        </Avatar>
      </Stack>

      {/* Valor principal */}
      <Typography
        component="div"
        data-cartao-valor
        sx={{
          color: "text.primary",

          fontSize: {
            xs: 28,
            sm: 32,
            lg: 36,
          },

          fontWeight: 750,
          lineHeight: 1.15,
          letterSpacing: "-0.04em",
          fontVariantNumeric: "tabular-nums",

          overflowWrap: "anywhere",
        }}
      >
        {value}
      </Typography>

      {/* Informações complementares */}
      {caption !== undefined && caption !== null && (
        <Box
          sx={{
            pt: 1.25,
            borderTop: "1px solid",
            borderColor: alpha(accent, 0.1),
          }}
        >
          <Typography
            component="div"
            data-cartao-legenda
            sx={{
              color: "text.secondary",
              fontSize: 12,
              fontWeight: 500,
              lineHeight: 1.5,
              overflowWrap: "anywhere",
            }}
          >
            {caption}
          </Typography>
        </Box>
      )}
    </Paper>
  );

  if (!onClick) return card;

  return (
    <Box
      component="button"
      type="button"
      onClick={onClick}
      aria-label={ariaLabel ?? title}
      aria-pressed={ariaPressed ?? active}
      sx={{
        appearance: "none",

        display: "block",
        width: "100%",
        height: "100%",
        minWidth: 0,

        p: 0,
        m: 0,

        border: 0,
        bgcolor: "transparent",
        textAlign: "left",
        borderRadius: 3.5,

        font: "inherit",
        cursor: "pointer",

        "&:focus-visible": {
          outline: `2px solid ${accent}`,
          outlineOffset: 4,
        },
      }}
    >
      {card}
    </Box>
  );
}
