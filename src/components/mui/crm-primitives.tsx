"use client";

import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { SxProps, Theme } from "@mui/material/styles";
import type { ReactNode } from "react";

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

export const crmPaperSx: SxProps<Theme> = {
  border: `1px solid ${crmPalette.border}`,
  borderRadius: "14px",
  boxShadow: "0 8px 24px rgba(15, 23, 42, 0.05)",
};

function mergeSx(base: SxProps<Theme>, sx?: SxProps<Theme>): SxProps<Theme> {
  if (!sx) {
    return base;
  }

  return (Array.isArray(sx) ? [base, ...sx] : [base, sx]) as SxProps<Theme>;
}

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
          display: "flex",
          flexDirection: "column",
          gap: 3,
        },
        sx,
      )}
    >
      {children}
    </Box>
  );
}

type CrmSectionProps = {
  children: ReactNode;
  sx?: SxProps<Theme>;
};

export function CrmSection({ children, sx }: CrmSectionProps) {
  return (
    <Paper
      elevation={0}
      sx={mergeSx(
        {
          ...crmPaperSx,
          overflow: "hidden",
          bgcolor: crmPalette.surface,
        },
        sx,
      )}
    >
      {children}
    </Paper>
  );
}

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
    <CrmSection sx={{ p: { xs: 3, md: 4 } }}>
      <Stack
        direction={{ xs: "column", lg: "row" }}
        spacing={3}
        sx={{
          alignItems: { xs: "flex-start", lg: "center" },
          justifyContent: "space-between",
        }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2.5}
          sx={{ alignItems: "center" }}
        >
          <Avatar
            variant="rounded"
            sx={{
              width: 52,
              height: 52,
              bgcolor: "#fff1eb",
              color: crmPalette.orange,
              border: "1px solid #fed7c3",
              borderRadius: "14px",
              boxShadow: "0 8px 20px rgba(255, 77, 0, 0.12)",
            }}
          >
            {icon}
          </Avatar>

          <Box>
            {eyebrow ? (
              <Typography
                component="p"
                sx={{
                  color: crmPalette.orangeDark,
                  fontSize: 12,
                  fontWeight: 900,
                  letterSpacing: ".16em",
                  textTransform: "uppercase",
                }}
              >
                {eyebrow}
              </Typography>
            ) : null}

            <Typography
              component="h1"
              sx={{
                mt: 0.5,
                color: "#020617",
                fontSize: { xs: 30, md: 40 },
                fontWeight: 900,
                lineHeight: 1.05,
                letterSpacing: 0,
              }}
            >
              {title}
            </Typography>

            {description ? (
              <Typography sx={{ mt: 1, color: crmPalette.muted, fontSize: 15 }}>
                {description}
              </Typography>
            ) : null}
          </Box>
        </Stack>

        {aside ? (
          <Box sx={{ width: { xs: "100%", sm: "auto" } }}>{aside}</Box>
        ) : null}
      </Stack>
    </CrmSection>
  );
}

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
  softColor = "#fff0e8",
  active,
  hideAccentBar,
  onClick,
  ariaLabel,
  ariaPressed,
  sx,
}: CrmKpiCardProps) {
  const card = (
    <Paper
      elevation={0}
      sx={mergeSx(
        {
          ...crmPaperSx,
          position: "relative",
          minHeight: 160,
          overflow: "hidden",
          p: 3,
          bgcolor: "#fff",
          boxShadow: active
            ? `0 18px 34px ${accent}22`
            : "0 12px 30px rgba(15,23,42,0.05)",
          outline: active ? `2px solid ${accent}80` : "0 solid transparent",
          transition:
            "transform 160ms ease, box-shadow 160ms ease, outline-color 160ms ease",
          cursor: onClick ? "pointer" : "default",
          "&:hover": onClick
            ? {
                transform: "translateY(-2px)",
                boxShadow: "0 18px 42px rgba(15,23,42,0.10)",
              }
            : undefined,
        },
        sx,
      )}
    >
      {!hideAccentBar ? (
        <Box
          sx={{
            position: "absolute",
            insetInline: 24,
            top: 0,
            height: 4,
            bgcolor: accent,
            borderBottomLeftRadius: 8,
            borderBottomRightRadius: 8,
          }}
        />
      ) : null}

      <Stack
        direction="row"
        spacing={2}
        sx={{ alignItems: "flex-start", justifyContent: "space-between" }}
      >
        <Box>
          <Typography sx={{ color: "#475569", fontSize: 14, fontWeight: 800 }}>
            {title}
          </Typography>

          <Typography
            component="div"
            sx={{
              mt: 1,
              color: "#020617",
              fontSize: 34,
              fontWeight: 900,
              lineHeight: 1,
            }}
          >
            {value}
          </Typography>

          {caption ? (
            <Typography
              component="div"
              sx={{ mt: 1.5, color: crmPalette.muted, fontSize: 13 }}
            >
              {caption}
            </Typography>
          ) : null}
        </Box>

        <Avatar
          variant="rounded"
          sx={{
            width: 48,
            height: 48,
            bgcolor: softColor,
            color: accent,
            borderRadius: "14px",
            border: `1px solid ${accent}25`,
          }}
        >
          {icon}
        </Avatar>
      </Stack>
    </Paper>
  );

  if (!onClick) {
    return card;
  }

  return (
    <Box
      component="button"
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      aria-pressed={ariaPressed}
      sx={{
        width: "100%",
        height: "100%",
        p: 0,
        border: 0,
        bgcolor: "transparent",
        textAlign: "left",
      }}
    >
      {card}
    </Box>
  );
}
