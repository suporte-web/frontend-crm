"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";

import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";

import {
  appScreens,
  isScreenEnabledForRole,
  type AppScreen,
} from "@/config/screens";

import { useAuth } from "@/context/auth-context";

import { sidebarSections, type SidebarSectionConfig } from "./sidebar-config";

import {
  SidebarNavigation,
  type SidebarSectionWithItems,
} from "./sidebar-navigation";

import { usePageTop } from "./page-top";

const SIDEBAR_OPEN_WIDTH = 264;
const SIDEBAR_COLLAPSED_WIDTH = 76;
const SIDEBAR_STORAGE_KEY = "crm-sidebar-collapsed";

const sidebarColors = {
  orange: "#ff4d00",
  orangeDark: "#ff6a2a",
  orangeSoft: "rgba(255, 77, 0, 0.14)",
  orangeHover: "rgba(255, 77, 0, 0.22)",

  background: "#2f2f2f",
  backgroundMuted: "#262626",

  text: "#ffffff",
  muted: "rgba(255,255,255,.78)",
  mutedLight: "rgba(255,255,255,.50)",

  border: "rgba(255,255,255,.10)",

  danger: "#ff6b6b",
  dangerSoft: "rgba(255, 107, 107, 0.12)",
};

function buildSidebarSections(
  filteredMenu: AppScreen[],
): SidebarSectionWithItems[] {
  return sidebarSections
    .map((section: SidebarSectionConfig) => ({
      ...section,

      items: section.keys
        .map((key) => filteredMenu.find((item) => item.key === key))
        .filter((item): item is AppScreen => Boolean(item)),
    }))
    .filter((section) => section.items.length > 0);
}

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const pageTop = usePageTop();


  const { user, signOut } = useAuth();

  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return window.localStorage.getItem(SIDEBAR_STORAGE_KEY) === "true";
  });


  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  const isSidebarExpanded = !collapsed;
  const sidebarWidth = isSidebarExpanded
    ? SIDEBAR_OPEN_WIDTH
    : SIDEBAR_COLLAPSED_WIDTH;

  useEffect(() => {
    pageTop?.setSidebarWidth(sidebarWidth);
  }, [sidebarWidth, pageTop?.setSidebarWidth]);

  const filteredMenu = appScreens.filter((item) =>
    isScreenEnabledForRole(item, user?.roles?.length ? user.roles : user?.role, user?.screenPermissions),
  );

  const filteredSections = buildSidebarSections(filteredMenu);


  function handleToggleSection(sectionId: string, fallbackOpen: boolean) {
    setOpenSections((current) => ({
      ...current,

      [sectionId]: !(current[sectionId] ?? fallbackOpen),
    }));
  }

  function handleSignOut() {
    signOut();
    router.replace("/entrar");
  }

  function handleToggleSidebar() {
    if (collapsed) {
      setCollapsed(false);
      window.localStorage.setItem(SIDEBAR_STORAGE_KEY, "false");
      return;
    }

    setCollapsed(true);
    window.localStorage.setItem(SIDEBAR_STORAGE_KEY, "true");
  }



  return (
    <Drawer
      variant="permanent"
      open={isSidebarExpanded}
      sx={{
        width: sidebarWidth,
        flexShrink: 0,

        display: {
          xs: "none",
          md: "block",
        },

        "& .MuiDrawer-paper": {
          width: sidebarWidth,
          boxSizing: "border-box",
          overflowX: "hidden",

          bgcolor: sidebarColors.background,
          color: sidebarColors.text,

          borderRight: `1px solid ${sidebarColors.border}`,

          boxShadow: "none",

          transition: (theme) =>
            theme.transitions.create("width", {
              easing: theme.transitions.easing.sharp,

              duration: theme.transitions.duration.shorter,
            }),
        },
      }}
    >
      <Stack
        sx={{
          height: "100%",
          minHeight: 0,
        }}
      >
        {/* Cabeçalho e logo */}
        <Box
          sx={{
            bgcolor: "#2f2f2f",
            minHeight: 84,
            height: 84,
            px: isSidebarExpanded ? 2 : 1,
            pt: 1.5,
            pb: 1.5,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 1.75,
          }}
        >
          {isSidebarExpanded ? (
            <>
              <Stack
                direction="row"
                spacing={0}
                sx={{
                  width: "100%",
                  display: "grid",
                  gridTemplateColumns: "32px minmax(0, 1fr) 32px",
                  alignItems: "center",
                }}
              >
                <Box
                  component="img"
                  src="/imagem/logopizzattolog.png"
                  alt="Pizzattolog"
                  sx={{
                    display: "block",
                    gridColumn: 2,
                    justifySelf: "center",
                    transform: "translateX(-24px)",
                    width: 176,
                    maxWidth: "100%",
                    height: 58,
                    objectFit: "contain",
                    objectPosition: "center",
                  }}
                />

                <Tooltip
                  title={collapsed ? "Expandir menu" : "Recolher menu"}
                  placement="right"
                  arrow
                >
                  <IconButton
                    onClick={handleToggleSidebar}
                    aria-label={
                      collapsed
                        ? "Expandir menu lateral"
                        : "Recolher menu lateral"
                    }
                    size="small"
                    sx={{
                      gridColumn: 3,
                      width: 32,
                      height: 32,
                      flexShrink: 0,
                      borderRadius: "50%",
                      border: "1px solid rgba(255,255,255,.35)",
                      bgcolor: "rgba(255,255,255,.06)",
                      color: "#fff",

                      "&:hover": {
                        bgcolor: "rgba(255,255,255,.12)",
                        color: "#fff",
                      },
                    }}
                  >
                    <ChevronLeftRoundedIcon sx={{ fontSize: 24 }} />
                  </IconButton>
                </Tooltip>
              </Stack>


            </>
          ) : (
            <Tooltip title="Expandir menu" placement="right" arrow>
              <IconButton
                onClick={handleToggleSidebar}
                aria-label="Expandir menu lateral"
                sx={{
                  width: 48,
                  height: 48,
                  mx: "auto",
                  borderRadius: "12px",
                  bgcolor: "transparent",
                  p: 0.75,

                  "&:hover": {
                    bgcolor: "rgba(255,255,255,.12)",
                  },
                }}
              >
                <Box
                  component="img"
                  src="/imagem/logopizzattolog.png"
                  alt="Pizzattolog"
                  sx={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                  }}
                />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        <Divider
          sx={{
            borderColor: sidebarColors.border,
          }}
        />

        {/* Botão que aparece quando o menu está recolhido */}
        {!isSidebarExpanded ? (
          <Box
            sx={{
              px: 1,
              pt: 1.5,
            }}
          >
            <Tooltip title="Expandir menu" placement="right" arrow>
              <IconButton
                onClick={handleToggleSidebar}
                aria-label="Expandir menu lateral"
                sx={{
                  width: 48,
                  height: 48,

                  display: "flex",
                  mx: "auto",

                  borderRadius: "50%",
                  border: "1px solid rgba(255,255,255,.35)",

                  color: "#fff",
                  bgcolor: "rgba(255,255,255,.06)",

                  "&:hover": {
                    bgcolor: "rgba(255,255,255,.12)",
                  },
                }}
              >
                <ChevronRightRoundedIcon sx={{ fontSize: 28 }} />
              </IconButton>
            </Tooltip>
          </Box>
        ) : null}

        {/* Área de navegação */}
        <Box
          sx={{
            flex: 1,
            minHeight: 0,

            px: isSidebarExpanded ? 1.5 : 1.75,
            pt: 1.5,
            pb: 2,

            overflowY: "auto",
            overflowX: "hidden",

            "&::-webkit-scrollbar": {
              width: 6,
            },

            "&::-webkit-scrollbar-thumb": {
              bgcolor: "#cbd5e1",
              borderRadius: 999,
            },

            "&::-webkit-scrollbar-track": {
              bgcolor: "transparent",
            },
          }}
        >
          {isSidebarExpanded ? (
            <Typography
              sx={{
                px: 1.5,
                mb: 1.25,

                color: sidebarColors.mutedLight,

                fontSize: 10,
                fontWeight: 1000,

                letterSpacing: ".14em",
                textTransform: "uppercase",
              }}
            >
              {/* Navegação */}
            </Typography>
          ) : null}

          <SidebarNavigation
            sections={filteredSections}
            pathname={pathname}
            role={user?.role}
            openSections={openSections}
            collapsed={!isSidebarExpanded}
            onToggleSection={handleToggleSection}
          />
        </Box>

        <Divider
          sx={{
            borderColor: sidebarColors.border,
          }}
        />

        <Box sx={{ px: isSidebarExpanded ? 2 : 1, py: 1.5 }}>
          <Tooltip title={isSidebarExpanded ? "" : "Sair"} placement="right" arrow>
            <Button
              fullWidth
              aria-label="Sair do sistema"
              onClick={handleSignOut}
              sx={{ minWidth: 0, minHeight: 44, px: isSidebarExpanded ? 1.5 : 0,
                justifyContent: isSidebarExpanded ? 'flex-start' : 'center', gap: isSidebarExpanded ? 1.5 : 0,
                borderRadius: '10px', color: sidebarColors.muted, textTransform: 'none', fontSize: 14, fontWeight: 600,
                '&:hover': { bgcolor: 'rgba(255,255,255,.08)', color: '#fff' },
              }}
            >
              <LogoutRoundedIcon sx={{ fontSize: 21 }} />
              {isSidebarExpanded && 'Sair'}
            </Button>
          </Tooltip>
        </Box>
      </Stack>
    </Drawer>
  );
}
