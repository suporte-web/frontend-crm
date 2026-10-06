"use client";

import Badge from "@mui/material/Badge";
import Box from "@mui/material/Box";
import Collapse from "@mui/material/Collapse";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Tooltip from "@mui/material/Tooltip";

import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";

import Link from "next/link";

import type { AppScreen } from "@/config/screens";
import { screenIcons, type SidebarSectionConfig } from "./sidebar-config";
import { getScreenLabel, isScreenActive } from "./sidebar-utils";

export type SidebarSectionWithItems = SidebarSectionConfig & {
  items: AppScreen[];
};

type SidebarNavigationProps = {
  sections: SidebarSectionWithItems[];
  pathname: string;
  role?: string;
  unreadChatCount: number;
  openSections: Record<string, boolean>;
  collapsed?: boolean;
  onToggleSection: (sectionId: string, fallbackOpen: boolean) => void;
};

const sidebarColors = {
  orange: "#ff4d00",
  orangeDark: "#ff5805",
  orangeSoft: "#fff0e8",
  orangeHover: "#ffe4d6",

  background: "#ffffff",
  submenuBackground: "transparent",

  text: "#0f172a",
  muted: "#64748b",
  mutedLight: "#94a3b8",

  border: "#e2e8f0",

  danger: "#dc2626",
};

