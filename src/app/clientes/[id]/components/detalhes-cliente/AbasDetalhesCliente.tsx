"use client";

import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";

import GridViewRoundedIcon from "@mui/icons-material/GridViewRounded";
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
    label: "Visão geral",
    icon: <GridViewRoundedIcon />,
  },
  {
    label: "Cadastro",
    icon: <BusinessOutlinedIcon />,
  },
  {
    label: "Contatos",
    icon: <GroupsOutlinedIcon />,
  },
  {
    label: "Condições comerciais",
    icon: <AccountBalanceWalletOutlinedIcon />,
  },
  {
    label: "Oportunidade/Proposta",
    icon: <AutoGraphOutlinedIcon />,
  },
  {
    label: "Documentos",
    icon: <DescriptionOutlinedIcon />,
  },
  {
    label: "Histórico",
    icon: <ManageHistoryOutlinedIcon />,
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
        {tabsDetalhesCliente.map((tab, index) => (
          <Tab
            key={tab.label}
            value={index}
            disableRipple
            icon={tab.icon}
            iconPosition="start"
            label={tab.label}
          />
        ))}
      </Tabs>
    </CrmSection>
  );
}