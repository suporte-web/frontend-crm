import Alert from "@mui/material/Alert";
import Stack from "@mui/material/Stack";
import { AppLayout } from "@/components/layout/app-layout";
import { useAuth } from "@/context/auth-context";
import {
  dashboardGroups,
  getDashboardShortcuts,
} from "./components/dashboard-shortcuts";
import { DashboardBanner } from "./components/DashboardBanner";
import { Box, ButtonBase, Typography } from "@mui/material";
import { Link } from "react-router-dom";

export default function DashboardPage() {
  const { user } = useAuth();
  const shortcuts = getDashboardShortcuts(
    user?.roles?.length ? user.roles : user?.role,
    user?.screenPermissions,
  );

  return (
    <AppLayout>
      <Stack spacing={{ xs: 3.5, md: 4.5 }} sx={{ width: "100%", pb: 2 }}>
        <DashboardBanner />
        {dashboardGroups.map((grupo, index) => {
          const atalhosDoGrupo = shortcuts.filter(
            (shortcut) => shortcut.grupo === grupo,
          );
          if (atalhosDoGrupo.length === 0) return null;
          const headingId = `dashboard-section-${index}`;

          return (
            <Box key={grupo} component="section" aria-labelledby={headingId}>
              <Typography
                id={headingId}
                component="h2"
                sx={{ mb: 2, fontSize: 16, fontWeight: 800, color: "#111827" }}
              >
                {grupo}
              </Typography>
              <Box
                sx={{
                  display: "grid",
                  gap: 1.5,
                  gridTemplateColumns: {
                    xs: "repeat(2, minmax(0, 1fr))",
                    sm: "repeat(3, minmax(0, 1fr))",
                    lg: "repeat(5, minmax(0, 1fr))",
                    xl: "repeat(6, minmax(0, 1fr))",
                  },
                }}
              >
                {atalhosDoGrupo.map((shortcut) => {
                  const Icon = shortcut.icone;

                  return (
                    <ButtonBase
                      key={shortcut.id}
                      className="crm-cartao-atalho"
                      component={Link}
                      to={shortcut.href}
                      focusRipple
                      sx={{
                        width: "100%",
                        minWidth: 0,
                        minHeight: 112,
                        px: 1.5,
                        py: 2,
                        display: "flex",
                        flexDirection: "column",
                        gap: 1.5,
                        color: "#111827",
                        bgcolor: "#fff",
                        border: "1px solid #e5e7eb",
                        borderRadius: "12px",
                        cursor: "pointer",
                        textDecoration: "none",
                        transition:
                          "border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease",
                        "&:hover": {
                          borderColor: "#fdba74",
                          boxShadow: "none",
                          transform: "none",
                        },
                        "&.Mui-focusVisible": {
                          outline: "3px solid #ff5805",
                          outlineOffset: 3,
                        },
                        "@media (prefers-reduced-motion: reduce)": {
                          transition: "none",
                          "&:hover": { transform: "none" },
                        },
                      }}
                    >
                      <Icon size={28} strokeWidth={1.8} aria-hidden="true" />
                      <Typography
                        component="span"
                        sx={{
                          fontSize: 13,
                          fontWeight: 650,
                          lineHeight: 1.35,
                          textAlign: "center",
                          maxWidth: 145,
                        }}
                      >
                        {shortcut.titulo}
                      </Typography>
                    </ButtonBase>
                  );
                })}
              </Box>
            </Box>
          );
        })}
        {user && shortcuts.length === 0 ? (
          <Alert severity="info">
            Nenhum atalho disponível para seu perfil.
          </Alert>
        ) : null}
      </Stack>
    </AppLayout>
  );
}
