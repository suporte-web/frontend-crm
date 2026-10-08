"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import AppBar from "@mui/material/AppBar";
import Avatar from "@mui/material/Avatar";
import Badge from "@mui/material/Badge";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import ListItemButton from "@mui/material/ListItemButton";
import Popover from "@mui/material/Popover";
import Stack from "@mui/material/Stack";
import Toolbar from "@mui/material/Toolbar";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import ButtonBase from "@mui/material/ButtonBase";

import AppsRoundedIcon from "@mui/icons-material/AppsRounded";
import DoneAllRoundedIcon from "@mui/icons-material/DoneAllRounded";
import NotificationsNoneRoundedIcon from "@mui/icons-material/NotificationsNoneRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";

import { screenIcons } from "./sidebar-config";


import { SidebarTrigger } from "@/components/ui/sidebar";
import { appScreens, isScreenEnabledForRole } from "@/config/screens";
import { useAuth } from "@/context/auth-context";
import {
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/services/notifications.service";
import type { CrmNotification } from "@/types/notifications";

const headerColors = {
  page: "#ffffff",
  text: "#343434",
  muted: "#64748b",
  border: "rgba(52, 52, 52, 0.10)",
  orange: "#ff4d00",
  red: "#ec3139",
  yellow: "#fab519",
};

function getPageTitle(pathname: string, role?: string) {
  if (pathname.startsWith('/atendimento/visitas')) return 'Visitas';
  if (pathname.startsWith("/painel")) {
    return role === "CLIENTE" ? "Canal do Cliente" : "Início";
  }

  // if (pathname.startsWith("/bi")) return "BI Comercial";
  // if (pathname.startsWith("/rastreamentos")) return "Rastreamento";
  // if (pathname.startsWith("/cotacoes")) return "Cotações";
  // if (pathname.startsWith("/clientes")) return "Clientes";
  // if (pathname.startsWith("/leads")) return "Leads";
  // if (pathname.startsWith("/chamados")) return "Chamados";
  // if (pathname.startsWith("/usuarios")) return "Usuários";
  // if (pathname.startsWith("/solicitacoes-site")) return "Fila do site";
  // if (pathname.startsWith("/marketing/informativo")) return "";
  // if (pathname.startsWith("/marketing/metricas")) return "Métricas de Marketing";

  // if (pathname.startsWith("/marketing")) return "Criação de conteúdo";
  // if (pathname.startsWith("/entregas")) return "Entregas";
  // if (pathname.startsWith("/entradas")) return "Central de Entradas";
  // if (pathname.startsWith("/fornecedores")) return "Fornecedores";
  // if (pathname.startsWith("/chat")) return "Chat";
  // if (pathname.startsWith("/logs")) return "Logs";

  return "CRM";
}

function getRoleLabel(role?: string) {
  if (!role) return "Perfil";

  const labels: Record<string, string> = {
    LIDER_ATENDIMENTO: "Líder de Atendimento",
    ATENDIMENTO: "Atendimento",
    ADMIN: "Administrador",
    GESTAO: "Gestão",
    COMERCIAL: "Comercial",
    MARKETING: "Marketing",
    CLIENTE: "Cliente",
  };

  return labels[role] ?? role;
}

function getNotificationTone(notification: CrmNotification) {
  const type = String(notification.metadata?.type ?? "").toUpperCase();
  const text = `${notification.title} ${notification.message}`.toLowerCase();

  if (
    type === "CHAT_MESSAGE" ||
    text.includes("chat") ||
    text.includes("mensagem")
  ) {
    return {
      borderColor: "#dbeafe",
      bgcolor: notification.readAt ? "#ffffff" : "#eff6ff",
      hover: "#dbeafe",
      dot: "#2563eb",
    };
  }

  if (text.includes("aprov")) {
    return {
      borderColor: "#bbf7d0",
      bgcolor: notification.readAt ? "#ffffff" : "#ecfdf5",
      hover: "#dcfce7",
      dot: "#059669",
    };
  }

  if (text.includes("ajuste") || text.includes("aguardando")) {
    return {
      borderColor: "#fde68a",
      bgcolor: notification.readAt ? "#ffffff" : "#fffbeb",
      hover: "#fef3c7",
      dot: "#f59e0b",
    };
  }

  return {
    borderColor: "#fecdd3",
    bgcolor: notification.readAt ? "#ffffff" : "#fff1f2",
    hover: "#ffe4e6",
    dot: notification.readAt ? "#cbd5e1" : headerColors.red,
  };
}

function normalizeNotificationLink(link?: string | null) {
  if (!link) {
    return undefined;
  }

  if (link.startsWith("/tickets?")) {
    return `/chamados?${link.split("?")[1]}`;
  }

  if (link.startsWith("/tickets/") || link.startsWith("/chamados/")) {
    return `/chamados?ticket=${link.split("/").pop()}`;
  }

  if (link === "/tickets") {
    return "/chamados";
  }

  if (link.startsWith("/clients/")) {
    return link.replace(/^\/clients/, "/clientes");
  }

  if (link === "/clients") {
    return "/clientes";
  }

  return link;
}

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, token, signOut } = useAuth();

  const [appsAnchorEl, setAppsAnchorEl] = useState<HTMLElement | null>(null);
  const [notificationsAnchorEl, setNotificationsAnchorEl] =
    useState<HTMLElement | null>(null);

  const [profileAnchorEl, setProfileAnchorEl] =
    useState<HTMLElement | null>(null);

  const [notifications, setNotifications] = useState<CrmNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const userFirstName = user?.name?.split(" ").filter(Boolean)[0] ?? "Usuário";
  const pageTitle = getPageTitle(pathname, user?.role);
  const appsOpen = Boolean(appsAnchorEl);
  const notificationsOpen = Boolean(notificationsAnchorEl);
  const profileOpen = Boolean(profileAnchorEl);

  const availableScreens = appScreens.filter((item) =>
    isScreenEnabledForRole(item, user?.roles?.length ? user.roles : user?.role, user?.screenPermissions),
  );

  function handleSignOut() {
    setProfileAnchorEl(null);
    signOut();
    router.replace("/entrar");
  }

  async function loadNotifications() {
    if (!token) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    const [items, unread] = await Promise.all([
      getNotifications(token),
      getUnreadNotificationCount(token),
    ]);

    setNotifications(items);
    setUnreadCount(unread.count);
  }

  useEffect(() => {
    loadNotifications().catch(() => undefined);
  }, [token, pathname]);

  useEffect(() => {
    if (!token) return;

    const interval = window.setInterval(() => {
      loadNotifications().catch(() => undefined);
    }, 30000);

    return () => window.clearInterval(interval);
  }, [token]);

  async function handleNotificationClick(notification: CrmNotification) {
    if (!token) {
      return;
    }

    if (!notification.readAt) {
      await markNotificationRead(notification.id, token).catch(() => undefined);
      setUnreadCount((current) => Math.max(0, current - 1));
    }

    setNotificationsAnchorEl(null);

    const targetLink = normalizeNotificationLink(notification.link);

    router.push(
      targetLink ||
      (notification.ticketId
        ? `/chamados?ticket=${notification.ticketId}`
        : "/chamados"),
    );
  }

  async function handleMarkAllRead() {
    if (!token) {
      return;
    }

    await markAllNotificationsRead(token).catch(() => undefined);
    setUnreadCount(0);

    setNotifications((current) =>
      current.map((item) => ({
        ...item,
        readAt: item.readAt ?? new Date().toISOString(),
      })),
    );
  }

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        top: 0,
        zIndex: 40,
        bgcolor: headerColors.page,
        color: headerColors.text,
        borderBottom: `1px solid ${headerColors.border}`,
        boxShadow: "0 10px 30px rgba(52, 52, 52, 0.04)",
      }}
    >
      <Toolbar
        disableGutters
        sx={{
          minHeight: 72,
          px: { xs: 2, md: 4 },
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        <Stack direction="row" spacing={1.5} sx={{ minWidth: 0, alignItems: "center" }}>
          <SidebarTrigger className="h-10 w-10 rounded-md text-[#343434] hover:bg-[#343434]/8" />

          <Typography
            component="h1"
            noWrap
            sx={{
              color: headerColors.text,
              fontSize: 18,
              fontWeight: 900,
              lineHeight: 1,
            }}
          >
            {pageTitle}
          </Typography>
        </Stack>

        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <Tooltip title="Aplicativos" arrow>
            <IconButton
              onClick={(event) => {
                setAppsAnchorEl(appsOpen ? null : event.currentTarget);
                setNotificationsAnchorEl(null);
                setProfileAnchorEl(null);
              }}
              aria-label="Aplicativos"
              sx={{
                width: 40,
                height: 40,
                color: headerColors.text,
                bgcolor: appsOpen ? "rgba(52,52,52,0.08)" : "transparent",
                "&:hover": { bgcolor: "rgba(52,52,52,0.08)" },
              }}
            >
              <AppsRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Configurações da conta" arrow>
            <IconButton
              onClick={() => router.push("/alterar-senha")}
              aria-label="Configurações da conta"
              sx={{
                display: { xs: "none", md: "inline-flex" },
                width: 40,
                height: 40,
                color: headerColors.text,
                "&:hover": { bgcolor: "rgba(52,52,52,0.08)" },
              }}
            >
              <SettingsRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Notificações" arrow>
            <IconButton
              onClick={(event) => {
                setNotificationsAnchorEl(
                  notificationsOpen ? null : event.currentTarget,
                );
                setAppsAnchorEl(null);
                setProfileAnchorEl(null);
                loadNotifications().catch(() => undefined);
              }}
              aria-label="Notificações"
              sx={{
                width: 40,
                height: 40,

                borderRadius: "10px",

                color: notificationsOpen
                  ? headerColors.orange
                  : headerColors.text,

                bgcolor: notificationsOpen
                  ? "#fff7f2"
                  : "transparent",

                "&:hover": {
                  bgcolor: "#fff7f2",
                  color: headerColors.orange,
                },
              }}
            >
              <Badge
                badgeContent={unreadCount > 9 ? "9+" : unreadCount}
                color="error"
                invisible={unreadCount === 0}
                sx={{
                  "& .MuiBadge-badge": {
                    bgcolor: headerColors.red,
                    color: "#ffffff",
                    fontSize: 10,
                    fontWeight: 900,
                    border: `1px solid ${headerColors.yellow}`,
                  },
                }}
              >
                <NotificationsNoneRoundedIcon fontSize="small" />
              </Badge>
            </IconButton>
          </Tooltip>

          <ButtonBase
            onClick={(event) => {
              setProfileAnchorEl(
                profileOpen ? null : event.currentTarget,
              );

              setAppsAnchorEl(null);
              setNotificationsAnchorEl(null);
            }}
            aria-label="Abrir menu do usuário"
            aria-expanded={profileOpen}
            sx={{
              display: { xs: "none", sm: "flex" },
              alignItems: "center",
              gap: 1,
              ml: 1,

              py: 0.65,
              pl: 0.7,
              pr: 1.25,

              border: "1px solid",
              borderColor: profileOpen
                ? "rgba(255,77,0,0.30)"
                : headerColors.border,

              borderRadius: "14px",

              bgcolor: profileOpen
                ? "#fff7f2"
                : "#ffffff",

              boxShadow: profileOpen
                ? "0 10px 30px rgba(52,52,52,0.10)"
                : "0 5px 18px rgba(52,52,52,0.06)",

              transition: "all 180ms ease",

              "&:hover": {
                bgcolor: "#fff7f2",
                borderColor: "rgba(255,77,0,0.25)",
              },
            }}
          >
            <Avatar
              sx={{
                width: 38,
                height: 38,

                bgcolor: headerColors.orange,
                color: "#ffffff",

                fontSize: 14,
                fontWeight: 900,
              }}
            >
              {userFirstName.slice(0, 1).toUpperCase()}
            </Avatar>

            <Box
              sx={{
                minWidth: 0,
                textAlign: "left",
              }}
            >
              <Typography
                noWrap
                sx={{
                  maxWidth: 125,
                  color: headerColors.text,
                  fontSize: 14,
                  fontWeight: 900,
                  lineHeight: 1.15,
                }}
              >
                {userFirstName}
              </Typography>

              <Typography
                noWrap
                sx={{
                  mt: 0.25,
                  maxWidth: 125,
                  color: headerColors.muted,
                  fontSize: 11,
                  fontWeight: 600,
                  lineHeight: 1.1,
                }}
              >
                {getRoleLabel(user?.role)}
              </Typography>
            </Box>

            <KeyboardArrowDownRoundedIcon
              sx={{
                ml: 0.25,
                fontSize: 20,
                color: "#64748b",

                transform: profileOpen
                  ? "rotate(180deg)"
                  : "rotate(0deg)",

                transition: "transform 180ms ease",
              }}
            />
          </ButtonBase>
        </Stack>
      </Toolbar>

      <Popover
        open={profileOpen}
        anchorEl={profileAnchorEl}
        onClose={() => setProfileAnchorEl(null)}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        slotProps={{
          paper: {
            sx: {
              mt: 1,

              width: 310,

              border: "1px solid #e2e8f0",
              borderRadius: "16px",

              bgcolor: "#ffffff",

              boxShadow:
                "0 24px 70px rgba(15,23,42,0.16)",

              overflow: "hidden",
            },
          },
        }}
      >
        {/* USUÁRIO */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,

            px: 2,
            py: 2,
          }}
        >
          <Avatar
            sx={{
              width: 46,
              height: 46,

              bgcolor: headerColors.orange,
              color: "#ffffff",

              fontSize: 16,
              fontWeight: 900,
            }}
          >
            {userFirstName.slice(0, 1).toUpperCase()}
          </Avatar>

          <Box
            sx={{
              minWidth: 0,
              flex: 1,
            }}
          >
            <Typography
              noWrap
              sx={{
                color: "#0f172a",
                fontSize: 15,
                fontWeight: 900,
              }}
            >
              {user?.name ?? "Usuário"}
            </Typography>

            <Typography
              sx={{
                mt: 0.25,
                color: headerColors.muted,
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              {getRoleLabel(user?.role)}
            </Typography>

            {user?.email ? (
              <Typography
                noWrap
                sx={{
                  mt: 0.4,
                  color: "#94a3b8",
                  fontSize: 11,
                }}
              >
                {user.email}
              </Typography>
            ) : null}
          </Box>
        </Box>

        <Divider />

        {/* CONFIGURAÇÕES */}
        <ListItemButton
          onClick={() => {
            setProfileAnchorEl(null);
            router.push("/alterar-senha");
          }}
          sx={{
            minHeight: 50,
            gap: 1.5,
            px: 2,

            color: "#334155",

            "&:hover": {
              bgcolor: "#f8fafc",
              color: headerColors.orange,
            },
          }}
        >
          <SettingsRoundedIcon
            sx={{
              fontSize: 20,
              color: "inherit",
            }}
          />

          <Typography
            sx={{
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            Configurações da conta
          </Typography>
        </ListItemButton>

        <Divider />

        {/* SAIR */}
        <ListItemButton
          onClick={handleSignOut}
          sx={{
            minHeight: 50,
            gap: 1.5,
            px: 2,

            color: "#dc2626",

            "&:hover": {
              bgcolor: "#fef2f2",
              color: "#b91c1c",
            },
          }}
        >
          <LogoutRoundedIcon
            sx={{
              fontSize: 20,
              color: "inherit",
            }}
          />

          <Typography
            sx={{
              fontSize: 14,
              fontWeight: 800,
            }}
          >
            Sair
          </Typography>
        </ListItemButton>
      </Popover>

      <Popover
        open={appsOpen}
        anchorEl={appsAnchorEl}
        onClose={() => setAppsAnchorEl(null)}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        slotProps={{
          paper: {
            sx: {
              mt: 1,

              width: {
                xs: 330,
                sm: 390,
              },

              border: "1px solid #e2e8f0",
              borderRadius: "18px",

              bgcolor: "#ffffff",

              boxShadow:
                "0 24px 70px rgba(15,23,42,0.16)",

              overflow: "hidden",
            },
          },
        }}
      >
        {/* Cabeçalho */}
        <Box
          sx={{
            px: 2,
            pt: 2,
            pb: 1.5,
          }}
        >
          <Typography
            sx={{
              color: "#0f172a",
              fontSize: 15,
              fontWeight: 900,
            }}
          >
            Aplicativos
          </Typography>

          <Typography
            sx={{
              mt: 0.35,
              color: "#64748b",
              fontSize: 12,
            }}
          >
            Acesso rápido aos módulos do CRM
          </Typography>
        </Box>

        <Divider />

        {/* Grid de aplicativos */}
        <Box
          sx={{
            display: "grid",

            gridTemplateColumns: {
              xs: "repeat(2, minmax(0, 1fr))",
              sm: "repeat(3, minmax(0, 1fr))",
            },

            gap: 1,

            p: 1.5,

            maxHeight: 410,
            overflowY: "auto",

            "&::-webkit-scrollbar": {
              width: 5,
            },

            "&::-webkit-scrollbar-thumb": {
              bgcolor: "#cbd5e1",
              borderRadius: 999,
            },
          }}
        >
          {availableScreens.map((item) => {
            const ScreenIcon = screenIcons[item.key];

            const isActive =
              pathname === item.href ||
              pathname.startsWith(`${item.href}/`);

            return (
              <Button
                key={item.href}
                component={Link}
                href={item.href}
                onClick={() => setAppsAnchorEl(null)}
                sx={{
                  minHeight: 92,

                  display: "flex",
                  flexDirection: "column",

                  alignItems: "center",
                  justifyContent: "center",

                  gap: 1,

                  px: 1,
                  py: 1.5,

                  border: "1px solid",
                  borderColor: isActive
                    ? "rgba(255,77,0,0.35)"
                    : "#e2e8f0",

                  borderRadius: "14px",

                  bgcolor: isActive
                    ? "#fff7f2"
                    : "#ffffff",

                  color: isActive
                    ? headerColors.orange
                    : "#334155",

                  textTransform: "none",

                  transition:
                    "all 180ms ease",

                  "&:hover": {
                    bgcolor: "#fff7f2",
                    borderColor: "rgba(255,77,0,0.35)",
                    color: headerColors.orange,
                    transform: "translateY(-2px)",
                    boxShadow:
                      "0 8px 22px rgba(15,23,42,0.08)",
                  },
                }}
              >
                <Box
                  sx={{
                    width: 42,
                    height: 42,

                    display: "grid",
                    placeItems: "center",

                    borderRadius: "12px",

                    bgcolor: isActive
                      ? "#ffedd5"
                      : "#f8fafc",

                    color: isActive
                      ? headerColors.orange
                      : "#64748b",
                  }}
                >
                  {ScreenIcon ? (
                    <ScreenIcon size={20} />
                  ) : (
                    <AppsRoundedIcon fontSize="small" />
                  )}
                </Box>

                <Typography
                  noWrap
                  sx={{
                    width: "100%",

                    color: "inherit",

                    fontSize: 12,
                    fontWeight: 800,

                    textAlign: "center",
                  }}
                >
                  {item.href === "/painel" &&
                    user?.role === "CLIENTE"
                    ? "Canal do Cliente"
                    : item.label}
                </Typography>
              </Button>
            );
          })}
        </Box>
      </Popover>

      <Popover
        open={notificationsOpen}
        anchorEl={notificationsAnchorEl}
        onClose={() => setNotificationsAnchorEl(null)}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        slotProps={{
          paper: {
            sx: {
              mt: 1,

              width: {
                xs: 330,
                sm: 400,
              },

              border: "1px solid #e2e8f0",
              borderRadius: "18px",

              bgcolor: "#ffffff",

              boxShadow:
                "0 24px 70px rgba(15,23,42,0.16)",

              overflow: "hidden",
            },
          },
        }}
      >
        {/* CABEÇALHO */}
        <Box
          sx={{
            px: 2,
            pt: 2,
            pb: 1.5,
          }}
        >
          <Stack
            direction="row"
            sx={{
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 2,
            }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Stack
                direction="row"
                sx={{
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <Typography
                  sx={{
                    color: "#0f172a",
                    fontSize: 16,
                    fontWeight: 900,
                  }}
                >
                  Notificações
                </Typography>

                {unreadCount > 0 ? (
                  <Box
                    sx={{
                      minWidth: 24,
                      height: 22,

                      px: 0.75,

                      display: "grid",
                      placeItems: "center",

                      borderRadius: 999,

                      bgcolor: "#fff1f2",
                      color: "#dc2626",

                      fontSize: 11,
                      fontWeight: 900,
                    }}
                  >
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </Box>
                ) : null}
              </Stack>

              <Typography
                sx={{
                  mt: 0.4,
                  color: "#64748b",
                  fontSize: 12,
                }}
              >
                Atualizações e atividades do CRM
              </Typography>
            </Box>

            <Tooltip
              title={
                unreadCount === 0
                  ? "Nenhuma notificação pendente"
                  : "Marcar todas como lidas"
              }
              arrow
            >
              <span>
                <IconButton
                  type="button"
                  disabled={unreadCount === 0}
                  onClick={handleMarkAllRead}
                  aria-label="Marcar todas as notificações como lidas"
                  sx={{
                    width: 38,
                    height: 38,

                    borderRadius: "10px",

                    color: headerColors.orange,

                    bgcolor:
                      unreadCount > 0
                        ? "#fff7f2"
                        : "#f8fafc",

                    "&:hover": {
                      bgcolor: "#ffedd5",
                    },

                    "&.Mui-disabled": {
                      color: "#cbd5e1",
                      bgcolor: "#f8fafc",
                    },
                  }}
                >
                  <DoneAllRoundedIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </Stack>
        </Box>

        <Divider />

        {/* LISTA */}
        <Box
          sx={{
            maxHeight: 440,
            overflowY: "auto",

            bgcolor: "#ffffff",

            "&::-webkit-scrollbar": {
              width: 5,
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
          {notifications.map((notification) => {
            const tone = getNotificationTone(notification);

            const isUnread = !notification.readAt;

            return (
              <ListItemButton
                key={notification.id}
                onClick={() =>
                  handleNotificationClick(notification)
                }
                sx={{
                  position: "relative",

                  alignItems: "flex-start",

                  gap: 1.5,

                  px: 2,
                  py: 1.75,

                  borderBottom: "1px solid #f1f5f9",

                  bgcolor: isUnread
                    ? tone.bgcolor
                    : "#ffffff",

                  transition: "all 160ms ease",

                  "&:hover": {
                    bgcolor: tone.hover,
                  },

                  "&::before": isUnread
                    ? {
                      content: '""',

                      position: "absolute",

                      left: 0,
                      top: 12,
                      bottom: 12,

                      width: 3,

                      borderRadius: "0 999px 999px 0",

                      bgcolor: tone.dot,
                    }
                    : {},
                }}
              >
                {/* ÍCONE */}
                <Box
                  sx={{
                    width: 38,
                    height: 38,

                    flexShrink: 0,

                    display: "grid",
                    placeItems: "center",

                    borderRadius: "11px",

                    bgcolor: isUnread
                      ? "#ffffff"
                      : "#f8fafc",

                    border: "1px solid",
                    borderColor: tone.borderColor,

                    color: tone.dot,
                  }}
                >
                  <NotificationsNoneRoundedIcon
                    sx={{
                      fontSize: 19,
                    }}
                  />
                </Box>

                {/* CONTEÚDO */}
                <Box
                  sx={{
                    minWidth: 0,
                    flex: 1,
                  }}
                >
                  <Stack
                    direction="row"
                    sx={{
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      gap: 1,
                    }}
                  >
                    <Typography
                      sx={{
                        minWidth: 0,

                        color: "#0f172a",

                        fontSize: 13.5,
                        fontWeight: isUnread ? 900 : 750,

                        lineHeight: 1.35,

                        display: "-webkit-box",
                        WebkitLineClamp: 1,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {notification.title}
                    </Typography>

                    {isUnread ? (
                      <Box
                        sx={{
                          flexShrink: 0,

                          px: 0.75,
                          py: 0.25,

                          borderRadius: 999,

                          bgcolor: "#ffffff",

                          border: "1px solid",
                          borderColor: tone.borderColor,

                          color: tone.dot,

                          fontSize: 9,
                          fontWeight: 900,

                          letterSpacing: ".06em",
                          textTransform: "uppercase",
                        }}
                      >
                        Nova
                      </Box>
                    ) : null}
                  </Stack>

                  <Typography
                    sx={{
                      mt: 0.5,

                      color: "#64748b",

                      fontSize: 12,
                      lineHeight: 1.55,

                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",

                      overflow: "hidden",
                    }}
                  >
                    {notification.message}
                  </Typography>
                </Box>
              </ListItemButton>
            );
          })}

          {/* ESTADO VAZIO */}
          {notifications.length === 0 ? (
            <Box
              sx={{
                px: 3,
                py: 5,

                display: "flex",
                flexDirection: "column",

                alignItems: "center",
                justifyContent: "center",

                textAlign: "center",
              }}
            >
              <Box
                sx={{
                  width: 52,
                  height: 52,

                  display: "grid",
                  placeItems: "center",

                  borderRadius: "16px",

                  bgcolor: "#f8fafc",
                  color: "#94a3b8",
                }}
              >
                <NotificationsNoneRoundedIcon />
              </Box>

              <Typography
                sx={{
                  mt: 1.5,

                  color: "#334155",

                  fontSize: 14,
                  fontWeight: 900,
                }}
              >
                Tudo certo por aqui
              </Typography>

              <Typography
                sx={{
                  mt: 0.5,

                  maxWidth: 250,

                  color: "#94a3b8",

                  fontSize: 12,
                  lineHeight: 1.5,
                }}
              >
                Você não possui novas notificações no momento.
              </Typography>
            </Box>
          ) : null}
        </Box>
      </Popover>
    </AppBar>
  );
}
