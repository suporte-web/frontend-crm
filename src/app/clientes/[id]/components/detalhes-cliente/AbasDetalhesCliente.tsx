"use client";

import Link from "next/link";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import SwapHorizOutlinedIcon from "@mui/icons-material/SwapHorizOutlined";
import Tabs from "@mui/material/Tabs";

import BusinessOutlinedIcon from "@mui/icons-material/BusinessOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import AutoGraphOutlinedIcon from "@mui/icons-material/AutoGraphOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import ManageHistoryOutlinedIcon from "@mui/icons-material/ManageHistoryOutlined";

import {
  CrmSection,
  crmPalette,
} from "@/components/mui/crm-primitives";

import type { LeadDetail } from "@/types/crm";

type PropriedadesAbasDetalhesCliente = {
  lead: LeadDetail | null;

  activeTab: number;

  setActiveTab: (nextTab: number) => void;
};

const tabsDetalhesCliente = [
  {
    label: "Cadastro",
    icon: <BusinessOutlinedIcon />,
    value: 0,
  },
  {
    label: "Contatos",
    value: 2,
    icon: <GroupsOutlinedIcon />,
  },
  {
    label: "Condições comerciais",
    value: 3,
    icon: <AccountBalanceWalletOutlinedIcon />,
  },
  {
    label: "Acesso às oportunidades",
    value: 4,
    icon: <AutoGraphOutlinedIcon />,
  },
  {
    label: "Documentos",
    value: 5,
    icon: <DescriptionOutlinedIcon />,
  },
  {
    label: "Histórico",
    value: 6,
    icon: <ManageHistoryOutlinedIcon />,
  },
  {
    label: "Modalidade",
    value: 7,
    icon: <SwapHorizOutlinedIcon />,
  },
];

export function AbasDetalhesCliente({
  lead,
  activeTab,
  setActiveTab,
}: PropriedadesAbasDetalhesCliente) {
  if (!lead) {
    return null;
  }

  return (
    <CrmSection
      sx={{
        p: 1,

        overflow: "hidden",

        borderRadius: "16px",

        border: `1px solid ${crmPalette.border}`,

        bgcolor: "#ffffff",

        boxShadow:
          "0 4px 14px rgba(15, 23, 42, 0.03)",
      }}
    >
      <Stack direction={{ xs: "column", xl: "row" }} spacing={1} sx={{ alignItems: { xs: "stretch", xl: "center" } }}>
      <Tabs
        value={activeTab}
        onChange={(_, newValue: number) =>
          setActiveTab(newValue)
        }
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
        slotProps={{
          indicator: {
            sx: {
              display: "none",
            },
          },
        }}
        sx={{
          minHeight: 0,
          minWidth: 0,
          flex: 1,

          "& .MuiTabs-flexContainer": {
            gap: 0.75,
          },

          "& .MuiTabs-scrollButtons": {
            width: 32,

            color: "#64748b",

            borderRadius: "8px",

            "&:hover": {
              bgcolor: "#f8fafc",
            },
          },

          /* =====================================
             ABA NORMAL
          ====================================== */
          "& .MuiTab-root": {
            minHeight: 44,

            minWidth: "auto",

            px: {
              xs: 1.25,
              md: 1.5,
            },

            py: 1,

            borderRadius: "10px",

            border: "1px solid transparent",

            color: "#64748b",

            bgcolor: "transparent",

            fontSize: {
              xs: 11.5,
              md: 12.5,
            },

            fontWeight: 800,

            lineHeight: 1.2,

            textTransform: "none",

            whiteSpace: "nowrap",

            transition: [
              "background-color 160ms ease",
              "border-color 160ms ease",
              "color 160ms ease",
              "box-shadow 160ms ease",
              "transform 160ms ease",
            ].join(", "),
          },

          /* ÍCONE */
          "& .MuiTab-iconWrapper, & .MuiTab-icon": {
            width: 19,

            height: 19,

            marginRight: "7px !important",

            marginBottom: "0 !important",

            color: "inherit",
          },

          /* =====================================
             HOVER
          ====================================== */
          "& .MuiTab-root:hover": {
            bgcolor: "#f8fafc",

            color: "#334155",
          },

          /* =====================================
             ABA ATIVA
          ====================================== */
          "& .MuiTab-root.Mui-selected": {
            bgcolor: "#fff7ed",

            color: `${crmPalette.orangeDark} !important`,

            borderColor: "#fed7aa",

            boxShadow:
              "0 2px 6px rgba(234, 88, 12, 0.06)",
          },

          "& .MuiTab-root.Mui-selected:hover": {
            bgcolor: "#ffedd5",

            borderColor: "#fdba74",
          },
        }}
      >
        {tabsDetalhesCliente.map((tab) => tab.value === 4 ? null : (
          <Tab
            key={tab.label}
            value={tab.value}
            disableRipple
            icon={tab.icon}
            iconPosition="start"
            label={tab.label}
          />
        ))}
      </Tabs>
      <Button
        component={Link}
        href={`/oportunidades/cadastro/${lead.id}`}
        variant="outlined"
        size="small"
        startIcon={<AutoGraphOutlinedIcon />}
        sx={{
          flexShrink: 0,
          alignSelf: { xs: "flex-start", xl: "center" },
          minHeight: 40,
          px: 1.5,
          borderRadius: "10px",
          textTransform: "none",
          fontSize: 12,
          fontWeight: 700,
          color: crmPalette.orangeDark,
          borderColor: "#fed7aa",
          "&:hover": { bgcolor: "#fff7ed", borderColor: "#fdba74" },
        }}
      >
        Oportunidades/propostas
      </Button>
      </Stack>
    </CrmSection>
  );
}