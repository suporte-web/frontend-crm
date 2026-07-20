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
import Paper from "@mui/material/Paper";
import Popover from "@mui/material/Popover";
import Stack from "@mui/material/Stack";
import Toolbar from "@mui/material/Toolbar";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";

import AppsRoundedIcon from "@mui/icons-material/AppsRounded";
import DoneAllRoundedIcon from "@mui/icons-material/DoneAllRounded";
import NotificationsNoneRoundedIcon from "@mui/icons-material/NotificationsNoneRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";

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
  page: "#fbf7ef",
  text: "#343434",
  muted: "#64748b",
  border: "rgba(52, 52, 52, 0.10)",
  orange: "#ff4d00",
  red: "#ec3139",
  yellow: "#fab519",
};

function getPageTitle(pathname: string, role?: string) {
  if (pathname.startsWith("/painel")) {
    return role === "CLIENTE" ? "Canal do Cliente" : "Dashboard";
  }

  if (pathname.startsWith("/bi")) return "BI Comercial";
  if (pathname.startsWith("/rastreamentos")) return "Rastreamento";
  if (pathname.startsWith("/cotacoes")) return "Cotações";
  if (pathname.startsWith("/clientes")) return "Clientes";
  if (pathname.startsWith("/leads")) return "Leads";
  if (pathname.startsWith("/chamados")) return "Chamados";
  if (pathname.startsWith("/usuarios")) return "Usuários";
  if (pathname.startsWith("/marketing")) return "Marketing";
  if (pathname.startsWith("/entregas")) return "Entregas";
  if (pathname.startsWith("/entradas")) return "Central de Entradas";
  if (pathname.startsWith("/fornecedores")) return "Fornecedores";
  if (pathname.startsWith("/chat")) return "Chat";
  if (pathname.startsWith("/logs")) return "Logs";

  return "CRM";
}

