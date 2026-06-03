"use client";

import Badge from "@mui/material/Badge";
import Box from "@mui/material/Box";
import Collapse from "@mui/material/Collapse";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Tooltip from "@mui/material/Tooltip";
import type { LucideIcon } from "lucide-react";
import {
  Building2,
  ChartSpline,
  ChevronDown,
  CircleHelp,
  FileText,
  Handshake,
  History,
  Inbox,
  LayoutDashboard,
  LogOut,
  Megaphone,
  MessageCircle,
  PackageSearch,
  Ticket,
  Truck,
  UserPlus,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/auth-context";
import {
  appScreens,
  isScreenEnabledForRole,
  type AppScreen,
  type ScreenKey,
} from "@/config/screens";
import { getNotifications } from "@/services/notifications.service";
import type { CrmNotification } from "@/types/notifications";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";

const screenIcons: Record<ScreenKey, LucideIcon> = {
  dashboard: LayoutDashboard,
  bi: ChartSpline,
  entregas: Truck,
  trackings: PackageSearch,
  quotes: FileText,
  clients: Building2,
  leads: UserPlus,
  entradas: Inbox,
  tickets: Ticket,
  helpCenter: CircleHelp,
  chat: MessageCircle,
  suppliers: Handshake,
  users: Users,
  marketing: Megaphone,
  logs: History,
};

const sidebarSections: Array<{
  id: string;
  title?: string;
  icon?: LucideIcon;
  keys: ScreenKey[];
}> = [
  { id: "dashboard", keys: ["dashboard"] },
  {
    id: "crm-comercial",
    title: "CRM Comercial",
    icon: ChartSpline,
    keys: ["clients", "leads", "quotes", "bi"],
  },
  {
    id: "operacao",
    title: "Operação",
    icon: Truck,
    keys: ["entregas", "trackings", "suppliers"],
  },
  {
    id: "atendimento",
    title: "Atendimento",
    icon: Inbox,
    keys: ["entradas", "tickets", "chat", "helpCenter"],
  },
  {
    id: "administracao",
    title: "Administração",
    icon: Users,
    keys: ["users", "marketing", "logs"],
  },
];

const sidebarFontFamily = '"Inter Variable", Inter, system-ui, sans-serif';

const menuTextSx = {
  display: "block",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  fontFamily: sidebarFontFamily,
  fontSize: 14,
  fontWeight: 700,
  letterSpacing: 0,
  color: "inherit",
};

const subMenuTextSx = {
  ...menuTextSx,
  fontWeight: 500,
};

const itemButtonSx = {
  minHeight: 55,
  borderRadius: "10px",
  px: 2,
  fontFamily: sidebarFontFamily,
  fontSize: 14,
  color: "#fff",
  transition:
    "background-color 160ms ease, color 160ms ease, box-shadow 160ms ease",
  "&:hover": {
    bgcolor: "rgba(255,255,255,0.08)",
    color: "#fff",
  },
  "&.Mui-selected": {
    bgcolor: "#ec3139",
    color: "#fff",
    boxShadow: "0 18px 32px rgba(236,49,57,0.24)",
  },
  "&.Mui-selected:hover": {
    bgcolor: "#d82931",
  },
  ".MuiListItemIcon-root": {
    minWidth: 52,
    color: "#fab519",
    transition: "color 160ms ease",
  },
  "&.Mui-selected .MuiListItemIcon-root": {
    color: "#fff",
  },
};

const subItemButtonSx = {
  minHeight: 45,
  borderRadius: "12px",
  px: 1.5,
  fontFamily: sidebarFontFamily,
  fontSize: 14,
  color: "#fff",
  transition:
    "background-color 160ms ease, color 160ms ease, box-shadow 160ms ease",
  "&:hover": {
    bgcolor: "rgba(255,255,255,0.08)",
    color: "#fff",
  },
  "&.Mui-selected": {
    bgcolor: "#fff2c2",
    color: "#343434",
    boxShadow: "0 14px 26px rgba(0,0,0,0.18)",
  },
  "&.Mui-selected:hover": {
    bgcolor: "#fff2c2",
  },
  ".MuiListItemIcon-root": {
    minWidth: 44,
    color: "inherit",
  },
};

function isUnreadChatNotification(notification: CrmNotification) {
  if (notification.readAt) return false;

  const type = String(notification.metadata?.type ?? "").toUpperCase();
  const text = `${notification.title} ${notification.message}`.toLowerCase();

  return (
    type === "CHAT_MESSAGE" ||
    text.includes("chat") ||
    text.includes("mensagem")
  );
}

function isScreenActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function getScreenLabel(item: AppScreen, role?: string) {
  return item.href === "/dashboard" && role === "CLIENTE"
    ? "Canal do Cliente"
    : item.label;
}

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { toggleSidebar } = useSidebar();
  const { user, token, signOut } = useAuth();
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  const filteredMenu = appScreens.filter((item) =>
    isScreenEnabledForRole(item, user?.role, user?.screenPermissions),
  );
  const filteredSections = sidebarSections
    .map((section) => ({
      ...section,
      items: section.keys
        .map((key) => filteredMenu.find((item) => item.key === key))
        .filter((item): item is AppScreen => Boolean(item)),
    }))
    .filter((section) => section.items.length > 0);
  const chatBadgeLabel = useMemo(
    () => (unreadChatCount > 9 ? "9+" : String(unreadChatCount)),
    [unreadChatCount],
  );

  useEffect(() => {
    if (!token) {
      setUnreadChatCount(0);
      return;
    }

    let active = true;
    const authToken = token;

    async function loadChatNotifications() {
      const notifications = await getNotifications(authToken);
      if (!active) return;
      setUnreadChatCount(notifications.filter(isUnreadChatNotification).length);
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

  function handleSignOut() {
    signOut();
    router.replace("/login");
  }

  return (
    <Sidebar
      collapsible="icon"
      className="!top-0 z-50 !h-svh border-r border-black/20 bg-[linear-gradient(180deg,#343434_0%,#2f2f2f_52%,#242424_100%)] text-slate-100"
    >
      <SidebarHeader className="bg-transparent px-6 pb-8 pt-8 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:pb-3 group-data-[collapsible=icon]:pt-4">
        <Box className="flex min-w-0 items-center justify-start gap-3 group-data-[collapsible=icon]:justify-center">
          <button
            type="button"
            onClick={toggleSidebar}
            className="grid h-[58px] w-[58px] shrink-0 place-items-center overflow-hidden rounded-xl bg-white p-2 shadow-[0_18px_34px_rgba(236,49,57,0.16)] ring-1 ring-white/10 transition hover:bg-[#fff7df] group-data-[collapsible=icon]:h-11 group-data-[collapsible=icon]:w-11 group-data-[collapsible=icon]:rounded-md group-data-[collapsible=icon]:p-1.5"
            aria-label="Alternar menu lateral"
            title="Alternar menu lateral"
          >
            <img
              src="/logopizzatto.png"
              alt="Pizzattolog"
              className="h-full w-full object-contain object-center"
            />
          </button>

          <Box className="min-w-0 group-data-[collapsible=icon]:hidden">
            <Box
              component="p"
              className="text-[10px] font-bold uppercase leading-4 tracking-[0.18em] text-[#fab519]"
              sx={{ fontFamily: sidebarFontFamily }}
            >
              CRM Portal
            </Box>

            <Box
              component="h2"
              className="mt-1.5 truncate pb-0.5 text-sm font-semibold leading-5 text-white"
              sx={{ fontFamily: sidebarFontFamily }}
            >
              Pizzattolog
            </Box>
          </Box>
        </Box>
      </SidebarHeader>

      <SidebarContent className="bg-transparent px-4 py-2 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:px-0">
        <Box
          component="nav"
          aria-label="Navegação principal"
          className="flex flex-col gap-2 group-data-[collapsible=icon]:w-full group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:gap-2"
        >
          {filteredSections.map((section) => {
            const sectionActive = section.items.some((item) =>
              isScreenActive(pathname, item.href),
            );
            const sectionOpen = openSections[section.id] ?? sectionActive;

            if (!section.title) {
              return (
                <List
                  key={section.id}
                  disablePadding
                  sx={{ display: "grid", gap: 0.5 }}
                >
                  {section.items.map((item) => {
                    const active = isScreenActive(pathname, item.href);
                    const Icon = screenIcons[item.key];
                    const label = getScreenLabel(item, user?.role);

                    return (
                      <Tooltip
                        key={item.href}
                        title={label}
                        placement="right"
                        arrow
                      >
                        <ListItemButton
                          component={Link}
                          href={item.href}
                          selected={active}
                          sx={itemButtonSx}
                          className="relative group-data-[collapsible=icon]:h-11! group-data-[collapsible=icon]:w-11! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0! group-data-[collapsible=icon]:[&_.MuiListItemIcon-root]:flex! group-data-[collapsible=icon]:[&_.MuiListItemIcon-root]:w-full! group-data-[collapsible=icon]:[&_.MuiListItemIcon-root]:min-w-0! group-data-[collapsible=icon]:[&_.MuiListItemIcon-root]:justify-center!"
                        >
                          {active ? (
                            <Box className="absolute -right-2 top-1/2 hidden h-6 w-1 -translate-y-1/2 rounded-l-full bg-[#fab519] group-data-[collapsible=icon]:block" />
                          ) : null}

                          <ListItemIcon className="group-data-[collapsible=icon]:min-w-0!">
                            <Icon className="h-4.5 w-4.5" />
                          </ListItemIcon>

                          <ListItemText
                            primary={
                              <Box component="span" sx={menuTextSx}>
                                {label}
                              </Box>
                            }
                            className="group-data-[collapsible=icon]:hidden"
                          />
                        </ListItemButton>
                      </Tooltip>
                    );
                  })}
                </List>
              );
            }

            const SectionIcon = section.icon;

            return (
              <List
                key={section.id}
                disablePadding
                sx={{ display: "grid", gap: 0.5 }}
              >
                <Tooltip title={section.title} placement="right" arrow>
                  <ListItemButton
                    selected={sectionActive}
                    aria-expanded={sectionOpen}
                    onClick={() =>
                      setOpenSections((current) => ({
                        ...current,
                        [section.id]: !(current[section.id] ?? sectionActive),
                      }))
                    }
                    sx={itemButtonSx}
                    className="group-data-[collapsible=icon]:h-11! group-data-[collapsible=icon]:w-11! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0! group-data-[collapsible=icon]:[&_.MuiListItemIcon-root]:flex! group-data-[collapsible=icon]:[&_.MuiListItemIcon-root]:w-full! group-data-[collapsible=icon]:[&_.MuiListItemIcon-root]:min-w-0! group-data-[collapsible=icon]:[&_.MuiListItemIcon-root]:justify-center!"
                  >
                    <ListItemIcon className="group-data-[collapsible=icon]:min-w-0!">
                      {SectionIcon ? (
                        <SectionIcon className="h-4.5 w-4.5" />
                      ) : null}
                    </ListItemIcon>

                    <ListItemText
                      primary={
                        <Box component="span" sx={menuTextSx}>
                          {section.title}
                        </Box>
                      }
                      className="group-data-[collapsible=icon]:hidden"
                    />

                    <ChevronDown
                      className={`h-4 w-4 text-white/55 transition-transform group-data-[collapsible=icon]:hidden ${
                        sectionOpen ? "rotate-180" : ""
                      }`}
                    />
                  </ListItemButton>
                </Tooltip>

                <Collapse
                  in={sectionOpen}
                  timeout={180}
                  unmountOnExit
                  className="group-data-[collapsible=icon]:hidden"
                >
                  <List
                    disablePadding
                    sx={{
                      mx: 0.5,
                      my: 0.5,
                      p: 1.5,
                      border: "1px solid rgba(255,255,255,0.06)",
                      borderRadius: "14px",
                      bgcolor: "rgba(0,0,0,0.12)",
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
                      display: "grid",
                      gap: 0.75,
                    }}
                  >
                    {section.items.map((item) => {
                      const active = isScreenActive(pathname, item.href);
                      const Icon = screenIcons[item.key];

                      return (
                        <ListItemButton
                          key={item.href}
                          component={Link}
                          href={item.href}
                          selected={active}
                          sx={subItemButtonSx}
                        >
                          <ListItemIcon>
                            <Icon className="h-4 w-4" />
                          </ListItemIcon>

                          <ListItemText
                            primary={
                              <Box component="span" sx={subMenuTextSx}>
                                {item.label}
                              </Box>
                            }
                          />

                          {item.key === "chat" && unreadChatCount > 0 ? (
                            <Badge
                              badgeContent={chatBadgeLabel}
                              sx={{
                                "& .MuiBadge-badge": {
                                  bgcolor: "#ec3139",
                                  color: "#fff",
                                  fontWeight: 900,
                                  fontSize: 10,
                                  height: 16,
                                  minWidth: 16,
                                  border: "2px solid #fab519",
                                },
                              }}
                            />
                          ) : null}
                        </ListItemButton>
                      );
                    })}
                  </List>
                </Collapse>
              </List>
            );
          })}
        </Box>
      </SidebarContent>

      <SidebarFooter className="mt-auto border-t border-white/8 bg-transparent px-4 py-4 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:px-0">
        <button
          type="button"
          onClick={handleSignOut}
          className="flex h-11 w-full items-center gap-3 rounded-md px-2 text-sm font-semibold text-white/78 transition hover:bg-white/[0.08] hover:text-white group-data-[collapsible=icon]:w-11 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
          style={{ fontFamily: sidebarFontFamily, fontSize: 14 }}
          aria-label="Sair"
          title="Sair"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-[#fab519] transition group-hover:text-[#ffd267]">
            <LogOut className="h-4.5 w-4.5" />
          </span>

          <span className="truncate group-data-[collapsible=icon]:hidden">
            Sair
          </span>
        </button>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