export function SidebarNavigation({
  sections,
  pathname,
  role,
  unreadChatCount,
  openSections,
  collapsed = false,
  onToggleSection,
}: SidebarNavigationProps) {
  const chatBadgeLabel = unreadChatCount > 9 ? "9+" : String(unreadChatCount);

  return (
    <Box
      component="nav"
      aria-label="Navegação principal"
      sx={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 1,
      }}
    >
      {sections.map((section) => {
        const sectionActive = section.items.some((item) =>
          isScreenActive(pathname, item.href),
        );

        const sectionOpen = openSections[section.id] ?? sectionActive;

        /*
         * Seção sem título:
         * renderiza os itens diretamente.
         */
        if (!section.title) {
          return (
            <List
              key={section.id}
              disablePadding
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 0.75,
              }}
            >
              {section.items.map((item) => {
                const active = isScreenActive(pathname, item.href);

                const Icon = screenIcons[item.key];

                const label = getScreenLabel(item, role);

                const menuButton = (
                  <ListItemButton
                    component={Link}
                    href={item.href}
                    selected={active}
                    sx={{
                      position: "relative",

                      width: collapsed ? 48 : "100%",
                      minWidth: collapsed ? 48 : 0,
                      minHeight: 48,

                      px: collapsed ? 0 : 1.5,

                      justifyContent: collapsed ? "center" : "flex-start",

                      borderRadius: "12px",

                      color: active
                        ? sidebarColors.orangeDark
                        : sidebarColors.muted,

                      transition:
                        "background-color 160ms ease, color 160ms ease",

                      "&:hover": {
                        bgcolor: sidebarColors.orangeSoft,
                        color: sidebarColors.orangeDark,
                      },

                      "&.Mui-selected": {
                        bgcolor: sidebarColors.orangeSoft,
                        color: sidebarColors.orangeDark,
                      },

                      "&.Mui-selected:hover": {
                        bgcolor: sidebarColors.orangeHover,
                      },

                      "&.Mui-selected::before": {
                        content: '""',
                        position: "absolute",
                        left: 0,
                        top: "50%",
                        width: 4,
                        height: 26,
                        borderRadius: "0 6px 6px 0",
                        bgcolor: sidebarColors.orange,
                        transform: "translateY(-50%)",
                      },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: collapsed ? 0 : 40,

                        display: "flex",
                        justifyContent: "center",

                        color: active ? sidebarColors.orange : "inherit",

                        "& svg": {
                          width: 20,
                          height: 20,
                        },
                      }}
                    >
                      <Icon />
                    </ListItemIcon>

                    {!collapsed ? (
                      <ListItemText
                        disableTypography
                        primary={
                          <Box
                            component="span"
                            sx={{
                              minWidth: 0,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              fontSize: 14,
                              fontWeight: active ? 800 : 700,
                              lineHeight: 1.2,
                            }}
                          >
                            {label}
                          </Box>
                        }
                      />
                    ) : null}
                  </ListItemButton>
                );

                return (
                  <Tooltip
                    key={item.href}
                    title={collapsed ? label : ""}
                    placement="right"
                    arrow
                  >
                    {menuButton}
                  </Tooltip>
                );
              })}
            </List>
          );
        }

        /*
         * Seção com título:
         * renderiza o cabeçalho e o submenu.
         */
        const SectionIcon = section.icon;

        const sectionButton = (
          <ListItemButton
            selected={sectionActive}
            aria-expanded={collapsed ? undefined : sectionOpen}
            onClick={() => {
              if (!collapsed) {
                onToggleSection(section.id, sectionActive);
              }
            }}
            sx={{
              position: "relative",

              width: collapsed ? 48 : "100%",
              minWidth: collapsed ? 48 : 0,
              minHeight: 48,

              px: collapsed ? 0 : 1.5,

              justifyContent: collapsed ? "center" : "flex-start",

              borderRadius: "12px",

              color: sectionActive
                ? sidebarColors.orangeDark
                : sidebarColors.muted,

              transition: "background-color 160ms ease, color 160ms ease",

              "&:hover": {
                bgcolor: sidebarColors.orangeSoft,
                color: sidebarColors.orangeDark,
              },

              "&.Mui-selected": {
                bgcolor: sidebarColors.orangeSoft,
                color: sidebarColors.orangeDark,
              },

              "&.Mui-selected:hover": {
                bgcolor: sidebarColors.orangeHover,
              },

              "&.Mui-selected::before": {
                content: '""',
                position: "absolute",
                left: 0,
                top: "50%",
                width: 4,
                height: 26,
                borderRadius: "0 6px 6px 0",
                bgcolor: sidebarColors.orange,
                transform: "translateY(-50%)",
              },
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: collapsed ? 0 : 40,

                display: "flex",
                justifyContent: "center",

                color: sectionActive ? sidebarColors.orange : "inherit",

                "& svg": {
                  width: 20,
                  height: 20,
                },
              }}
            >
              {SectionIcon ? <SectionIcon /> : null}
            </ListItemIcon>

            {!collapsed ? (
              <>
                <ListItemText
                  disableTypography
                  primary={
                    <Box
                      component="span"
                      sx={{
                        minWidth: 0,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        fontSize: 14,
                        fontWeight: sectionActive ? 800 : 700,
                        lineHeight: 1.2,
                      }}
                    >
                      {section.title}
                    </Box>
                  }
                />

                <ExpandMoreRoundedIcon
                  sx={{
                    ml: 1,
                    fontSize: 20,
                    color: sectionActive
                      ? sidebarColors.orange
                      : sidebarColors.mutedLight,

                    transform: sectionOpen ? "rotate(180deg)" : "rotate(0deg)",

                    transition: "transform 180ms ease",
                  }}
                />
              </>
            ) : null}
          </ListItemButton>
        );

        return (
          <List
            key={section.id}
            disablePadding
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 0.5,
            }}
          >
            <Tooltip
              title={collapsed ? section.title : ""}
              placement="right"
              arrow
            >
              {sectionButton}
            </Tooltip>

            {!collapsed ? (
              <Collapse in={sectionOpen} timeout={180} unmountOnExit>
                <List
                  disablePadding
                  sx={{
                    mx: 0.75,
                    mt: 0.5,
                    mb: 0.75,

                    p: 1,

                    display: "flex",
                    flexDirection: "column",
                    gap: 0.5,

                    border: "none",
                    borderRadius: "12px",

                    bgcolor: sidebarColors.submenuBackground,
                  }}
                >
                  {section.items.map((item) => {
                    const active =
                      pathname === item.href ||
                      (
                        pathname.startsWith(`${item.href}/`) &&
                        !section.items.some(
                          (outroItem) =>
                            outroItem.href !== item.href &&
                            pathname === outroItem.href
                        )
                      );

                    const Icon = screenIcons[item.key];

                    const label = getScreenLabel(item, role);

                    return (
                      <ListItemButton
                        key={item.href}
                        component={Link}
                        href={item.href}
                        selected={active}
                        sx={{
                          position: "relative",

                          minHeight: 42,
                          px: 1.25,

                          borderRadius: "10px",

                          color: active
                            ? sidebarColors.orangeDark
                            : sidebarColors.muted,

                          "&:hover": {
                            bgcolor: sidebarColors.orangeSoft,
                            color: sidebarColors.orangeDark,
                          },

                          "&.Mui-selected": {
                            bgcolor: sidebarColors.orangeSoft,
                            color: sidebarColors.orangeDark,
                          },

                          "&.Mui-selected:hover": {
                            bgcolor: sidebarColors.orangeHover,
                          },
                        }}
                      >
                        <ListItemIcon
                          sx={{
                            minWidth: 34,
                            color: active ? sidebarColors.orange : "inherit",

                            "& svg": {
                              width: 18,
                              height: 18,
                            },
                          }}
                        >
                          <Icon />
                        </ListItemIcon>

                        <ListItemText
                          disableTypography
                          primary={
                            <Box
                              component="span"
                              sx={{
                                minWidth: 0,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                fontSize: 13,
                                fontWeight: active ? 800 : 700,
                                lineHeight: 1.2,
                              }}
                            >
                              {label}
                            </Box>
                          }
                        />

                        {item.key === "chat" && unreadChatCount > 0 ? (
                          <Badge
                            badgeContent={chatBadgeLabel}
                            sx={{
                              mr: 1,

                              "& .MuiBadge-badge": {
                                position: "static",
                                transform: "none",

                                bgcolor: sidebarColors.danger,
                                color: "#ffffff",

                                fontSize: 10,
                                fontWeight: 900,

                                height: 20,
                                minWidth: 20,

                                px: 0.5,

                                border: "2px solid #ffffff",
                              },
                            }}
                          />
                        ) : null}
                      </ListItemButton>
                    );
                  })}
                </List>
              </Collapse>
            ) : null}
          </List>
        );
      })}
    </Box>
  );
}