function getRoleLabel(role?: string) {
  if (!role) return "Perfil";

  const labels: Record<string, string> = {
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

  if (link.startsWith("/tickets/") || link.startsWith("/chamados/")) {
    return `/chamados?ticket=${link.split("/").pop()}`;
  }

  if (link === "/tickets") {
    return "/chamados";
  }

  return link;
}

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, token } = useAuth();

  const [appsAnchorEl, setAppsAnchorEl] = useState<HTMLElement | null>(null);
  const [notificationsAnchorEl, setNotificationsAnchorEl] =
    useState<HTMLElement | null>(null);
  const [notifications, setNotifications] = useState<CrmNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const userFirstName = user?.name?.split(" ").filter(Boolean)[0] ?? "Usuário";
  const pageTitle = getPageTitle(pathname, user?.role);
  const appsOpen = Boolean(appsAnchorEl);
  const notificationsOpen = Boolean(notificationsAnchorEl);
  const availableScreens = appScreens.filter((item) =>
    isScreenEnabledForRole(item, user?.role, user?.screenPermissions),
  );

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
                loadNotifications().catch(() => undefined);
              }}
              aria-label="Notificações"
              sx={{
                width: 40,
                height: 40,
                color: headerColors.text,
                bgcolor: notificationsOpen
                  ? "rgba(52,52,52,0.08)"
                  : "transparent",
                "&:hover": { bgcolor: "rgba(52,52,52,0.08)" },
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

          <Paper
            elevation={0}
            sx={{
              display: { xs: "none", sm: "flex" },
              alignItems: "center",
              gap: 1,
              ml: 1,
              py: 0.75,
              pl: 0.75,
              pr: 1.5,
              border: `1px solid ${headerColors.border}`,
              borderRadius: 999,
              bgcolor: "rgba(255,255,255,0.86)",
              boxShadow: "0 8px 22px rgba(52,52,52,0.08)",
            }}
            title={`${user?.name ?? "Usuário"}${
              user?.role ? ` (${getRoleLabel(user.role)})` : ""
            }`}
          >
            <Avatar
              sx={{
                width: 38,
                height: 38,
                bgcolor: headerColors.red,
                color: "#ffffff",
                fontSize: 13,
                fontWeight: 900,
                border: `2px solid ${headerColors.yellow}`,
              }}
            >
              {userFirstName.slice(0, 1)}
            </Avatar>

            <Typography
              noWrap
              sx={{
                maxWidth: 130,
                color: headerColors.text,
                fontSize: 14,
                fontWeight: 900,
              }}
            >
              {userFirstName}
            </Typography>
          </Paper>
        </Stack>
      </Toolbar>

      <Popover
        open={appsOpen}
        anchorEl={appsAnchorEl}
        onClose={() => setAppsAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: {
            sx: {
              mt: 1,
              width: 324,
              border: "1px solid #e2e8f0",
              borderRadius: "14px",
              boxShadow: "0 24px 70px rgba(15,23,42,0.16)",
              overflow: "hidden",
            },
          },
        }}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: 0.75,
            p: 1,
            bgcolor: "#ffffff",
          }}
        >
          {availableScreens.slice(0, 10).map((item) => (
            <Button
              key={item.href}
              component={Link}
              href={item.href}
              onClick={() => setAppsAnchorEl(null)}
              sx={{
                justifyContent: "flex-start",
                minHeight: 46,
                px: 1.5,
                borderRadius: "10px",
                color: headerColors.text,
                fontSize: 13,
                fontWeight: 800,
                textTransform: "none",
                "&:hover": {
                  bgcolor: "#fff7df",
                  color: headerColors.red,
                },
              }}
            >
              {item.href === "/painel" && user?.role === "CLIENTE"
                ? "Canal do Cliente"
                : item.label}
            </Button>
          ))}
        </Box>
      </Popover>

      <Popover
        open={notificationsOpen}
        anchorEl={notificationsAnchorEl}
        onClose={() => setNotificationsAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: {
            sx: {
              mt: 1,
              width: { xs: 330, sm: 380 },
              border: "1px solid #e2e8f0",
              borderRadius: "14px",
              boxShadow: "0 24px 70px rgba(15,23,42,0.16)",
              overflow: "hidden",
            },
          },
        }}
      >
        <Stack
          direction="row"
          spacing={2}
          sx={{
            alignItems: "center",
            justifyContent: "space-between",
            px: 2,
            py: 1.75,
            bgcolor: "#ffffff",
          }}
        >
          <Box>
            <Typography sx={{ color: "#020617", fontSize: 14, fontWeight: 900 }}>
              Notificações
            </Typography>
            <Typography sx={{ mt: 0.25, color: headerColors.muted, fontSize: 12 }}>
              {unreadCount} não lida(s)
            </Typography>
          </Box>

          <Button
            type="button"
            variant="outlined"
            size="small"
            startIcon={<DoneAllRoundedIcon fontSize="small" />}
            onClick={handleMarkAllRead}
            sx={{
              borderRadius: "10px",
              borderColor: "#e2e8f0",
              color: headerColors.text,
              fontSize: 12,
              fontWeight: 800,
              textTransform: "none",
              "&:hover": {
                borderColor: headerColors.orange,
                bgcolor: "#fff7f2",
              },
            }}
          >
            Marcar lidas
          </Button>
        </Stack>

        <Divider />

        <Box sx={{ maxHeight: 420, overflowY: "auto", bgcolor: "#ffffff" }}>
          {notifications.map((notification) => {
            const tone = getNotificationTone(notification);

            return (
              <ListItemButton
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                sx={{
                  alignItems: "flex-start",
                  gap: 1.5,
                  px: 2,
                  py: 1.5,
                  borderBottom: "1px solid",
                  borderColor: tone.borderColor,
                  bgcolor: tone.bgcolor,
                  "&:hover": {
                    bgcolor: tone.hover,
                  },
                }}
              >
                <Box
                  sx={{
                    mt: 0.75,
                    width: 8,
                    height: 8,
                    flexShrink: 0,
                    borderRadius: 999,
                    bgcolor: notification.readAt ? "#cbd5e1" : tone.dot,
                  }}
                />

                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    noWrap
                    sx={{ color: "#020617", fontSize: 14, fontWeight: 900 }}
                  >
                    {notification.title}
                  </Typography>

                  <Typography
                    sx={{
                      mt: 0.5,
                      color: headerColors.muted,
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

          {notifications.length === 0 ? (
            <Typography
              sx={{
                px: 2,
                py: 4,
                color: headerColors.muted,
                fontSize: 14,
                textAlign: "center",
              }}
            >
              Nenhuma notificação.
            </Typography>
          ) : null}
        </Box>
      </Popover>
    </AppBar>
  );
}
