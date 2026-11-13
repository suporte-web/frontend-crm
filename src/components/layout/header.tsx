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
import { Camera, KeyRound } from "lucide-react";
import { useProfilePhoto } from '@/components/profile/use-profile-photo';
import { ProfilePhotoDialog } from '@/components/profile/profile-photo-dialog';
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";

import { getPageTop } from "@/config/page-top";
import { PageTopHeading, usePageTop } from "./page-top";
import { screenIcons } from "./sidebar-config";


import { SidebarTrigger } from "@/components/ui/sidebar";
import { appScreens, isScreenEnabledForRole } from "@/config/screens";
import { useAuth } from "@/context/auth-context";
import { getNotifications, getUnreadNotificationCount, markAllNotificationsRead, markNotificationRead } from "@/services/notifications.service";
import { normalizeNotificationLink } from "@/lib/notification-links";
import type { CrmNotification } from "@/types/notifications";

const headerColors = {
  page: "#ffffff",
  text: "#343434",
  muted: "#64748b",
  border: "rgba(52, 52, 52, 0.10)",
  orange: "#ff5805",
  red: "#ec3139",
  yellow: "#fab519",
};

function getRoleLabel(role?: string) {
  if (!role) return "Perfil";

  const labels: Record<string, string> = {
    LIDER_ATENDIMENTO: "Líder de Atendimento",
    ATENDIMENTO: "Atendimento",
    ADMIN: "Administrador",
    GESTAO: "Gestão",
    COMERCIAL: "Comercial",
    CONSULTORA: "Consultora",
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

export function Header() {
  const pathname = usePathname();
  const pageTop = usePageTop();
  const pageInfo = getPageTop(pathname);
  const router = useRouter();
  const { user, token, signOut } = useAuth();

  const { photoUrl, loadError: photoLoadError, save: savePhoto, remove: removePhoto } = useProfilePhoto(user?.id, token);
  const [photoDialogOpen, setPhotoDialogOpen] = useState(false);
  useEffect(() => { setPhotoDialogOpen(false); }, [user?.id]);
  function editPhoto() { setProfileAnchorEl(null); setPhotoDialogOpen(true); }

  const [appsAnchorEl, setAppsAnchorEl] = useState<HTMLElement | null>(null);
  const [notificationsAnchorEl, setNotificationsAnchorEl] =
    useState<HTMLElement | null>(null);

  const [profileAnchorEl, setProfileAnchorEl] =
    useState<HTMLElement | null>(null);

  const [notifications, setNotifications] = useState<CrmNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const userFirstName = user?.name?.split(" ").filter(Boolean)[0] ?? "Usuário";
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
    if (!token || user?.role === 'CONSULTORA') {
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
    if (!token || user?.role === 'CONSULTORA') return;

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

    if (targetLink) router.push(targetLink);
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
        bgcolor: "#ffffff",
        ml: { xs: 0, md: `${pageTop?.sidebarWidth ?? 264}px` },
        width: { xs: "100%", md: `calc(100% - ${pageTop?.sidebarWidth ?? 264}px)` },
        transition: "margin-left 180ms ease, width 180ms ease",
        color: "#343434",
        borderBottom: `1px solid ${headerColors.border}`,
        boxShadow: "none",
      }}
    >
      <Toolbar
        disableGutters
        sx={{
          minHeight: { xs: 84, sm: 84 },
          display: { xs: "grid", md: "flex" },
          gridTemplateColumns: "40px minmax(0, 1fr)",
          py: 1.25,
          flexWrap: { xs: "wrap", md: "nowrap" },
          alignItems: "center",
          px: { xs: 2, md: 3 },
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        <Box sx={{ display: { xs: 'block', md: 'none' }, flexShrink: 0 }}>
          <SidebarTrigger className="h-10 w-10 rounded-md text-[#343434] hover:bg-[#343434]/8" />
        </Box>
        <Box ref={pageTop?.setTarget} data-page-top-target sx={{ flex: '1 1 320px', minWidth: 0, gridColumn: { xs: '1 / -1', md: 'auto' }, gridRow: { xs: 2, md: 'auto' },
          '&:has(> [data-page-top-content]) > [data-page-top-fallback]': { display: 'none' },
        }}>
          <Box data-page-top-fallback>
            <PageTopHeading title={pageInfo?.title || 'CRM Pizzattolog'} description={pageInfo?.description} />
          </Box>
        </Box>

        <Stack direction="row" spacing={1} data-page-top-tools sx={{ alignItems: "center", flexShrink: 0, gridColumn: { xs: 2, md: "auto" }, gridRow: { xs: 1, md: "auto" }, ml: { xs: "auto", md: 0 }, "& > .MuiIconButton-root": { color: "#343434", "&:hover": { bgcolor: "rgba(52,52,52,.08)", color: "#343434" } } }}>
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

          {user?.role !== 'CONSULTORA' && <Tooltip title="Notificações" arrow>
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

                borderRadius: "8px",

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
                    bgcolor: headerColors.orange,
                    color: "#ffffff",
                    fontSize: 10,
                    fontWeight: 600,
                    border: "1px solid #fff",
                  },
                }}
              >
                <NotificationsNoneRoundedIcon fontSize="small" />
              </Badge>
            </IconButton>
          </Tooltip>}

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
            aria-haspopup="true"
            sx={{
              display: "flex",
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

              borderRadius: "8px",

              bgcolor: profileOpen
                ? "#fff7f2"
                : "#ffffff",

              boxShadow: "none",

              transition: "all 180ms ease",

              "&:hover": {
                bgcolor: "#fff7f2",
                borderColor: "rgba(255,77,0,0.25)",
              },
            }}
          >
            <Avatar src={photoUrl || undefined} alt={user?.name || "Perfil"}
              sx={{
                width: 32,
                height: 32,

                bgcolor: headerColors.orange,
                color: "#ffffff",

                fontSize: 14,
                fontWeight: 600,
              }}
            >
              {userFirstName.slice(0, 1).toUpperCase()}
            </Avatar>

            <Box
              sx={{
                minWidth: 0,
                textAlign: "left",
                display: { xs: "none", sm: "block" },
              }}
            >
              <Typography
                noWrap
                sx={{
                  maxWidth: 125,
                  color: headerColors.text,
                  fontSize: 14,
                  fontWeight: 600,
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

              width: 340,

              border: "1px solid #e2e8f0",
              borderRadius: "12px",
              maxWidth: "calc(100vw - 24px)",
              maxHeight: "calc(100dvh - 96px)",

              bgcolor: "#ffffff",

              boxShadow: "none",

              overflowX: "hidden", overflowY: "auto",
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
          <Box sx={{ position: 'relative', flexShrink: 0 }}>
          <Avatar src={photoUrl || undefined} alt={user?.name || "Perfil"}
              sx={{
              width: 56,
              height: 56,

              bgcolor: headerColors.orange,
              color: "#ffffff",

              fontSize: 16,
              fontWeight: 600,
            }}
          >
            {userFirstName.slice(0, 1).toUpperCase()}
          </Avatar>
            <IconButton aria-label="Editar foto de perfil" onClick={editPhoto} size="small" sx={{ position: 'absolute', bottom: -4, right: -4, width: 25, height: 25, bgcolor: '#fff', border: '1px solid #e2e8f0', color: '#ff5805', '&:hover': { bgcolor: '#fff4eb' } }}><Camera size={13}/></IconButton>
          </Box>

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
                fontWeight: 600,
              }}
            >
              {user?.name ?? "Usuário"}
            </Typography>

            <Typography
              sx={{
                mt: 0.25,
                color: headerColors.muted,
                fontSize: 12,
                fontWeight: 600,
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

        <ListItemButton onClick={editPhoto} sx={{ minHeight: 44, gap: 1.5, px: 2, fontSize: 14, color: '#334155', '&:hover': { bgcolor: '#fff4eb', color: '#c94600' } }}>
          <Camera size={18}/><Typography sx={{ fontSize: 14, fontWeight: 500 }}>{photoUrl ? 'Alterar foto de perfil' : 'Adicionar foto de perfil'}</Typography>
        </ListItemButton>
        {/* CONFIGURAÇÕES */}
        <ListItemButton
          onClick={() => {
            setProfileAnchorEl(null);
            router.push("/alterar-senha");
          }}
          sx={{
            minHeight: 44,
            gap: 1.5,
            px: 2,

            color: "#334155",

            "&:hover": {
              bgcolor: "#f8fafc",
              color: headerColors.orange,
            },
          }}
        >
          <KeyRound size={18} />

          <Typography
            sx={{
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            Alterar senha
          </Typography>
        </ListItemButton>

        <Divider sx={{ display: { xs: "block", md: "none" } }} />

        {/* Acesso à saída no celular, onde o sidebar permanente fica oculto. */}
        <ListItemButton
          onClick={handleSignOut}
          sx={{
            display: { xs: "flex", md: "none" },
            minHeight: 44,
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
              fontWeight: 600,
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
              borderRadius: "12px",
              maxWidth: "calc(100vw - 24px)",
              maxHeight: "calc(100dvh - 96px)",

              bgcolor: "#ffffff",

              boxShadow: "none",

              overflowX: "hidden", overflowY: "auto",
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
              fontWeight: 600,
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

            maxHeight: "min(410px, 60dvh)",
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
                  minHeight: 80,

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

                  borderRadius: "8px",

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
                    transform: "none",
                    boxShadow: "none",
                  },
                }}
              >
                <Box
                  sx={{
                    width: 32,
                    height: 32,

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
                    <ScreenIcon size={18} />
                  ) : (
                    <AppsRoundedIcon fontSize="small" />
                  )}
                </Box>

                <Typography
                  sx={{
                    width: "100%",
                    lineHeight: 1.35,
                    overflowWrap: "anywhere",

                    color: "inherit",

                    fontSize: 12,
                    fontWeight: 600,

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
              borderRadius: "12px",
              maxWidth: "calc(100vw - 24px)",
              maxHeight: "calc(100dvh - 96px)",

              bgcolor: "#ffffff",

              boxShadow: "none",

              overflowX: "hidden", overflowY: "auto",
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
                    fontWeight: 600,
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

                      bgcolor: "#fff4eb",
                      color: "#c94600",

                      fontSize: 11,
                      fontWeight: 600,
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

                    borderRadius: "8px",

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
            maxHeight: "min(440px, 60dvh)",
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

                    borderRadius: "8px",

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
                        fontWeight: isUnread ? 600 : 400,

                        lineHeight: 1.35,

                        display: "-webkit-box",
                        WebkitLineClamp: 1,
                        WebkitBoxOrient: "vertical",
                        overflowX: "hidden", overflowY: "auto",
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
                          fontWeight: 600,

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

                      overflowX: "hidden", overflowY: "auto",
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

                  borderRadius: "8px",

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
                  fontWeight: 600,
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
      {photoDialogOpen && user && <ProfilePhotoDialog key={user.id} name={user.name} photoUrl={photoUrl} loadError={photoLoadError} onClose={() => setPhotoDialogOpen(false)} onSave={savePhoto} onRemove={removePhoto}/>}
    </AppBar>
  );
}
