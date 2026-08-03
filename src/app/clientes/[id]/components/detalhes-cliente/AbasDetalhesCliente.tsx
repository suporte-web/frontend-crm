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

import { CrmSection, crmPalette } from "@/components/mui/crm-primitives";
import type { LeadDetail } from "@/types/crm";

type PropriedadesAbasDetalhesCliente = {
  lead: LeadDetail | null;
  activeTab: number;
  setActiveTab: (nextTab: number) => void;
};

export function AbasDetalhesCliente({ lead, activeTab, setActiveTab }: PropriedadesAbasDetalhesCliente) {
    if (!lead) {
      return null;
    }

    return (
      <CrmSection
        sx={{
          p: 0,
          overflow: "hidden",
          borderRadius: "12px",
          border: `1px solid ${crmPalette.border}`,
          bgcolor: "#ffffff",
          boxShadow: "none",
        }}
      >
        <Tabs
          value={activeTab}
          onChange={(_, newValue: number) => setActiveTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{
            px: { xs: 1, md: 1.5 },
            bgcolor: "#ffffff",

            "& .MuiTab-root": {
              minHeight: 54,
              minWidth: "auto",
              px: { xs: 1.25, md: 1.8 },
              gap: 0.7,
              borderRadius: "10px 10px 0 0",
              color: crmPalette.muted,
              fontSize: 12,
              fontWeight: 800,
              textTransform: "none",
              transition: "all 180ms ease",
            },

            "& .MuiTab-iconWrapper": {
              fontSize: 19,
              marginRight: "8px",
              marginBottom: "0 !important",
              transition: "color 180ms ease, transform 180ms ease",
            },

            "& .MuiTab-root:hover": {
              color: crmPalette.orangeDark,
              bgcolor: "#fffaf7",
            },

            "& .Mui-selected": {
              color: `${crmPalette.orangeDark} !important`,
              bgcolor: "#fff7f2",
            },

            "& .MuiTabs-indicator": {
              height: 3,
              borderRadius: "3px 3px 0 0",
              bgcolor: crmPalette.orange,
            },
          }}
        >
          <Tab
            icon={<GridViewRoundedIcon />}
            iconPosition="start"
            label="Visão geral"
          />

          <Tab
            icon={<BusinessOutlinedIcon />}
            iconPosition="start"
            label="Cadastro"
          />

          <Tab
            icon={<GroupsOutlinedIcon />}
            iconPosition="start"
            label="Contatos"
          />

          <Tab
            icon={<AccountBalanceWalletOutlinedIcon />}
            iconPosition="start"
            label="Condições comerciais"
          />

          <Tab
            icon={<AutoGraphOutlinedIcon />}
            iconPosition="start"
            label="Oportunidade/Proposta"
          />

          <Tab
            icon={<DescriptionOutlinedIcon />}
            iconPosition="start"
            label="Documentos"
          />

          <Tab
            icon={<ManageHistoryOutlinedIcon />}
            iconPosition="start"
            label="Histórico"
          />
        </Tabs>
      </CrmSection>
    );
  }