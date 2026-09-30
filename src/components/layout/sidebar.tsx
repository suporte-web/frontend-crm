"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";

import MenuOpenRoundedIcon from "@mui/icons-material/MenuOpenRounded";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";

import {
  appScreens,
  isScreenEnabledForRole,
  type AppScreen,
} from "@/config/screens";

import { useAuth } from "@/context/auth-context";
import { getNotifications } from "@/services/notifications.service";

import { sidebarSections, type SidebarSectionConfig } from "./sidebar-config";

import {
  SidebarNavigation,
  type SidebarSectionWithItems,
} from "./sidebar-navigation";

import { isUnreadChatNotification } from "./sidebar-utils";

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
  muted: "rgba(255, 255, 255, 0.72)",
  mutedLight: "rgba(255, 255, 255, 0.46)",

  border: "rgba(255, 255, 255, 0.10)",

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


  const { user, token } = useAuth();

  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return window.localStorage.getItem(SIDEBAR_STORAGE_KEY) === "true";
  });

  const [unreadChatCount, setUnreadChatCount] = useState(0);

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  const isSidebarExpanded = !collapsed;
  const sidebarWidth = isSidebarExpanded
    ? SIDEBAR_OPEN_WIDTH
    : SIDEBAR_COLLAPSED_WIDTH;

  const filteredMenu = appScreens.filter((item) =>
    isScreenEnabledForRole(item, user?.role, user?.screenPermissions),
  );

  const filteredSections = buildSidebarSections(filteredMenu);

  useEffect(() => {
    if (!token) {
      setUnreadChatCount(0);
      return;
    }

    let active = true;

    const authToken = token;

    async function loadChatNotifications() {
      const notifications = await getNotifications(authToken);

      if (!active) {
        return;
      }

      const unreadNotifications = notifications.filter(
        isUnreadChatNotification,
      );

      setUnreadChatCount(unreadNotifications.length);
    }

    loadChatNotifications().catch(() => undefined);

    const interval = window.setInterval(() => {
      loadChatNotifications().catch(() => undefined);
    }, 30000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [token, pathname]);

  function handleToggleSection(sectionId: string, fallbackOpen: boolean) {
    setOpenSections((current) => ({
      ...current,

      [sectionId]: !(current[sectionId] ?? fallbackOpen),
    }));
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

          boxShadow: "4px 0 24px rgba(0, 0, 0, 0.18)",

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
            minHeight: isSidebarExpanded ? 120 : 76,
            px: isSidebarExpanded ? 2 : 1,
            pt: isSidebarExpanded ? 2.75 : 1.25,
            pb: isSidebarExpanded ? 2 : 1.25,
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-start",
            gap: 1.75,
          }}
        >
          {isSidebarExpanded ? (
            <>
              <Stack
                direction="row"
                spacing={1}
                sx={{
                  width: "100%",
                  alignItems: "center",
                  justifyContent: "flex-end",
                }}
              >
                <Box
                  component="img"
                  src="/imagem/logopizzattolog.png"
                  alt="Pizzattolog"
                  sx={{
                    display: "block",
                    width: 200,
                    maxWidth: "calc(100% - 48px)",
                    height: 60,
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
                      width: 36,
                      height: 36,
                      flexShrink: 0,
                      borderRadius: "10px",
                      color: "rgba(255,255,255,0.72)",

                      "&:hover": {
                        bgcolor: "rgba(255,255,255,0.08)",
                        color: "#ffffff",
                      },
                    }}
                  >
                    <MenuOpenRoundedIcon />
                  </IconButton>
                </Tooltip>
              </Stack>

              <Typography
                sx={{
                  mt: 0.5,
                  pl: 1.25,
                  borderLeft: `3px solid ${sidebarColors.orange}`,
                  color: "rgba(255,255,255,0.68)",
                  fontSize: 10,
                  fontWeight: 1000,
                  lineHeight: 1.3,
                  letterSpacing: ".14em",
                  textTransform: "uppercase",
                }}
              >
                {/* Portal CRM */}
              </Typography>
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
                  bgcolor: "#2f2f2f",
                  p: 0.75,

                  "&:hover": {
                    bgcolor: "#3a3a3a",
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

                  borderRadius: "12px",

                  color: sidebarColors.orangeDark,
                  bgcolor: sidebarColors.orangeSoft,

                  "&:hover": {
                    bgcolor: sidebarColors.orangeHover,
                  },
                }}
              >
                <MenuRoundedIcon />
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
            unreadChatCount={unreadChatCount}
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

        {/* Rodapé */}
        {/* Rodapé */}
        <Box
          sx={{
            px: isSidebarExpanded ? 2 : 1,
            py: 2,
          }}
        >
          {isSidebarExpanded ? (
            <Stack
              direction="row"
              sx={{
                alignItems: "center",
                justifyContent: "center",
                gap: 1,
              }}
            >
              <Typography
                sx={{
                  color: sidebarColors.mutedLight,
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: ".03em",
                }}
              >
                Versão 1.0.0
              </Typography>

              <Box
                sx={{
                  width: 4,
                  height: 4,
                  borderRadius: "50%",
                  bgcolor: sidebarColors.orange,
                  opacity: 0.8,
                }}
              />

              <Typography
                sx={{
                  color: sidebarColors.mutedLight,
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                CRM
              </Typography>
            </Stack>
          ) : (
            <Tooltip
              title="CRM • Versão 1.0.0"
              placement="right"
              arrow
            >
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  mx: "auto",
                  borderRadius: "50%",
                  bgcolor: sidebarColors.orange,
                }}
              />
            </Tooltip>
          )}
        </Box>
      </Stack>
    </Drawer>
  );
}
